/**
 * MLW-RT1 Durable Memory Runtime Chain — Alibaba Live Proof
 *
 * Proves a governed /api/execute request can write a summary-only durable
 * memory receipt, and a later governed /api/execute request can read that
 * stored summary through the durable-memory route without raw memory release
 * or reinjection authorization.
 *
 * Skipped automatically when no Alibaba/DashScope-compatible key is loaded.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { resolveAlibabaApiKey } from '@/lib/alibaba-env';
import { getTemplateById, generateIntent } from '@/lib/templates';

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
  '/api/execute MLW-RT1 durable memory runtime chain live proof — Alibaba',
  () => {
    const originalEnv = { ...process.env };
    let tempDir = '';
    let storePath = '';

    beforeEach(async () => {
      tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-mlw-rt1-live-'));
      storePath = path.join(tempDir, 'durable-memory.json');
      process.env = { ...originalEnv };
      process.env.ALIBABA_API_KEY = ALIBABA_API_KEY;
      process.env.CVF_DURABLE_MEMORY_STORE_PATH = storePath;

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
      verifySessionCookieMock.mockResolvedValue({
        userId: 'usr_mlw_rt1_live',
        user: 'MLW-RT1 Live Tester',
        role: 'admin',
        orgId: 'org_cvf',
        teamId: 'team_mlw_rt1',
        expiresAt: Date.now() + 3_600_000,
        authMode: 'session',
      });
    });

    afterEach(async () => {
      process.env = { ...originalEnv };
      if (tempDir) await rm(tempDir, { recursive: true, force: true });
    });

    it('writes then reads durable summary-only memory through governed execute receipts', async () => {
      const template = getTemplateById('strategy_analysis');
      expect(template).toBeDefined();

      const writeInputs = {
        topic: 'CVF MLW-RT1 durable memory live proof',
        context: 'Return one concise sentence containing this exact marker: MLW-RT1 durable memory live anchor.',
        options: 'Keep it bounded. Do not include secrets. Do not claim autonomous learning.',
        constraints: 'Summary-only durable memory write proof.',
        priority: 'Governance',
      };

      const writeResponse = await POST(new Request('http://localhost/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: 'strategy_analysis',
          templateName: template?.name,
          intent: generateIntent(template!, writeInputs),
          inputs: writeInputs,
          provider: 'alibaba',
          model: 'qwen-turbo',
          mode: 'simple',
          cvfRiskLevel: 'R1',
          cvfPhase: 'BUILD',
          action: 'write mlw rt1 durable memory live proof',
          aiCommit: {
            commitId: 'mlw-rt1-live-durable-memory-write',
            agentId: 'codex-mlw-rt1-live',
            timestamp: Date.now(),
            description: 'Live proof writes summary-only durable memory through governed execute route.',
          },
          durableMemoryWrite: {
            enabled: true,
            tier: 'skill',
            scope: 'project:mlw-rt1-live',
            policy: { actorAuthorized: true },
            maxSummaryLength: 240,
          },
        }),
      }) as never);

      const writeData = await writeResponse.json();
      if (!writeData.success) {
        console.log('[MLW-RT1 live write diagnostic]', {
          httpStatus: writeResponse.status,
          success: writeData.success,
          error: writeData.error,
          provider: writeData.provider,
          model: writeData.model,
          diagnostic: writeData.diagnostic
            ? {
                stage: writeData.diagnostic.stage,
                class: writeData.diagnostic.class,
                provider: writeData.diagnostic.provider,
                model: writeData.diagnostic.model,
                httpStatus: writeData.diagnostic.httpStatus,
              }
            : undefined,
          providerRouting: writeData.providerRouting,
          guardResult: writeData.guardResult
            ? {
                finalDecision: writeData.guardResult.finalDecision,
                blockedBy: writeData.guardResult.blockedBy,
                results: Array.isArray(writeData.guardResult.results)
                  ? JSON.stringify(writeData.guardResult.results.map((result: { guardId?: string; decision?: string; reason?: string }) => ({
                      guardId: result.guardId,
                      decision: result.decision,
                      reason: result.reason,
                    })))
                  : undefined,
              }
            : undefined,
          governanceDecision: writeData.governanceEvidenceReceipt?.decision,
        });
      }

      expect(writeData.success).toBe(true);
      expect(writeData.governanceEvidenceReceipt.decision).toBe('ALLOW');
      expect(writeData.durableMemoryWriteReceipt).toMatchObject({
        operation: 'write',
        decision: 'allowed',
        scope: 'project:mlw-rt1-live',
        summaryOnly: true,
        canReinject: false,
        rawMemoryReleased: false,
      });

      const records = JSON.parse(await readFile(storePath, 'utf8')) as Array<{ id: string; summary: string }>;
      expect(records).toHaveLength(1);

      const readInputs = {
        topic: 'CVF MLW-RT1 durable memory read proof',
        context: 'Use the governed durable memory context if available.',
        options: 'Acknowledge the bounded memory context without exposing raw memory.',
        constraints: 'No autonomous learning or reinjection claim.',
        priority: 'Governance',
      };

      const readResponse = await POST(new Request('http://localhost/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: 'strategy_analysis',
          templateName: template?.name,
          intent: generateIntent(template!, readInputs),
          inputs: readInputs,
          provider: 'alibaba',
          model: 'qwen-turbo',
          mode: 'simple',
          cvfRiskLevel: 'R1',
          action: 'read mlw rt1 durable memory live proof',
          durableMemory: {
            enabled: true,
            tier: 'skill',
            scope: 'project:mlw-rt1-live',
            query: '',
            policy: { actorAuthorized: true },
            maxResults: 1,
          },
        }),
      }) as never);

      const readData = await readResponse.json();
      const serializedRead = JSON.stringify(readData);

      expect(readData.success).toBe(true);
      expect(readData.governanceEvidenceReceipt.decision).toBe('ALLOW');
      expect(readData.durableMemoryRead).toMatchObject({
        operation: 'read',
        decision: 'allowed',
        memoryIds: [records[0].id],
        summaryOnly: true,
        canReinject: false,
        rawMemoryReleased: false,
      });
      expect(readData.governanceEvidenceReceipt.durableMemoryRead.memoryIds).toEqual([records[0].id]);
      expect(readData.durableMemoryWriteReceipt).toBeUndefined();
      expect(serializedRead).not.toContain(ALIBABA_API_KEY);

      console.log('[MLW-RT1 durable memory live proof]', {
        writeReceiptId: writeData.governanceEvidenceReceipt.receiptId,
        readReceiptId: readData.governanceEvidenceReceipt.receiptId,
        memoryIds: readData.durableMemoryRead.memoryIds,
        provider: readData.provider,
        model: readData.model,
      });
    }, 90_000);
  },
);
