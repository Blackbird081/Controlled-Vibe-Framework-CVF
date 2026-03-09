import fs from 'fs'
import os from 'os'
import path from 'path'
import { beforeEach, describe, expect, it } from 'vitest'
import { ExecutionEngine } from '../runtime/execution.engine.js'
import { ExecutionLog } from '../internal_ledger/execution.log.js'
import { CostLedger } from '../internal_ledger/cost.ledger.js'
import { GovernanceKernel } from '../core/governance.kernel.js'
import { RuntimeOrchestrator } from '../core/runtime.orchestrator.js'
import { PhaseManager } from '../core/phase.manager.js'
import { Constitution } from '../core/constitution.js'
import { RiskScorer } from '../skill_system/governance/risk.scorer.js'
import { ExecutionGuard } from '../skill_system/execution/execution.guard.js'
import { ExecutionPlanner } from '../skill_system/execution/execution.planner.js'
import { ExecutionLogger } from '../skill_system/execution/execution.logger.js'
import { ToolRouter } from '../skill_system/execution/tool.router.js'
import { SkillNormalizer } from '../skill_system/governance/skill.normalizer.js'
import { SkillValidator } from '../skill_system/governance/skill.validator.js'
import { DomainGuard } from '../skill_system/governance/domain.guard.js'
import { ApprovalWorkflow } from '../skill_system/governance/approval.workflow.js'

describe('v1.2.2 runtime + governance behavior', () => {
    let executionLog: ExecutionLog
    let costLedger: CostLedger
    let engine: ExecutionEngine

    beforeEach(() => {
        executionLog = new ExecutionLog()
        costLedger = new CostLedger()
        engine = new ExecutionEngine(executionLog, costLedger)
    })

    it('ExecutionEngine logs successful execution as approved', async () => {
        const result = await engine.execute({
            execution_id: 'e1',
            skill_id: 'skill-1',
            risk_score: 20,
            cost_estimate: 1,
        }, async () => 'ok')

        expect(result).toBe('ok')
        const records = executionLog.getAll()
        expect(records).toHaveLength(1)
        expect(records[0]!.approved).toBe(true)
        expect(records[0]!.result_status).toBe('success')
        expect(costLedger.list()).toHaveLength(1)
    })

    it('ExecutionEngine logs failed execution as not approved', async () => {
        await expect(engine.execute({
            execution_id: 'e2',
            skill_id: 'skill-1',
            risk_score: 20,
            cost_estimate: 1,
        }, async () => {
            throw new Error('boom')
        })).rejects.toThrow('boom')

        const records = executionLog.getAll()
        expect(records).toHaveLength(1)
        expect(records[0]!.approved).toBe(false)
        expect(records[0]!.result_status).toBe('failure')
    })

    it('GovernanceKernel and RuntimeOrchestrator enforce decisions', async () => {
        expect(GovernanceKernel.evaluate({
            riskScore: 10,
            skillVerified: true,
            integrityPassed: true,
        })).toBe('APPROVED')

        expect(GovernanceKernel.evaluate({
            riskScore: 80,
            skillVerified: true,
            integrityPassed: true,
        })).toBe('REJECTED')

        const orchestrator = new RuntimeOrchestrator()
        const approved = await orchestrator.execute({
            riskScore: 10,
            skillVerified: true,
            integrityPassed: true,
        })
        expect(approved).toBe('APPROVED')
        expect(orchestrator.getCurrentPhase()).toBe('LEDGER_RECORD')

        const rejected = await orchestrator.execute({
            riskScore: 81,
            skillVerified: true,
            integrityPassed: true,
        })
        expect(rejected).toBe('REJECTED')
    })

    it('PhaseManager blocks transition when governance context is missing or rejected', () => {
        const manager = new PhaseManager()
        manager.transition('SKILL_DISCOVERY')
        manager.transition('RISK_EVALUATION')
        expect(() => manager.transition('GOVERNANCE_DECISION')).toThrow('requires GovernanceContext')

        expect(() =>
            manager.transition('GOVERNANCE_DECISION', {
                riskScore: 95,
                skillVerified: true,
                integrityPassed: true,
            })
        ).toThrow('REJECTED')
    })
})

