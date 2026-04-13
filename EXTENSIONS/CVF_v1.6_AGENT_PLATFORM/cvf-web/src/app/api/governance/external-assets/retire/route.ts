import { NextRequest, NextResponse } from 'next/server';
import { verifySessionCookie } from '@/lib/middleware-auth';
import { retireEntry } from '@/lib/server/asset-registry';

/**
 * POST /api/governance/external-assets/retire
 * Retires an active governed registry entry (append-only).
 *
 * The original registry entry line is never mutated. A retirement record is
 * appended to the JSONL file; readAllLines() applies it on the next read.
 *
 * Body: { id: string }   — uuid of the active entry to retire
 * Returns: { success: true, entry: AssetRegistryEntry }  (lifecycleStatus: 'retired')
 *
 * 404 — id not found or entry is already retired
 * 409 — entry is already retired (alias: returns same 404 shape for simplicity)
 *
 * Lifecycle rule: re-registration of the same logical asset (source_ref +
 * candidate_asset_type) is allowed only after retirement.
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
        if (!body || typeof body !== 'object' || typeof body.id !== 'string' || !body.id) {
            return NextResponse.json(
                { success: false, error: 'Missing required field: id (string)' },
                { status: 400 },
            );
        }

        const retired = retireEntry(body.id);
        if (!retired) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Registry entry not found or already retired: ${body.id}`,
                },
                { status: 404 },
            );
        }

        return NextResponse.json({ success: true, entry: retired });
    } catch (error) {
        console.error('[API] /governance/external-assets/retire POST error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Internal error' },
            { status: 500 },
        );
    }
}
