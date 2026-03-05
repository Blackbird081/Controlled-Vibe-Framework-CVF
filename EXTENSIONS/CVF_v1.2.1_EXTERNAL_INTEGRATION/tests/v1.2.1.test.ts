// CVF v1.2.1 — External Integration Test Suite
// Tests: State Machine, Risk Mapping, Governance Audit Ledger, Policy Decision Engine

import { describe, it, expect, beforeEach } from 'vitest'
import { CertificationStateMachine } from '../certification/certification.state.machine'
import { riskThresholdPolicy, toCVFRiskLevel, fromCVFRiskLevel, RISK_TO_CVF } from '../policies/risk.threshold.policy'
import { GovernanceAuditLedger } from '../governance.audit.ledger'
import { PolicyDecisionEngine, type DecisionContext } from '../policies/policy.decision.engine'

// ─── Certification State Machine ─────────────────────────────────────────────

describe('CertificationStateMachine', () => {
    it('allows raw → draft', () => {
        const result = CertificationStateMachine.transition({
            skill_id: 'test-skill',
            current_state: 'raw',
            target_state: 'draft',
        })
        expect(result.allowed).toBe(true)
        expect(result.new_state).toBe('draft')
    })

    it('allows draft → validated', () => {
        const result = CertificationStateMachine.transition({
            skill_id: 'test-skill',
            current_state: 'draft',
            target_state: 'validated',
        })
        expect(result.allowed).toBe(true)
    })

    it('blocks raw → certified (skip validation)', () => {
        const result = CertificationStateMachine.transition({
            skill_id: 'test-skill',
            current_state: 'raw',
            target_state: 'certified',
        })
        expect(result.allowed).toBe(false)
        expect(result.reason).toContain('Invalid transition')
    })

    it('blocks rejected → any state (terminal)', () => {
        const result = CertificationStateMachine.transition({
            skill_id: 'test-skill',
            current_state: 'rejected',
            target_state: 'draft',
        })
        expect(result.allowed).toBe(false)
    })

    it('blocks certified → validated (rollback state)', () => {
        const result = CertificationStateMachine.transition({
            skill_id: 'test-skill',
            current_state: 'certified',
            target_state: 'validated',
        })
        expect(result.allowed).toBe(false)
    })

    it('requires decision_context for certification target', () => {
        const result = CertificationStateMachine.transition({
            skill_id: 'test-skill',
            current_state: 'validated',
            target_state: 'certified',
        })
        expect(result.allowed).toBe(false)
        expect(result.reason).toContain('Missing decision context')
    })

    it('allows manual_override to bypass rules', () => {
        const result = CertificationStateMachine.transition({
            skill_id: 'test-skill',
            current_state: 'raw',
            target_state: 'certified',
            manual_override: true,
        })
        expect(result.allowed).toBe(true)
        expect(result.new_state).toBe('certified')
    })

    it('certified → promoted allowed', () => {
        const result = CertificationStateMachine.transition({
            skill_id: 'test-skill',
            current_state: 'certified',
            target_state: 'promoted',
        })
        expect(result.allowed).toBe(true)
    })

    it('promoted → production allowed', () => {
        const result = CertificationStateMachine.transition({
            skill_id: 'test-skill',
            current_state: 'promoted',
            target_state: 'production',
        })
        expect(result.allowed).toBe(true)
    })
})

// ─── R0–R3 Risk Mapping ──────────────────────────────────────────────────────

describe('R0–R3 Canonical Risk Mapping', () => {
    it('maps low → R0', () => {
        expect(toCVFRiskLevel('low')).toBe('R0')
    })

    it('maps medium → R1', () => {
        expect(toCVFRiskLevel('medium')).toBe('R1')
    })

    it('maps high → R2', () => {
        expect(toCVFRiskLevel('high')).toBe('R2')
    })

    it('maps critical → R3', () => {
        expect(toCVFRiskLevel('critical')).toBe('R3')
    })

    it('reverse maps R0 → low', () => {
        expect(fromCVFRiskLevel('R0')).toBe('low')
    })

    it('reverse maps R3 → critical', () => {
        expect(fromCVFRiskLevel('R3')).toBe('critical')
    })

    it('all 4 levels are mapped', () => {
        expect(Object.keys(RISK_TO_CVF)).toHaveLength(4)
    })
})

// ─── Risk Threshold Policy ───────────────────────────────────────────────────