describe('v1.2.2 skill governance utilities', () => {
    it('RiskScorer computes bounded score by factors', () => {
        const score = RiskScorer.compute({
            risk_profile: {
                base_score: 60,
                factors: ['data_access', 'external_dependency', 'code_execution', 'cost_impact'],
            },
        })
        expect(score).toBe(100)
    })

    it('ExecutionGuard/Planner/Router basic flow works', async () => {
        expect(ExecutionGuard.enforceRisk(80)).toBe(true)
        expect(ExecutionGuard.enforceRisk(81)).toBe(false)

        const plan = ExecutionPlanner.create({
            id: 'skill-2',
            type: 'EXTERNAL',
            metadata: { risk_profile: { factors: [] } },
        })
        expect(plan.requiresExternalCall).toBe(true)
        expect(plan.steps).toContain('execute_core')

        const output = await ToolRouter.route({
            execute: async (x: unknown) => ({ ok: x }),
        }, { input: 1 })
        expect(output.ok.input).toBe(1)
    })

    it('SkillNormalizer, schema validator, domain guard, approval workflow integrate', () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cvf122-'))
        const schemaPath = path.join(tmp, 'schema.yaml')
        const policyPath = path.join(tmp, 'policy.yaml')

        fs.writeFileSync(schemaPath, [
            'skill:',
            '  id:',
            '    pattern: "^skill-[a-z0-9-]+$"',
            '  version:',
            '    pattern: "^\\\\d+\\\\.\\\\d+\\\\.\\\\d+$"',
        ].join('\n'))

        fs.writeFileSync(policyPath, [
            'allowed_domains:',
            '  - engineering',
            '  - operations',
        ].join('\n'))

        const normalized = SkillNormalizer.normalize({
            id: 'SKILL-abc',
            name: 'Skill',
            version: '1.0.0',
            domain: 'ENGINEERING',
            type: 'external',
            maturity: 'alpha',
            integrity: { checksum: 'x', verified: true },
            risk_profile: { base_score: 10, factors: [] },
        })

        expect(normalized.id).toBe('skill-abc')
        expect(DomainGuard.isAllowed('engineering', policyPath)).toBe(true)
        expect(SkillValidator.validateSchema(normalized, schemaPath)).toBe(true)
        expect(SkillValidator.validateIntegrity(normalized)).toBe(true)

        const decision = ApprovalWorkflow.evaluate(normalized, schemaPath, policyPath)
        expect(decision).toBe('APPROVED')

        fs.rmSync(tmp, { recursive: true, force: true })
    })

    it('Constitution exposes strict rules and evaluate toggles decision', () => {
        const rules = Constitution.getRules()
        expect(rules.length).toBeGreaterThanOrEqual(5)
        expect(rules.every(r => r.enforcementLevel === 'STRICT')).toBe(true)
        expect(Constitution.evaluate(true)).toBe('APPROVED')
        expect(Constitution.evaluate(false)).toBe('REJECTED')
    })
})

