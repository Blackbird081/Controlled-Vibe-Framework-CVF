import { beforeEach, describe, expect, it, vi } from 'vitest';

const verifySessionCookieMock = vi.hoisted(() => vi.fn());
const retireEntryMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/middleware-auth', () => ({
    verifySessionCookie: verifySessionCookieMock,
}));

vi.mock('@/lib/server/asset-registry', () => ({
    retireEntry: retireEntryMock,
}));

import { POST } from './route';

const MOCK_ACTIVE_ENTRY = {
    id: 'test-uuid',
    registeredAt: '2026-04-13T10:00:00.000Z',
    source_ref: 'CVF_ADDING_NEW/skill.md',
    candidate_asset_type: 'W7SkillAsset',
    description_or_trigger: 'Convert shell skill into governed CVF asset',
    approvalState: 'approved',
    governanceOwner: 'cvf-architecture',
    riskLevel: 'R1',
    registryRefs: ['cvf://registry/w7/test'],
    workflowStatus: 'registry_ready' as const,
    lifecycleStatus: 'active' as const,
    assetName: 'skill.md',
    assetVersion: '1.0.0',
};

const MOCK_RETIRED_ENTRY = {
    ...MOCK_ACTIVE_ENTRY,
    lifecycleStatus: 'retired' as const,
    retiredAt: '2026-04-13T11:00:00.000Z',
};

describe('/api/governance/external-assets/retire', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        process.env = { ...originalEnv };
        delete process.env.CVF_SERVICE_TOKEN;
        verifySessionCookieMock.mockReset();
        retireEntryMock.mockReset();
        verifySessionCookieMock.mockResolvedValue({
            user: 'tester',
            role: 'admin',
            expiresAt: Date.now() + 1000 * 60 * 60,
        });
    });

    it('returns 401 when no session and no service token', async () => {
        verifySessionCookieMock.mockResolvedValueOnce(null);

        const req = new Request('http://localhost/api/governance/external-assets/retire', {
            method: 'POST',
            body: JSON.stringify({ id: 'test-uuid' }),
        });

        const res = await POST(req as never);
        const data = await res.json();

        expect(res.status).toBe(401);
        expect(data.success).toBe(false);
        expect(retireEntryMock).not.toHaveBeenCalled();
    });

    it('returns 400 when id field is missing', async () => {
        const req = new Request('http://localhost/api/governance/external-assets/retire', {
            method: 'POST',
            body: JSON.stringify({}),
        });

        const res = await POST(req as never);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toMatch(/id/);
        expect(retireEntryMock).not.toHaveBeenCalled();
    });

    it('returns 400 when id is an empty string', async () => {
        const req = new Request('http://localhost/api/governance/external-assets/retire', {
            method: 'POST',
            body: JSON.stringify({ id: '' }),
        });

        const res = await POST(req as never);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.success).toBe(false);
        expect(retireEntryMock).not.toHaveBeenCalled();
    });

    it('retires an active entry and returns retired entry', async () => {
        retireEntryMock.mockReturnValue(MOCK_RETIRED_ENTRY);

        const req = new Request('http://localhost/api/governance/external-assets/retire', {
            method: 'POST',
            body: JSON.stringify({ id: 'test-uuid' }),
        });

        const res = await POST(req as never);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.entry.lifecycleStatus).toBe('retired');
        expect(data.entry.retiredAt).toBeTruthy();
        expect(retireEntryMock).toHaveBeenCalledWith('test-uuid');
    });

    it('returns 404 when entry not found', async () => {
        retireEntryMock.mockReturnValue(null);

        const req = new Request('http://localhost/api/governance/external-assets/retire', {
            method: 'POST',
            body: JSON.stringify({ id: 'nonexistent-uuid' }),
        });

        const res = await POST(req as never);
        const data = await res.json();

        expect(res.status).toBe(404);
        expect(data.success).toBe(false);
        expect(data.error).toMatch(/nonexistent-uuid/);
    });

    it('returns 404 when entry is already retired (retireEntry returns null)', async () => {
        // retireEntry returns null when the entry is already retired
        retireEntryMock.mockReturnValue(null);

        const req = new Request('http://localhost/api/governance/external-assets/retire', {
            method: 'POST',
            body: JSON.stringify({ id: 'already-retired-uuid' }),
        });

        const res = await POST(req as never);
        const data = await res.json();

        expect(res.status).toBe(404);
        expect(data.success).toBe(false);
        expect(data.error).toMatch(/already retired/);
    });

    it('accepts service token auth for automated retirement', async () => {
        process.env.CVF_SERVICE_TOKEN = 'svc-token';
        verifySessionCookieMock.mockResolvedValueOnce(null);
        retireEntryMock.mockReturnValue(MOCK_RETIRED_ENTRY);

        const req = new Request('http://localhost/api/governance/external-assets/retire', {
            method: 'POST',
            headers: { 'x-cvf-service-token': 'svc-token' },
            body: JSON.stringify({ id: 'test-uuid' }),
        });

        const res = await POST(req as never);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.entry.lifecycleStatus).toBe('retired');
    });

    it('does not mutate history — retireEntry is called (append-only contract)', async () => {
        retireEntryMock.mockReturnValue(MOCK_RETIRED_ENTRY);

        const req = new Request('http://localhost/api/governance/external-assets/retire', {
            method: 'POST',
            body: JSON.stringify({ id: 'test-uuid' }),
        });

        await POST(req as never);

        // retireEntry was called once — the append-only contract is enforced in the helper
        expect(retireEntryMock).toHaveBeenCalledOnce();
        expect(retireEntryMock).toHaveBeenCalledWith('test-uuid');
    });
});
