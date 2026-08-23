/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { mkdtemp, rm } from 'node:fs/promises';
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

vi.mock('@/lib/i18n', () => ({
  useLanguage: () => ({ language: 'en' }),
}));

import { POST } from './route';
import { resetRateLimitStoresForTest } from '@/lib/rate-limit';
import { resetSharedMandatoryGateway } from '@/lib/mandatory-gateway-singleton';
import { resetSharedGuardEngine } from '@/lib/guard-engine-singleton';
import { readAuditEvents } from '@/lib/control-plane-events';
import { AdminAuditLogBody } from '@/components/admin/AdminAuditLogBody';

const ALIBABA_API_KEY = resolveAlibabaApiKey();

/**
 * GC009-LIVE-T5: bounded operator-acceptance proof of the accepted GC-009
 * Web caller (mandatory gateway -> real Alibaba provider) using the actual
 * route, shared gateway, guard engine, gateway adapter, event store, final
 * response builder, and Alibaba provider adapter with an isolated durable
 * event store. Only authentication, enforcement, and quota are mocked.
 *
 * Live-call ceiling: exactly one real Alibaba provider call on PASS.
 */
describe.skipIf(!ALIBABA_API_KEY)(
  'GC009-LIVE-T5 bounded operator acceptance proof - actual route, real Alibaba, keyless BLOCK',
  () => {
    const originalEnv = { ...process.env };
    let tempDir = '';

    beforeEach(async () => {
      tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-gc009-live-t5-'));
      process.env = { ...originalEnv };
      process.env.CVF_CONTROL_PLANE_EVENTS_PATH = path.join(tempDir, 'control-plane-events.json');
      process.env.ALIBABA_API_KEY = ALIBABA_API_KEY;
      // Keep exactly one Alibaba/DashScope alias set for the ALLOW request;
      // the BLOCK request below removes it before that request is sent.
      delete process.env.DASHSCOPE_API_KEY;
      delete process.env.CVF_BENCHMARK_ALIBABA_KEY;
      delete process.env.CVF_ALIBABA_API_KEY;

      evaluateEnforcementMock.mockReset();
      verifySessionCookieMock.mockReset();
      checkTeamQuotaMock.mockReset();
      resetRateLimitStoresForTest();
      resetSharedMandatoryGateway();
      resetSharedGuardEngine();

      evaluateEnforcementMock.mockReturnValue({ status: 'ALLOW', reasons: [], riskGate: { riskLevel: 'R1' } });
      checkTeamQuotaMock.mockResolvedValue({
        exceeded: false,
        currentUSD: 0,
        softCapUSD: 50,
        hardCapUSD: 100,
        overrideActive: false,
      });
      verifySessionCookieMock.mockResolvedValue({
        userId: 'usr_gc009_live_t5',
        user: 'GC009 Live T5 Tester',
        role: 'admin',
        orgId: 'org_cvf',
        teamId: 'team_gc009_live_t5',
        expiresAt: Date.now() + 3_600_000,
        authMode: 'session',
      });
    });

    afterEach(async () => {
      resetSharedMandatoryGateway();
      resetSharedGuardEngine();
      resetRateLimitStoresForTest();
      cleanup();
      process.env = { ...originalEnv };
      if (tempDir) {
        await rm(tempDir, { recursive: true, force: true });
      }
    });

    it(
      'proves real Alibaba ALLOW, fail-closed keyless BLOCK, durable correlation, and existing audit projection',
      async () => {
        // ---- ALLOW request: real Alibaba provider call through the actual route ----
        const template = getTemplateById('strategy_analysis');
        expect(template).toBeDefined();
        const allowRequestId = 'gc009-live-t5-allow-request';
        const inputs = {
          topic: 'GC009 Live T5 bounded operator acceptance proof',
          context: 'CVF proves the accepted GC-009 Web caller with one real Alibaba call.',
          options: '1. Confirm ALLOW decision\n2. Verify durable event correlation\n3. Verify no credential value leakage',
          constraints: 'Governance evidence only. No provider routing or policy behavior change.',
          priority: 'Governance evidence',
        };

        const allowReq = new Request('http://localhost/api/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestId: allowRequestId,
            templateId: 'strategy_analysis',
            templateName: template?.name,
            intent: generateIntent(template!, inputs),
            inputs,
            provider: 'alibaba',
            model: 'qwen-flash',
            mode: 'simple',
            cvfPhase: 'INTAKE',
            cvfRiskLevel: 'R1',
            action: 'analyze strategy_analysis gc009 live t5 acceptance proof request',
            skillPreflightPassed: true,
            skillPreflightDeclaration: 'SKILL PREFLIGHT PASS: GC009-LIVE-T5 acceptance proof only.',
          }),
        });

        const allowResponse = await POST(allowReq as never);
        const allowData = await allowResponse.json();

        if (!allowData.governanceEvidenceReceipt) {
          // Secret-safe diagnostic per CVF_LIVE_RUN_DIAGNOSTIC_STANDARD_2026-05-24.md:
          // no raw key, prompt, output, or signed header is logged, only stage-classifying
          // shape facts, to determine whether the request reached the provider boundary.
          console.log('[GC009-LIVE-T5 diagnostic]', {
            stage: 'request_validation_or_pre_provider',
            httpStatus: allowResponse.status,
            responseKeys: Object.keys(allowData),
            success: allowData.success,
            error: typeof allowData.error === 'string' ? allowData.error : undefined,
            model: allowData.model,
          });
        }

        const allowReceipt = allowData.governanceEvidenceReceipt as Record<string, unknown>;
        const allowTelemetry = allowReceipt?.runtimeTelemetry as Record<string, unknown> | undefined;

        expect(allowResponse.status).toBe(200);
        expect(allowData.success).toBe(true);
        expect(allowData.provider).toBe('alibaba');
        expect(allowReceipt.decision).toBe('ALLOW');
        expect(typeof allowData.output).toBe('string');
        expect((allowData.output as string).length).toBeGreaterThan(0);
        expect(allowTelemetry).toBeDefined();
        expect(typeof allowTelemetry!.providerLatencyMs).toBe('number');
        expect(typeof allowTelemetry!.routeElapsedMs).toBe('number');
        expect(allowTelemetry!.claimBoundary).toBe(
          'summary_only_no_raw_prompt_output_key_or_provider_payload',
        );

        const allowSerialized = JSON.stringify({ allowData, allowTelemetry });
        expect(allowSerialized).not.toContain(ALIBABA_API_KEY);

        // ---- Remove all Alibaba/DashScope aliases before the BLOCK request ----
        delete process.env.ALIBABA_API_KEY;
        delete process.env.DASHSCOPE_API_KEY;
        delete process.env.CVF_BENCHMARK_ALIBABA_KEY;
        delete process.env.CVF_ALIBABA_API_KEY;
        expect(resolveAlibabaApiKey()).toBeUndefined();

        // ---- BLOCK request: fail-closed authority_gate before any provider call ----
        const blockRequestId = 'gc009-live-t5-block-request';
        const blockReq = new Request('http://localhost/api/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestId: blockRequestId,
            templateName: 'Strategy',
            intent: 'Analyze the market',
            inputs: { targetMarket: 'SMBs' },
            provider: 'alibaba',
            cvfPhase: 'INTAKE',
            cvfRiskLevel: 'R0',
            action: 'delete_governance',
            aiCommit: {
              commitId: 'gc009-live-t5-negative-authority-proof',
              agentId: 'cvf-route-test',
              timestamp: 1,
            },
          }),
        });

        const blockResponse = await POST(blockReq as never);
        const blockData = await blockResponse.json();

        expect(blockResponse.status).toBe(400);
        expect(blockData.success).toBe(false);
        expect(blockData.model).toBe('guard-blocked');
        expect(blockData.guardResult.finalDecision).toBe('BLOCK');
        expect(blockData.governanceEvidenceReceipt.decision).toBe('BLOCK');

        const blockSerialized = JSON.stringify(blockData);
        expect(blockSerialized).not.toContain(ALIBABA_API_KEY);

        // ---- Durable correlation: exactly two linked MANDATORY_GATEWAY_EVALUATED events ----
        const allEvents = await readAuditEvents();
        const gatewayEvents = allEvents.filter((event) => event.eventType === 'MANDATORY_GATEWAY_EVALUATED');
        expect(gatewayEvents).toHaveLength(2);

        const allowEvent = gatewayEvents.find(
          (event) => (event.payload as Record<string, unknown> | undefined)?.gatewayRequestId === allowRequestId,
        );
        const blockEvent = gatewayEvents.find(
          (event) => (event.payload as Record<string, unknown> | undefined)?.gatewayRequestId === blockRequestId,
        );
        expect(allowEvent).toBeDefined();
        expect(blockEvent).toBeDefined();
        expect(allowEvent!.outcome).toBe('ALLOW');
        expect(blockEvent!.outcome).toBe('BLOCK');

        const allowPayloadKeys = Object.keys(allowEvent!.payload as Record<string, unknown>).sort();
        const blockPayloadKeys = Object.keys(blockEvent!.payload as Record<string, unknown>).sort();
        const expectedKeys = [
          'gatewayAllowed',
          'gatewayBlockedBy',
          'gatewayBypassed',
          'gatewayControlMode',
          'gatewayDecision',
          'gatewayEscalatedBy',
          'gatewayRequestId',
        ];
        expect(allowPayloadKeys).toEqual(expectedKeys);
        expect(blockPayloadKeys).toEqual(expectedKeys);
        expect((blockEvent!.payload as Record<string, unknown>).gatewayBlockedBy).toBe('authority_gate');

        const eventsSerialized = JSON.stringify(gatewayEvents);
        expect(eventsSerialized).not.toContain(ALIBABA_API_KEY);
        expect(eventsSerialized).not.toContain(inputs.topic);
        expect(eventsSerialized).not.toContain(inputs.context);

        // ---- Projection: render the actual persisted events through the accepted admin component ----
        const projectedEvents = gatewayEvents.map((event) => ({
          id: event.id,
          timestamp: event.timestamp,
          eventType: event.eventType,
          action: event.action,
          actorId: event.actorId,
          actorRole: event.actorRole,
          targetResource: event.targetResource,
          outcome: event.outcome,
          riskLevel: event.riskLevel,
          phase: event.phase,
          payload: event.payload,
        }));

        render(
          <AdminAuditLogBody
            filteredEvents={projectedEvents}
            actorFilter=""
            outcomeFilter=""
            riskFilter=""
          />,
        );

        expect(screen.getAllByText('ALLOW').length).toBeGreaterThan(0);
        expect(screen.getAllByText('BLOCK').length).toBeGreaterThan(0);
        expect(screen.getAllByText(allowRequestId).length).toBeGreaterThan(0);
        expect(screen.getAllByText(blockRequestId).length).toBeGreaterThan(0);
        expect(screen.getAllByText('authority_gate').length).toBeGreaterThan(0);

        // ---- Secret-safe console evidence (no key, no raw prompt/output) ----
        console.log('[GC009-LIVE-T5 live proof]', {
          liveCallCount: 1,
          blockRequestCount: 1,
          allowRequestId,
          blockRequestId,
          allowReceiptId: allowReceipt.receiptId,
          allowEnvelopeId: allowReceipt.envelopeId,
          allowEventId: allowEvent!.id,
          blockEventId: blockEvent!.id,
          allowDecision: allowReceipt.decision,
          blockDecision: blockData.governanceEvidenceReceipt.decision,
          blockedBy: (blockEvent!.payload as Record<string, unknown>).gatewayBlockedBy,
          provider: allowData.provider,
          model: allowData.model,
          providerLatencyMsObserved: allowTelemetry!.providerLatencyMs,
          routeElapsedMsObserved: allowTelemetry!.routeElapsedMs,
        });
      },
      60_000,
    );
  },
);
