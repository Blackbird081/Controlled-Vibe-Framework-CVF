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
