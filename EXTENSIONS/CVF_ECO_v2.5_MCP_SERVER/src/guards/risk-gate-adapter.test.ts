import { describe, expect, it } from 'vitest';

import {
  MCP_RISK_GATE_ADAPTER_VERSION,
  RiskGateGuard,
} from './risk-gate.guard.js';
import type { GuardRequestContext } from './types.js';

function ctx(overrides: Partial<GuardRequestContext> = {}): GuardRequestContext {
  return {
    requestId: 'mcp-risk-fanout-001',
    phase: 'BUILD',
    riskLevel: 'R2',
    role: 'AI_AGENT',
    action: 'execute',
    ...overrides,
  };
}

describe('Phase 2.B MCP risk gate adapter', () => {
  it('evaluateWithAdapter mirrors guard decision metadata', () => {
    const guard = new RiskGateGuard();
    const wrapped = guard.evaluateWithAdapter(ctx());

    expect(wrapped.adapter.version).toBe(MCP_RISK_GATE_ADAPTER_VERSION);
    expect(wrapped.adapter.source).toBe('eco-v2.5:mcp-risk-gate');
    expect(wrapped.adapter.requestId).toBe('mcp-risk-fanout-001');
    expect(wrapped.adapter.riskNumeric).toBe(2);
    expect(wrapped.adapter.decision).toBe(wrapped.result.decision);
    expect(wrapped.result.decision).toBe('ESCALATE');
  });
});
