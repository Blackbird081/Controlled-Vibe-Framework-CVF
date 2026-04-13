import { beforeEach, describe, expect, it, vi } from 'vitest';

const verifySessionCookieMock = vi.hoisted(() => vi.fn());
const registerAssetMock = vi.hoisted(() => vi.fn());
const listRegistryEntriesMock = vi.hoisted(() => vi.fn());
const prepareExternalAssetGovernanceMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/middleware-auth', () => ({
    verifySessionCookie: verifySessionCookieMock,
}));

vi.mock('@/lib/server/asset-registry', () => ({
    registerAsset: registerAssetMock,
    listRegistryEntries: listRegistryEntriesMock,
    getRegistryEntry: vi.fn(),
}));

vi.mock('@/lib/server/external-asset-governance', () => ({
    prepareExternalAssetGovernance: prepareExternalAssetGovernanceMock,
}));

import { POST, GET } from './route';

// Governed asset shape matches RegistryReadyGovernedAsset contract (snake_case fields)
const MOCK_GOVERNED_ASSET = {
    stage: 'registry_ready_governed_asset' as const,
    asset_id: 'test-asset-id',
    asset_type: 'W7SkillAsset',
    candidate_id: 'test-candidate-id',
    source_ref: 'CVF_ADDING_NEW/skill.md',
    governance: {
        owner: 'cvf-architecture',
        approval_state: 'approved',
        source_quality: 'internal_design_draft',
    },
    risk_level: 'R1',
    observability: { trace_required: false },
    evaluation_profile: { enabled: true },
    registry_refs: ['cvf://registry/w7/test'],
};

const MOCK_REGISTRY_READY_RESULT = {
    workflowStatus: 'registry_ready' as const,
    readyForRegistry: true,
    warnings: [],
    intake: {
        valid: true,
        issues: [],
        normalizedProfile: {
            source_ref: 'CVF_ADDING_NEW/skill.md',
            candidate_asset_type: 'W7SkillAsset',
            description_or_trigger: 'Convert shell skill into governed CVF asset',
        },
    },
    registryReady: {
        stage: 'registry_ready_governed_asset' as const,
        valid: true,
        issues: [],
        governedAsset: MOCK_GOVERNED_ASSET,
    },
};

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

// Minimal valid profile body — same shape as /prepare
const VALID_PROFILE_BODY = {
    profile: {
        source_ref: 'CVF_ADDING_NEW/skill.md',
        source_kind: 'document_bundle',
        source_quality: 'internal_design_draft',
        officially_verified: false,
        provenance_notes: 'Curated from analysis.',
        candidate_asset_type: 'W7SkillAsset',
        description_or_trigger: 'Convert shell skill into governed CVF asset',
        instruction_body: 'Use shell script directly.',
    },
    registry: {
        governanceOwner: 'cvf-architecture',
        riskLevel: 'R1',
        registryRefs: ['cvf://registry/w7/test'],
    },
};

describe('/api/governance/external-assets/register', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        process.env = { ...originalEnv };
        delete process.env.CVF_SERVICE_TOKEN;
        verifySessionCookieMock.mockReset();
        registerAssetMock.mockReset();
        listRegistryEntriesMock.mockReset();
        prepareExternalAssetGovernanceMock.mockReset();
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
                body: JSON.stringify(VALID_PROFILE_BODY),
            });

            const res = await POST(req as never);
            const data = await res.json();

            expect(res.status).toBe(401);
            expect(data.success).toBe(false);
        });

        it('returns 400 when profile field is missing', async () => {
            const req = new Request('http://localhost/api/governance/external-assets/register', {
                method: 'POST',
                body: JSON.stringify({ registry: {} }),
            });

            const res = await POST(req as never);
            const data = await res.json();

            expect(res.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error).toMatch(/profile/);
            expect(prepareExternalAssetGovernanceMock).not.toHaveBeenCalled();
        });

        it('registers an asset when pipeline independently confirms registry_ready', async () => {
            prepareExternalAssetGovernanceMock.mockReturnValue(MOCK_REGISTRY_READY_RESULT);
            registerAssetMock.mockReturnValue(MOCK_ENTRY);

            const req = new Request('http://localhost/api/governance/external-assets/register', {
                method: 'POST',
                body: JSON.stringify(VALID_PROFILE_BODY),
            });

            const res = await POST(req as never);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.entry.id).toBe('test-uuid');
            expect(data.entry.workflowStatus).toBe('registry_ready');
            expect(data.entry.governanceOwner).toBe('cvf-architecture');
            // Pipeline must have been invoked — server derives, not trusts
            expect(prepareExternalAssetGovernanceMock).toHaveBeenCalledOnce();
            expect(registerAssetMock).toHaveBeenCalledOnce();
        });

        it('returns 422 when pipeline returns review_required (adversarial: self-declared approved bypasses nothing)', async () => {
            // Simulate a caller who includes approvalState approved in registry config
            // but the pipeline still returns review_required — server wins
            prepareExternalAssetGovernanceMock.mockReturnValue({
                workflowStatus: 'review_required',
                readyForRegistry: false,
                warnings: ['PLANNER_CLARIFICATION_REQUIRED'],
            });

            const req = new Request('http://localhost/api/governance/external-assets/register', {
                method: 'POST',
                body: JSON.stringify({
                    ...VALID_PROFILE_BODY,
                    registry: { ...VALID_PROFILE_BODY.registry, approvalState: 'approved' },
                }),
            });

            const res = await POST(req as never);
            const data = await res.json();

            expect(res.status).toBe(422);
            expect(data.success).toBe(false);
            expect(data.workflowStatus).toBe('review_required');
            expect(data.warnings).toContain('PLANNER_CLARIFICATION_REQUIRED');
            expect(registerAssetMock).not.toHaveBeenCalled();
        });

        it('returns 422 when pipeline returns invalid (adversarial: bad intake, self-declared approved)', async () => {
            prepareExternalAssetGovernanceMock.mockReturnValue({
                workflowStatus: 'invalid',
                readyForRegistry: false,
                warnings: ['INTAKE_REQUIRED_PROVENANCE_NOTES'],
            });

            const req = new Request('http://localhost/api/governance/external-assets/register', {
                method: 'POST',
                body: JSON.stringify({
                    profile: {
                        source_ref: 'CVF/skill.md',
                        candidate_asset_type: 'W7SkillAsset',
                        description_or_trigger: 'test',
                        // provenance_notes intentionally missing
                    },
                    registry: { approvalState: 'approved' },
                }),
            });

            const res = await POST(req as never);
            const data = await res.json();

            expect(res.status).toBe(422);
            expect(data.success).toBe(false);
            expect(data.workflowStatus).toBe('invalid');
            expect(data.warnings).toContain('INTAKE_REQUIRED_PROVENANCE_NOTES');
            expect(registerAssetMock).not.toHaveBeenCalled();
        });

        it('accepts service token auth for automated registration', async () => {
            process.env.CVF_SERVICE_TOKEN = 'svc';
            verifySessionCookieMock.mockResolvedValueOnce(null);
            prepareExternalAssetGovernanceMock.mockReturnValue(MOCK_REGISTRY_READY_RESULT);
            registerAssetMock.mockReturnValue(MOCK_ENTRY);

            const req = new Request('http://localhost/api/governance/external-assets/register', {
                method: 'POST',
                headers: { 'x-cvf-service-token': 'svc' },
                body: JSON.stringify(VALID_PROFILE_BODY),
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
