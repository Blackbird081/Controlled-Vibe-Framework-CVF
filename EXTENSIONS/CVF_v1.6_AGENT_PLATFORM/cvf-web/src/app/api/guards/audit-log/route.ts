/**
 * GET /api/guards/audit-log
 * =========================
 * Returns the in-memory audit log from the guard engine.
 * Supports filtering by requestId.
 *
 * Query params:
 *   ?requestId=xxx — filter to a specific request
 *   ?limit=N       — limit number of entries (default: 50)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createGuardEngine } from 'cvf-guard-contract';

// Share the same engine singleton as /evaluate
// (In production, this should be a shared module)
let engine: ReturnType<typeof createGuardEngine> | null = null;
function getEngine() {
  if (!engine) {
    engine = createGuardEngine();
  }
  return engine;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const guardEngine = getEngine();
    const fullLog = guardEngine.getAuditLog();

    if (requestId) {
      const entry = guardEngine.getAuditEntry(requestId);
      if (!entry) {
        return NextResponse.json(
          { success: false, error: `No audit entry found for requestId: ${requestId}` },
          { status: 404 },
        );
      }
      return NextResponse.json({ success: true, data: entry });
    }

    const entries = fullLog.slice(-limit);
    return NextResponse.json({
      success: true,
      total: fullLog.length,
      showing: entries.length,
      data: entries,
    });
  } catch (error) {
    console.error('[API] /api/guards/audit-log error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 },
    );
  }
}
