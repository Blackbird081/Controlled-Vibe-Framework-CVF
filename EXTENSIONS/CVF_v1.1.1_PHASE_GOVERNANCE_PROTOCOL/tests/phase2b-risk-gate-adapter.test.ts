import { describe, expect, it } from 'vitest'

import {
    PHASE_GOVERNANCE_RISK_GATE_ADAPTER_VERSION,
    RiskGateGuard,
} from '../governance/guard_runtime/guards/risk.gate.guard.js'
import type { GuardRequestContext } from '../governance/guard_runtime/guard.runtime.types.js'

function ctx(overrides: Partial<GuardRequestContext> = {}): GuardRequestContext {
    return {
        requestId: 'phase-risk-fanout-001',
        phase: 'BUILD',
        riskLevel: 'R3',
        role: 'BUILDER',
        action: 'deploy',
        ...overrides,
    }
}

describe('Phase 2.B phase governance risk gate adapter', () => {
    it('evaluateWithAdapter mirrors risk gate result for existing runtime guard', () => {
        const guard = new RiskGateGuard()
        const wrapped = guard.evaluateWithAdapter(ctx())

        expect(wrapped.adapter.version).toBe(PHASE_GOVERNANCE_RISK_GATE_ADAPTER_VERSION)
        expect(wrapped.adapter.source).toBe('phase-governance:risk-gate')
        expect(wrapped.adapter.riskNumeric).toBe(3)
        expect(wrapped.adapter.decision).toBe(wrapped.result.decision)
        expect(wrapped.result.decision).toBe('BLOCK')
    })
})
