import { describe, expect, it } from 'vitest';

import {
  GUARD_CONTRACT_RISK_GATE_ADAPTER_VERSION,
  RiskGateGuard,
} from './risk-gate.guard';
import type { GuardRequestContext, RiskApprovalEvidence } from '../types';

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

describe('R2 builder approval evidence', () => {
  const hash = 'a'.repeat(64);
  const valid = (): RiskApprovalEvidence => ({
    status: 'APPROVED', approvalRef: 'owned/run/approval.json', approvedByRole: 'OPERATOR',
    subjectRole: 'BUILDER', subjectPhase: 'BUILD', action: 'create_html_draft',
    actorId: 'usr_3', binding: 'pilot-profile-digest', traceHash: hash,
    expiresAt: new Date(Date.now() + 60_000).toISOString(), revoked: false,
  });
  const approved = (evidence: RiskApprovalEvidence): GuardRequestContext => ctx({
    action: 'create_html_draft', metadata: { actorId: 'usr_3' },
    approvalBinding: 'pilot-profile-digest', traceHash: hash, riskApproval: evidence,
  });

  it('allows only the exact approved R2 builder action', () => {
    expect(new RiskGateGuard().evaluate(approved(valid())).decision).toBe('ALLOW');
    expect(new RiskGateGuard().evaluate(ctx()).decision).toBe('ESCALATE');
  });

  it.each([
    ['wrong owner', (e: RiskApprovalEvidence) => ({ ...e, actorId: 'other' })],
    ['wrong action', (e: RiskApprovalEvidence) => ({ ...e, action: 'modify_html_draft' })],
    ['wrong role', (e: RiskApprovalEvidence) => ({ ...e, subjectRole: 'OPERATOR' as const })],
    ['wrong binding', (e: RiskApprovalEvidence) => ({ ...e, binding: 'other' })],
    ['wrong trace', (e: RiskApprovalEvidence) => ({ ...e, traceHash: 'b'.repeat(64) })],
    ['revoked', (e: RiskApprovalEvidence) => ({ ...e, revoked: true as false })],
    ['expired', (e: RiskApprovalEvidence) => ({ ...e, expiresAt: '2020-01-01T00:00:00Z' })],
    ['unapproved', (e: RiskApprovalEvidence) => ({ ...e, status: 'PENDING' as 'APPROVED' })],
  ])('escalates %s evidence', (_label, mutate) => {
    expect(new RiskGateGuard().evaluate(approved(mutate(valid()))).decision).toBe('ESCALATE');
  });
});
