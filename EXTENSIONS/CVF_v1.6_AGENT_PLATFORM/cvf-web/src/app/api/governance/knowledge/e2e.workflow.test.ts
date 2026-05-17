/**
 * W82-T1 — Knowledge Governance E2E Workflow Tests
 * Chains compile → maintain → refactor through the W80 API routes.
 * Tests the full operator lifecycle at the product layer.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const verifySessionCookieMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/middleware-auth', () => ({
  verifySessionCookie: verifySessionCookieMock,
}));

import { POST as compilePost } from './compile/route';
import { POST as maintainPost } from './maintain/route';
import { POST as refactorPost } from './refactor/route';

const VALID_COMPILE_REQUEST = {
  contextId: 'ctx-e2e-001',
  artifactType: 'concept' as const,
  sourceIds: ['src-e2e-001', 'src-e2e-002'],
  citationRef: 'CVF Knowledge Policy §3',
  citationTrail: ['raw-ingest-e2e-001 -> compiled-e2e-001'],
  compiledBy: 'e2e-test-agent',
  content: 'CVF governance artifacts must be formally compiled before entering the query pool.',
};

const BASE = 'http://localhost';

function makeReq(path: string, body: unknown, serviceToken?: string) {
  return new Request(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(serviceToken ? { 'x-cvf-service-token': serviceToken } : {}),
    },
    body: JSON.stringify(body),
  }) as never;
}

describe('Knowledge Governance E2E — full lifecycle (compile → maintain → refactor)', () => {
  beforeEach(() => {
    verifySessionCookieMock.mockReset();
    verifySessionCookieMock.mockResolvedValue({ user: 'e2e-tester', role: 'admin', expiresAt: Date.now() + 3_600_000 });
  });

  it('Scenario A — compile to pending (no govern)', async () => {
    const res = await compilePost(makeReq('/api/governance/knowledge/compile', { compileRequest: VALID_COMPILE_REQUEST }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.governed).toBe(false);
    expect(json.data.artifact.governanceStatus).toBe('pending');
    expect(json.data.artifact.governedAt).toBeNull();
  });

  it('Scenario B — compile + approve: artifact ready for maintain', async () => {
    const res = await compilePost(makeReq('/api/governance/knowledge/compile', {
      compileRequest: VALID_COMPILE_REQUEST,
      governDecision: { decision: 'approved' },
    }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.governed).toBe(true);
    expect(json.data.artifact.governanceStatus).toBe('approved');
    expect(json.data.artifact.governedAt).not.toBeNull();
    expect(json.data.artifact.rejectionReason).toBeNull();
  });

  it('Scenario C — compile + approve → maintain clean (no signals)', async () => {
    const compileRes = await compilePost(makeReq('/api/governance/knowledge/compile', {
      compileRequest: VALID_COMPILE_REQUEST,
      governDecision: { decision: 'approved' },
    }));
    const { data: { artifact } } = await compileRes.json();

    const maintainRes = await maintainPost(makeReq('/api/governance/knowledge/maintain', {
      artifact,
      checks: [{ type: 'lint', requiredKeywords: ['governance', 'compiled'] }],
    }));
    const maintainJson = await maintainRes.json();

    expect(maintainRes.status).toBe(200);
    expect(maintainJson.success).toBe(true);
    expect(maintainJson.data.hasIssues).toBe(false);
    expect(maintainJson.data.totalSignals).toBe(0);
    expect(maintainJson.data.artifactId).toBe(artifact.artifactId);
  });

  it('Scenario D — compile + approve → maintain with issues → refactor proposals', async () => {
    const compileRes = await compilePost(makeReq('/api/governance/knowledge/compile', {
      compileRequest: VALID_COMPILE_REQUEST,
      governDecision: { decision: 'approved' },
    }));
    const { data: { artifact } } = await compileRes.json();

    const maintainRes = await maintainPost(makeReq('/api/governance/knowledge/maintain', {
      artifact,
      checks: [{ type: 'lint', requiredKeywords: ['missing-keyword-xyz', 'another-missing-kw'] }],
    }));
    const maintainJson = await maintainRes.json();

    expect(maintainRes.status).toBe(200);
    expect(maintainJson.data.hasIssues).toBe(true);
    expect(maintainJson.data.totalSignals).toBe(2);
    expect(maintainJson.data.signals[0].signalType).toBe('lint');

    const refactorRes = await refactorPost(makeReq('/api/governance/knowledge/refactor', {
      result: maintainJson.data,
    }));
    const refactorJson = await refactorRes.json();

    expect(refactorRes.status).toBe(200);
    expect(refactorJson.success).toBe(true);
    expect(refactorJson.data.artifactId).toBe(artifact.artifactId);
    expect(refactorJson.data.recommendedAction).toBeDefined();
    expect(refactorJson.data.triggerTypes).toContain('lint');
    expect(refactorJson.data.rationale).toBeDefined();
  });

  it('Scenario E — compile + reject: artifact cannot enter maintain', async () => {
    const compileRes = await compilePost(makeReq('/api/governance/knowledge/compile', {
      compileRequest: VALID_COMPILE_REQUEST,
      governDecision: { decision: 'rejected', reason: 'Content violates policy standards.' },
    }));
    const { data: { artifact } } = await compileRes.json();

    expect(artifact.governanceStatus).toBe('rejected');
    expect(artifact.rejectionReason).toBe('Content violates policy standards.');

    const maintainRes = await maintainPost(makeReq('/api/governance/knowledge/maintain', {
      artifact,
      checks: [{ type: 'lint', requiredKeywords: [] }],
    }));
    const maintainJson = await maintainRes.json();

    expect(maintainRes.status).toBe(500);
    expect(maintainJson.success).toBe(false);
    expect(maintainJson.error).toMatch(/approved/);
  });

  it('Scenario F — unauthorized access rejected on all routes', async () => {
    verifySessionCookieMock.mockResolvedValue(null);

    const compileRes = await compilePost(makeReq('/api/governance/knowledge/compile', { compileRequest: VALID_COMPILE_REQUEST }));
    expect(compileRes.status).toBe(401);

    const maintainRes = await maintainPost(makeReq('/api/governance/knowledge/maintain', { artifact: {}, checks: [] }));
    expect(maintainRes.status).toBe(401);

    const refactorRes = await refactorPost(makeReq('/api/governance/knowledge/refactor', { result: {} }));
    expect(refactorRes.status).toBe(401);
  });

  it('Scenario G — invalid inputs rejected on all routes', async () => {
    const compileRes = await compilePost(makeReq('/api/governance/knowledge/compile', {}));
    expect(compileRes.status).toBe(400);

    const maintainRes = await maintainPost(makeReq('/api/governance/knowledge/maintain', { artifact: {} }));
    expect(maintainRes.status).toBe(400);

    const refactorRes = await refactorPost(makeReq('/api/governance/knowledge/refactor', {}));
    expect(refactorRes.status).toBe(400);
  });
});
