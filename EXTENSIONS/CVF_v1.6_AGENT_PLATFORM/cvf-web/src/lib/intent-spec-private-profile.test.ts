/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
    admitPrivateStoreProfile, hardenPrivate, isPrivateSecurity, measureSecurity, PRIVATE_PROFILE_ID, ProfileError,
} from './intent-spec-private-profile';
import { applyAdversary, makePrivateRoot, removeFixture, FIXTURE_PREFIX } from './intent-spec-security-fixture';

const roots: string[] = [];
afterEach(async () => {
    vi.unstubAllEnvs();
    for (const root of roots.splice(0)) await removeFixture(root);
});
const track = async (label: string) => { const root = await makePrivateRoot(label); roots.push(root); return root; };
const plain = async () => { const root = await fs.mkdtemp(path.join(os.tmpdir(), `${FIXTURE_PREFIX}plain-`)); roots.push(root); return root; };
const env = (root?: string, profile: string | null = PRIVATE_PROFILE_ID) => ({
    ...(profile ? { CVF_INTENT_SPEC_STORE_PROFILE: profile } : {}), ...(root ? { CVF_INTENT_SPEC_STORE_ROOT: root } : {}),
}) as NodeJS.ProcessEnv;
const code = async (promise: Promise<unknown>) => promise.then(() => 'RESOLVED', (error: ProfileError) => error.code);

describe.runIf(process.platform === 'win32')('WINDOWS_SINGLE_HOST_PRIVATE_V1 admission on synthetic roots', () => {
    it('is disabled without complete explicit configuration and never picks a default root', async () => {
        const root = await track('admit');
        expect(await code(admitPrivateStoreProfile(env()))).toBe('PROFILE_DISABLED');
        expect(await code(admitPrivateStoreProfile(env(root, null)))).toBe('PROFILE_DISABLED');
        expect(await code(admitPrivateStoreProfile(env(undefined)))).toBe('PROFILE_DISABLED');
        expect(await code(admitPrivateStoreProfile(env(root, 'OTHER')))).toBe('PROFILE_DISABLED');
    });
    it('admits only an existing absolute private root measured from real NTFS state', async () => {
        const root = await track('admit');
        const admitted = await admitPrivateStoreProfile(env(root));
        expect(admitted.profile).toBe(PRIVATE_PROFILE_ID);
        expect(admitted.root).toBe(path.resolve(root));
        const measured = await measureSecurity(root);
        expect(measured.tuple.ownerSid).toBe(measured.currentSid);
        expect(measured.tuple.protectionState).toBe('PROTECTED');
        expect(measured.tuple.inheritanceState).toBe('NO_INHERITED_ACES');
        expect(measured.tuple.aces.map(ace => ace.sid).sort()).toEqual([measured.currentSid, 'S-1-5-18'].sort());
        for (const ace of measured.tuple.aces) {
            expect(Object.keys(ace).sort()).toEqual(['accessType', 'inheritanceFlags', 'isInherited', 'propagationFlags', 'rights', 'sid']);
        }
    });
    it.each(['relative\\root', '\\\\server\\share\\root', 'C:\\', `${os.tmpdir()}\\${FIXTURE_PREFIX}does-not-exist-${Date.now()}`])(
        'refuses an invalid root: %s', async value => {
            expect(await code(admitPrivateStoreProfile(env(value)))).toBe('PROFILE_ROOT_INVALID');
        });
    it('refuses an ordinary inheriting root and every non-private mutation without changing it', async () => {
        const inheriting = await plain();
        expect(await code(admitPrivateStoreProfile(env(inheriting)))).toBe('PROFILE_ROOT_INSECURE');
        for (const kind of ['EXTRA_ALLOW', 'DENY', 'INHERITED'] as const) {
            const root = await track(kind.toLowerCase());
            await applyAdversary(root, kind);
            const before = await measureSecurity(root);
            expect(isPrivateSecurity(before)).toBe(false);
            expect(await code(admitPrivateStoreProfile(env(root)))).toBe('PROFILE_ROOT_INSECURE');
            expect((await measureSecurity(root)).tuple).toEqual(before.tuple);
        }
    });
    it('refuses a file or a link root', async () => {
        const root = await track('link');
        const file = path.join(root, 'file.txt'); await fs.writeFile(file, 'x');
        expect(await code(admitPrivateStoreProfile(env(file)))).toBe('PROFILE_ROOT_INVALID');
        const link = path.join(await plain(), 'junction');
        await fs.symlink(root, link, 'junction');
        expect(await code(admitPrivateStoreProfile(env(link)))).toBe('PROFILE_ROOT_INVALID');
    });
    it('reports unsupported platforms as unavailable instead of weakening the profile', async () => {
        const root = await track('platform');
        const original = Object.getOwnPropertyDescriptor(process, 'platform')!;
        Object.defineProperty(process, 'platform', { value: 'linux' });
        try { expect(await code(admitPrivateStoreProfile(env(root)))).toBe('PROFILE_UNSUPPORTED_PLATFORM'); }
        finally { Object.defineProperty(process, 'platform', original); }
    });
    it.each(['EXTRA_ALLOW', 'DENY', 'INHERITED'] as const)('hardening %s is private and its rollback restores the exact semantic pre-state', async kind => {
        const root = await track(kind.toLowerCase());
        const target = path.join(root, 'namespace'); await fs.mkdir(target);
        await applyAdversary(target, kind);
        const before = await measureSecurity(target);
        expect(isPrivateSecurity(before)).toBe(false);
        const rollback = await hardenPrivate(target);
        expect(isPrivateSecurity(await measureSecurity(target))).toBe(true);
        await rollback();
        expect((await measureSecurity(target)).tuple).toEqual(before.tuple);
    });
    it('exposes the host limitation for a WRONG_OWNER fixture instead of pretending it was exercised', async () => {
        const root = await track('owner');
        const target = path.join(root, 'namespace'); await fs.mkdir(target);
        const attempt = await applyAdversary(target, 'WRONG_OWNER').then(() => 'CREATED', (error: Error) => error.message);
        if (attempt === 'CREATED') {
            // A privileged host could build the fixture; then hardening must refuse and leave it unchanged.
            const before = await measureSecurity(target);
            await expect(hardenPrivate(target)).rejects.toThrow('PROFILE_ROOT_INSECURE');
            expect((await measureSecurity(target)).tuple).toEqual(before.tuple);
        } else expect(attempt).toContain('FIXTURE_SECURITY_FAILED');
    });
});
