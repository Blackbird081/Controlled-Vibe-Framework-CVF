import { describe, expect, it } from 'vitest'

import {
    CERTIFICATION_STATE_MACHINE_ADAPTER_VERSION,
    CertificationStateMachine,
} from '../certification/certification.state.machine'
import {
    POLICY_DECISION_ENGINE_ADAPTER_VERSION,
    PolicyDecisionEngine,
} from '../policies/policy.decision.engine'
import {
    EXTERNAL_RISK_SCORING_HOOK_ADAPTER_VERSION,
    RiskScoringHook,
} from '../governance_hooks/risk.scoring.hook'

describe('Phase 2.B external policy adapters', () => {
    it('PolicyDecisionEngine.evaluateWithAdapter mirrors existing decision', () => {
        const ctx = {
            source: 'partner_registry' as const,
            risk_level: 'low' as const,
            phase: 'Discovery' as const,
            domain: 'marketing' as const,
            validation_passed: true,
        }
        const wrapped = PolicyDecisionEngine.evaluateWithAdapter(ctx)

        expect(wrapped.version).toBe(POLICY_DECISION_ENGINE_ADAPTER_VERSION)
        expect(wrapped.source).toBe('external-integration:policy-decision-engine')
        expect(wrapped.decision).toBe(PolicyDecisionEngine.evaluate(ctx))
        expect(wrapped.manualOverride).toBe(false)
    })

    it('CertificationStateMachine.transitionWithAdapter mirrors transition result', () => {
        const wrapped = CertificationStateMachine.transitionWithAdapter({
            skill_id: 'skill-policy-fanout',
            current_state: 'raw',
            target_state: 'draft',
        })

        expect(wrapped.adapter.version).toBe(CERTIFICATION_STATE_MACHINE_ADAPTER_VERSION)
        expect(wrapped.adapter.source).toBe('external-integration:certification-state-machine')
        expect(wrapped.adapter.allowed).toBe(wrapped.result.allowed)
        expect(wrapped.adapter.new_state).toBe('draft')
    })

    it('RiskScoringHook.evaluateWithAdapter preserves external scoring result', () => {
        const ctx = {
            scope_size: 2,
            external_dependencies: 1,
            accesses_filesystem: true,
            accesses_network: false,
            domain_sensitivity_score: 2,
        }
        const wrapped = RiskScoringHook.evaluateWithAdapter(ctx)

        expect(wrapped.version).toBe(EXTERNAL_RISK_SCORING_HOOK_ADAPTER_VERSION)
        expect(wrapped.source).toBe('external-integration:risk-scoring-hook')
        expect(wrapped.result).toEqual(RiskScoringHook.evaluate(ctx))
    })
})
