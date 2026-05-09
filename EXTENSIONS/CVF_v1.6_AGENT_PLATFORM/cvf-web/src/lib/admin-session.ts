import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextResponse, type NextRequest } from 'next/server';

import { canAccessAdmin } from '@/lib/enterprise-access';
import { appendAuditEvent } from '@/lib/control-plane-events';
import type { SessionCookie } from '@/lib/middleware-auth';
import { verifySessionCookie, withSessionAuditPayload } from '@/lib/middleware-auth';
import { constantTimeEqual } from '@/lib/service-token-auth';

export type AdminSession = SessionCookie | BreakGlassSession;

export type BreakGlassSession = {
  userId: 'break-glass';
  user: 'Break Glass Session';
  role: 'owner';
  orgId: 'org_cvf';
  teamId: 'team_exec';
  expiresAt: number;
  authMode: 'break-glass';
};

const BREAK_GLASS_SESSION: BreakGlassSession = {
  userId: 'break-glass',
  user: 'Break Glass Session',
  role: 'owner',
  orgId: 'org_cvf',
  teamId: 'team_exec',
  expiresAt: 0,
  authMode: 'break-glass',
};

type AdminSessionOptions = {
  ownerOnly?: boolean;
  allowBreakGlass?: boolean;
};

const DEFAULT_BREAK_GLASS_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function resolveBreakGlassMaxAgeMs(): number {
  const configuredDays = Number(process.env.CVF_BREAK_GLASS_MAX_AGE_DAYS);
  if (Number.isFinite(configuredDays) && configuredDays > 0) {
    return configuredDays * 24 * 60 * 60 * 1000;
  }

  return DEFAULT_BREAK_GLASS_MAX_AGE_MS;
}

function resolveBreakGlassIssuedAt(configuredToken: string): number | null {
  const configuredIssuedAt = process.env.CVF_BREAK_GLASS_TOKEN_ISSUED_AT?.trim();
  if (configuredIssuedAt) {
    const numericIssuedAt = Number(configuredIssuedAt);
    if (Number.isFinite(numericIssuedAt)) {
      return numericIssuedAt;
    }

    const parsedIssuedAt = Date.parse(configuredIssuedAt);
    return Number.isFinite(parsedIssuedAt) ? parsedIssuedAt : null;
  }

  const tokenMatch = configuredToken.match(/^(?:cvfbg|bg)[.:](\d{13})[.:].+$/i);
  if (!tokenMatch) {
    return null;
  }

  return Number(tokenMatch[1]);
}

function isOwnerLikeSession(session: AdminSession): boolean {
  if (session.authMode === 'break-glass') return true;
  if (session.role === 'owner') return true;
  return session.realRole === 'owner';
}

export function withAdminAuditPayload(
  session: AdminSession | null | undefined,
  payload?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const nextPayload = session?.authMode === 'session'
    ? withSessionAuditPayload(session, payload) ?? {}
    : { ...(payload ?? {}) };

  if (session?.authMode === 'break-glass') {
    nextPayload.authMode = 'break-glass';
  }

  return Object.keys(nextPayload).length > 0 ? nextPayload : undefined;
}

