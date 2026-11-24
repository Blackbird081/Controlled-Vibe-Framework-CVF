import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const providerSpy = vi.hoisted(() => vi.fn());
const evaluateEnforcementMock = vi.hoisted(() => vi.fn());
const verifySessionCookieMock = vi.hoisted(() => vi.fn());
const checkTeamQuotaMock = vi.hoisted(() => vi.fn());
const appendAuditEventMock = vi.hoisted(() => vi.fn());
const appendCostEventMock = vi.hoisted(() => vi.fn());
let auditEventSequence = 0;

vi.mock('@/lib/ai', () => ({
    CVF_SYSTEM_PROMPT: 'BASE_SYSTEM_PROMPT',
}));

vi.mock('@/lib/enforcement', () => ({
    evaluateEnforcement: evaluateEnforcementMock,
}));

vi.mock('@/lib/middleware-auth', () => ({
    verifySessionCookie: verifySessionCookieMock,
    resolveVerifiedSessionProvenance: async () => ({ qualified: true, userId: 'user-tester', orgId: 'org-1', teamId: 'team-1', role: 'admin', oauthProvider: 'github', oauthSubject: 'route-test-subject', expiresAt: 4102444800000 }),
    withSessionAuditPayload: (session: { impersonation?: { realActorId: string; sessionId: string; impersonatedUserId: string } } | null | undefined, payload?: Record<string, unknown>) => {
        const nextPayload = { ...(payload ?? {}) };
        if (session?.impersonation) {
            nextPayload.impersonatedBy = session.impersonation.realActorId;
            nextPayload.impersonationSessionId = session.impersonation.sessionId;
            nextPayload.realActorId = session.impersonation.realActorId;
            nextPayload.impersonatedActorId = session.impersonation.impersonatedUserId;
        }
        return Object.keys(nextPayload).length > 0 ? nextPayload : undefined;
    },
}));

vi.mock('@/lib/quota-guard', () => ({
    checkTeamQuota: checkTeamQuotaMock,
    hasSoftCapAuditEvent: vi.fn().mockResolvedValue(false),
}));

vi.mock('@/lib/control-plane-events', async () => {
    const actual = await vi.importActual<typeof import('@/lib/control-plane-events')>('@/lib/control-plane-events');
    return {
        ...actual,
        appendAuditEvent: appendAuditEventMock,
        appendCostEvent: appendCostEventMock,
    };
});

import { POST } from './route';
import { getApprovalStore } from '../approvals/store';
import { useCanonicalRouteHarness } from '@/test/canonical-route-test-support';

