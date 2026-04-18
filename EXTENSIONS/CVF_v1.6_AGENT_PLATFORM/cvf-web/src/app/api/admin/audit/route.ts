import { NextRequest, NextResponse } from 'next/server';

import { requireAdminApiSession, withAdminAuditPayload } from '@/lib/admin-session';
import { appendAuditEvent, readAuditEvents } from '@/lib/control-plane-events';

const INTERNAL_AUDIT_SECRET = process.env.CVF_INTERNAL_AUDIT_SECRET;

export async function GET(request: NextRequest) {
  const session = await requireAdminApiSession(request, '/api/admin/audit');
  if (session instanceof NextResponse) {
    return session;
  }

  const events = await readAuditEvents();
  return NextResponse.json({ success: true, data: events });
}

export async function POST(request: NextRequest) {
  const internalSecret = request.headers.get('x-cvf-internal-audit');
  const isInternalAuditCall = !!internalSecret && !!INTERNAL_AUDIT_SECRET && internalSecret === INTERNAL_AUDIT_SECRET;

  const session = isInternalAuditCall
    ? null
    : await requireAdminApiSession(request, '/api/admin/audit');
  if (session instanceof NextResponse) {
    return session;
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
      ? withAdminAuditPayload(session, body.payload as Record<string, unknown>)
      : withAdminAuditPayload(session),
  });

  return NextResponse.json({ success: true, data: record });
}
