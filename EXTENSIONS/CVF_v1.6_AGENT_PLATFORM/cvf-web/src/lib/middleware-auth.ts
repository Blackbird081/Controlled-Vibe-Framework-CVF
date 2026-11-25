import { auth, authSecret } from '@/auth';
import { cookies } from 'next/headers';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import type { TeamRole } from 'cvf-guard-contract/enterprise';

import { resolveAuthSessionCookie } from '@/lib/auth-session-cookie';
import { CVF_IMPERSONATION_COOKIE, parseCookieHeader } from '@/lib/impersonation';
import { findMockUserById, normalizeDisplayName } from '@/lib/mock-enterprise-db';
import { findOAuthIdentityBinding, isOAuthProviderId, type OAuthProviderId } from '@/lib/oauth-identity-profile';
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
    authSource?: 'local_mock' | 'oauth_bound';
    oauthProvider?: OAuthProviderId;
    oauthSubject?: string;
};

type AppToken = {
    name?: string | null;
    email?: string | null;
    role?: TeamRole;
    userId?: string;
    orgId?: string;
    teamId?: string;
    exp?: number;
    authSource?: 'local_mock' | 'oauth_bound';
    oauthProvider?: OAuthProviderId;
    oauthSubject?: string;
};

function productionBinding(source: unknown, provider: unknown, subject: unknown) {
    if (source !== 'oauth_bound' || provider !== process.env.CVF_OAUTH_PROVIDER) return null;
    return findOAuthIdentityBinding(process.env.CVF_OAUTH_IDENTITY_BINDINGS_JSON, provider, subject);
}

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

async function readRequestToken(request: Request): Promise<AppToken | null> {
    const { secure, name } = resolveAuthSessionCookie(request);
    return getToken({ req: request, secret: authSecret, secureCookie: secure, cookieName: name, salt: name });
}

async function resolveBaseSessionFromRequest(request: NextRequest | Request): Promise<SessionCookie | null> {
    const token = await readRequestToken(request);
    if (!token) return null;

    const binding = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development'
        ? null : productionBinding(token.authSource, token.oauthProvider, token.oauthSubject);
    if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'development' && !binding) return null;

    return {
        userId: binding?.userId ?? token.userId ?? 'unknown-user',
        user: normalizeDisplayName(token.name) || token.email || 'unknown',
        role: binding?.role ?? token.role ?? 'developer',
        orgId: binding?.orgId ?? token.orgId ?? 'org_cvf',
        teamId: binding?.teamId ?? token.teamId ?? 'team_eng',
        expiresAt: (token.exp ?? 0) * 1000,
        authMode: 'session',
    };
}

async function resolveBaseSessionAmbient(): Promise<SessionCookie | null> {
    const session = await auth();
    if (!session?.user) return null;
    const sessionUser = session.user as SessionUser;

    const binding = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development'
        ? null : productionBinding(sessionUser.authSource, sessionUser.oauthProvider, sessionUser.oauthSubject);
    if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'development' && !binding) return null;

    return {
        userId: binding?.userId ?? sessionUser.userId ?? 'unknown-user',
        user: normalizeDisplayName(sessionUser.name) || sessionUser.email || 'unknown',
        role: binding?.role ?? sessionUser.role ?? 'developer',
        orgId: binding?.orgId ?? sessionUser.orgId ?? 'org_cvf',
        teamId: binding?.teamId ?? sessionUser.teamId ?? 'team_eng',
        expiresAt: new Date(session.expires).getTime(),
        authMode: 'session',
    };
}

export type VerifiedSessionUnqualifiedReason =
    | 'NO_SESSION'
    | 'NOT_OAUTH_BOUND'
    | 'BINDING_MISSING'
    | 'BINDING_INCOMPLETE'
    | 'EXPIRED'
    | 'IMPERSONATED'
    | 'DEVELOPMENT_FALLBACK';

/**
 * Provenance of a request identity. `qualified: true` is returned only when every
 * identity value comes from a currently configured production OAuth binding.
 * Test/development fallbacks, impersonated sessions and expired tokens never qualify.
 */
export type VerifiedSessionProvenance =
    | {
        qualified: true;
        userId: string;
        orgId: string;
        teamId: string;
        role: TeamRole;
        oauthProvider: OAuthProviderId;
        oauthSubject: string;
        expiresAt: number;
    }
    | { qualified: false; reason: VerifiedSessionUnqualifiedReason };

function unqualified(reason: VerifiedSessionUnqualifiedReason): VerifiedSessionProvenance {
    return { qualified: false, reason };
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Additive provenance resolver. Reads the request-bound token and the current
 * environment configuration on every call (no caching) and never throws on
 * malformed binding configuration. It does not change `verifySessionCookie`.
 */
export async function resolveVerifiedSessionProvenance(
    request: NextRequest | Request,
    now: number = Date.now(),
): Promise<VerifiedSessionProvenance> {
    const token = await readRequestToken(request);
    if (!token) return unqualified('NO_SESSION');

    const configuredProvider = process.env.CVF_OAUTH_PROVIDER;
    if (
        token.authSource !== 'oauth_bound' ||
        !isOAuthProviderId(token.oauthProvider) ||
        token.oauthProvider !== configuredProvider ||
        !isNonEmptyString(token.oauthSubject)
    ) {
        return unqualified('NOT_OAUTH_BOUND');
    }

    let binding: ReturnType<typeof findOAuthIdentityBinding>;
    try {
        binding = findOAuthIdentityBinding(
            process.env.CVF_OAUTH_IDENTITY_BINDINGS_JSON,
            token.oauthProvider,
            token.oauthSubject,
        );
    } catch {
        // The strict parser rejects malformed/incomplete binding configuration.
        return unqualified('BINDING_INCOMPLETE');
    }

    if (!binding) {
        const nonProduction = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';
        return unqualified(nonProduction ? 'DEVELOPMENT_FALLBACK' : 'BINDING_MISSING');
    }

    if (
        !isNonEmptyString(binding.userId) ||
        !isNonEmptyString(binding.orgId) ||
        !isNonEmptyString(binding.teamId) ||
        !isNonEmptyString(binding.role)
    ) {
        return unqualified('BINDING_INCOMPLETE');
    }

    const expiresAt = (token.exp ?? 0) * 1000;
    if (!(expiresAt > now)) return unqualified('EXPIRED');

    const impersonationSessionId = await resolveCookieValue(request);
    if (impersonationSessionId) {
        const impersonationSession = await getActiveImpersonationSession(impersonationSessionId);
        if (impersonationSession && impersonationSession.realActorId === binding.userId) {
            return unqualified('IMPERSONATED');
        }
    }

    return {
        qualified: true,
        userId: binding.userId,
        orgId: binding.orgId,
        teamId: binding.teamId,
        role: binding.role,
        oauthProvider: binding.provider,
        oauthSubject: binding.providerAccountId,
        expiresAt,
    };
}

/**
 * Legacy wrapper for verifying session inside server components and API routes.
 * Delegates to the request-bound Auth.js JWT decoder when a request is supplied,
 * and to the ambient App Router auth() function otherwise.
 * This prevents breaking the ~10 API routes that currently import it.
 */
export async function verifySessionCookie(_request?: NextRequest | Request): Promise<SessionCookie | null> {
    const baseSession = _request
        ? await resolveBaseSessionFromRequest(_request)
        : await resolveBaseSessionAmbient();
    if (!baseSession) return null;

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
