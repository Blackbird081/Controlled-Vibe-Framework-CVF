/** Server-only session-owner composition; this module registers no route. */
import { verifySessionCookie } from './middleware-auth';

export interface IntentSpecActor {
    readonly userId: string;
    readonly orgId: string;
    readonly teamId: string;
    readonly role: string;
    readonly assurance: 'LOCAL_TEST_SESSION' | 'EXISTING_AUTH_JS_OWNER';
}

const ACTORS = new WeakMap<IntentSpecActor, number>();
const ROLES = new Set(['owner', 'admin', 'developer', 'reviewer']);
const validId = (value: unknown): value is string => typeof value === 'string'
    && value.trim() === value && value.length > 0 && value.length <= 200
    && !['unknown', 'unknown-user'].includes(value.toLowerCase());

export function assertCurrentIntentSpecActor(actor: IntentSpecActor, now = Date.now()): void {
    const expiresAt = actor && ACTORS.get(actor);
    if (!Number.isSafeInteger(now) || expiresAt === undefined || expiresAt <= now) {
        throw new Error('CURRENT_SESSION_ACTOR_REQUIRED');
    }
}

/** Client names/IDs cannot manufacture this context; resolve through the current auth owner. */
export async function resolveIntentSpecActor(request: Request, now = Date.now()): Promise<IntentSpecActor> {
    if (!Number.isSafeInteger(now)) throw new Error('CURRENT_SESSION_ACTOR_REQUIRED');
    const session = await verifySessionCookie(request);
    if (!session || session.authMode !== 'session' || !validId(session.userId)
        || !validId(session.orgId) || !validId(session.teamId) || !ROLES.has(session.role)
        || session.impersonation || session.realUserId || session.realRole
        || !Number.isSafeInteger(session.expiresAt) || session.expiresAt <= now) {
        throw new Error('CURRENT_SESSION_ACTOR_REQUIRED');
    }
    const actor: IntentSpecActor = Object.freeze({
        userId: session.userId, orgId: session.orgId, teamId: session.teamId, role: session.role,
        assurance: ['test', 'development'].includes(process.env.NODE_ENV ?? '')
            ? 'LOCAL_TEST_SESSION' : 'EXISTING_AUTH_JS_OWNER',
    });
    ACTORS.set(actor, session.expiresAt);
    return actor;
}
