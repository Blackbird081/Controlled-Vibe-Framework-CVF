import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

const mockListGovernanceJobs = vi.fn(() => ({
    auditPath: '.cvf/runtime/web-governance-jobs.jsonl',
    events: [],
    jobs: [],
}));
const mockSubmitGovernanceJob = vi.fn(async (request?: unknown) => {
    void request;
    return {
        jobId: 'job-1',
        status: 'succeeded',
        decision: 'allowed',
        decisionReason: 'role_authorized',
        auditPath: '.cvf/runtime/web-governance-jobs.jsonl',
        latestEvent: { status: 'succeeded' },
    };
});
const mockVerifySessionCookie = vi.fn(async () => ({
    userId: 'u-1',
    user: 'Test Operator',
    role: 'developer',
    orgId: 'org',
    teamId: 'team',
    expiresAt: Date.now() + 1000,
    authMode: 'session',
}));

vi.mock('@/lib/server/web-governance-jobs', () => ({
    listGovernanceJobs: () => mockListGovernanceJobs(),
    submitGovernanceJob: (request: unknown) => mockSubmitGovernanceJob(request),
}));

vi.mock('@/lib/middleware-auth', () => ({
    verifySessionCookie: () => mockVerifySessionCookie(),
}));

import { GET, POST } from './route';

describe('/api/system/jobs', () => {
    it('lists governance job audit state without caching', async () => {
        const response = await GET();
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(json.jobs).toEqual([]);
        expect(mockListGovernanceJobs).toHaveBeenCalledOnce();
    });

    it('submits job request with authenticated session role mapped to operator', async () => {
        const request = new NextRequest('http://localhost/api/system/jobs', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-forwarded-for': '127.0.0.1',
            },
            body: JSON.stringify({ jobType: 'cvf_doctor', timeoutMsOverride: 25 }),
        });

        const response = await POST(request);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.status).toBe('succeeded');
        expect(mockSubmitGovernanceJob).toHaveBeenCalledWith(expect.objectContaining({
            jobType: 'cvf_doctor',
            role: 'operator',
            requestedBy: 'Test Operator',
            requestIpClass: 'loopback',
            timeoutMsOverride: 25,
        }));
    });

    it('returns 403 when the runner blocks by policy', async () => {
        mockVerifySessionCookie.mockResolvedValueOnce({
            userId: 'u-2',
            user: 'Read Only',
            role: 'viewer',
            orgId: 'org',
            teamId: 'team',
            expiresAt: Date.now() + 1000,
            authMode: 'session',
        });
        mockSubmitGovernanceJob.mockResolvedValueOnce({
            jobId: 'job-2',
            status: 'blocked_by_policy',
            decision: 'blocked_by_policy',
            decisionReason: 'read_only_role_cannot_trigger',
            auditPath: '.cvf/runtime/web-governance-jobs.jsonl',
            latestEvent: { status: 'blocked_by_policy' },
        });
        const request = new NextRequest('http://localhost/api/system/jobs', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ jobType: 'provider_check', provider: 'alibaba' }),
        });

        const response = await POST(request);
        const json = await response.json();

        expect(response.status).toBe(403);
        expect(json.status).toBe('blocked_by_policy');
    });
});
