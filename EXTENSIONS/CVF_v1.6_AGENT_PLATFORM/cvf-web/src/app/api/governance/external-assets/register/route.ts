import { NextRequest, NextResponse } from 'next/server';
import { verifySessionCookie } from '@/lib/middleware-auth';
import { prepareExternalAssetGovernance } from '@/lib/server/external-asset-governance';
import {
    registerAsset,
    listRegistryEntries,
    getRegistryEntry,
    findDuplicate,
    filterRegistryEntries,
} from '@/lib/server/asset-registry';

/**
 * POST /api/governance/external-assets/register
 * Persists a registry_ready governed asset into the governed registry.
 *
 * Security: re-derives workflowStatus server-side via the full governance pipeline.
 * Callers cannot self-declare approvalState — the pipeline is the authority.
 *
 * Duplicate policy: source_ref + candidate_asset_type is the logical identity key.
 * A second registration of the same logical asset returns 409 with the existing entry.
 * The duplicate gate is lifecycle-aware: only ACTIVE entries block registration.
 *
 * Body: ExternalAssetGovernanceRequest (same shape as /prepare)
 * Returns: { success: true, entry: AssetRegistryEntry }
 *
 * GET /api/governance/external-assets/register
 * Without query params: list all registered governed assets.
 * With ?id=<uuid>: return a single entry detail (404 if not found).
 * Filter params (ANDed, applied when no ?id):
 *   ?status=active|retired
 *   ?source_ref=<str>
 *   ?candidate_asset_type=<str>
 */

function checkServiceToken(request: NextRequest): boolean {
    const serviceToken = request.headers.get('x-cvf-service-token');
    const configuredToken = process.env.CVF_SERVICE_TOKEN;
    return (
        configuredToken !== undefined &&
        configuredToken.length > 0 &&
        serviceToken === configuredToken
    );
}

export async function POST(request: NextRequest) {
    try {
        const session = await verifySessionCookie(request);
        if (!session && !checkServiceToken(request)) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized: please login.' },
                { status: 401 },
            );
        }

        const body = await request.json();
        if (!body || typeof body !== 'object' || !('profile' in body)) {
            return NextResponse.json(
                { success: false, error: 'Missing required field: profile' },
                { status: 400 },
            );
        }

        // Server-side re-derive: run the full governance pipeline on the submitted
        // profile. The pipeline result is the authority — callers cannot bypass by
        // self-declaring approvalState or workflowStatus.
        const result = prepareExternalAssetGovernance(body);

        if (result.workflowStatus !== 'registry_ready') {
            return NextResponse.json(
                {
                    success: false,
                    error: `Asset is not registry_ready (workflowStatus: ${result.workflowStatus}); resolve all issues via /prepare before registering`,
                    workflowStatus: result.workflowStatus,
                    warnings: result.warnings,
                },
                { status: 422 },
            );
        }

        // CP1 — Duplicate gate: source_ref + candidate_asset_type must be unique (active entries only).
        // First registration wins; repeat registrations of the same logical asset
        // are rejected with 409 and the existing entry is returned for reference.
        // Lifecycle-aware: retired entries do not block re-registration.
        const profile = result.intake.normalizedProfile;
        const existing = findDuplicate(profile.source_ref, profile.candidate_asset_type);
        if (existing) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Asset already registered: source_ref "${profile.source_ref}" + candidate_asset_type "${profile.candidate_asset_type}" already exists in the governed registry`,
                    existingEntry: existing,
                },
                { status: 409 },
            );
        }

        const { governedAsset } = result.registryReady;
        const entry = registerAsset({
            source_ref: governedAsset?.source_ref ?? profile.source_ref,
            candidate_asset_type: governedAsset?.asset_type ?? profile.candidate_asset_type,
            description_or_trigger: profile.description_or_trigger,
            approvalState: 'approved',
            governanceOwner: governedAsset?.governance.owner ?? 'cvf-operator',
            riskLevel: governedAsset?.risk_level ?? 'R1',
            registryRefs: governedAsset?.registry_refs ?? [],
        });

        return NextResponse.json({ success: true, entry });
    } catch (error) {
        console.error('[API] /governance/external-assets/register POST error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Internal error' },
            { status: 500 },
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await verifySessionCookie(request);
        if (!session && !checkServiceToken(request)) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized: please login.' },
                { status: 401 },
            );
        }

        // CP2 — Detail query: ?id=<uuid> returns a single entry.
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (id) {
            const entry = getRegistryEntry(id);
            if (!entry) {
                return NextResponse.json(
                    { success: false, error: `Registry entry not found: ${id}` },
                    { status: 404 },
                );
            }
            return NextResponse.json({ success: true, entry });
        }

        // CP2 — Filtered list: ?status, ?source_ref, ?candidate_asset_type are ANDed.
        const statusParam = searchParams.get('status');
        const sourceRefParam = searchParams.get('source_ref');
        const candidateAssetTypeParam = searchParams.get('candidate_asset_type');
        const hasFilter = statusParam || sourceRefParam || candidateAssetTypeParam;

        if (hasFilter) {
            const filter: Parameters<typeof filterRegistryEntries>[0] = {};
            if (statusParam === 'active' || statusParam === 'retired') {
                filter.status = statusParam;
            }
            if (sourceRefParam) filter.source_ref = sourceRefParam;
            if (candidateAssetTypeParam) filter.candidate_asset_type = candidateAssetTypeParam;
            const entries = filterRegistryEntries(filter);
            return NextResponse.json({ success: true, entries, count: entries.length });
        }

        const entries = listRegistryEntries();
        return NextResponse.json({ success: true, entries, count: entries.length });
    } catch (error) {
        console.error('[API] /governance/external-assets/register GET error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Internal error' },
            { status: 500 },
        );
    }
}
