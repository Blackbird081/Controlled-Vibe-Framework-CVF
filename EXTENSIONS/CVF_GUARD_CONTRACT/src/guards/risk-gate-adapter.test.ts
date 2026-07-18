import { describe, expect, it } from 'vitest';

import {
  GUARD_CONTRACT_RISK_GATE_ADAPTER_VERSION,
  RiskGateGuard,
} from './risk-gate.guard';
import type { GuardRequestContext } from '../types';

function ctx(overrides: Partial<GuardRequestContext> = {}): GuardRequestContext {
  return {
    requestId: 'guard-contract-risk-fanout-001',
    phase: 'BUILD',
    riskLevel: 'R2',
    role: 'BUILDER',
    action: 'write',
    ...overrides,
  };
}

describe('Phase 2.B guard contract risk gate adapter', () => {
  it('evaluateWithAdapter preserves canonical risk gate decision metadata', () => {
    const guard = new RiskGateGuard();
    const wrapped = guard.evaluateWithAdapter(ctx());

    expect(wrapped.adapter.version).toBe(GUARD_CONTRACT_RISK_GATE_ADAPTER_VERSION);
    expect(wrapped.adapter.source).toBe('guard-contract:risk-gate');
    expect(wrapped.adapter.riskNumeric).toBe(2);
    expect(wrapped.adapter.decision).toBe(wrapped.result.decision);
    expect(wrapped.result.decision).toBe('ESCALATE');
  });
});
