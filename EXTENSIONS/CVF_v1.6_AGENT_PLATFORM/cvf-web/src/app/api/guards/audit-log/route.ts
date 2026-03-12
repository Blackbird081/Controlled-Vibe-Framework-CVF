/**
 * GET /api/guards/audit-log
 * =========================
 * Returns the audit log from the shared guard engine.
 * Sprint 6 — Task 6.5: Uses shared guard engine singleton.
 *
 * Query params:
 *   ?requestId=xxx — filter to a specific request
 *   ?limit=N       — limit number of entries (default: 50)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSharedGuardEngine } from '@/lib/guard-engine-singleton';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const guardEngine = getSharedGuardEngine();
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
