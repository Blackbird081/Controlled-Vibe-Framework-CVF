import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const executeAIMock = vi.hoisted(() => vi.fn());
const evaluateEnforcementMock = vi.hoisted(() => vi.fn());
const verifySessionCookieMock = vi.hoisted(() => vi.fn());
const checkTeamQuotaMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/ai', () => ({
  executeAI: executeAIMock,
  CVF_SYSTEM_PROMPT: 'BASE_SYSTEM_PROMPT',
}));

vi.mock('@/lib/enforcement', () => ({
  evaluateEnforcement: evaluateEnforcementMock,
}));

vi.mock('@/lib/middleware-auth', () => ({
  verifySessionCookie: verifySessionCookieMock,
  withSessionAuditPayload: (_session: unknown, payload?: Record<string, unknown>) => payload,
}));

vi.mock('@/lib/quota-guard', () => ({
  checkTeamQuota: checkTeamQuotaMock,
  hasSoftCapAuditEvent: vi.fn().mockResolvedValue(false),
}));

vi.mock('@/lib/guard-engine-singleton', () => ({
  getSharedGuardEngine: () => ({
    evaluate: () => ({ finalDecision: 'ALLOW', results: [] }),
  }),
}));

import { POST } from './route';

describe('/api/execute MLW-NRD1 next-runtime decision readout', () => {
  const originalEnv = { ...process.env };
  let tempDir = '';

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-mlw-nrd1-'));
    process.env = { ...originalEnv };
    process.env.CVF_CONTROL_PLANE_EVENTS_PATH = path.join(tempDir, 'events.json');
    process.env.OPENAI_API_KEY = 'openai-test-key';
    delete process.env.ALIBABA_API_KEY;
    delete process.env.DASHSCOPE_API_KEY;
    delete process.env.CVF_BENCHMARK_ALIBABA_KEY;
    delete process.env.CVF_ALIBABA_API_KEY;
    delete process.env.CVF_SERVICE_TOKEN;

    executeAIMock.mockReset();
    evaluateEnforcementMock.mockReset();
    verifySessionCookieMock.mockReset();
    checkTeamQuotaMock.mockReset();

    executeAIMock.mockResolvedValue({
      success: true,
      output: [
        '## Governed Advisory',
        '',
        'The route returns an advisory decision readout for the next MLW runtime lane.',
        'It records the selected route-visible readout lane while holding runtime adapters, optimization, promotion, public sync, and live proof for separate authorization.',
      ].join('\n'),
      provider: 'openai',
      model: 'gpt-4o-mini',
    });
    evaluateEnforcementMock.mockReturnValue({ status: 'ALLOW', reasons: [] });
    checkTeamQuotaMock.mockResolvedValue({
      exceeded: false,
      currentUSD: 0,
      softCapUSD: 50,
      hardCapUSD: 100,
      overrideActive: false,
    });
    verifySessionCookieMock.mockResolvedValue({
      userId: 'usr_mlw_nrd1',
      user: 'MLW NRD1 Tester',
      role: 'admin',
      orgId: 'org_a',
      teamId: 'team_a',
      expiresAt: Date.now() + 1000 * 60 * 60,
      authMode: 'session',
    });
  });

  afterEach(async () => {
    process.env = { ...originalEnv };
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
  });

  it('returns an advisory next-runtime decision without execution, optimization, promotion, or public authority', async () => {
    const res = await POST(new Request('http://localhost/api/execute', {
      method: 'POST',
      body: JSON.stringify({
        templateName: 'Knowledge Query',
        intent: 'Show the MLW next runtime decision readout boundaries',
        inputs: {
          question: 'Which MLW lane is selected next?',
          audience: 'Governance reviewer',
          constraints: 'Advisory readout only.',
        },
        provider: 'openai',
      }),
    }) as never);

    const data = await res.json();
    const readout = data.mlwNextRuntimeDecisionReadout;

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(readout).toMatchObject({
      contractVersion: 'cvf.mlwNrd1.nextRuntimeDecisionReadout.rt1.v1',
      selectedLane: 'ROUTE_VISIBLE_ADVISORY_DECISION_READOUT',
      selectedDisposition: 'SELECTED_FOR_CURRENT_WORK_ORDER',
      advisoryReadoutOnly: true,
      routeVisibleReadoutAuthorized: true,
      externalCapabilityExecutionAuthorized: false,
      runtimeAdapterAuthorized: false,
      automaticOptimizationAuthorized: false,
      policyRelaxationAuthorized: false,
      evidenceReductionAuthorized: false,
      highRiskPromotionAuthorized: false,
      publicSyncAuthorized: false,
      liveProviderProofAuthorized: false,
      memoryReinjectionAuthorized: false,
      automaticPromotionAuthorized: false,
      autonomousMutationAuthorized: false,
    });
    expect(readout.candidateLanes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          lane: 'MLW7_EXTERNAL_CAPABILITY_RUNTIME_ADAPTER',
          disposition: 'HOLD_FOR_SEPARATE_GC018',
        }),
        expect.objectContaining({
          lane: 'MLW8_AUTOMATIC_EFFICIENCY_OPTIMIZATION',
          disposition: 'HOLD_FOR_SEPARATE_GC018',
        }),
        expect.objectContaining({
          lane: 'LO2_HIGH_RISK_PROMOTION',
          disposition: 'BLOCKED_BY_BOUNDARY',
        }),
      ]),
    );
    expect(JSON.stringify(readout)).not.toMatch(/openai-test-key|sk-|DASHSCOPE|ALIBABA_API_KEY/i);
  });
});
