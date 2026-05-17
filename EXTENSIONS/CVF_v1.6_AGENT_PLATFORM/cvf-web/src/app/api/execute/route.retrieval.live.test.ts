/**
 * Wave 2 — Retrieval-Aware Alibaba Live Validation
 *
 * Validates that the governed /api/execute path behaves correctly after
 * Wave 1 retrieval partitioning integration (R1–R5 acceptance gates):
 * - tenant-scoped knowledge chunks are injected into the AI context
 * - cross-tenant chunks are dropped and produce a KNOWLEDGE_SCOPE_FILTER_APPLIED audit event
 * - global collections are available to all authorized callers
 * - the full pipeline (retrieval → enforcement → Alibaba live inference) completes successfully
 *
 * Skipped automatically when ALIBABA_API_KEY is absent.
 * Run: ALIBABA_API_KEY=sk-... npx vitest run route.retrieval.live
 *
 * GC-018: docs/baselines/CVF_GC018_W96_T1_WAVE2_ALIBABA_RETRIEVAL_LIVE_VALIDATION_AUTHORIZATION_2026-04-18.md
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { readAuditEvents, type UnifiedAuditEvent } from '@/lib/control-plane-events';
import { resolveAlibabaApiKey } from '@/lib/alibaba-env';

const evaluateEnforcementMock = vi.hoisted(() => vi.fn());
const verifySessionCookieMock = vi.hoisted(() => vi.fn());
const checkTeamQuotaMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/enforcement', () => ({
  evaluateEnforcement: evaluateEnforcementMock,
}));

vi.mock('@/lib/middleware-auth', () => ({
  verifySessionCookie: verifySessionCookieMock,
  withSessionAuditPayload: (
    session: { impersonation?: { realActorId: string; sessionId: string } } | null | undefined,
    payload?: Record<string, unknown>,
  ) => {
    const nextPayload = { ...(payload ?? {}) };
    if (session?.impersonation) {
      nextPayload.impersonatedBy = session.impersonation.realActorId;
      nextPayload.impersonationSessionId = session.impersonation.sessionId;
    }
    return Object.keys(nextPayload).length > 0 ? nextPayload : undefined;
  },
}));

vi.mock('@/lib/quota-guard', () => ({
  checkTeamQuota: checkTeamQuotaMock,
  hasSoftCapAuditEvent: vi.fn().mockResolvedValue(false),
}));

import { POST } from './route';

const ALIBABA_API_KEY = resolveAlibabaApiKey();

describe.skipIf(!ALIBABA_API_KEY)(
  '/api/execute retrieval live — Wave 2 Alibaba governed path',
  () => {
    const originalEnv = { ...process.env };
    let tempDir = '';

    beforeEach(async () => {
      tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-retrieval-live-'));
      process.env.CVF_CONTROL_PLANE_EVENTS_PATH = path.join(tempDir, 'events.json');
      process.env.ALIBABA_API_KEY = ALIBABA_API_KEY;

      evaluateEnforcementMock.mockReset();
      verifySessionCookieMock.mockReset();
      checkTeamQuotaMock.mockReset();

      evaluateEnforcementMock.mockReturnValue({ status: 'ALLOW', reasons: [] });
      checkTeamQuotaMock.mockResolvedValue({
        exceeded: false,
        currentUSD: 0,
        softCapUSD: 50,
        hardCapUSD: 100,
        overrideActive: false,
      });
    });

    afterEach(async () => {
      process.env = { ...originalEnv };
      if (tempDir) {
        await rm(tempDir, { recursive: true, force: true });
      }
    });

    it(
      'exec team session: exec-playbook chunk injected via scoped retrieval — live inference succeeds',
      async () => {
        verifySessionCookieMock.mockResolvedValue({
          userId: 'usr_exec_live',
          user: 'Live Exec Tester',
          role: 'admin',
          orgId: 'org_cvf',
          teamId: 'team_exec',
          expiresAt: Date.now() + 3_600_000,
          authMode: 'session',
        });

        const res = await POST(
          new Request('http://localhost/api/execute', {
            method: 'POST',
            body: JSON.stringify({
              templateName: 'Governance Analysis',
              intent: 'Analyze executive finops quota controls for governance',
              inputs: { topic: 'FinOps escalation procedures' },
              provider: 'alibaba',
            }),
          }) as never,
        );

        const data = (await res.json()) as Record<string, unknown>;
        const ki = data.knowledgeInjection as
          | { injected: boolean; source: string; chunkCount: number }
          | undefined;

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(ki?.injected).toBe(true);
        expect(ki?.source).toBe('retrieval');
        expect(ki?.chunkCount).toBeGreaterThanOrEqual(1);
        expect(String(data.output ?? '').length).toBeGreaterThan(20);
      },
      30_000,
    );

    it(
      'engineering team session: engineering-runbooks chunk injected via scoped retrieval',
      async () => {
        verifySessionCookieMock.mockResolvedValue({
          userId: 'usr_eng_live',
          user: 'Live Eng Tester',
          role: 'admin',
          orgId: 'org_cvf',
          teamId: 'team_eng',
          expiresAt: Date.now() + 3_600_000,
          authMode: 'session',
        });

        const res = await POST(
          new Request('http://localhost/api/execute', {
            method: 'POST',
            body: JSON.stringify({
              templateName: 'Runbook Query',
              intent: 'Analyze engineering runbook deployment incident procedures',
              inputs: { topic: 'Deployment incident response' },
              provider: 'alibaba',
            }),
          }) as never,
        );

        const data = (await res.json()) as Record<string, unknown>;
        const ki = data.knowledgeInjection as
          | { injected: boolean; source: string; chunkCount: number }
          | undefined;

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(ki?.injected).toBe(true);
        expect(ki?.source).toBe('retrieval');
        expect(ki?.chunkCount).toBeGreaterThanOrEqual(1);
        expect(String(data.output ?? '').length).toBeGreaterThan(20);
      },
      30_000,
    );

    it(
      'cross-tenant: org_a session drops org_b chunk — KNOWLEDGE_SCOPE_FILTER_APPLIED audited',
      async () => {
        verifySessionCookieMock.mockResolvedValue({
          userId: 'usr_a_live',
          user: 'Live Tenant A',
          role: 'admin',
          orgId: 'org_a',
          teamId: 'team_a',
          expiresAt: Date.now() + 3_600_000,
          authMode: 'session',
        });

        const res = await POST(
          new Request('http://localhost/api/execute', {
            method: 'POST',
            body: JSON.stringify({
              templateName: 'Partition Query',
              intent: 'Analyze tenant partition scope governance details',
              inputs: { topic: 'Tenant partition governance' },
              provider: 'alibaba',
            }),
          }) as never,
        );

        const data = (await res.json()) as Record<string, unknown>;
        const events = await readAuditEvents();
        const filterEvent = events.find(
          (e): e is UnifiedAuditEvent => e.eventType === 'KNOWLEDGE_SCOPE_FILTER_APPLIED',
        );

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(filterEvent).toBeDefined();
        expect(
          (filterEvent?.payload as { droppedChunkCount?: number } | undefined)?.droppedChunkCount,
        ).toBeGreaterThan(0);
        expect(
          (filterEvent?.payload as { droppedCollectionIds?: string[] } | undefined)
            ?.droppedCollectionIds,
        ).toContain('tenant-org-b-private');
      },
      30_000,
    );

    it(
      'global governance collection is available to all tenant sessions via retrieval',
      async () => {
        verifySessionCookieMock.mockResolvedValue({
          userId: 'usr_any_live',
          user: 'Live Any Tester',
          role: 'admin',
          orgId: 'org_cvf',
          teamId: 'team_exec',
          expiresAt: Date.now() + 3_600_000,
          authMode: 'session',
        });

        const res = await POST(
          new Request('http://localhost/api/execute', {
            method: 'POST',
            body: JSON.stringify({
              templateName: 'Governance Query',
              intent: 'Analyze cvf enterprise governance control-plane guardrails',
              inputs: { topic: 'Enterprise governance controls' },
              provider: 'alibaba',
            }),
          }) as never,
        );

        const data = (await res.json()) as Record<string, unknown>;
        const ki = data.knowledgeInjection as
          | { injected: boolean; source: string; chunkCount: number }
          | undefined;

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(ki?.injected).toBe(true);
        expect(ki?.source).toBe('retrieval');
        expect(ki?.chunkCount).toBeGreaterThanOrEqual(1);
        expect(String(data.output ?? '').length).toBeGreaterThan(20);
      },
      30_000,
    );
  },
);
