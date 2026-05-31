import { beforeEach, describe, expect, it, vi } from 'vitest';

const executeAIMock = vi.hoisted(() => vi.fn());
const evaluateEnforcementMock = vi.hoisted(() => vi.fn());
const verifySessionCookieMock = vi.hoisted(() => vi.fn());
const checkTeamQuotaMock = vi.hoisted(() => vi.fn());
const appendAuditEventMock = vi.hoisted(() => vi.fn());

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

vi.mock('@/lib/control-plane-events', async () => {
    const actual = await vi.importActual<typeof import('@/lib/control-plane-events')>('@/lib/control-plane-events');
    return {
        ...actual,
        appendAuditEvent: appendAuditEventMock,
    };
});

import { POST } from './route';

describe('/api/execute actor role gate', () => {
    beforeEach(() => {
        executeAIMock.mockReset();
        evaluateEnforcementMock.mockReset();
        verifySessionCookieMock.mockReset();
        checkTeamQuotaMock.mockReset();
        appendAuditEventMock.mockReset();
        evaluateEnforcementMock.mockReturnValue({ status: 'ALLOW', reasons: [] });
        checkTeamQuotaMock.mockResolvedValue({
            exceeded: false,
            currentUSD: 0,
            softCapUSD: 0,
            hardCapUSD: 0,
            overrideActive: false,
        });
        process.env.OPENAI_API_KEY = 'test-key';
    });

    it('denies OBSERVER actor role for governed pack policies before provider dispatch', async () => {
        verifySessionCookieMock.mockResolvedValueOnce({
            userId: 'viewer-user',
            user: 'viewer',
            role: 'viewer',
            orgId: 'org-1',
            teamId: 'team-1',
            expiresAt: Date.now() + 1000 * 60 * 60,
        });

        const res = await POST(new Request('http://localhost/api/execute', {
            method: 'POST',
            body: JSON.stringify({
                templateId: 'documentation',
                templateName: 'Documentation',
                intent: 'Create an onboarding SOP',
                inputs: {
                    subject: 'Customer onboarding',
                    currentNotes: 'Lead captured, sales verifies, operations schedules kickoff.',
                    readerGoal: 'New operator can run the process safely.',
                },
                provider: 'openai',
            }),
        }) as never);
        const data = await res.json();

        expect(res.status).toBe(403);
        expect(data).toMatchObject({
            success: false,
            error: 'actor_role_not_permitted',
            executionIdentity: {
                contractVersion: 'cvf.executionIdentity.v1',
                actorId: 'viewer-user',
                sessionRole: 'viewer',
                cvfRole: 'OBSERVER',
                templateId: 'documentation',
                targetResource: 'Documentation',
                decision: 'denied',
                reason: 'actor_role_not_permitted',
                authority: {
                    canExecute: false,
                    outputClass: 'summary',
                    outputAllowed: null,
                    allowedActorRoles: ['OPERATOR', 'BUILDER', 'REVIEWER', 'SERVICE_AGENT'],
                },
                contextScope: { scope: 'observer_read_only' },
                executionBoundary: {
                    boundary: 'governed_pack_actor_policy',
                    packPolicyApplied: true,
                },
                receiptOwnership: {
                    ownerActorId: 'viewer-user',
                    ownerRole: 'OBSERVER',
                    source: 'session_actor',
                },
            },
        });
        expect(executeAIMock).not.toHaveBeenCalled();
        expect(appendAuditEventMock).toHaveBeenCalledWith(expect.objectContaining({
            eventType: 'ACTOR_ROLE_GATE_REJECTED',
            payload: expect.objectContaining({
                actor_role_gate_result: 'rejected',
                allowedActorRoles: ['OPERATOR', 'BUILDER', 'REVIEWER', 'SERVICE_AGENT'],
                templateId: 'documentation',
                executionIdentity: expect.objectContaining({
                    decision: 'denied',
                    reason: 'actor_role_not_permitted',
                    cvfRole: 'OBSERVER',
                }),
            }),
        }));
    });
});