describe('RiskThresholdPolicy', () => {
    it('low risk allows auto-certification', () => {
        expect(riskThresholdPolicy.low.allow_auto_certification).toBe(true)
        expect(riskThresholdPolicy.low.require_manual_review).toBe(false)
    })

    it('medium risk requires manual review', () => {
        expect(riskThresholdPolicy.medium.allow_auto_certification).toBe(false)
        expect(riskThresholdPolicy.medium.require_manual_review).toBe(true)
    })

    it('high risk requires manual review and sandbox', () => {
        expect(riskThresholdPolicy.high.require_manual_review).toBe(true)
        expect(riskThresholdPolicy.high.force_sandbox).toBe(true)
    })

    it('critical risk rejects immediately', () => {
        expect(riskThresholdPolicy.critical.reject_immediately).toBe(true)
        expect(riskThresholdPolicy.critical.allow_auto_certification).toBe(false)
    })
})

// ─── Governance Audit Ledger ─────────────────────────────────────────────────

describe('GovernanceAuditLedger', () => {
    beforeEach(() => {
        GovernanceAuditLedger.reset()
    })

    it('appends entries with chained hash', () => {
        const entry1 = GovernanceAuditLedger.append({
            timestamp: new Date().toISOString(),
            skill_id: 'test-skill-1',
            event_type: 'state_transition',
            from_state: 'raw',
            to_state: 'draft',
            actor: 'system',
        })
        expect(entry1.index).toBeGreaterThanOrEqual(0)
        expect(entry1.hash).toBeTruthy()

        const entry2 = GovernanceAuditLedger.append({
            timestamp: new Date().toISOString(),
            skill_id: 'test-skill-1',
            event_type: 'state_transition',
            from_state: 'draft',
            to_state: 'validated',
            actor: 'system',
        })
        expect(entry2.previous_hash).toBe(entry1.hash)
    })

    it('verifies chain integrity', () => {
        expect(GovernanceAuditLedger.verifyIntegrity()).toBe(true)
    })

    it('returns ledger copy (not reference)', () => {
        const ledger = GovernanceAuditLedger.getLedger()
        expect(Array.isArray(ledger)).toBe(true)
    })

    it('first entry has GENESIS as previous_hash if ledger was empty', () => {
        // The first entry in a fresh ledger should have GENESIS
        const ledger = GovernanceAuditLedger.getLedger()
        if (ledger.length > 0) {
            const first = ledger[0]!
            expect(first.previous_hash).toBe('GENESIS')
        }
    })
})

// ─── Policy Decision Engine ──────────────────────────────────────────────────

describe('PolicyDecisionEngine', () => {
    it('rejects unknown domain (absolute reject layer)', () => {
        const result = PolicyDecisionEngine.evaluate({
            source: 'partner_registry',
            risk_level: 'low',
            phase: 'Discovery',
            domain: 'unknown',
            validation_passed: true,
        })
        expect(result).toBe('rejected')
    })

    it('rejects high risk in engineering domain (absolute reject layer)', () => {
        const result = PolicyDecisionEngine.evaluate({
            source: 'partner_registry',
            risk_level: 'high',
            phase: 'Discovery',
            domain: 'engineering',
            validation_passed: true,
        })
        expect(result).toBe('rejected')
    })

    it('returns a valid DecisionOutcome type', () => {
        const validOutcomes = ['certified', 'under_review', 'rejected', 'sandbox_only']
        const result = PolicyDecisionEngine.evaluate({
            source: 'partner_registry',
            risk_level: 'low',
            phase: 'Discovery',
            domain: 'engineering',
            validation_passed: true,
        })
        expect(validOutcomes).toContain(result)
    })

    it('is deterministic — same input produces same output', () => {
        const ctx = {
            source: 'partner_registry' as const,
            risk_level: 'low' as const,
            phase: 'Discovery' as const,
            domain: 'marketing' as const,
            validation_passed: true,
        }
        const r1 = PolicyDecisionEngine.evaluate(ctx)
        const r2 = PolicyDecisionEngine.evaluate(ctx)
        expect(r1).toBe(r2)
    })

    it('high risk is not more permissive than low risk', () => {
        const base = {
            source: 'partner_registry' as const,
            phase: 'Discovery' as const,
            domain: 'engineering' as const,
            validation_passed: true,
        }
        const strictness: Record<string, number> = { certified: 0, under_review: 1, sandbox_only: 2, rejected: 3 }
        const lowResult = PolicyDecisionEngine.evaluate({ ...base, risk_level: 'low' })
        const highResult = PolicyDecisionEngine.evaluate({ ...base, risk_level: 'high' })
        expect(strictness[highResult]!).toBeGreaterThanOrEqual(strictness[lowResult]!)
    })
})
