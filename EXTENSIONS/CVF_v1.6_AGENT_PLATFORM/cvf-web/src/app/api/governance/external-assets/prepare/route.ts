import { NextRequest, NextResponse } from 'next/server';
import { verifySessionCookie } from '@/lib/middleware-auth';
import { prepareExternalAssetGovernance } from '@/lib/server/external-asset-governance';

/**
 * POST /api/governance/external-assets/prepare
 * Runs the bounded CVF external-asset governance pipeline:
 * intake validation -> semantic classification -> planner heuristics ->
 * provisional signal capture -> W7 normalization -> registry-ready preparation.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await verifySessionCookie(request);
    const serviceToken = request.headers.get(
      'x-cvf-service-token',
    );
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
    if (!body || typeof body !== 'object' || !('profile' in body)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: profile',
        },
        { status: 400 },
      );
    }

    const data = prepareExternalAssetGovernance(body);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[API] /governance/external-assets/prepare error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal error',
      },
      { status: 500 },
    );
  }
}