describe('v1.2.2 branch and edge coverage', () => {
    function createSchemaAndPolicy(tmp: string): { schemaPath: string; policyPath: string } {
        const schemaPath = path.join(tmp, 'schema.yaml')
        const policyPath = path.join(tmp, 'policy.yaml')

        fs.writeFileSync(schemaPath, [
            'skill:',
            '  id:',
            '    pattern: "^skill-[a-z0-9-]+$"',
            '  version:',
            '    pattern: "^\\\\d+\\\\.\\\\d+\\\\.\\\\d+$"',
        ].join('\n'))

        fs.writeFileSync(policyPath, [
            'allowed_domains:',
            '  - engineering',
            '  - operations',
        ].join('\n'))

        return { schemaPath, policyPath }
    }

    function makeSkill(overrides: Record<string, unknown> = {}): any {
        return {
            id: 'SKILL-alpha',
            name: 'Skill Alpha',
            version: '1.0.0',
            domain: 'ENGINEERING',
            type: 'external',
            maturity: 'beta',
            integrity: { checksum: 'sha', verified: true },
            risk_profile: { base_score: 10, factors: [] },
            ...overrides,
        }
    }

    it('GovernanceKernel rejects when verification or integrity fails', () => {
        expect(GovernanceKernel.evaluate({
            riskScore: 10,
            skillVerified: false,
            integrityPassed: true,
        })).toBe('REJECTED')

        expect(GovernanceKernel.evaluate({
            riskScore: 10,
            skillVerified: true,
            integrityPassed: false,
        })).toBe('REJECTED')
    })

    it('PhaseManager history/reset and governed transition flow work', () => {
        const manager = new PhaseManager()
        manager.transition('SKILL_DISCOVERY')
        manager.transition('RISK_EVALUATION')
        manager.transition('GOVERNANCE_DECISION', {
            riskScore: 10,
            skillVerified: true,
            integrityPassed: true,
        })
        expect(manager.getCurrentPhase()).toBe('GOVERNANCE_DECISION')
        expect(manager.getHistory()).toEqual(['INTENT_ANALYSIS', 'SKILL_DISCOVERY', 'RISK_EVALUATION'])

        manager.reset()
        expect(manager.getCurrentPhase()).toBe('INTENT_ANALYSIS')
        expect(manager.getHistory()).toEqual([])
    })

    it('ExecutionLog filters by skill and CostLedger totals aggregate correctly', () => {
        const log = new ExecutionLog()
        log.log({
            execution_id: 'a',
            skill_id: 'skill-a',
            risk_score: 10,
            cost_estimate: 1,
            approved: true,
            timestamp: Date.now(),
            result_status: 'success',
        })
        log.log({
            execution_id: 'b',
            skill_id: 'skill-b',
            risk_score: 20,
            cost_estimate: 2,
            approved: false,
            timestamp: Date.now(),
            result_status: 'failure',
        })

        expect(log.filterBySkill('skill-a')).toHaveLength(1)
        expect(log.filterBySkill('missing')).toHaveLength(0)

        const ledger = new CostLedger()
        ledger.record({
            execution_id: 'a',
            tokens_used: 10,
            runtime_ms: 50,
            external_cost_flag: false,
            timestamp: Date.now(),
        })
        ledger.record({
            execution_id: 'b',
            tokens_used: 20,
            runtime_ms: 100,
            external_cost_flag: true,
            timestamp: Date.now(),
        })

        expect(ledger.getTotalTokens()).toBe(30)
        expect(ledger.getTotalRuntime()).toBe(150)
        expect(ledger.list()).toHaveLength(2)
    })

    it('ExecutionGuard validates contracts and ToolRouter throws for missing execute', async () => {
        const skill = {
            contract: {
                input_schema: { q: 'string' },
                output_schema: { result: 'string' },
            },
        }

        expect(ExecutionGuard.validateBefore(skill, { q: 'x' })).toBe(true)
        expect(ExecutionGuard.validateBefore(skill, {})).toBe(false)
        expect(ExecutionGuard.validateAfter(skill, { result: 'ok' })).toBe(true)
        expect(ExecutionGuard.validateAfter(skill, {})).toBe(false)
        expect(ExecutionGuard.enforceRisk(80)).toBe(true)
        expect(ExecutionGuard.enforceRisk(81)).toBe(false)

        await expect(ToolRouter.route({}, {})).rejects.toThrow('function not found')
    })

    it('ExecutionPlanner handles local/external branches', () => {
        const localPlan = ExecutionPlanner.create({
            id: 'skill-local',
            type: 'INTERNAL',
            metadata: { risk_profile: { factors: [] } },
        })
        expect(localPlan.requiresExternalCall).toBe(false)

        const factorPlan = ExecutionPlanner.create({
            id: 'skill-fx',
            type: 'INTERNAL',
            metadata: { risk_profile: { factors: ['external_dependency'] } },
        })
        expect(factorPlan.requiresExternalCall).toBe(true)
    })

    it('ApprovalWorkflow covers REJECTED/PROBATION/APPROVED paths', () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cvf122-branch-'))
        const { schemaPath, policyPath } = createSchemaAndPolicy(tmp)

        const approved = ApprovalWorkflow.evaluate(makeSkill(), schemaPath, policyPath)
        expect(approved).toBe('APPROVED')

        const probation = ApprovalWorkflow.evaluate(
            makeSkill({ risk_profile: { base_score: 61, factors: [] } }),
            schemaPath,
            policyPath
        )
        expect(probation).toBe('PROBATION')

        const rejectedRisk = ApprovalWorkflow.evaluate(
            makeSkill({ risk_profile: { base_score: 90, factors: [] } }),
            schemaPath,
            policyPath
        )
        expect(rejectedRisk).toBe('REJECTED')

        const rejectedDomain = ApprovalWorkflow.evaluate(
            makeSkill({ domain: 'FINANCE' }),
            schemaPath,
            policyPath
        )
        expect(rejectedDomain).toBe('REJECTED')

        const rejectedIntegrity = ApprovalWorkflow.evaluate(
            makeSkill({ integrity: { checksum: '', verified: false } }),
            schemaPath,
            policyPath
        )
        expect(rejectedIntegrity).toBe('REJECTED')

        const rejectedSchema = ApprovalWorkflow.evaluate(
            makeSkill({ id: 'BAD-ID' }),
            schemaPath,
            policyPath
        )
        expect(rejectedSchema).toBe('REJECTED')

        fs.rmSync(tmp, { recursive: true, force: true })
    })

    it('SkillValidator and DomainGuard reject malformed policy/schema cases', () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cvf122-schema-'))
        const { schemaPath, policyPath } = createSchemaAndPolicy(tmp)

        expect(SkillValidator.validateSchema({}, schemaPath)).toBe(false)
        expect(SkillValidator.validateSchema(makeSkill({ id: 'BAD' }), schemaPath)).toBe(false)
        expect(SkillValidator.validateSchema(makeSkill({ version: '1' }), schemaPath)).toBe(false)

        expect(SkillValidator.validateIntegrity({})).toBe(false)
        expect(SkillValidator.validateIntegrity({ integrity: { checksum: '', verified: true } })).toBe(false)

        const noDomainPolicy = path.join(tmp, 'policy-no-domain.yaml')
        fs.writeFileSync(noDomainPolicy, 'name: test-policy')
        expect(DomainGuard.isAllowed('engineering', noDomainPolicy)).toBe(false)
        expect(DomainGuard.isAllowed('engineering', policyPath)).toBe(true)

        fs.rmSync(tmp, { recursive: true, force: true })
    })

    it('RiskScorer handles low and capped score branches', () => {
        expect(RiskScorer.compute({ risk_profile: { base_score: 0, factors: [] } })).toBe(0)
        expect(RiskScorer.compute({
            risk_profile: {
                base_score: 95,
                factors: ['code_execution'],
            },
        })).toBe(100)
    })

    it('ExecutionLogger appends usage and trace payloads to files', () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cvf122-log-'))
        const usagePath = path.join(tmp, 'usage.log')
        const tracePath = path.join(tmp, 'trace.log')

        ExecutionLogger.logUsage(usagePath, 'skill-logger', true)
        ExecutionLogger.logTrace(tracePath, { execution_id: 'e1', step: 'done' })

        const usageLines = fs.readFileSync(usagePath, 'utf8').trim().split('\n')
        const traceLines = fs.readFileSync(tracePath, 'utf8').trim().split('\n')

        expect(usageLines).toHaveLength(1)
        expect(JSON.parse(usageLines[0]).skillId).toBe('skill-logger')
        expect(traceLines).toHaveLength(1)
        expect(JSON.parse(traceLines[0]).execution_id).toBe('e1')

        fs.rmSync(tmp, { recursive: true, force: true })
    })
})
