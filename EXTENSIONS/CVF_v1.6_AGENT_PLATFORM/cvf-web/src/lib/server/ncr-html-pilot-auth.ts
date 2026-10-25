import { NextResponse, type NextRequest } from 'next/server';
import { verifySessionCookie, type SessionCookie } from '@/lib/middleware-auth';
import type { DraftPrincipal } from '@/lib/html-draft-recovery-contract';

const ident = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9_-]{1,150}$/.test(v);
export function htmlPilotNormalPrincipal(session: SessionCookie | null, now: number): DraftPrincipal | null {
  if (!session || session.authMode !== 'session' || session.realUserId || session.realRole || session.impersonation
    || !Number.isFinite(session.expiresAt) || session.expiresAt <= now
    || ![session.userId, session.orgId, session.teamId].every(ident)) return null;
  return { userId: session.userId, orgId: session.orgId, teamId: session.teamId };
}
export function htmlPilotSameOwner(a: DraftPrincipal, b: DraftPrincipal): boolean {
  return a.userId === b.userId && a.orgId === b.orgId && a.teamId === b.teamId;
}
export async function requireHtmlPilotOwner(request: NextRequest, now = Date.now()): Promise<DraftPrincipal | NextResponse> {
  const session = await verifySessionCookie(request);
  const owner = htmlPilotNormalPrincipal(session, now);
  return owner ?? NextResponse.json({ success: false, error: 'PILOT_NORMAL_SESSION_REQUIRED' },
    { status: session ? 403 : 401, headers: { 'Cache-Control': 'no-store' } });
}