async function resolveBreakGlassSession(
  token: string | null,
  targetResource: string,
): Promise<BreakGlassSession | null> {
  const configuredToken = process.env.CVF_BREAK_GLASS_TOKEN;
  if (!token || !configuredToken || !constantTimeEqual(token, configuredToken)) {
    return null;
  }

  const issuedAtMs = resolveBreakGlassIssuedAt(configuredToken);
  if (issuedAtMs === null) {
    await appendAuditEvent({
      eventType: 'BREAK_GLASS_DENIED',
      actorId: 'break-glass',
      actorRole: 'owner',
      targetResource,
      action: 'EMERGENCY_ACCESS',
      riskLevel: 'R3',
      phase: 'PHASE D',
      outcome: 'DENIED',
      payload: {
        authMode: 'break-glass',
        reason: 'missing-issued-at',
      },
    });
    console.error('[CVF BREAK GLASS DENIED] Configure CVF_BREAK_GLASS_TOKEN_ISSUED_AT or use an encoded token timestamp.');
    return null;
  }

  const FUTURE_GRACE_MS = 60_000;
  if (issuedAtMs > Date.now() + FUTURE_GRACE_MS) {
    await appendAuditEvent({
      eventType: 'BREAK_GLASS_DENIED',
      actorId: 'break-glass',
      actorRole: 'owner',
      targetResource,
      action: 'EMERGENCY_ACCESS',
      riskLevel: 'R3',
      phase: 'PHASE D',
      outcome: 'DENIED',
      payload: {
        authMode: 'break-glass',
        reason: 'future-issued-at',
        issuedAt: new Date(issuedAtMs).toISOString(),
      },
    });
    console.error('[CVF BREAK GLASS DENIED] Break-glass token issuedAt is in the future — rotate and reissue with a valid timestamp.');
    return null;
  }

  const maxAgeMs = resolveBreakGlassMaxAgeMs();
  if (Date.now() - issuedAtMs > maxAgeMs) {
    await appendAuditEvent({
      eventType: 'BREAK_GLASS_DENIED',
      actorId: 'break-glass',
      actorRole: 'owner',
      targetResource,
      action: 'EMERGENCY_ACCESS',
      riskLevel: 'R3',
      phase: 'PHASE D',
      outcome: 'DENIED',
      payload: {
        authMode: 'break-glass',
        reason: 'token-expired',
        issuedAt: new Date(issuedAtMs).toISOString(),
        maxAgeMs,
      },
    });
    console.error('[CVF BREAK GLASS DENIED] Break-glass token has expired and must be rotated.');
    return null;
  }

  const usedAt = new Date().toISOString();
  await appendAuditEvent({
    timestamp: usedAt,
    eventType: 'BREAK_GLASS_USED',
    actorId: 'break-glass',
    actorRole: 'owner',
    targetResource,
    action: 'EMERGENCY_ACCESS',
    riskLevel: 'R3',
    phase: 'PHASE D',
    outcome: 'GRANTED',
    payload: {
      authMode: 'break-glass',
      issuedAt: new Date(issuedAtMs).toISOString(),
    },
  });
  console.error('[CVF BREAK GLASS USED] Rotate CVF_BREAK_GLASS_TOKEN immediately.');

  return {
    ...BREAK_GLASS_SESSION,
    expiresAt: issuedAtMs + maxAgeMs,
  };
}

async function buildDeniedResponsePayload(
  session: SessionCookie | null,
  targetResource: string,
  source: 'server-component' | 'api-route',
  requiredRole: 'admin' | 'owner',
) {
  await appendAuditEvent({
    eventType: 'ADMIN_ACCESS_DENIED',
    actorId: session?.userId ?? 'unknown-user',
    actorRole: session?.role ?? 'unknown',
    targetResource,
    action: source === 'server-component' ? 'READ_ADMIN_ROUTE' : 'CALL_ADMIN_API',
    outcome: 'DENIED',
    payload: withSessionAuditPayload(session, {
      source,
      requiredRole,
    }),
  });
}

function hasRequiredAccess(session: AdminSession, options: AdminSessionOptions): boolean {
  if (options.ownerOnly) {
    return isOwnerLikeSession(session);
  }

  if (session.authMode === 'break-glass') {
    return true;
  }

  return canAccessAdmin(session.role);
}

export async function requireAdminSession(
  targetResource: string,
  options: AdminSessionOptions = {},
): Promise<AdminSession> {
  const headerStore = await headers();
  const breakGlassSession = options.allowBreakGlass === false
    ? null
    : await resolveBreakGlassSession(headerStore.get('x-cvf-break-glass'), targetResource);

  if (breakGlassSession) {
    return breakGlassSession;
  }

  const session = await verifySessionCookie();

  if (!session) {
    redirect(`/login?from=${encodeURIComponent(targetResource)}`);
  }

  if (!hasRequiredAccess(session, options)) {
    await buildDeniedResponsePayload(session, targetResource, 'server-component', options.ownerOnly ? 'owner' : 'admin');
    redirect('/');
  }

  return session;
}

export async function requireAdminApiSession(
  request: NextRequest,
  targetResource: string,
  options: AdminSessionOptions = {},
): Promise<AdminSession | NextResponse> {
  const breakGlassSession = options.allowBreakGlass === false
    ? null
    : await resolveBreakGlassSession(request.headers.get('x-cvf-break-glass'), targetResource);

  if (breakGlassSession) {
    return breakGlassSession;
  }

  const session = await verifySessionCookie(request);
  if (!session || !hasRequiredAccess(session, options)) {
    await buildDeniedResponsePayload(session, targetResource, 'api-route', options.ownerOnly ? 'owner' : 'admin');
    return NextResponse.json(
      { success: false, error: options.ownerOnly ? 'Owner session required.' : 'Unauthorized' },
      { status: session ? 403 : 401 },
    );
  }

  return session;
}
