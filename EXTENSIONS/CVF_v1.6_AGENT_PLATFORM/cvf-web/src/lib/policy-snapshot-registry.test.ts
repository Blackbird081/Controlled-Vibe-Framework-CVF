/**
 * Focused tests for policy-snapshot-registry.ts
 *
 * Tests verify buildPolicySnapshot, persistPolicySnapshot, readPolicySnapshot,
 * and generatePolicySnapshotId without any provider calls.
 *
 * CVF_POLICY_SNAPSHOT_REGISTRY_VERSION: 2026-06-05
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import os from 'node:os';
import { mkdir, rm } from 'node:fs/promises';
import {
    buildPolicySnapshot,
    persistPolicySnapshot,
    readPolicySnapshot,
    generatePolicySnapshotId,
    getSnapshotDir,
} from './policy-snapshot-registry';

async function makeTmpDir(): Promise<string> {
    const dir = path.join(os.tmpdir(), `cvf-test-snapshots-${Date.now()}`);
    await mkdir(dir, { recursive: true });
    return dir;
}

describe('policy-snapshot-registry', () => {
    let tmpDir: string;
    let originalEnv: string | undefined;

    beforeEach(async () => {
        tmpDir = await makeTmpDir();
        originalEnv = process.env.CVF_POLICY_SNAPSHOT_DIR;
        process.env.CVF_POLICY_SNAPSHOT_DIR = tmpDir;
    });

    afterEach(async () => {
        if (originalEnv === undefined) {
            delete process.env.CVF_POLICY_SNAPSHOT_DIR;
        } else {
            process.env.CVF_POLICY_SNAPSHOT_DIR = originalEnv;
        }
        try { await rm(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
    });

    describe('getSnapshotDir', () => {
        it('returns CVF_POLICY_SNAPSHOT_DIR when set', () => {
            expect(getSnapshotDir()).toBe(tmpDir);
        });
    });

    describe('buildPolicySnapshot', () => {
        it('builds a bounded local snapshot record with required fields', () => {
            const id = 'pol-20260605-0001';
            const record = buildPolicySnapshot({ id });
            expect(record.id).toBe(id);
            expect(record.evidenceClass).toBe('BOUNDED_LOCAL');
            expect(record.bounded).toBe(true);
            expect(typeof record.createdAt).toBe('string');
            expect(typeof record.policyDate).toBe('string');
            expect(record.policyDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });

        it('uses provided createdAt when given', () => {
            const createdAt = '2026-06-05T00:00:00.000Z';
            const record = buildPolicySnapshot({ id: 'pol-20260605-0001', createdAt });
            expect(record.createdAt).toBe(createdAt);
            expect(record.policyDate).toBe('2026-06-05');
        });

        it('does not include raw prompts, raw outputs, or secrets in fields', () => {
            const record = buildPolicySnapshot({ id: 'pol-20260605-0001' });
            const recordStr = JSON.stringify(record);
            expect(recordStr).not.toContain('rawPrompt');
            expect(recordStr).not.toContain('rawOutput');
            expect(recordStr).not.toContain('apiKey');
            expect(recordStr).not.toContain('sk-');
        });
    });

    describe('persistPolicySnapshot + readPolicySnapshot', () => {
        it('persists a snapshot and reads it back by id', async () => {
            const record = buildPolicySnapshot({ id: 'pol-20260605-0042' });
            await persistPolicySnapshot(record);
            const read = await readPolicySnapshot('pol-20260605-0042');
            expect(read).not.toBeNull();
            expect(read?.id).toBe('pol-20260605-0042');
            expect(read?.evidenceClass).toBe('BOUNDED_LOCAL');
            expect(read?.bounded).toBe(true);
        });

        it('returns null for a non-existent snapshot id', async () => {
            const result = await readPolicySnapshot('pol-99999999-9999');
            expect(result).toBeNull();
        });

        it('persisted record is secret-safe (no raw content)', async () => {
            const record = buildPolicySnapshot({ id: 'pol-20260605-0099' });
            await persistPolicySnapshot(record);
            const read = await readPolicySnapshot('pol-20260605-0099');
            const readStr = JSON.stringify(read);
            expect(readStr).not.toContain('rawPrompt');
            expect(readStr).not.toContain('rawOutput');
            expect(readStr).not.toContain('sk-');
        });
    });

    describe('generatePolicySnapshotId', () => {
        it('returns a string matching pol-YYYYMMDD-NNNN', () => {
            const id = generatePolicySnapshotId();
            expect(id).toMatch(/^pol-\d{8}-\d{4}$/);
        });

        it('returns unique ids on successive calls', () => {
            const a = generatePolicySnapshotId();
            const b = generatePolicySnapshotId();
            expect(a).not.toBe(b);
        });

        it('eventually persists a snapshot record for the generated id', async () => {
            const id = generatePolicySnapshotId();
            await new Promise(r => setTimeout(r, 50));
            const record = await readPolicySnapshot(id);
            expect(record).not.toBeNull();
            expect(record?.id).toBe(id);
            expect(record?.bounded).toBe(true);
        });
    });
});
