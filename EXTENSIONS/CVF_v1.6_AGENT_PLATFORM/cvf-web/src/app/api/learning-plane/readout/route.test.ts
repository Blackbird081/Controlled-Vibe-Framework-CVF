import { describe, expect, it, vi, beforeEach } from 'vitest';
import { FINDING_TO_LEARNING_BRIDGE_VERSION } from '@/lib/finding-to-learning-bridge';
import { LEARNING_PLANE_READOUT_ROUTE_VERSION } from './route-constants';

const verifySessionCookieMock = vi.hoisted(() => vi.fn());
vi.mock('@/lib/middleware-auth', () => ({
  verifySessionCookie: verifySessionCookieMock,
  withSessionAuditPayload: vi.fn((_, p) => p),
}));

import { POST } from './route';

const validInput = {
  sourceId: 'test-src-001',
  sourceArtifact: 'docs/reviews/CVF_RT2_TEST.md',
  sourceSummary: 'RT2 finding: RULE_GAP in intake bridge caller',
  lane: 'GOVERNANCE_CONTROL_PLANE',
  defectClass: 'RULE_GAP',
  severity: 'medium',
  disposition: 'N/A_WITH_REASON',
  nextControlAction: 'RT3 route wiring',
  evidenceBasis: 'check_finding_to_governance_learning.py',
};

function makeReq(body: unknown) {
  return new Request('http://localhost/api/learning-plane/readout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/learning-plane/readout', () => {
  beforeEach(() => {
    verifySessionCookieMock.mockResolvedValue({
      userId: 'usr_rt3_test', role: 'admin', orgId: 'org_cvf',
      teamId: 'team_rt3', expiresAt: Date.now() + 3_600_000, authMode: 'session',
    });
  });

  it('returns findingToLearningReadout with correct versions', async () => {
    const res = await POST(makeReq(validInput) as never);
    const d = await res.json();
    expect(d.success).toBe(true);
    expect(d.routeVersion).toBe(LEARNING_PLANE_READOUT_ROUTE_VERSION);
    expect(d.bridgeVersion).toBe(FINDING_TO_LEARNING_BRIDGE_VERSION);
    expect(d.findingToLearningReadout).toBeDefined();
  });

  it('autonomousMutationAuthorized is false', async () => {
    const res = await POST(makeReq(validInput) as never);
    const d = await res.json();
    expect(d.findingToLearningReadout.autonomousMutationAuthorized).toBe(false);
  });

  it('maps RULE_GAP + N/A_WITH_REASON to ACCEPT feedbackClass', async () => {
    const res = await POST(makeReq(validInput) as never);
    const d = await res.json();
    expect(d.findingToLearningReadout.feedbackClass).toBe('ACCEPT');
  });

  it('returns 401 when unauthenticated', async () => {
    verifySessionCookieMock.mockResolvedValue(null);
    const res = await POST(makeReq(validInput) as never);
    expect(res.status).toBe(401);
  });

  it('returns 400 on missing required fields', async () => {
    const res = await POST(makeReq({ sourceId: 'only-this' }) as never);
    expect(res.status).toBe(400);
  });

  it('returns 400 on invalid taxonomy values', async () => {
    const res = await POST(makeReq({ ...validInput, lane: 'MADE_UP_LANE' }) as never);
    expect(res.status).toBe(400);
  });

  it('returns 400 on invalid JSON', async () => {
    const req = new Request('http://localhost/api/learning-plane/readout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'not-json',
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });
});
