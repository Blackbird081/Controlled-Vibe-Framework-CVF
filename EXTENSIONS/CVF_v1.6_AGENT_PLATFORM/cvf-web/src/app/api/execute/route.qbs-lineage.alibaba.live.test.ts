import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { resolveAlibabaApiKey } from '@/lib/alibaba-env';
import { getTemplateById, generateIntent } from '@/lib/templates';

const evaluateEnforcementMock = vi.hoisted(() => vi.fn());
const verifySessionCookieMock = vi.hoisted(() => vi.fn());
const checkTeamQuotaMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/enforcement', () => ({ evaluateEnforcement: evaluateEnforcementMock }));
vi.mock('@/lib/middleware-auth', () => ({
  verifySessionCookie: verifySessionCookieMock,
  withSessionAuditPayload: (_session: unknown, payload?: Record<string, unknown>) => payload,
}));
vi.mock('@/lib/quota-guard', () => ({
  checkTeamQuota: checkTeamQuotaMock,
  hasSoftCapAuditEvent: vi.fn().mockResolvedValue(false),
}));

import { POST } from './route';
import { resetRateLimitStoresForTest } from '@/lib/rate-limit';
import { resetSharedMandatoryGateway } from '@/lib/mandatory-gateway-singleton';
import { resetSharedGuardEngine } from '@/lib/guard-engine-singleton';

const ALIBABA_API_KEY = resolveAlibabaApiKey();

describe.skipIf(!ALIBABA_API_KEY)('QBS lineage R1 real Alibaba evidence', () => {
  const originalEnv = { ...process.env };
  let tempDir = '';

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-qbs-lineage-r1-'));
    process.env = { ...originalEnv, ALIBABA_API_KEY };
    process.env.CVF_CONTROL_PLANE_EVENTS_PATH = path.join(tempDir, 'control-plane-events.json');
    delete process.env.DASHSCOPE_API_KEY;
    delete process.env.CVF_BENCHMARK_ALIBABA_KEY;
    delete process.env.CVF_ALIBABA_API_KEY;
    resetRateLimitStoresForTest();
    resetSharedMandatoryGateway();
    resetSharedGuardEngine();
    evaluateEnforcementMock.mockReset();
    verifySessionCookieMock.mockReset();
    checkTeamQuotaMock.mockReset();
    evaluateEnforcementMock.mockReturnValue({ status: 'ALLOW', reasons: [], riskGate: { riskLevel: 'R1' } });
    checkTeamQuotaMock.mockResolvedValue({ exceeded: false, currentUSD: 0, softCapUSD: 50, hardCapUSD: 100, overrideActive: false });
    verifySessionCookieMock.mockResolvedValue({
      userId: 'usr_qbs_lineage_r1',
      user: 'QBS Lineage R1 Tester',
      role: 'admin',
      orgId: 'org_cvf',
      teamId: 'team_qbs_lineage_r1',
      expiresAt: Date.now() + 3_600_000,
      authMode: 'session',
    });
  });

  afterEach(async () => {
    resetSharedMandatoryGateway();
    resetSharedGuardEngine();
    resetRateLimitStoresForTest();
    process.env = { ...originalEnv };
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
  });

  it('returns a secret-safe real ALLOW receipt for a family-aware QBS request', async () => {
    const template = getTemplateById('strategy_analysis');
    expect(template).toBeDefined();
    const inputs = {
      topic: 'QBS lineage R1 developer handoff evidence',
      context: 'Prepare a bounded developer handoff for email and password login.',
      options: 'One implementation-ready handoff with verification and rollback.',
      constraints: 'Do not invent repository paths. Mark unknown paths for inspection.',
      priority: 'Evidence quality',
    };
    const response = await POST(new Request('http://localhost/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId: 'qbs-lineage-r1-alibaba-live-allow',
        templateId: 'strategy_analysis',
        templateName: template?.name,
        intent: generateIntent(template!, inputs),
        inputs,
        provider: 'alibaba',
        model: 'qwen-flash',
        mode: 'simple',
        cvfPhase: 'INTAKE',
        cvfRiskLevel: 'R1',
        qbsFamily: 'builder_handoff_technical_planning',
        action: 'analyze qbs lineage r1 developer handoff evidence',
        skillPreflightPassed: true,
        skillPreflightDeclaration: 'SKILL PREFLIGHT PASS: QBS lineage R1 live evidence only.',
      }),
    }) as never);
    const data = await response.json() as Record<string, unknown>;
    const receipt = data.governanceEvidenceReceipt as Record<string, unknown> | undefined;
    const telemetry = receipt?.runtimeTelemetry as Record<string, unknown> | undefined;

    console.info('[QBS-LINEAGE-R1 live receipt]', {
      httpStatus: response.status,
      success: data.success,
      provider: data.provider,
      model: data.model,
      receiptId: receipt?.receiptId,
      decision: receipt?.decision,
      routeId: receipt?.routeId,
      policySnapshotId: receipt?.policySnapshotId,
      providerLatencyMs: telemetry?.providerLatencyMs,
      routeElapsedMs: telemetry?.routeElapsedMs,
      outputPresent: typeof data.output === 'string' && data.output.length > 0,
    });

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.provider).toBe('alibaba');
    expect(typeof data.output).toBe('string');
    expect((data.output as string).length).toBeGreaterThan(0);
    expect(receipt?.decision).toBe('ALLOW');
    expect(receipt?.routeId).toBe('/api/execute');
    expect(typeof receipt?.receiptId).toBe('string');
    expect(typeof receipt?.policySnapshotId).toBe('string');
    expect(typeof telemetry?.providerLatencyMs).toBe('number');
    expect(JSON.stringify(data)).not.toContain(ALIBABA_API_KEY);
  }, 60_000);
});
