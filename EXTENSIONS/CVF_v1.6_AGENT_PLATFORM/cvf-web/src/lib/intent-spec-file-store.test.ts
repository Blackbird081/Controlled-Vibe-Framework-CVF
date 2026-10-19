/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import path from 'node:path';
import os from 'node:os';
import { createHash, webcrypto } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const verifier = vi.hoisted(() => vi.fn());
const fault = vi.hoisted(() => ({ point: '', published: false }));
vi.mock('./middleware-auth', () => ({ verifySessionCookie: verifier }));
vi.mock('node:fs/promises', async importOriginal => {
    const actual = await importOriginal<typeof import('node:fs/promises')>();
    return {
        ...actual,
        async open(...args: Parameters<typeof actual.open>) {
            if (args[1] === 'wx' && fault.point === 'open') throw new Error('OPEN_FAILED');
            if (args[1] === 'r' && fault.published && fault.point === 'post-publication') throw new Error('READ_FAILED');
            if (args[1] === 'wx' && fault.point === 'collision') await actual.writeFile(args[0], 'Foreign writer fixture');
            const handle = await actual.open(...args);
            if (args[1] === 'wx' && fault.point === 'sync') vi.spyOn(handle, 'sync').mockRejectedValue(new Error('SYNC_FAILED'));
            if (args[1] === 'wx' && fault.point === 'write') {
                const write = handle.writeFile.bind(handle);
                vi.spyOn(handle, 'writeFile').mockImplementation(async () => { await write(new Uint8Array([123])); throw new Error('PARTIAL_WRITE_FAILED'); });
            }
            return handle;
        },
        async link(...args: Parameters<typeof actual.link>) {
            if (fault.point === 'link') throw new Error('LINK_FAILED');
            await actual.link(...args); fault.published = true;
        },
        async unlink(...args: Parameters<typeof actual.unlink>) {
            if (fault.point === 'cleanup') throw new Error('CLEANUP_FAILED');
            return actual.unlink(...args);
        },
    };
});
import * as fs from 'node:fs/promises';
import { FileIntentSpecAcceptanceStore } from './intent-spec-file-store';
import { resolveIntentSpecActor } from './intent-spec-actor';
import { prepareIntentSpecAcceptance, commitIntentSpecAcceptanceCandidate } from './intent-spec-acceptance';
import { createSpecConfirmationCandidate } from './intent-spec-confirmation';
import { acknowledgeIntentSpecReview, createIntentSpecReview, updateReviewDecision } from './intent-spec-review';

let root: string;
let now: number;
beforeEach(async () => {
    vi.stubGlobal('crypto', webcrypto); now = Date.now();
    fault.point = ''; fault.published = false;
    verifier.mockReset();
    verifier.mockResolvedValue({ userId: 'user_fixture', user: 'Fixture', role: 'developer', orgId: 'org_fixture', teamId: 'team_fixture', expiresAt: now + 60000, authMode: 'session' });
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'cvf-nis-store-'));
});
afterEach(async () => {
    fault.point = ''; vi.restoreAllMocks(); vi.unstubAllGlobals();
    const relative = path.relative(path.resolve(os.tmpdir()), path.resolve(root));
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative) || !path.basename(root).startsWith('cvf-nis-store-')) {
        throw new Error('UNSAFE_FIXTURE_CLEANUP');
    }
    await fs.rm(root, { recursive: true, force: true });
});
async function fixture(userId = 'user_fixture') {
    const source = await verifier(); verifier.mockResolvedValue({ ...source, userId });
    const actor = await resolveIntentSpecActor(new Request('http://localhost/local-contract'), now);
    let review = createIntentSpecReview({ coreFeatures: 'Synthetic reporting' }, 'Synthetic exact packet');
    for (const decision of review.decisions) review = updateReviewDecision(review, decision.id, { answer: `Decision ${decision.id}` });
    const portable = await createSpecConfirmationCandidate(acknowledgeIntentSpecReview(review), 'en', 'Fixture reviewer', new Date(now).toISOString());
    const candidate = prepareIntentSpecAcceptance(actor, new TextEncoder().encode(portable.fileContent), portable.fileSha256, now);
    const store = new FileIntentSpecAcceptanceStore(root, actor, () => now);
    return { actor, candidate, store };
}

