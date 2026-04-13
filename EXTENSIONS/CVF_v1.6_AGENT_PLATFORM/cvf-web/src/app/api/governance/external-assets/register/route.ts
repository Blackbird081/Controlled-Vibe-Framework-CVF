import { NextRequest, NextResponse } from 'next/server';
import { verifySessionCookie } from '@/lib/middleware-auth';
import { registerAsset, listRegistryEntries, type RegisterAssetInput } from '@/lib/server/asset-registry';

/**
 * POST /api/governance/external-assets/register
 * Persists an approved registry_ready_governed_asset into the governed registry.
 * Write path is isolated from /api/execute and PVV evidence files.
 *
 * Body: { asset: RegisterAssetInput }
 * Returns: { success: true, entry: AssetRegistryEntry }
 *
 * GET /api/governance/external-assets/register
 * Lists all registered governed assets (auditable registry read).
 */

export async function POST(request: NextRequest) {
    try {
        const session = await verifySessionCookie(request);
        const serviceToken = request.headers.get('x-cvf-service-token');
        const configuredToken = process.env.CVF_SERVICE_TOKEN;
        const isServiceAllowed =
            configuredToken !== undefined && configuredToken.length > 0 && serviceToken === configuredToken;

        if (!session && !isServiceAllowed) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized: please login.' },
                { status: 401 },
            );
        }

        const body = await request.json();
        if (!body || typeof body !== 'object' || !('asset' in body)) {
            return NextResponse.json(
                { success: false, error: 'Missing required field: asset' },
                { status: 400 },
            );
        }

        const asset = body.asset as Partial<RegisterAssetInput>;

        if (!asset.source_ref || !asset.candidate_asset_type || !asset.description_or_trigger) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'asset must include source_ref, candidate_asset_type, description_or_trigger',
                },
                { status: 400 },
            );
        }

        // Governance gate: only explicitly approved, registry_ready assets may be registered.
        // Callers must run /prepare first and confirm workflowStatus === 'registry_ready'.
        if (asset.approvalState !== 'approved') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'asset.approvalState must be "approved"; run /prepare first and confirm registry_ready status before registering',
                },
                { status: 400 },
            );
        }

        const entry = registerAsset({
            source_ref: String(asset.source_ref),
            candidate_asset_type: String(asset.candidate_asset_type),
            description_or_trigger: String(asset.description_or_trigger),
            approvalState: 'approved',
            governanceOwner: typeof asset.governanceOwner === 'string' ? asset.governanceOwner : 'cvf-operator',
            riskLevel: typeof asset.riskLevel === 'string' ? asset.riskLevel : 'R1',
            registryRefs: Array.isArray(asset.registryRefs) ? asset.registryRefs : [],
            assetName: typeof asset.assetName === 'string' ? asset.assetName : undefined,
            assetVersion: typeof asset.assetVersion === 'string' ? asset.assetVersion : undefined,
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
        const serviceToken = request.headers.get('x-cvf-service-token');
        const configuredToken = process.env.CVF_SERVICE_TOKEN;
        const isServiceAllowed =
            configuredToken !== undefined && configuredToken.length > 0 && serviceToken === configuredToken;

        if (!session && !isServiceAllowed) {
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
