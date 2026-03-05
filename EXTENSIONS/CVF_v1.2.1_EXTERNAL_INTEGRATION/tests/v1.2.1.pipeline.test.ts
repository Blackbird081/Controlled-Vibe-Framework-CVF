import fs from 'fs'
import os from 'os'
import path from 'path'
import { beforeEach, describe, expect, it } from 'vitest'
import { SkillAdapter } from '../skill.adapter'
import { SkillIntake } from '../skill.intake'
import { SkillValidator } from '../skill.validator'
import { SkillCertifier } from '../skill.certifier'
import { SkillPublisher } from '../skill.publisher'
import { GovernanceAuditLedger } from '../governance.audit.ledger'
import { DomainGuardHook } from '../governance_hooks/domain.guard.hook'
import { IntegrityVerificationHook } from '../governance_hooks/integrity.verification.hook'
import { PhaseBindingHook } from '../governance_hooks/phase.binding.hook'
import { RiskScoringHook } from '../governance_hooks/risk.scoring.hook'
import { ExternalSkillAudit, ExternalSkillAuditLog } from '../internal_ledger/external_skill.audit.log'
import { RevocationRegistry } from '../internal_ledger/revocation.registry'
import { CertificationStateMachine as CoreStateMachine } from '../models/certification-state'
import { PolicyDecisionEngine } from '../policies/policy.decision.engine'
import { policyOverrideMatrix } from '../policies/policy.override.matrix'
import type { ExternalSkillRaw } from '../models/external-skill.raw'

function makeRaw(overrides: Partial<ExternalSkillRaw> = {}): ExternalSkillRaw {
    return {
        source: 'partner_registry',
        format: 'markdown',
        raw_content: 'review deployment plan with API checks',
        raw_content_hash: 'raw-hash-001',
        ingested_at: new Date().toISOString(),
        ingested_by: 'system',
        ingestion_pipeline_version: '1.0.0',
        external_metadata: {
            title: 'Deploy Auditor',
            description: 'Audits deployment checklists',
        },
        ...overrides,
    }
}

