import { randomUUID } from 'node:crypto';

import { NextRequest, NextResponse } from 'next/server';

import { requireAdminApiSession, withAdminAuditPayload } from '@/lib/admin-session';
import { appendAuditEvent } from '@/lib/control-plane-events';
import { buildImpersonationCookieValue, CVF_IMPERSONATION_COOKIE } from '@/lib/impersonation';
import { findMockUserById } from '@/lib/mock-enterprise-db';
import { appendImpersonationSessionEvent } from '@/lib/policy-events';

export async function POST(request: NextRequest) {
  const session = await requireAdminApiSession(request, '/api/admin/impersonate', { ownerOnly: true });
  if (session instanceof NextResponse) {
    return session;
  }

  if (session.authMode === 'break-glass') {
    return NextResponse.json(
      { success: false, error: 'Impersonation is disabled during break-glass access.' },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null) as { userId?: string } | null;
  const targetUser = findMockUserById(String(body?.userId || ''));
  if (!targetUser) {
    return NextResponse.json({ success: false, error: 'Unknown userId.' }, { status: 400 });
  }

  if (targetUser.role === 'owner') {
    return NextResponse.json({ success: false, error: 'Owner accounts cannot be impersonated.' }, { status: 400 });
  }

  const sessionId = randomUUID();
  const startedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + (60 * 60 * 1000)).toISOString();

  const record = await appendImpersonationSessionEvent({
    timestamp: startedAt,
    sessionId,
    realActorId: session.userId,
    impersonatedUserId: targetUser.id,
    startedAt,
    expiresAt,
    status: 'started',
  });

  await appendAuditEvent({
    timestamp: startedAt,
    eventType: 'IMPERSONATION_STARTED',
    actorId: targetUser.id,
    actorRole: targetUser.role,
    targetResource: targetUser.id,
    action: 'START_IMPERSONATION',
    riskLevel: 'R3',
    phase: 'PHASE D',
    outcome: 'SUCCESS',
    payload: withAdminAuditPayload(session, {
      realActorId: session.userId,
      impersonatedUserId: targetUser.id,
      expiresAt,
    }),
  });

  const response = NextResponse.json({ success: true, data: record }, { status: 201 });
  response.cookies.set(CVF_IMPERSONATION_COOKIE, buildImpersonationCookieValue(sessionId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(expiresAt),
  });
  response.headers.set('X-CVF-Impersonation-Active', 'true');
  return response;
}
