// RT3 live proof — exercises /api/learning-plane/readout POST handler directly.
// Confirms findingToLearningReadout field with autonomousMutationAuthorized=false.
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { FINDING_TO_LEARNING_BRIDGE_VERSION } from '@/lib/finding-to-learning-bridge';
import { LEARNING_PLANE_READOUT_ROUTE_VERSION } from './route-constants';

const verifySessionCookieMock = vi.hoisted(() => vi.fn());
vi.mock('@/lib/middleware-auth', () => ({
  verifySessionCookie: verifySessionCookieMock,
  withSessionAuditPayload: vi.fn((_, p) => p),
}));

import { POST } from './route';

describe('RT3 live proof — /api/learning-plane/readout', () => {
  beforeEach(() => {
    verifySessionCookieMock.mockResolvedValue({
      userId: 'usr_rt3_live', user: 'RT3 Live Tester', role: 'admin',
      orgId: 'org_cvf', teamId: 'team_rt3',
      expiresAt: Date.now() + 3_600_000, authMode: 'session',
    });
  });

  it('returns well-formed findingToLearningReadout for RT2 RULE_GAP finding', async () => {
    const input = {
      sourceId: 'rt2-rule-gap-finding-rt3-proof',
      sourceArtifact: 'docs/reviews/CVF_RT2_FINDING_TO_LEARNING_SIGNAL_BRIDGE_COMPLETION_2026-05-31.md',
      sourceSummary: 'RT2 closed the protocol-only gap between finding guard taxonomy and LPF intake bridge caller. RT3 exposes this on a dedicated advisory route.',
      lane: 'GOVERNANCE_CONTROL_PLANE',
      defectClass: 'RULE_GAP',
      severity: 'medium',
      disposition: 'N/A_WITH_REASON',
      nextControlAction: 'RT3 new route /api/learning-plane/readout advisory surface',
      evidenceBasis: 'RT2 CLOSED_PASS_BOUNDED — finding-to-learning-bridge.live.test.ts 1/1 PASS',
    };

    const req = new Request('http://localhost/api/learning-plane/readout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    const res = await POST(req as never);
    const data = await res.json();

    console.log('[RT3 live proof]', {
      routeVersion: data.routeVersion,
      bridgeVersion: data.bridgeVersion,
      findingToLearningReadout: data.findingToLearningReadout,
    });

    expect(data.success).toBe(true);
    expect(data.routeVersion).toBe(LEARNING_PLANE_READOUT_ROUTE_VERSION);
    expect(data.bridgeVersion).toBe(FINDING_TO_LEARNING_BRIDGE_VERSION);
    expect(data.findingToLearningReadout).toBeDefined();
    expect(data.findingToLearningReadout.lane).toBe('GOVERNANCE_CONTROL_PLANE');
    expect(data.findingToLearningReadout.defectClass).toBe('RULE_GAP');
    expect(data.findingToLearningReadout.feedbackClass).toBe('ACCEPT');
    expect(data.findingToLearningReadout.autonomousMutationAuthorized).toBe(false);
    expect(data.findingToLearningReadout.requiresGovernanceWorkOrder).toBe(false);
  }, 10_000);
});
