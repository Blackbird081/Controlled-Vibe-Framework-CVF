import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { POST } from './route';

const verifySessionCookieMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/middleware-auth', () => ({
  verifySessionCookie: verifySessionCookieMock,
}));

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/lpci/intake', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-cvf-service-token': 'test-service-token' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/lpci/intake route governance proof', () => {
  beforeEach(() => {
    process.env.CVF_SERVICE_TOKEN = 'test-service-token';
    verifySessionCookieMock.mockReset();
    verifySessionCookieMock.mockResolvedValue(null);
  });

  it('emits routeGovernanceProof on validation denial after auth', async () => {
    const res = await POST(makeRequest({ corpusRoot: '', manifestPath: '' }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.routeGovernanceProof.routeId).toBe('/api/lpci/intake');
    expect(data.routeGovernanceProof.authMode).toBe('service_token');
    expect(data.routeGovernanceProof.decision).toBe('ALLOW');
  });
});
