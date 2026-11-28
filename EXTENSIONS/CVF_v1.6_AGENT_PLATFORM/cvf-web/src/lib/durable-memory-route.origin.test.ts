import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { createFileBackedDurableMemoryStore } from 'cvf-learning-plane-foundation/web-runtime';

import { evaluateDurableMemoryRoute, evaluateDurableMemoryWrite, resolveDurableMemoryPrincipal } from './durable-memory-route';

let tempDir: string | undefined;

afterEach(() => {
    if (tempDir) {
        rmSync(tempDir, { recursive: true, force: true });
        tempDir = undefined;
    }
});

function makeStorePath(): string {
    tempDir = mkdtempSync(join(tmpdir(), 'cvf-web-memory-origin-'));
    return join(tempDir, 'durable-memory.json');
}

describe('durable memory route origin isolation (ESC-002)', () => {
    it('binds Web writes to the server-resolved actor as origin principal', () => {
        const storePath = makeStorePath();
        const receipt = evaluateDurableMemoryWrite({
            request: { durableMemoryWrite: { enabled: true, policy: { actorAuthorized: true } } },
            actorId: 'user-a',
            originPrincipalId: 'user-a',
            actorRole: 'OPERATOR',
            output: 'User A prefers short weekly summaries.',
            storePath,
        });

        expect(receipt?.decision).toBe('allowed');
        const stored = createFileBackedDurableMemoryStore(storePath).list();
        expect(stored).toHaveLength(1);
        expect(stored[0].originPrincipalId).toBe('user-a');
    });

    it('does not surface another user\'s records when a client supplies their scope', () => {
        const storePath = makeStorePath();
        evaluateDurableMemoryWrite({
            request: { durableMemoryWrite: { enabled: true, policy: { actorAuthorized: true } } },
            actorId: 'user-a',
            originPrincipalId: 'user-a',
            actorRole: 'OPERATOR',
            output: 'User A private weekly summary preference.',
            storePath,
        });

        const spoofed = evaluateDurableMemoryRoute({
            request: { durableMemory: { enabled: true, scope: 'user:user-a', query: 'weekly', policy: { actorAuthorized: true } } },
            actorId: 'user-b',
            originPrincipalId: 'user-b',
            actorRole: 'OPERATOR',
            defaultQuery: 'weekly',
            storePath,
        });
        expect(spoofed.injected).toBe(false);
        expect(spoofed.records).toEqual([]);
        expect(spoofed.promptBlock).toBeUndefined();
        expect(JSON.stringify(spoofed.receipt)).not.toContain('s1-');

        const owner = evaluateDurableMemoryRoute({
            request: { durableMemory: { enabled: true, query: 'weekly', policy: { actorAuthorized: true } } },
            actorId: 'user-a',
            originPrincipalId: 'user-a',
            actorRole: 'OPERATOR',
            defaultQuery: 'weekly',
            storePath,
        });
        expect(owner.injected).toBe(true);
        expect(owner.records).toHaveLength(1);
    });

    it('excludes origin-less legacy records on the Web read path', () => {
        const storePath = makeStorePath();
        createFileBackedDurableMemoryStore(storePath).write({
            id: 'legacy-record',
            tier: 'skill',
            scope: 'user:user-a',
            actorId: 'user-a',
            actorRole: 'OPERATOR',
            summary: 'Legacy weekly note without origin.',
            policyDecision: 'allow',
            actorAuthorized: true,
        });

        const read = evaluateDurableMemoryRoute({
            request: { durableMemory: { enabled: true, query: 'weekly', policy: { actorAuthorized: true } } },
            actorId: 'user-a',
            originPrincipalId: 'user-a',
            actorRole: 'OPERATOR',
            defaultQuery: 'weekly',
            storePath,
        });
        expect(read.records).toEqual([]);
        expect(read.receipt?.excluded.map((entry) => entry.id)).not.toContain('legacy-record');
    });

    it('resolves one principal for service and session callers on both routes', () => {
        expect(resolveDurableMemoryPrincipal({ isServiceAllowed: true, serviceIdentity: 'service:abc', sessionUserId: 'user-a' })).toBe('service:abc');
        expect(resolveDurableMemoryPrincipal({ isServiceAllowed: false, serviceIdentity: 'service:abc', sessionUserId: 'user-a' })).toBe('user-a');
        expect(resolveDurableMemoryPrincipal({ isServiceAllowed: false, serviceIdentity: null, sessionUserId: undefined })).toBeUndefined();
    });

    it('denies Web reads and writes without a resolved principal', () => {
        const storePath = makeStorePath();
        const write = evaluateDurableMemoryWrite({
            request: { durableMemoryWrite: { enabled: true, policy: { actorAuthorized: true } } },
            actorId: 'unknown-actor',
            originPrincipalId: undefined,
            actorRole: 'OPERATOR',
            output: 'No principal.',
            storePath,
        });
        expect(write?.decision).toBe('denied');
        expect(write?.reason).toBe('durable_memory_origin_principal_required');
        const read = evaluateDurableMemoryRoute({
            request: { durableMemory: { enabled: true, policy: { actorAuthorized: true } } },
            actorId: 'unknown-actor',
            originPrincipalId: undefined,
            actorRole: 'OPERATOR',
            defaultQuery: 'weekly',
            storePath,
        });
        expect(read.injected).toBe(false);
        expect(read.receipt?.reason).toBe('durable_memory_origin_principal_required');
    });
});
