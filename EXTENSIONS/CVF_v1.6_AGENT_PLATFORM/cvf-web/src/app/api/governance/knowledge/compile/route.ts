import { NextRequest, NextResponse } from 'next/server';
import { verifySessionCookie } from '@/lib/middleware-auth';
import { compileKnowledgeArtifact } from '@/lib/server/knowledge-governance';

/**
 * POST /api/governance/knowledge/compile
 * Runs CompiledKnowledgeArtifactContract.compile() and optionally .govern() in one call.
 * W80-T1 — N4 Product/Operator Adoption
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
    if (!body || typeof body !== 'object' || !('compileRequest' in body)) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: compileRequest' },
        { status: 400 },
      );
    }

    const data = compileKnowledgeArtifact({
      compileRequest: body.compileRequest,
      governDecision: body.governDecision,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[API] /governance/knowledge/compile error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 },
    );
  }
}