describe('v1.2.1 pipeline coverage', () => {
    beforeEach(() => {
        GovernanceAuditLedger.reset()
        ExternalSkillAuditLog.getChain().length = 0
    })

    it('SkillAdapter maps unsupported source/format to safe defaults', async () => {
        const draft = await SkillAdapter.transform(
            makeRaw({
                source: 'github_repo',
                format: 'repository',
                external_metadata: { title: ' Repo Scanner ' },
            })
        )
        expect(draft.source).toBe('unknown')
        expect(draft.original_format).toBe('repo_url')
        expect(draft.slug).toBe('repo-scanner')
    })

    it('SkillIntake appends raw_ingested event and returns draft', async () => {
        const draft = await SkillIntake.ingest(makeRaw({ source_reference: 'ext/1' }))
        expect(draft.status).toBe('draft')
        const chain = ExternalSkillAuditLog.getChain()
        expect(chain[0]!.event_type).toBe('raw_ingested')
    })

    it('SkillValidator validates draft and enriches governance', async () => {
        const draft = await SkillAdapter.transform(
            makeRaw({
                raw_content: 'design security policy and review infrastructure via https://api.example.com',
            })
        )
        const validated = await SkillValidator.validate(draft)
        expect(validated.status).toBe('validated')
        expect(validated.governance.inferred_domain).toBe('security')
        expect(validated.governance.manual_review_required).toBe(true)
    })

    it('SkillValidator rejects critical-risk draft', async () => {
        const draft = await SkillAdapter.transform(
            makeRaw({
                raw_content:
                    'security ' +
                    'https://a.example.com https://b.example.com https://c.example.com ' +
                    'write delete file filesystem upload post api ' +
                    'x'.repeat(1000),
            })
        )
        await expect(SkillValidator.validate(draft)).rejects.toThrow('Critical risk')
    })

    it('SkillValidator infers diverse domains and phases', async () => {
        const finance = await SkillValidator.validate(
            await SkillAdapter.transform(makeRaw({ raw_content: 'finance design checklist' }))
        )
        expect(finance.governance.inferred_domain).toBe('finance')
        expect(finance.governance.inferred_phase).toBe('Design')

        const discovery = await SkillValidator.validate(
            await SkillAdapter.transform(makeRaw({ raw_content: 'discover data sources for report' }))
        )
        expect(discovery.governance.inferred_domain).toBe('data')
        expect(discovery.governance.inferred_phase).toBe('Discovery')

        const operations = await SkillValidator.validate(
            await SkillAdapter.transform(makeRaw({ raw_content: 'deploy infra module' }))
        )
        expect(operations.governance.inferred_domain).toBe('operations')
        expect(operations.governance.inferred_phase).toBe('Build')
    })

    it('SkillCertifier certifies safe draft and writes audit log', async () => {
        const draft = await SkillAdapter.transform(makeRaw())
        draft.governance = {
            inferred_domain: 'engineering',
            inferred_phase: 'Build',
            inferred_risk_level: 'low',
            inferred_risk_score: 2,
            risk_flags: [],
            manual_review_required: false,
        }
        const certified = await SkillCertifier.certify(draft)
        expect(certified.status).toBe('certified')
        expect(certified.certification.immutable_hash).toHaveLength(64)
        expect(ExternalSkillAuditLog.getChain().some(e => e.event_type === 'certified')).toBe(true)
    })

    it('SkillCertifier blocks critical risk by policy', async () => {
        const draft = await SkillAdapter.transform(makeRaw())
        draft.governance = {
            inferred_domain: 'engineering',
            inferred_phase: 'Build',
            inferred_risk_level: 'critical',
            inferred_risk_score: 20,
        }
        await expect(SkillCertifier.certify(draft)).rejects.toThrow('blocked by policy')
    })

    it('SkillCertifier applies default fallbacks when governance fields are missing', async () => {
        const draft = await SkillAdapter.transform(
            makeRaw({
                external_metadata: undefined,
            })
        )
        draft.governance = {}
        const certified = await SkillCertifier.certify(draft)
        expect(certified.risk.risk_level).toBe('medium')
        expect(certified.risk.risk_score).toBe(0)
        expect(certified.risk.manual_review_required).toBe(true)
        expect(certified.domain).toBe('other')
        expect(certified.description).toBe('')
        expect(certified.output_contract).toBe('text')
        expect(certified.scope_boundary).toBe('unspecified')
    })

    it('SkillPublisher persists metadata, logic and risk report', async () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cvf-v121-'))
        const previousCwd = process.cwd()
        try {
            process.chdir(tmp)
            SkillPublisher.persist({
                skill_id: 'skill-1',
                slug: 'skill-one',
                title: 'Skill One',
                description: 'Desc',
                domain: 'other',
                phase_binding: 'Build',
                risk: {
                    risk_score: 1,
                    risk_level: 'low',
                    risk_flags: [],
                    policy_threshold_passed: true,
                    manual_review_required: false,
                },
                preconditions: [],
                procedural_steps: 'step1',
                output_contract: 'text',
                scope_boundary: 'local',
                certification: {
                    certified_at: new Date().toISOString(),
                    certified_by: 'system',
                    immutable_hash: 'h'.repeat(64),
                    version: '1.0.0',
                    source: 'partner_registry',
                },
                status: 'certified',
            })
            expect(fs.existsSync(path.join(tmp, 'skills', 'external', 'skill-one', 'skill.meta.json'))).toBe(true)
            expect(fs.existsSync(path.join(tmp, 'skills', 'external', 'skill-one', 'skill.logic.md'))).toBe(true)
            expect(fs.existsSync(path.join(tmp, 'skills', 'external', 'skill-one', 'risk.report.json'))).toBe(true)
        } finally {
            process.chdir(previousCwd)
            fs.rmSync(tmp, { recursive: true, force: true })
        }
    })

    it('SkillPublisher falls back to title-based slug when slug is empty', async () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cvf-v121-title-'))
        const previousCwd = process.cwd()
        try {
            process.chdir(tmp)
            SkillPublisher.persist({
                skill_id: 'skill-2',
                slug: '',
                title: 'Title Slug Only',
                description: 'Desc',
                domain: 'other',
                phase_binding: 'Build',
                risk: {
                    risk_score: 1,
                    risk_level: 'low',
                    risk_flags: [],
                    policy_threshold_passed: true,
                    manual_review_required: false,
                },
                preconditions: [],
                procedural_steps: 'step1',
                output_contract: 'text',
                scope_boundary: 'local',
                certification: {
                    certified_at: new Date().toISOString(),
                    certified_by: 'system',
                    immutable_hash: 'h'.repeat(64),
                    version: '1.0.0',
                    source: 'partner_registry',
                },
                status: 'certified',
            })
            expect(fs.existsSync(path.join(tmp, 'skills', 'external', 'title-slug-only', 'skill.meta.json'))).toBe(true)
        } finally {
            process.chdir(previousCwd)
            fs.rmSync(tmp, { recursive: true, force: true })
        }
    })
})

