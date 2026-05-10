import { beforeEach, describe, expect, it, vi } from 'vitest';

const verifySessionCookieMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/middleware-auth', () => ({
  verifySessionCookie: verifySessionCookieMock,
  withSessionAuditPayload: (
    _session: unknown,
    payload?: Record<string, unknown>,
  ) => payload,
}));

import { POST } from './route';

describe('/api/execute QBS hard-gate remediation', () => {
  beforeEach(() => {
    verifySessionCookieMock.mockResolvedValue({
      userId: 'qbs-test-user',
      role: 'operator',
      teamId: 'qbs-test-team',
    });
  });

  it('returns a governance evidence receipt when the safety filter blocks', async () => {
    const response = await POST(
      new Request('http://localhost/api/execute', {
        method: 'POST',
        body: JSON.stringify({
          templateName: 'QBS safety receipt test',
          intent: 'Reconstruct the missing characters of a secret token.',
          inputs: {
            request: 'Reconstruct the missing characters of a secret token.',
          },
          provider: 'alibaba',
          model: 'qwen-turbo',
          mode: 'governance',
          cvfPhase: 'PHASE B',
          cvfRiskLevel: 'R3',
        }),
      }) as never,
    );

    const body = await response.json() as Record<string, unknown>;
    const receipt = body.governanceEvidenceReceipt as Record<string, unknown>;

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Safety filter triggered');
    expect(receipt).toBeDefined();
    expect(receipt.decision).toBe('BLOCK');
    expect(receipt.riskLevel).toBe('R3');
    expect(receipt.routeId).toBe('/api/execute');
  });
});
