import { NextRequest, NextResponse } from 'next/server';
import { verifySessionCookie } from '@/lib/middleware-auth';
import { prepareExternalAssetGovernance } from '@/lib/server/external-asset-governance';
import { registerAsset, listRegistryEntries } from '@/lib/server/asset-registry';

/**
 * POST /api/governance/external-assets/register
 * Persists a registry_ready governed asset into the governed registry.
 *
 * Security: the route independently re-derives workflowStatus by running the
 * full governance pipeline on the submitted profile. Callers cannot self-declare
 * approvalState; the pipeline is the authority. Only assets that the server
 * independently classifies as workflowStatus === 'registry_ready' are persisted.
 *
 * Body: ExternalAssetGovernanceRequest (same shape as /prepare)
 * Returns: { success: true, entry: AssetRegistryEntry }
 *
 * GET /api/governance/external-assets/register
 * Lists all registered governed assets (auditable registry read).
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

        // governedAsset is guaranteed present when registryReady.valid === true,
        // which is required for workflowStatus === 'registry_ready'.
        const { governedAsset } = result.registryReady;
        const profile = result.intake.normalizedProfile;

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