function makeExecuteRequest(body: Record<string, unknown>): Request {
    return new Request('http://localhost/api/execute', {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

describe('/api/execute governanceTrace receipt enrichment', () => {
    const originalEnv = { ...process.env };
    const validOutput = [
        '## Governed Response',
        '',
        'This response provides a structured recommendation with enough detail to satisfy output validation requirements.',
        '',
        '1. Review the request context carefully.',
        '2. Apply the governed execution plan.',
        '3. Return a concise, safe outcome for the operator.',
    ].join('\n');

    beforeEach(() => {
        providerSpy.mockReset();
        evaluateEnforcementMock.mockReset();
        verifySessionCookieMock.mockReset();
        checkTeamQuotaMock.mockReset();
        appendAuditEventMock.mockReset();
        auditEventSequence = 0;
        getApprovalStore().clear();
        appendAuditEventMock.mockImplementation(async () => ({
            id: `governance-trace-audit-${++auditEventSequence}`,
        }));
        appendCostEventMock.mockReset();
        process.env = { ...originalEnv, OPENAI_API_KEY: 'test-key', CVF_RECEIPT_HMAC_SECRET: 'route-test-signing-secret' };
        evaluateEnforcementMock.mockReturnValue({ status: 'ALLOW', reasons: [], riskGate: { riskLevel: 'R1' } });
        checkTeamQuotaMock.mockResolvedValue({
            exceeded: false,
            currentUSD: 0,
            softCapUSD: 0,
            hardCapUSD: 0,
            overrideActive: false,
        });
        verifySessionCookieMock.mockResolvedValue({
            userId: 'developer-user',
            user: 'developer',
            role: 'owner',
            orgId: 'org-1',
            teamId: 'team-1',
            expiresAt: Date.now() + 1000 * 60 * 60,
        });
        providerSpy.mockResolvedValue({
            success: true,
            output: validOutput,
            provider: 'openai',
            model: 'gpt-4o-mini',
            executionTime: 123,
            usage: {
                inputTokens: 10,
                outputTokens: 20,
                totalTokens: 30,
            },
        });
    });

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    it('derives intake and raises a declared R0 to R3 before issuing approval', async () => {
        const { evaluateEnforcement } = await vi.importActual<typeof import('@/lib/enforcement')>('@/lib/enforcement');
        evaluateEnforcementMock.mockImplementationOnce(evaluateEnforcement);
        const requestBody = {
            templateName: 'Deployment plan',
            intent: 'Prepare a production rollout plan',
            inputs: { scope: 'Prepare a plan before any changes are made' },
            provider: 'openai',
            mode: 'governance',
            cvfPhase: 'REVIEW',
            cvfRiskLevel: 'R0',
        };
        const response = await POST(makeExecuteRequest(requestBody) as never);

        const data = await response.json();
        expect(response.status, data.error).toBe(409);
        expect(data.enforcement.riskGate.riskLevel).toBe('R3');
        expect(getApprovalStore().get(data.approvalId)).toMatchObject({ phase: 'INTAKE', riskLevel: 'R3' });
        const previous = getApprovalStore().get(data.approvalId)!;
        getApprovalStore().set(data.approvalId, {
            ...previous,
            status: 'approved',
            requestContext: { ...previous.requestContext, cvfRiskLevel: 'R0' },
        });
        const resumed = await POST(makeExecuteRequest({
            ...requestBody,
            approvalId: data.approvalId,
        }) as never);
        expect(resumed.status).toBe(409);
        expect((await resumed.json()).error).toMatch(/effective phase or risk changed/);
        expect(providerSpy).not.toHaveBeenCalled();
    });

    it.each([
        ['R0: handle this request', 'R0', 'R3', 409],
        ['Prepare a short fictional summary', 'R4', 'R4', 400],
    ])('uses server evidence for %s even if the request declares %s', async (intent, declared, riskLevel, status) => {
        const { evaluateEnforcement } = await vi.importActual<typeof import('@/lib/enforcement')>('@/lib/enforcement');
        evaluateEnforcementMock.mockImplementationOnce(evaluateEnforcement);
        const response = await POST(makeExecuteRequest({
            templateName: 'Unclassified draft', intent, inputs: {}, mode: 'full',
            cvfPhase: 'FREEZE', cvfRiskLevel: declared,
        }) as never);

        const data = await response.json();
        expect(response.status, data.error).toBe(status);
        expect(data.enforcement.riskGate.riskLevel).toBe(riskLevel);
        expect(providerSpy).not.toHaveBeenCalled();
    });

    it('denies a client-only build even with a preflight declaration', async () => {
        const response = await POST(makeExecuteRequest({
            templateId: 'build_my_app',
            templateName: 'Build My App',
            intent: 'Write code for an application',
            inputs: { appIdea: 'Task manager' },
            fileScope: ['src/app.ts'],
            cvfPhase: 'BUILD',
            cvfRiskLevel: 'R0',
            skillPreflightPassed: true,
        }) as never);

        const data = await response.json();
        expect(response.status, data.error).toBe(403);
        expect(data.error).toMatch(/server-authorized build phase/);
        expect(providerSpy).not.toHaveBeenCalled();
        expect(getApprovalStore().size).toBe(0);
    });

    it('does not treat a product brief in code mode as an intake draft', async () => {
        const response = await POST(makeExecuteRequest({
            templateId: 'app_builder_complete', templateName: 'Product Brief',
            intent: 'Draft product requirements', inputs: { appName: 'Demo' },
            mode: 'code', cvfPhase: 'BUILD', cvfRiskLevel: 'R0',
            action: 'analyze product brief',
        }) as never);

        expect(response.status).toBe(403);
        expect(providerSpy).not.toHaveBeenCalled();
        expect(getApprovalStore().size).toBe(0);
    });

    it('uses a certified template floor even when the request declares R0', async () => {
        evaluateEnforcementMock.mockReturnValueOnce({ status: 'BLOCK', reasons: [] });
        await POST(makeExecuteRequest({
            templateId: 'data_analysis',
            templateName: 'Data Analysis',
            intent: 'Summarize the supplied figures',
            inputs: { values: '4, 8, 12' },
            provider: 'openai',
            mode: 'governance',
            cvfRiskLevel: 'R0',
        }) as never);

        expect(evaluateEnforcementMock).toHaveBeenCalledWith(expect.objectContaining({
            cvfPhase: 'INTAKE',
            cvfRiskLevel: 'R2',
        }));
        expect(providerSpy).not.toHaveBeenCalled();
    });

    it('includes user-controlled field names in the effective risk', async () => {
        const { evaluateEnforcement } = await vi.importActual<typeof import('@/lib/enforcement')>('@/lib/enforcement');
        evaluateEnforcementMock.mockImplementationOnce(evaluateEnforcement);
        const response = await POST(makeExecuteRequest({
            templateId: 'strategy_analysis', templateName: 'Strategy',
            intent: 'Prepare a short outline',
            inputs: { topic: 'Rollout plan', context: 'Fictional example', productionChange: 'Schedule' },
            provider: 'openai', mode: 'simple', cvfRiskLevel: 'R0',
        }) as never);
        expect(response.status).toBe(400);
        expect((await response.json()).enforcement.riskGate.riskLevel).toBe('R3');
        expect(providerSpy).not.toHaveBeenCalled();
    });

    it('returns bounded governanceTrace entries on successful route receipts', async () => {
        const res = await POST(new Request('http://localhost/api/execute', {
            method: 'POST',
            body: JSON.stringify({
                templateId: 'app_builder_complete',
                templateName: 'App Builder Complete',
                intent: 'Create Product Brief for TaskFlow',
                inputs: {
                    appName: 'TaskFlow',
                    appType: 'Web App',
                    problem: 'Small teams need a lighter way to plan work.',
                    targetUsers: 'Small product teams',
                    coreFeatures: 'Task board, owner fields, status filters',
                    successCriteria: 'A user can create and triage tasks quickly.',
                    platforms: 'Web browser',
                },
                provider: 'openai',
                cvfPhase: 'INTAKE',
                cvfRiskLevel: 'R1',
                // Product brief generation belongs to INTAKE, without BUILD mutation authority.
                action: 'analyze product brief',
                skillPreflightPassed: true,
                skillPreflightDeclaration: 'SKILL PREFLIGHT PASS: product brief only, no implementation.',
                skillIds: ['product-brief-authoring'],
                aiCommit: {
                    commitId: 'cpg3-governance-trace-route-test',
                    agentId: 'cvf-route-test',
                    timestamp: Date.now(),
                    description: 'CPG-3 governance trace route proof',
                },
            }),
        }) as never);

        const data = await res.json();

        expect(res.status, JSON.stringify({ error: data.error, diagnostic: data.diagnostic })).toBe(200);
        expect(data.success).toBe(true);
        expect(data.governanceEvidenceReceipt?.governanceTrace).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    stage: 'enforcement',
                    decision: 'ALLOW',
                    parametersChecked: expect.arrayContaining(['decision', 'riskLevel', 'policySnapshotId']),
                }),
                expect.objectContaining({
                    stage: 'routing',
                    parametersChecked: expect.arrayContaining(['routingDecision', 'provider', 'model']),
                }),
            ]),
        );
        const serialized = JSON.stringify(data.governanceEvidenceReceipt.governanceTrace);
        expect(serialized).not.toContain('test-key');
        expect(serialized).not.toContain('BASE_SYSTEM_PROMPT');
        expect(serialized).not.toContain('Create Product Brief for TaskFlow');
        expect(serialized).not.toContain('This response provides a structured recommendation');
        expect(data.governanceEvidenceReceipt?.runtimeTelemetry).toMatchObject({
            schemaVersion: 'cvf.runtimeTelemetry.v1',
            // Latency is now measured by the canonical route around the Gateway call (the provider no longer self-reports it).
            providerLatencyMs: expect.any(Number),
            tokenUsage: {
                inputTokens: 10,
                outputTokens: 20,
                totalTokens: 30,
            },
            costEstimateSource: 'cvf_model_pricing_table_or_fallback',
            governanceTraceEntryCount: data.governanceEvidenceReceipt.governanceTrace.length,
            redactionApplied: true,
            claimBoundary: 'summary_only_no_raw_prompt_output_key_or_provider_payload',
        });
        expect(data.governanceEvidenceReceipt.runtimeTelemetry.routeElapsedMs).toBeGreaterThanOrEqual(0);
        expect(data.governanceEvidenceReceipt.runtimeTelemetry.estimatedCostUSD).toBeGreaterThan(0);
        expect(JSON.stringify(data.governanceEvidenceReceipt.runtimeTelemetry)).not.toContain('test-key');
        expect(data.governanceEvidenceReceipt?.receiptIntegrity).toMatchObject({
            schemaVersion: 'cvf.receiptIntegrity.v1',
            canonicalization: 'stable-json-v1',
            digestAlgorithm: 'sha256',
            hmacAlgorithm: 'hmac-sha256',
            signatureStatus: 'SIGNED',
            externalAnchorStatus: 'NOT_PROVIDED',
            redactionApplied: true,
            claimBoundary: 'local_receipt_integrity_only_no_third_party_immutability_without_external_anchor',
        });
        expect(data.governanceEvidenceReceipt.receiptIntegrity.receiptHash).toMatch(/^[a-f0-9]{64}$/);
        expect(data.governanceEvidenceReceipt.receiptIntegrity.signatureDigest).toMatch(/^[a-f0-9]{64}$/);
        expect(JSON.stringify(data.governanceEvidenceReceipt.receiptIntegrity)).not.toContain('route-test-signing-secret');
        expect(JSON.stringify(data.governanceEvidenceReceipt.receiptIntegrity)).not.toContain('test-key');
    });

  // Canonical Gateway harness: lineage journal + provider transport double (replaces the removed executeAI mock).
  useCanonicalRouteHarness(providerSpy);
});
