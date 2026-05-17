import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Mock dependencies ──────────────────────────────────────────────

const mockGovernanceEvaluate = vi.fn();
const mockVerifySession = vi.fn();
const mockResolveBindings = vi.fn();

vi.mock('@/lib/governance-engine', () => ({
    governanceEvaluate: (...args: unknown[]) => mockGovernanceEvaluate(...args),
}));

vi.mock('@/lib/middleware-auth', () => ({
    verifySessionCookie: (req: unknown) => mockVerifySession(req),
}));

vi.mock('@/lib/server/governance-binding-resolver', () => ({
    resolveGovernanceBindingsForAgent: (agentId?: string) => mockResolveBindings(agentId),
}));

// ─── Import route ───────────────────────────────────────────────────

import { POST } from '@/app/api/governance/evaluate/route';

function makeRequest(body: unknown, token?: string): NextRequest {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (token) headers['x-cvf-service-token'] = token;

    return new NextRequest('http://localhost:3000/api/governance/evaluate', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });
}

describe('POST /api/governance/evaluate', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockVerifySession.mockResolvedValue({ user: 'admin', role: 'admin' });
        mockResolveBindings.mockReturnValue({});
    });

    it('returns 401 when not authenticated', async () => {
        mockVerifySession.mockResolvedValue(null);

        const res = await POST(makeRequest({ request_id: '1', artifact_id: 'a', payload: {} }));
        const json = await res.json();

        expect(res.status).toBe(401);
        expect(json.success).toBe(false);
    });

    it('returns 400 when missing required fields', async () => {
        const res = await POST(makeRequest({ request_id: '1' }));
        const json = await res.json();

        expect(res.status).toBe(400);
        expect(json.error).toContain('Missing required fields');
    });

    it('returns evaluation result when engine responds', async () => {
        const evalResult = {
            report: {
                status: 'APPROVED',
                risk_score: 0.2,
                cvf_quality: { overall: 0.85, grade: 'B' },
                cvf_enforcement: { action: 'ALLOW' },
            },
            execution_record: { request_id: 'test-1' },
        };
        mockGovernanceEvaluate.mockResolvedValue(evalResult);

        const res = await POST(
            makeRequest({
                request_id: 'test-1',
                artifact_id: 'art-1',
                payload: { content: 'test' },
                cvf_phase: 'C',
                skill_preflight: {
                    required: true,
                    declared: true,
                    source: 'explicit',
                },
            }),
        );
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.data.report.status).toBe('APPROVED');
        expect(json.governance_bindings).toEqual({});
    });

    it('returns 400 for BUILD requests without skill preflight declaration', async () => {
        const res = await POST(
            makeRequest({
                request_id: 'build-1',
                artifact_id: 'art-build-1',
                payload: { content: 'build task' },
                cvf_phase: 'BUILD',
            }),
        );
        const json = await res.json();

        expect(res.status).toBe(400);
        expect(json.success).toBe(false);
        expect(json.error).toMatch(/Skill Preflight/i);
        expect(mockGovernanceEvaluate).not.toHaveBeenCalled();
    });

    it('returns 503 when engine unavailable', async () => {
        mockGovernanceEvaluate.mockResolvedValue(null);

        const res = await POST(
            makeRequest({
                request_id: 'test-2',
                artifact_id: 'art-2',
                payload: { content: 'test' },
            }),
        );
        const json = await res.json();

        expect(res.status).toBe(503);
        expect(json.fallback).toBe(true);
    });

    it('accepts service token auth', async () => {
        mockVerifySession.mockResolvedValue(null);
        process.env.CVF_SERVICE_TOKEN = 'secret-token';

        const evalResult = {
            report: { status: 'APPROVED' },
            execution_record: {},
        };
        mockGovernanceEvaluate.mockResolvedValue(evalResult);

        const res = await POST(
            makeRequest(
                { request_id: 't', artifact_id: 'a', payload: {} },
                'secret-token',
            ),
        );
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);

        delete process.env.CVF_SERVICE_TOKEN;
    });

    it('returns resolved governance bindings when agent_id is provided', async () => {
        mockGovernanceEvaluate.mockResolvedValue({
            report: { status: 'APPROVED' },
            execution_record: { request_id: 'test-bindings' },
        });
        mockResolveBindings.mockReturnValue({
            registryBinding: {
                agentId: 'AI_ASSISTANT_V1',
                certificationStatus: 'ACTIVE',
            },
            uatBinding: {
                status: 'PASS',
                lastRunAt: '2026-03-01T10:00:00Z',
            },
        });

        const res = await POST(
            makeRequest({
                request_id: 'test-bindings',
                artifact_id: 'art-bindings',
                payload: { content: 'test' },
                agent_id: 'AI_ASSISTANT_V1',
            }),
        );
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(mockResolveBindings).toHaveBeenCalledWith('AI_ASSISTANT_V1');
        expect(json.governance_bindings.registryBinding.agentId).toBe('AI_ASSISTANT_V1');
        expect(json.governance_bindings.uatBinding.status).toBe('PASS');
    });
});
