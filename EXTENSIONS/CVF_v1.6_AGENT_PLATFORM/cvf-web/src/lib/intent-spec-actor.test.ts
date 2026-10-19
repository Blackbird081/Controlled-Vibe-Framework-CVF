/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const verifier = vi.hoisted(() => vi.fn());
vi.mock('./middleware-auth', () => ({ verifySessionCookie: verifier }));
import { assertCurrentIntentSpecActor, resolveIntentSpecActor } from './intent-spec-actor';

const now = 1791158400000;
const request = () => new Request('http://localhost/local-contract');
const session = () => ({ userId: 'user_fixture', user: 'Fixture', role: 'developer', orgId: 'org_fixture', teamId: 'team_fixture', expiresAt: now + 60000, authMode: 'session' });
beforeEach(() => { verifier.mockReset(); verifier.mockResolvedValue(session()); });
afterEach(() => vi.unstubAllEnvs());

describe('session-owner actor composition, not live authentication proof', () => {
    it('uses the request verifier and captures a frozen local-test identity', async () => {
        const req = request();
        const source = session(); verifier.mockResolvedValue(source);
        const actor = await resolveIntentSpecActor(req, now);
        expect(verifier).toHaveBeenCalledWith(req);
        expect(actor.assurance).toBe('LOCAL_TEST_SESSION');
        expect(Object.isFrozen(actor)).toBe(true);
        source.userId = 'Changed after resolution';
        expect(actor.userId).toBe('user_fixture');
        expect(() => assertCurrentIntentSpecActor(actor, now)).not.toThrow();
        expect(() => assertCurrentIntentSpecActor({ ...actor }, now)).toThrow('CURRENT_SESSION_ACTOR_REQUIRED');
    });
    it.each([
        null, { ...session(), expiresAt: now }, { ...session(), expiresAt: NaN },
        { ...session(), userId: 'unknown-user' }, { ...session(), orgId: '' },
        { ...session(), teamId: ' team' }, { ...session(), role: 'viewer' },
        { ...session(), role: 'invalid' }, { ...session(), authMode: 'client' },
        { ...session(), realUserId: 'other' }, { ...session(), realRole: 'owner' },
        { ...session(), impersonation: { realActorId: 'other' } },
    ])('rejects absent, stale, fallback or impersonated identities: %j', async value => {
        verifier.mockResolvedValue(value);
        await expect(resolveIntentSpecActor(request(), now)).rejects.toThrow('CURRENT_SESSION_ACTOR_REQUIRED');
    });
    it('rechecks expiry at the time of use and never silently extends it', async () => {
        const actor = await resolveIntentSpecActor(request(), now);
        expect(() => assertCurrentIntentSpecActor(actor, now + 60000)).toThrow('CURRENT_SESSION_ACTOR_REQUIRED');
    });
    it('propagates verifier failure instead of supplying an actor fallback', async () => {
        verifier.mockRejectedValue(new Error('Verifier failed'));
        await expect(resolveIntentSpecActor(request(), now)).rejects.toThrow('Verifier failed');
    });
});