describe('v1.2.1 governance hooks and ledgers', () => {
    beforeEach(() => {
        GovernanceAuditLedger.reset()
        ExternalSkillAuditLog.getChain().length = 0
    })

    it('DomainGuardHook blocks uncertified/sensitive and allows valid execution', () => {
        expect(
            DomainGuardHook.enforce({
                skill_id: 's1',
                domain: 'engineering',
                phase: 'Build',
                certified: false,
                execution_environment: 'dev',
                runtime_requester: 'tester',
            }).allowed
        ).toBe(false)

        const sensitive = DomainGuardHook.enforce({
            skill_id: 's2',
            domain: 'security',
            phase: 'Build',
            certified: true,
            execution_environment: 'staging',
            runtime_requester: 'tester',
        })
        expect(sensitive.allowed).toBe(false)

        const allowed = DomainGuardHook.enforce({
            skill_id: 's3',
            domain: 'operations',
            phase: 'Build',
            certified: true,
            execution_environment: 'production',
            runtime_requester: 'tester',
        })
        expect(allowed.allowed).toBe(true)

        const prodBlocked = DomainGuardHook.enforce({
            skill_id: 's4',
            domain: 'marketing',
            phase: 'Build',
            certified: true,
            execution_environment: 'production',
            runtime_requester: 'tester',
        })
        expect(prodBlocked.allowed).toBe(false)
        expect(prodBlocked.escalation_required).toBe(true)
    })

    it('IntegrityVerificationHook detects hash mismatch', () => {
        const bad = IntegrityVerificationHook.verify({
            skill_id: 's1',
            certified_hash: 'a',
            current_hash: 'b',
            version: '1.0.0',
        })
        expect(bad.valid).toBe(false)
        expect(bad.tamper_detected).toBe(true)

        const ok = IntegrityVerificationHook.verify({
            skill_id: 's1',
            certified_hash: 'a',
            current_hash: 'a',
            version: '1.0.0',
            signature: 'optional-signature',
        })
        expect(ok.valid).toBe(true)
    })

    it('PhaseBindingHook enforces progression and production immutability', () => {
        expect(
            PhaseBindingHook.enforce({
                current_phase: 'Build',
                target_phase: 'Design',
                immutable: true,
                certified: true,
            }).allowed
        ).toBe(false)

        expect(
            PhaseBindingHook.enforce({
                current_phase: 'Review',
                target_phase: 'Production',
                immutable: false,
                certified: true,
            }).allowed
        ).toBe(false)

        expect(
            PhaseBindingHook.enforce({
                current_phase: 'Review',
                target_phase: 'Production',
                immutable: true,
                certified: true,
            }).allowed
        ).toBe(true)
    })

    it('RiskScoringHook maps low/medium/high/critical ranges', () => {
        expect(
            RiskScoringHook.evaluate({
                scope_size: 1,
                external_dependencies: 0,
                accesses_filesystem: false,
                accesses_network: false,
                domain_sensitivity_score: 1,
            }).risk_level
        ).toBe('low')

        expect(
            RiskScoringHook.evaluate({
                scope_size: 3,
                external_dependencies: 1,
                accesses_filesystem: false,
                accesses_network: false,
                domain_sensitivity_score: 2,
            }).risk_level
        ).toBe('medium')

        expect(
            RiskScoringHook.evaluate({
                scope_size: 5,
                external_dependencies: 2,
                accesses_filesystem: true,
                accesses_network: false,
                domain_sensitivity_score: 2,
            }).risk_level
        ).toBe('high')

        expect(
            RiskScoringHook.evaluate({
                scope_size: 10,
                external_dependencies: 5,
                accesses_filesystem: true,
                accesses_network: true,
                domain_sensitivity_score: 5,
            }).risk_level
        ).toBe('critical')
    })

    it('ExternalSkillAuditLog chain verifies and detects tampering', () => {
        const e1 = ExternalSkillAuditLog.append({
            skill_id: 's-log-1',
            timestamp: new Date().toISOString(),
            event_type: 'raw_ingested',
            actor: 'system',
        })
        ExternalSkillAuditLog.append({
            skill_id: 's-log-1',
            timestamp: new Date().toISOString(),
            event_type: 'risk_scored',
            actor: 'system',
        })
        expect(e1.previous_hash).toBe('GENESIS')
        expect(ExternalSkillAuditLog.verifyIntegrity()).toBe(true)

        const chain = ExternalSkillAuditLog.getChain()
        chain[0]!.hash = 'tampered'
        expect(ExternalSkillAuditLog.verifyIntegrity()).toBe(false)
    })

    it('ExternalSkillAudit legacy shim normalizes unknown event type', () => {
        ExternalSkillAudit.log('unexpected_event', 'skill-legacy')
        const latest = ExternalSkillAuditLog.getChain().at(-1)
        expect(latest?.event_type).toBe('policy_evaluated')
        expect(latest?.skill_id).toBe('skill-legacy')
    })

    it('ExternalSkillAudit legacy shim accepts known event with object metadata', () => {
        ExternalSkillAudit.log('certified', { skill_id: 'skill-obj', source: 'unit-test' })
        const latest = ExternalSkillAuditLog.getChain().at(-1)
        expect(latest?.event_type).toBe('certified')
        expect(latest?.skill_id).toBe('skill-obj')
    })

    it('RevocationRegistry prevents duplicate revocation and supports lookup', () => {
        const skillId = `skill-rev-${Date.now()}`
        const first = RevocationRegistry.revoke({
            skill_id: skillId,
            revoked_at: new Date().toISOString(),
            reason: 'manual_admin_action',
            previous_state: 'certified',
            actor: 'admin',
        })
        expect(first.hash).toHaveLength(64)
        expect(RevocationRegistry.isRevoked(skillId)).toBe(true)
        expect(RevocationRegistry.getRevocation(skillId)?.skill_id).toBe(skillId)
        expect(RevocationRegistry.listRevoked().some(x => x.skill_id === skillId)).toBe(true)

        expect(() =>
            RevocationRegistry.revoke({
                skill_id: skillId,
                revoked_at: new Date().toISOString(),
                reason: 'manual_admin_action',
                previous_state: 'certified',
                actor: 'admin',
            })
        ).toThrow('already revoked')
    })

    it('GovernanceAuditLedger verifies chain and catches tampering', () => {
        GovernanceAuditLedger.append({
            timestamp: new Date().toISOString(),
            skill_id: 'gov-1',
            event_type: 'state_transition',
            from_state: 'raw',
            to_state: 'draft',
            actor: 'system',
        })
        GovernanceAuditLedger.append({
            timestamp: new Date().toISOString(),
            skill_id: 'gov-1',
            event_type: 'policy_decision',
            decision: 'certified',
            actor: 'system',
        })
        expect(GovernanceAuditLedger.verifyIntegrity()).toBe(true)

        const ledger = (GovernanceAuditLedger as unknown as { ledger: Array<{ hash: string }> }).ledger
        ledger[0]!.hash = 'tampered'
        expect(GovernanceAuditLedger.verifyIntegrity()).toBe(false)
    })
})

