import { beforeEach, describe, expect, it, vi } from 'vitest';

const verifySessionCookieMock = vi.hoisted(() => vi.fn());
const registerAssetMock = vi.hoisted(() => vi.fn());
const listRegistryEntriesMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/middleware-auth', () => ({
    verifySessionCookie: verifySessionCookieMock,
}));

vi.mock('@/lib/server/asset-registry', () => ({
    registerAsset: registerAssetMock,
    listRegistryEntries: listRegistryEntriesMock,
    getRegistryEntry: vi.fn(),
}));

import { POST, GET } from './route';

const MOCK_ENTRY = {
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
    assetName: 'skill.md',
    assetVersion: '1.0.0',
};

describe('/api/governance/external-assets/register', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        process.env = { ...originalEnv };
        delete process.env.CVF_SERVICE_TOKEN;
        verifySessionCookieMock.mockReset();
        registerAssetMock.mockReset();
        listRegistryEntriesMock.mockReset();
        verifySessionCookieMock.mockResolvedValue({
            user: 'tester',
            role: 'admin',
            expiresAt: Date.now() + 1000 * 60 * 60,
        });
    });

    describe('POST', () => {
        it('returns 401 when no session and no service token', async () => {
            verifySessionCookieMock.mockResolvedValueOnce(null);

            const req = new Request('http://localhost/api/governance/external-assets/register', {
                method: 'POST',
                body: JSON.stringify({ asset: {} }),
            });

            const res = await POST(req as never);
            const data = await res.json();

            expect(res.status).toBe(401);
            expect(data.success).toBe(false);
        });

        it('returns 400 when asset field is missing', async () => {
            const req = new Request('http://localhost/api/governance/external-assets/register', {
                method: 'POST',
                body: JSON.stringify({}),
            });

            const res = await POST(req as never);
            const data = await res.json();

            expect(res.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error).toMatch(/asset/);
        });

        it('returns 400 when required asset fields are missing', async () => {
            const req = new Request('http://localhost/api/governance/external-assets/register', {
                method: 'POST',
                body: JSON.stringify({ asset: { source_ref: 'CVF/skill.md' } }),
            });

            const res = await POST(req as never);
            const data = await res.json();

            expect(res.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error).toMatch(/source_ref/);
        });

        it('registers an approved asset and returns the entry', async () => {
            registerAssetMock.mockReturnValue(MOCK_ENTRY);

            const req = new Request('http://localhost/api/governance/external-assets/register', {
                method: 'POST',
                body: JSON.stringify({
                    asset: {
                        source_ref: 'CVF_ADDING_NEW/skill.md',
                        candidate_asset_type: 'W7SkillAsset',
                        description_or_trigger: 'Convert shell skill into governed CVF asset',
                        approvalState: 'approved',
                        governanceOwner: 'cvf-architecture',
                        riskLevel: 'R1',
                        registryRefs: ['cvf://registry/w7/test'],
                    },
                }),
            });

            const res = await POST(req as never);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.entry.id).toBe('test-uuid');
            expect(data.entry.workflowStatus).toBe('registry_ready');
            expect(data.entry.governanceOwner).toBe('cvf-architecture');
            expect(registerAssetMock).toHaveBeenCalledOnce();
        });

        it('accepts service token auth for automated registration', async () => {
            process.env.CVF_SERVICE_TOKEN = 'svc';
            verifySessionCookieMock.mockResolvedValueOnce(null);
            registerAssetMock.mockReturnValue(MOCK_ENTRY);

            const req = new Request('http://localhost/api/governance/external-assets/register', {
                method: 'POST',
                headers: { 'x-cvf-service-token': 'svc' },
                body: JSON.stringify({
                    asset: {
                        source_ref: 'CVF_ADDING_NEW/skill.md',
                        candidate_asset_type: 'W7SkillAsset',
                        description_or_trigger: 'Test',
                    },
                }),
            });

            const res = await POST(req as never);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.success).toBe(true);
        });
    });

    describe('GET', () => {
        it('returns 401 when unauthenticated', async () => {
            verifySessionCookieMock.mockResolvedValueOnce(null);

            const req = new Request('http://localhost/api/governance/external-assets/register', {
                method: 'GET',
            });

            const res = await GET(req as never);
            const data = await res.json();

            expect(res.status).toBe(401);
            expect(data.success).toBe(false);
        });

        it('returns registry entries list', async () => {
            listRegistryEntriesMock.mockReturnValue([MOCK_ENTRY]);

            const req = new Request('http://localhost/api/governance/external-assets/register', {
                method: 'GET',
            });

            const res = await GET(req as never);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.count).toBe(1);
            expect(data.entries[0].id).toBe('test-uuid');
        });

        it('returns empty list when registry has no entries', async () => {
            listRegistryEntriesMock.mockReturnValue([]);

            const req = new Request('http://localhost/api/governance/external-assets/register', {
                method: 'GET',
            });

            const res = await GET(req as never);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.count).toBe(0);
            expect(data.entries).toHaveLength(0);
        });
    });
});
