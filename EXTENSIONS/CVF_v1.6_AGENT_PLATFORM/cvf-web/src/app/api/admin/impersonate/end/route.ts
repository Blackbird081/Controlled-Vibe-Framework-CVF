import { NextRequest, NextResponse } from 'next/server';

import { appendAuditEvent } from '@/lib/control-plane-events';
import { parseCookieHeader, CVF_IMPERSONATION_COOKIE } from '@/lib/impersonation';
import { verifySessionCookie, withSessionAuditPayload } from '@/lib/middleware-auth';
import { appendImpersonationSessionEvent } from '@/lib/policy-events';
import { getActiveImpersonationSession } from '@/lib/policy-reader';

export async function POST(request: NextRequest) {
  const session = await verifySessionCookie(request);
  if (!session?.impersonation || session.realRole !== 'owner') {
    return NextResponse.json({ success: false, error: 'No active owner impersonation session found.' }, { status: 403 });
  }

  const cookies = parseCookieHeader(request.headers.get('cookie'));
  const sessionId = cookies[CVF_IMPERSONATION_COOKIE];
  if (!sessionId) {
    return NextResponse.json({ success: false, error: 'No impersonation cookie found.' }, { status: 400 });
  }

  const activeSession = await getActiveImpersonationSession(sessionId);
  if (!activeSession) {
    return NextResponse.json({ success: false, error: 'Impersonation session already inactive.' }, { status: 404 });
  }

  const endedAt = new Date().toISOString();
  const record = await appendImpersonationSessionEvent({
    timestamp: endedAt,
    sessionId: activeSession.sessionId,
    realActorId: activeSession.realActorId,
    impersonatedUserId: activeSession.impersonatedUserId,
    startedAt: activeSession.startedAt,
    expiresAt: activeSession.expiresAt,
    status: 'ended',
    endedAt,
    endedBy: session.realUserId ?? session.impersonation.realActorId,
  });

  await appendAuditEvent({
    timestamp: endedAt,
    eventType: 'IMPERSONATION_ENDED',
    actorId: session.userId,
    actorRole: session.role,
    targetResource: activeSession.impersonatedUserId,
    action: 'END_IMPERSONATION',
    riskLevel: 'R2',
    phase: 'PHASE D',
    outcome: 'SUCCESS',
    payload: withSessionAuditPayload(session, {
      realActorId: activeSession.realActorId,
      impersonatedUserId: activeSession.impersonatedUserId,
    }),
  });

  const response = NextResponse.json({ success: true, data: record });
  response.cookies.set(CVF_IMPERSONATION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return response;
}