describe('v1.2.1 policy/state behavior', () => {
    it('PolicyDecisionEngine returns under_review when manual review is required', () => {
        const result = PolicyDecisionEngine.evaluate({
            source: 'partner_registry',
            risk_level: 'medium',
            phase: 'Discovery',
            domain: 'engineering',
            validation_passed: true,
        })
        expect(result).toBe('under_review')
    })

    it('PolicyDecisionEngine does not hard-reject blocked source without absolute layer', () => {
        const result = PolicyDecisionEngine.evaluate({
            source: 'unknown',
            risk_level: 'low',
            phase: 'Discovery',
            domain: 'engineering',
            validation_passed: true,
        })
        expect(result).toBe('certified')
    })

    it('PolicyDecisionEngine can bypass to certified when manual override is set', () => {
        const originalManualBlocking = policyOverrideMatrix.manual_review_is_blocking
        try {
            policyOverrideMatrix.manual_review_is_blocking = false
            const result = PolicyDecisionEngine.evaluate({
                source: 'partner_registry',
                risk_level: 'medium',
                phase: 'Discovery',
                domain: 'engineering',
                validation_passed: true,
                manual_override: true,
            })
            expect(result).toBe('certified')
        } finally {
            policyOverrideMatrix.manual_review_is_blocking = originalManualBlocking
        }
    })

    it('PolicyDecisionEngine production absolute lock can reject late in resolution', () => {
        const originalRejectLayers = [...policyOverrideMatrix.absolute_reject_layers]
        const originalManualBlocking = policyOverrideMatrix.manual_review_is_blocking
        try {
            policyOverrideMatrix.absolute_reject_layers = ['domain']
            policyOverrideMatrix.manual_review_is_blocking = false
            const result = PolicyDecisionEngine.evaluate({
                source: 'partner_registry',
                risk_level: 'medium',
                phase: 'Production',
                domain: 'engineering',
                validation_passed: true,
            })
            expect(result).toBe('rejected')
        } finally {
            policyOverrideMatrix.absolute_reject_layers = originalRejectLayers
            policyOverrideMatrix.manual_review_is_blocking = originalManualBlocking
        }
    })

    it('Core certification state machine enforces transitions', () => {
        expect(CoreStateMachine.canTransition('draft', 'validated')).toBe(true)
        expect(CoreStateMachine.canTransition('rejected', 'draft')).toBe(false)
        expect(() => CoreStateMachine.assertTransition('rejected', 'draft')).toThrow('Invalid certification state transition')
    })

    it('Transition guard blocks invalid promote/production source states', async () => {
        const { CertificationStateMachine } = await import('../certification/certification.state.machine')
        const promoteBlocked = CertificationStateMachine.transition({
            skill_id: 'skill-p1',
            current_state: 'validated',
            target_state: 'promoted',
        })
        expect(promoteBlocked.allowed).toBe(false)
        expect(promoteBlocked.reason).toContain('Invalid transition')

        const productionBlocked = CertificationStateMachine.transition({
            skill_id: 'skill-p2',
            current_state: 'certified',
            target_state: 'production',
        })
        expect(productionBlocked.allowed).toBe(false)
        expect(productionBlocked.reason).toContain('Invalid transition')
    })
})
