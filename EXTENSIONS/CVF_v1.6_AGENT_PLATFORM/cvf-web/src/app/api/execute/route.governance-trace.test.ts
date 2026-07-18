import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const executeAIMock = vi.hoisted(() => vi.fn());
const evaluateEnforcementMock = vi.hoisted(() => vi.fn());
const verifySessionCookieMock = vi.hoisted(() => vi.fn());
const checkTeamQuotaMock = vi.hoisted(() => vi.fn());
const appendAuditEventMock = vi.hoisted(() => vi.fn());
const appendCostEventMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/ai', () => ({
    executeAI: executeAIMock,
    CVF_SYSTEM_PROMPT: 'BASE_SYSTEM_PROMPT',
}));

vi.mock('@/lib/enforcement', () => ({
    evaluateEnforcement: evaluateEnforcementMock,
}));

vi.mock('@/lib/middleware-auth', () => ({
    verifySessionCookie: verifySessionCookieMock,
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
        executeAIMock.mockReset();
        evaluateEnforcementMock.mockReset();
        verifySessionCookieMock.mockReset();
        checkTeamQuotaMock.mockReset();
        appendAuditEventMock.mockReset();
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
            role: 'developer',
            orgId: 'org-1',
            teamId: 'team-1',
            expiresAt: Date.now() + 1000 * 60 * 60,
        });
        executeAIMock.mockResolvedValue({
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
                cvfPhase: 'BUILD',
                cvfRiskLevel: 'R1',
                action: 'build template execution request',
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

        expect(res.status).toBe(200);
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
            providerLatencyMs: 123,
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
});
