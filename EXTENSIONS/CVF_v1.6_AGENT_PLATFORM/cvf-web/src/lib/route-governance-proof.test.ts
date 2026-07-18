import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import {
  ROUTE_GOVERNANCE_PROOF_REGISTRY,
  ROUTE_GOVERNANCE_PROOF_WORKFLOW_CHAIN_VERSION,
  authorizeRouteGovernanceProof,
  getRouteGovernanceProofConfig,
} from './route-governance-proof';

const verifySessionCookieMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/middleware-auth', () => ({
  verifySessionCookie: verifySessionCookieMock,
}));

const CONFIG = {
  routeId: '/api/test-governed',
  surface: 'test-governed-route',
  riskLevel: 'R1' as const,
  evidenceBasis: 'focused route governance proof test',
};

function request(body: string, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/test-governed', {
    method: 'POST',
    headers,
    body,
  });
}

describe('authorizeRouteGovernanceProof', () => {
  beforeEach(() => {
    verifySessionCookieMock.mockReset();
    verifySessionCookieMock.mockResolvedValue(null);
    process.env.CVF_SERVICE_TOKEN = 'test-service-token';
  });

  it('allows a valid service token without leaking the raw token', async () => {
    const result = await authorizeRouteGovernanceProof(
      request('{"ok":true}', { 'x-cvf-service-token': 'test-service-token' }),
      '{"ok":true}',
      CONFIG,
    );

    expect(result.allowed).toBe(true);
    expect(result.proof.workflowChainVersion).toBe(ROUTE_GOVERNANCE_PROOF_WORKFLOW_CHAIN_VERSION);
    expect(result.proof.stages).toEqual([
      'BODY_CAPTURED',
      'ROUTE_CONFIG_RESOLVED',
      'SERVICE_TOKEN_EVALUATED',
      'PROOF_EMITTED',
    ]);
    expect(result.proof.terminalStage).toBe('PROOF_EMITTED');
    expect(result.proof.authMode).toBe('service_token');
    expect(result.proof.decision).toBe('ALLOW');
    expect(result.proof.serviceTokenConfigured).toBe(true);
    expect(JSON.stringify(result.proof)).not.toContain('test-service-token');
    expect(verifySessionCookieMock).not.toHaveBeenCalled();
  });

  it('allows a session when no valid service token is present', async () => {
    verifySessionCookieMock.mockResolvedValueOnce({
      userId: 'user-1',
      user: 'Tester',
      role: 'admin',
      orgId: 'org',
      teamId: 'team',
      expiresAt: Date.now() + 1000,
      authMode: 'session',
    });

    const result = await authorizeRouteGovernanceProof(request('{"ok":true}'), '{"ok":true}', CONFIG);

    expect(result.allowed).toBe(true);
    expect(result.proof.authMode).toBe('session');
    expect(result.proof.actorId).toBe('user-1');
  });

  it('denies missing auth with secret-safe routeGovernanceProof', async () => {
    const result = await authorizeRouteGovernanceProof(request('{"ok":true}'), '{"ok":true}', CONFIG);
    const payload = await result.response?.json();

    expect(result.allowed).toBe(false);
    expect(result.response?.status).toBe(401);
    expect(payload.routeGovernanceProof.decision).toBe('DENY');
    expect(payload.routeGovernanceProof.serviceTokenConfigured).toBe(true);
    expect(payload.routeGovernanceProof.stages).toContain('SESSION_EVALUATED');
  });

  it('registers the five ERH-T2C route governance proof surfaces', () => {
    expect(Object.keys(ROUTE_GOVERNANCE_PROOF_REGISTRY).sort()).toEqual([
      '/api/artifacts/export',
      '/api/governance/override',
      '/api/knowledge/ingest',
      '/api/lpci/intake',
      '/api/lpci/query',
    ]);
    expect(getRouteGovernanceProofConfig('/api/lpci/query').riskLevel).toBe('R2');
  });
});