describe('real isolated filesystem adapter, not production or independent transaction proof', () => {
    it('publishes exact bytes and reads them with a fresh store instance', async () => {
        const { actor, candidate, store } = await fixture();
        const result = await commitIntentSpecAcceptanceCandidate(actor, candidate, store, () => now);
        expect(result.claimBoundary).toBe('NO_DURABILITY_OR_BUILD_AUTHORITY');
        const fresh = new FileIntentSpecAcceptanceStore(root, actor, () => now);
        const saved = await fresh.read(candidate.id);
        expect(createHash('sha256').update(saved!).digest('hex')).toBe(candidate.id);
        expect(await fs.readdir(path.join(root, store.namespace))).toEqual([`${candidate.id}.json`]);
        expect(Object.isFrozen(store)).toBe(true);
    });
    it('verifies the published bytes in a separate OS process without printing private content', async () => {
        const { actor, candidate, store } = await fixture();
        await commitIntentSpecAcceptanceCandidate(actor, candidate, store, () => now);
        const file = path.join(root, store.namespace, `${candidate.id}.json`);
        const child = await promisify(execFile)(process.execPath, ['-e',
            "const fs=require('node:fs');const crypto=require('node:crypto');const b=fs.readFileSync(process.argv[1]);process.stdout.write(JSON.stringify({sha256:crypto.createHash('sha256').update(b).digest('hex'),bytes:b.length}));", file]);
        const proof = JSON.parse(child.stdout);
        expect(proof.sha256).toBe(candidate.id); expect(proof.bytes).toBeGreaterThan(0);
    });
    it('keeps another actor in a separate namespace and denies cross-actor writes', async () => {
        const first = await fixture();
        await commitIntentSpecAcceptanceCandidate(first.actor, first.candidate, first.store, () => now);
        const other = await fixture('other_fixture');
        expect(other.store.namespace).not.toBe(first.store.namespace);
        expect(await other.store.read(first.candidate.id)).toBeNull();
        const saved = await first.store.read(first.candidate.id);
        await expect(other.store.createIfAbsent(first.candidate.id, saved!)).rejects.toThrow('STORED_SPEC_ACTOR_MISMATCH');
    });
    it('allows concurrent identical attempts without overwriting published records', async () => {
        const { actor, candidate, store } = await fixture();
        const results = await Promise.all(Array.from({ length: 4 }, () => commitIntentSpecAcceptanceCandidate(actor, candidate, store, () => now)));
        expect(results.every(result => result.state === 'STORE_PORT_READBACK_VERIFIED')).toBe(true);
        expect(await fs.readdir(path.join(root, store.namespace))).toEqual([`${candidate.id}.json`]);
    });
    it.each(['open', 'write', 'sync', 'link'])('cleans only owned temporary state after %s failure, then permits a retry', async point => {
        const { actor, candidate, store } = await fixture(); fault.point = point;
        await expect(commitIntentSpecAcceptanceCandidate(actor, candidate, store, () => now)).rejects.toThrow('STORE_COMMIT_UNCONFIRMED');
        expect(await store.read(candidate.id)).toBeNull();
        expect(await fs.readdir(path.join(root, store.namespace))).toEqual([]);
        fault.point = '';
        await expect(commitIntentSpecAcceptanceCandidate(actor, candidate, store, () => now)).resolves.toMatchObject({ state: 'STORE_PORT_READBACK_VERIFIED' });
    });
    it.each(['post-publication', 'cleanup'])('keeps post-publication %s errors unconfirmed without deleting the record', async point => {
        const { actor, candidate, store } = await fixture(); fault.point = point;
        await expect(commitIntentSpecAcceptanceCandidate(actor, candidate, store, () => now)).rejects.toThrow('STORE_COMMIT_UNCONFIRMED');
        fault.point = '';
        expect(await store.read(candidate.id)).not.toBeNull();
        expect(candidate.state).toBe('PENDING_STORE_COMMIT');
    });
    it('ignores interrupted-writer orphan files and does not run a cleanup sweep', async () => {
        const { candidate, store } = await fixture();
        const directory = path.join(root, store.namespace); await fs.mkdir(directory);
        const orphan = path.join(directory, '.pending-orphan-fixture'); await fs.writeFile(orphan, '{');
        expect(await store.read(candidate.id)).toBeNull();
        expect(await fs.readFile(orphan, 'utf8')).toBe('{');
    });
    it('does not remove a foreign temporary file when exclusive creation fails', async () => {
        const { actor, candidate, store } = await fixture(); fault.point = 'collision';
        await expect(commitIntentSpecAcceptanceCandidate(actor, candidate, store, () => now)).rejects.toThrow('STORE_COMMIT_UNCONFIRMED');
        const directory = path.join(root, store.namespace);
        const files = await fs.readdir(directory);
        expect(files).toHaveLength(1); expect(files[0]).toMatch(/^\.pending-/);
        expect(await fs.readFile(path.join(directory, files[0]), 'utf8')).toBe('Foreign writer fixture');
        expect(await store.read(candidate.id)).toBeNull();
    });
    it('retains historical actor metadata when the same principal has a new role', async () => {
        const { actor, candidate, store } = await fixture();
        await commitIntentSpecAcceptanceCandidate(actor, candidate, store, () => now);
        const source = await verifier(); verifier.mockResolvedValue({ ...source, role: 'admin' });
        const nextActor = await resolveIntentSpecActor(new Request('http://localhost/local-contract'), now);
        const fresh = new FileIntentSpecAcceptanceStore(root, nextActor, () => now);
        expect(fresh.namespace).toBe(store.namespace);
        const saved = await fresh.read(candidate.id);
        expect(JSON.parse(new TextDecoder().decode(saved!)).actor.role).toBe('developer');
    });
    it('refuses corrupted published bytes and never repairs them by overwriting', async () => {
        const { actor, candidate, store } = await fixture();
        await commitIntentSpecAcceptanceCandidate(actor, candidate, store, () => now);
        const good = await store.read(candidate.id);
        const file = path.join(root, store.namespace, `${candidate.id}.json`);
        await fs.writeFile(file, 'Corrupt synthetic fixture');
        await expect(store.read(candidate.id)).rejects.toThrow('INVALID_STORED_SPEC_RECORD');
        await expect(store.createIfAbsent(candidate.id, good!)).rejects.toThrow();
        expect(await fs.readFile(file, 'utf8')).toBe('Corrupt synthetic fixture');
    });
    it('rejects relative/root directories and unsafe record IDs before filesystem mutation', async () => {
        const { actor, store } = await fixture();
        for (const unsafe of ['relative', path.parse(root).root, '\\\\host\\share\\folder']) {
            expect(() => new FileIntentSpecAcceptanceStore(unsafe, actor, () => now)).toThrow('EXPLICIT_PRIVATE_ROOT_REQUIRED');
        }
        await expect(store.read('../escape')).rejects.toThrow('INVALID_STORED_SPEC_RECORD');
        expect(await fs.readdir(root)).toEqual([]);
    });
    it('rejects root and actor-directory junctions/symlinks', async () => {
        const { actor, store, candidate } = await fixture();
        const target = path.join(root, 'target'); await fs.mkdir(target);
        const linkedRoot = path.join(root, 'linked-root'); await fs.symlink(target, linkedRoot, 'junction');
        await expect(new FileIntentSpecAcceptanceStore(linkedRoot, actor, () => now).read(candidate.id)).rejects.toThrow('UNSAFE_PRIVATE_ROOT');
        await fs.symlink(target, path.join(root, store.namespace), 'junction');
        await expect(store.read(candidate.id)).rejects.toThrow('UNSAFE_ACTOR_NAMESPACE');
        expect(await fs.readdir(target)).toEqual([]);
    });
    it('throws on non-file committed paths and read failures rather than returning missing', async () => {
        const { actor, candidate, store } = await fixture();
        await commitIntentSpecAcceptanceCandidate(actor, candidate, store, () => now);
        const file = path.join(root, store.namespace, `${candidate.id}.json`); await fs.unlink(file); await fs.mkdir(file);
        await expect(store.read(candidate.id)).rejects.toThrow('UNSAFE_SPEC_RECORD');
    });
});
