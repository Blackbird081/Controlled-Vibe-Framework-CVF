import { NextRequest, NextResponse } from 'next/server';

import { verifySessionCookie } from '@/lib/middleware-auth';
import { appendAuditEvent, readAuditEvents } from '@/lib/control-plane-events';
import { canAccessAdmin } from '@/lib/enterprise-access';

const INTERNAL_AUDIT_SECRET = process.env.CVF_INTERNAL_AUDIT_SECRET;

export async function GET() {
  const session = await verifySessionCookie();
  if (!session || !canAccessAdmin(session.role)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const events = await readAuditEvents();
  return NextResponse.json({ success: true, data: events });
}

export async function POST(request: NextRequest) {
  const internalSecret = request.headers.get('x-cvf-internal-audit');
  const session = await verifySessionCookie(request);
  const isInternalAuditCall = !!internalSecret && !!INTERNAL_AUDIT_SECRET && internalSecret === INTERNAL_AUDIT_SECRET;

  if (!isInternalAuditCall && (!session || !canAccessAdmin(session.role))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json() as Record<string, unknown>;
  const record = await appendAuditEvent({
    eventType: String(body.eventType || 'ADMIN_EVENT'),
    actorId: String(body.actorId || session?.userId || 'unknown-user'),
    actorRole: String(body.actorRole || session?.role || 'unknown'),
    targetResource: String(body.targetResource || 'unknown'),
    action: String(body.action || 'UNKNOWN_ACTION'),
    riskLevel: body.riskLevel ? String(body.riskLevel) : undefined,
    phase: body.phase ? String(body.phase) : undefined,
    outcome: String(body.outcome || 'RECORDED'),
    payload: typeof body.payload === 'object' && body.payload
      ? body.payload as Record<string, unknown>
      : undefined,
  });

  return NextResponse.json({ success: true, data: record });
}
