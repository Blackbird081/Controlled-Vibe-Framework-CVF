/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { webcrypto } from 'node:crypto';
const verifier = vi.hoisted(() => vi.fn());
vi.mock('./middleware-auth', () => ({ verifySessionCookie: verifier }));
import { FileIntentSpecAcceptanceStore, type FileStoreOptions } from './intent-spec-file-store';
import { resolveIntentSpecActor } from './intent-spec-actor';
import { prepareIntentSpecAcceptance } from './intent-spec-acceptance';
import { createSpecConfirmationCandidate } from './intent-spec-confirmation';
import { acknowledgeIntentSpecReview, createIntentSpecReview, updateReviewDecision } from './intent-spec-review';
import { hardenPrivate, isPrivateSecurity, measureSecurity, windowsPrivateSecurity } from './intent-spec-private-profile';
import { applyAdversary, makePrivateRoot, removeFixture } from './intent-spec-security-fixture';

const describeWindows = describe.runIf(process.platform === 'win32');
let root: string;
let now: number;
beforeEach(async () => {
    vi.stubGlobal('crypto', webcrypto); now = Date.now();
    verifier.mockReset();
    verifier.mockResolvedValue({ userId: 'user_fixture', user: 'Fixture', role: 'developer', orgId: 'org_fixture', teamId: 'team_fixture', expiresAt: now + 600000, authMode: 'session' });
    root = await makePrivateRoot('store');
});
afterEach(async () => { vi.unstubAllGlobals(); await removeFixture(root); });

async function fixture(options: FileStoreOptions = {}, answer = 'Synthetic reporting') {
    const actor = await resolveIntentSpecActor(new Request('http://localhost/local-contract'), now);
    let review = createIntentSpecReview({ coreFeatures: answer }, 'Synthetic exact packet');
    for (const decision of review.decisions) review = updateReviewDecision(review, decision.id, { answer: `Decision ${decision.id}` });
    const portable = await createSpecConfirmationCandidate(acknowledgeIntentSpecReview(review), 'en', 'Fixture reviewer', new Date(now).toISOString());
    const candidate = prepareIntentSpecAcceptance(actor, new TextEncoder().encode(portable.fileContent), portable.fileSha256, now);
    const store = new FileIntentSpecAcceptanceStore(root, actor, () => now, { security: windowsPrivateSecurity, ...options });
    const bytes = new TextEncoder().encode(JSON.stringify({
        schema: 'cvf.intentSpecAcceptanceCandidate.v1', state: 'PENDING_STORE_COMMIT', scope: 'SPEC_REVIEW_ONLY_NO_BUILD_AUTHORITY',
        actor, preparedAt: new Date(now).toISOString(), sourceFileSha256: portable.fileSha256, sourceFile: portable.fileContent,
    }) + '\n');
    return { actor, candidate, store, bytes, id: candidate.id };
}
const namespaceDir = (store: FileIntentSpecAcceptanceStore) => path.join(root, store.namespace);
const lockDir = (store: FileIntentSpecAcceptanceStore) => path.join(root, `${store.namespace}.lock`);
const exists = (target: string) => fs.lstat(target).then(() => true, () => false);

