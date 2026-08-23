import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import {
  ROUTE_GOVERNANCE_PROOF_REGISTRY,
  ROUTE_GOVERNANCE_PROOF_WORKFLOW_CHAIN_VERSION,
  authorizeRouteGovernanceProof,
  getRouteGovernanceProofConfig,
} from './route-governance-proof';
import { computeServiceRequestSignature } from './service-token-auth';

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

const SERVICE_TOKEN = 'test-service-token';

function request(body: string, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/test-governed', {
    method: 'POST',
    headers,
    body,
  });
}

function signedTokenHeaders(body: string, now: number, token: string = SERVICE_TOKEN): Record<string, string> {
  const timestamp = String(now);
  return {
    'x-cvf-service-token': token,
    'x-cvf-service-timestamp': timestamp,
    'x-cvf-service-signature': computeServiceRequestSignature(token, timestamp, body),
  };
}

describe('authorizeRouteGovernanceProof', () => {
  beforeEach(() => {
    verifySessionCookieMock.mockReset();
    verifySessionCookieMock.mockResolvedValue(null);
    process.env.CVF_SERVICE_TOKEN = 'test-service-token';
  });

  it('allows a valid signed service token without leaking the raw token', async () => {
    const body = '{"ok":true}';
    const now = Date.now();

    const result = await authorizeRouteGovernanceProof(
      request(body, signedTokenHeaders(body, now)),
      body,
      CONFIG,
      { now },
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
    expect(JSON.stringify(result.proof)).not.toContain(SERVICE_TOKEN);
    expect(verifySessionCookieMock).not.toHaveBeenCalled();
  });

  it('denies a presented service token missing a signature, without a test-mode bypass', async () => {
    const result = await authorizeRouteGovernanceProof(
      request('{"ok":true}', { 'x-cvf-service-token': SERVICE_TOKEN }),
      '{"ok":true}',
      CONFIG,
    );

    expect(result.proof.serviceTokenPresented).toBe(true);
    expect(result.proof.serviceSignaturePresented).toBe(false);
    expect(result.proof.authMode).not.toBe('service_token');
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

  it('preserves existing session fallback for an invalid presented token when no precedence option is passed', async () => {
    verifySessionCookieMock.mockResolvedValueOnce({
      userId: 'user-1',
      user: 'Tester',
      role: 'admin',
      orgId: 'org',
      teamId: 'team',
      expiresAt: Date.now() + 1000,
      authMode: 'session',
    });

    const result = await authorizeRouteGovernanceProof(
      request('{"ok":true}', { 'x-cvf-service-token': 'wrong-token' }),
      '{"ok":true}',
      CONFIG,
    );

    expect(result.allowed).toBe(true);
    expect(result.proof.authMode).toBe('session');
    expect(verifySessionCookieMock).toHaveBeenCalledTimes(1);
  });

  it('denies before session evaluation when invalidTokenPrecedence is FAIL_CLOSED', async () => {
    const result = await authorizeRouteGovernanceProof(
      request('{"ok":true}', { 'x-cvf-service-token': 'wrong-token' }),
      '{"ok":true}',
      CONFIG,
      { invalidTokenPrecedence: 'FAIL_CLOSED' },
    );

    expect(result.allowed).toBe(false);
    expect(result.response?.status).toBe(401);
    expect(result.proof.actorId).toBeNull();
    expect(verifySessionCookieMock).not.toHaveBeenCalled();
  });

  it('allows session through the FAIL_CLOSED precedence when no token is presented', async () => {
    verifySessionCookieMock.mockResolvedValueOnce({
      userId: 'user-1',
      user: 'Tester',
      role: 'admin',
      orgId: 'org',
      teamId: 'team',
      expiresAt: Date.now() + 1000,
      authMode: 'session',
    });

    const result = await authorizeRouteGovernanceProof(
      request('{"ok":true}'),
      '{"ok":true}',
      CONFIG,
      { invalidTokenPrecedence: 'FAIL_CLOSED' },
    );

    expect(result.allowed).toBe(true);
    expect(result.proof.authMode).toBe('session');
  });

  it('uses an injected time for deterministic generatedAt and the token verification window', async () => {
    const fixedNow = 1_700_000_000_000;
    const body = '{"ok":true}';

    const result = await authorizeRouteGovernanceProof(
      request(body, signedTokenHeaders(body, fixedNow)),
      body,
      CONFIG,
      { now: fixedNow },
    );

    expect(result.allowed).toBe(true);
    expect(result.proof.generatedAt).toBe(new Date(fixedNow).toISOString());
  });
});
