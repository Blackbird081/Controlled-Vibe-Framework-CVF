import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { POST } from './route';

const verifySessionCookieMock = vi.hoisted(() => vi.fn());
const governanceFetchDirectMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/middleware-auth', () => ({
  verifySessionCookie: verifySessionCookieMock,
}));

vi.mock('@/lib/governance-engine', () => ({
  governanceFetchDirect: governanceFetchDirectMock,
}));

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/governance/override', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-cvf-service-token': 'test-service-token' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/governance/override route governance proof', () => {
  beforeEach(() => {
    process.env.CVF_SERVICE_TOKEN = 'test-service-token';
    verifySessionCookieMock.mockReset();
    verifySessionCookieMock.mockResolvedValue(null);
    governanceFetchDirectMock.mockReset();
    governanceFetchDirectMock.mockResolvedValue(null);
  });

  it('emits routeGovernanceProof on fallback override creation', async () => {
    const res = await POST(makeRequest({
      requestId: 'req-1',
      justification: 'This override is requested for a bounded governance test with a clear audit reason.',
      riskAcknowledged: true,
      expiryDays: 1,
    }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.routeGovernanceProof.routeId).toBe('/api/governance/override');
    expect(data.routeGovernanceProof.authMode).toBe('service_token');
    expect(JSON.stringify(data.routeGovernanceProof)).not.toContain('test-service-token');
  });
});