describeWindows('private profile publication on a synthetic private root', () => {
    it('publishes under a measured private namespace and owns no lock afterwards', async () => {
        const { store, bytes, id } = await fixture();
        await store.createIfAbsent(id, bytes);
        expect(Buffer.from((await store.read(id))!).equals(Buffer.from(bytes))).toBe(true);
        expect(isPrivateSecurity(await measureSecurity(namespaceDir(store)))).toBe(true);
        const file = await measureSecurity(path.join(namespaceDir(store), `${id}.json`));
        expect(file.tuple.ownerSid).toBe(file.currentSid);
        expect(file.tuple.aces.every(ace => [file.currentSid, 'S-1-5-18'].includes(ace.sid) && ace.accessType === 'Allow')).toBe(true);
        expect(await exists(lockDir(store))).toBe(false);
        expect((await fs.readdir(namespaceDir(store)))).toEqual([`${id}.json`]);
    });
    it('serializes writers: a contending writer cannot enter before the holder releases', async () => {
        const events: string[] = [];
        let release!: () => void;
        const gate = new Promise<void>(resolve => { release = resolve; });
        const holder = await fixture({ instrumentation: { afterAcquire: async () => { events.push('HOLDER_ENTERED'); await gate; } } });
        const peer = await fixture({ instrumentation: {
            onContended: () => { events.push('PEER_CONTENDED'); release(); events.push('PARENT_RELEASE'); },
            afterAcquire: () => { events.push('PEER_ENTERED'); },
        } }, 'Second synthetic reporting');
        const first = holder.store.createIfAbsent(holder.id, holder.bytes);
        await vi.waitFor(() => expect(events).toContain('HOLDER_ENTERED'));
        const second = peer.store.createIfAbsent(peer.id, peer.bytes);
        await Promise.all([first, second]);
        expect(events).toEqual(['HOLDER_ENTERED', 'PEER_CONTENDED', 'PARENT_RELEASE', 'PEER_ENTERED']);
        expect(await holder.store.read(holder.id)).not.toBeNull();
        expect(await peer.store.read(peer.id)).not.toBeNull();
    });
    it('releases the lock after a post-acquire failure and a subsequent peer acquires', async () => {
        const failing = await fixture({ instrumentation: { afterAcquire: () => { throw new Error('INJECTED_AFTER_ACQUIRE_BEFORE_MUTATION'); } } });
        await expect(failing.store.createIfAbsent(failing.id, failing.bytes)).rejects.toThrow('INJECTED_AFTER_ACQUIRE_BEFORE_MUTATION');
        expect(await exists(lockDir(failing.store))).toBe(false);
        expect(await exists(namespaceDir(failing.store))).toBe(false);
        const next = await fixture();
        await next.store.createIfAbsent(next.id, next.bytes);
        expect(await next.store.read(next.id)).not.toBeNull();
    });
    it('times out closed on a foreign lock without deleting it or mutating anything', async () => {
        const { store, bytes, id } = await fixture({ lockTimeoutMs: 120 });
        await fs.mkdir(lockDir(store));
        await expect(store.createIfAbsent(id, bytes)).rejects.toThrow('STORE_LOCK_TIMEOUT');
        expect(await exists(lockDir(store))).toBe(true);
        expect(await exists(namespaceDir(store))).toBe(false);
    });
    it('removes a namespace this invocation created when security mutation fails afterwards', async () => {
        const { store, bytes, id } = await fixture({ instrumentation: { afterSecurityMutation: () => { throw new Error('INJECTED_AFTER_SECURITY'); } } });
        await expect(store.createIfAbsent(id, bytes)).rejects.toThrow('INJECTED_AFTER_SECURITY');
        expect(await exists(namespaceDir(store))).toBe(false);
        expect(await exists(lockDir(store))).toBe(false);
    });
    it.each(['EXTRA_ALLOW', 'DENY', 'INHERITED'] as const)('restores the exact semantic pre-state after a %s namespace fails mid-hardening', async kind => {
        const { store, bytes, id } = await fixture({ instrumentation: { afterSecurityMutation: () => { throw new Error('INJECTED_AFTER_SECURITY'); } } });
        await fs.mkdir(namespaceDir(store));
        await applyAdversary(namespaceDir(store), kind);
        const before = await measureSecurity(namespaceDir(store));
        expect(isPrivateSecurity(before)).toBe(false);
        await expect(store.createIfAbsent(id, bytes)).rejects.toThrow('INJECTED_AFTER_SECURITY');
        expect((await measureSecurity(namespaceDir(store))).tuple).toEqual(before.tuple);
        expect(await fs.readdir(namespaceDir(store))).toEqual([]);
        expect(await exists(lockDir(store))).toBe(false);
        // The same namespace is privatized when nothing fails, and reads fail closed before that.
        const clean = await fixture();
        await expect(clean.store.read(clean.id)).rejects.toThrow('UNSAFE_ACTOR_NAMESPACE');
        await clean.store.createIfAbsent(clean.id, clean.bytes);
        expect(isPrivateSecurity(await measureSecurity(namespaceDir(clean.store)))).toBe(true);
    });
    const ambiguous = (hooks: Parameters<typeof hardenPrivate>[1]) => ({
        ...windowsPrivateSecurity, harden: (target: string) => hardenPrivate(target, hooks),
    });
    const injected = () => { throw new Error('INJECTED_AFTER_REAL_HARDENING'); };
    it.each(['EXTRA_ALLOW', 'DENY', 'INHERITED'] as const)('restores a %s namespace when real hardening fails before the rollback handle is returned', async kind => {
        const { store, bytes, id } = await fixture({ security: ambiguous({ afterMutation: injected }) });
        await fs.mkdir(namespaceDir(store));
        await applyAdversary(namespaceDir(store), kind);
        const before = await measureSecurity(namespaceDir(store));
        await expect(store.createIfAbsent(id, bytes)).rejects.toThrow('PROFILE_HARDENING_FAILED');
        expect((await measureSecurity(namespaceDir(store))).tuple).toEqual(before.tuple);
        expect(await fs.readdir(namespaceDir(store))).toEqual([]);
        expect(await exists(lockDir(store))).toBe(false);
        const peer = await fixture();
        await peer.store.createIfAbsent(peer.id, peer.bytes);
        expect(Buffer.from((await peer.store.read(peer.id))!).equals(Buffer.from(peer.bytes))).toBe(true);
    });
    it('removes a namespace created by this invocation when hardening fails ambiguously', async () => {
        const { store, bytes, id } = await fixture({ security: ambiguous({ afterMutation: injected }) });
        await expect(store.createIfAbsent(id, bytes)).rejects.toThrow('PROFILE_HARDENING_FAILED');
        expect(await exists(namespaceDir(store))).toBe(false);
        expect(await exists(lockDir(store))).toBe(false);
    });
    it('reports a failed restoration truthfully, keeps the namespace private and lets a peer recover', async () => {
        const { store, bytes, id } = await fixture({ security: ambiguous({ afterMutation: injected, beforeRestore: () => { throw new Error('INJECTED_RESTORE'); } }) });
        await fs.mkdir(namespaceDir(store));
        await applyAdversary(namespaceDir(store), 'EXTRA_ALLOW');
        await expect(store.createIfAbsent(id, bytes)).rejects.toThrow('PROFILE_RESTORATION_FAILED');
        expect(isPrivateSecurity(await measureSecurity(namespaceDir(store)))).toBe(true);
        expect(await exists(lockDir(store))).toBe(false);
        const peer = await fixture();
        await peer.store.createIfAbsent(peer.id, peer.bytes);
        expect(await peer.store.read(peer.id)).not.toBeNull();
    });
    it('never reads or mutates a non-private namespace on the read path', async () => {
        const { store, id } = await fixture();
        await fs.mkdir(namespaceDir(store));
        await applyAdversary(namespaceDir(store), 'EXTRA_ALLOW');
        const before = await measureSecurity(namespaceDir(store));
        await expect(store.read(id)).rejects.toThrow('UNSAFE_ACTOR_NAMESPACE');
        expect((await measureSecurity(namespaceDir(store))).tuple).toEqual(before.tuple);
    });
});
