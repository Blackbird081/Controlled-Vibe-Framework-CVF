import { auth } from '@/auth';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import type { TeamRole } from 'cvf-guard-contract/enterprise';

import { CVF_IMPERSONATION_COOKIE, parseCookieHeader } from '@/lib/impersonation';
import { findMockUserById, normalizeDisplayName } from '@/lib/mock-enterprise-db';
import { getActiveImpersonationSession } from '@/lib/policy-reader';

export type SessionImpersonation = {
    sessionId: string;
    realActorId: string;
    impersonatedUserId: string;
    startedAt: string;
    expiresAt: string;
};

export type SessionCookie = {
    userId: string;
    user: string;
    role: TeamRole;
    orgId: string;
    teamId: string;
    expiresAt: number;
    authMode: 'session';
    realUserId?: string;
    realRole?: TeamRole;
    impersonation?: SessionImpersonation;
};

type SessionUser = {
    name?: string | null;
    email?: string | null;
    role?: TeamRole;
    userId?: string;
    orgId?: string;
    teamId?: string;
};

async function resolveCookieValue(request?: NextRequest | Request): Promise<string | undefined> {
    if (request) {
        const parsed = parseCookieHeader(request.headers.get('cookie'));
        return parsed[CVF_IMPERSONATION_COOKIE];
    }

    try {
        const cookieStore = await cookies();
        return cookieStore.get(CVF_IMPERSONATION_COOKIE)?.value;
    } catch {
        return undefined;
    }
}

export function withSessionAuditPayload(
    session: SessionCookie | null | undefined,
    payload?: Record<string, unknown>,
): Record<string, unknown> | undefined {
    const nextPayload = payload ? { ...payload } : {};

    if (session?.impersonation) {
        nextPayload.impersonatedBy = session.impersonation.realActorId;
        nextPayload.impersonationSessionId = session.impersonation.sessionId;
        nextPayload.realActorId = session.impersonation.realActorId;
        nextPayload.impersonatedActorId = session.impersonation.impersonatedUserId;
    }

    return Object.keys(nextPayload).length > 0 ? nextPayload : undefined;
}

/**
 * Legacy wrapper for verifying session inside server components and API routes.
 * Now delegates internally to NextAuth.js App Router auth() function.
 * This prevents breaking the ~10 API routes that currently import it.
 */
export async function verifySessionCookie(_request?: NextRequest | Request): Promise<SessionCookie | null> {
    const session = await auth();
    if (!session?.user) return null;
    const sessionUser = session.user as SessionUser;

    const baseSession: SessionCookie = {
        userId: sessionUser.userId || 'unknown-user',
        user: normalizeDisplayName(sessionUser.name) || sessionUser.email || 'unknown',
        role: sessionUser.role || 'developer',
        orgId: sessionUser.orgId || 'org_cvf',
        teamId: sessionUser.teamId || 'team_eng',
        expiresAt: new Date(session.expires).getTime(),
        authMode: 'session',
    };

    const impersonationSessionId = await resolveCookieValue(_request);
    if (!impersonationSessionId) {
        return baseSession;
    }

    const impersonationSession = await getActiveImpersonationSession(impersonationSessionId);
    if (!impersonationSession || impersonationSession.realActorId !== baseSession.userId) {
        return baseSession;
    }

    const impersonatedUser = findMockUserById(impersonationSession.impersonatedUserId);
    if (!impersonatedUser) {
        return baseSession;
    }

    return {
        ...baseSession,
        userId: impersonatedUser.id,
        user: impersonatedUser.name,
        role: impersonatedUser.role,
        orgId: impersonatedUser.orgId,
        teamId: impersonatedUser.teamId,
        realUserId: baseSession.userId,
        realRole: baseSession.role,
        impersonation: {
            sessionId: impersonationSession.sessionId,
            realActorId: impersonationSession.realActorId,
            impersonatedUserId: impersonationSession.impersonatedUserId,
            startedAt: impersonationSession.startedAt,
            expiresAt: impersonationSession.expiresAt,
        },
    };
}
