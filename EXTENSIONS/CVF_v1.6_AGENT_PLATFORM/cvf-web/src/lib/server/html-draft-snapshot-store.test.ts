// Text Encoding Exception: Vietnamese fixture bytes verify exact UTF-8 persistence.
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { HtmlDraftSnapshotStore } from './html-draft-snapshot-store';
import type { DraftInput } from '../html-draft-recovery-contract';

const now = Date.parse('2026-10-18T00:00:00.000Z');
const input: DraftInput = {
  versionId: '123e4567-e89b-42d3-a456-426614174001', sourceRecordId: 'evt_1',
  request: { title: 'x', sourcePath: 'a', sourceContent: 'b', memoryClass: 'FULL_RECORD', status: 'DRAFT', claimBoundary: 'unaccepted', receiptAnchor: 'r' },
  html: '<p>é\r\n</p>', filename: 'x.html', generatedAt: new Date(now).toISOString(), buildNumber: 1,
};
const owner = { userId: 'u1', orgId: 'o1', teamId: 't1' };
describe('synthetic snapshot files', () => {
  it('writes exact bytes, refuses collision and joins principal and record', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'cvf-draft-synthetic-'));
    const store = new HtmlDraftSnapshotStore({ kind: 'local-synthetic', root, production: false }, () => now);
    expect((await Promise.all([store.save(input, owner), store.save(input, owner)])).sort()).toEqual(['COLLISION', 'SAVED']);
    expect((await store.get(input.versionId, input.sourceRecordId, owner))?.html).toBe(input.html);
    expect(await store.get(input.versionId, 'evt_2', owner)).toBeNull();
    expect(await store.get(input.versionId, input.sourceRecordId, { ...owner, teamId: 't2' })).toBeNull();
    expect(await store.list(input.sourceRecordId, owner)).toHaveLength(1);
    const namespace = (await fs.readdir(root))[0];
    const file = path.join(root, namespace, `${input.versionId}.json`);
    const valid = JSON.parse(await fs.readFile(file, 'utf8'));
    await fs.writeFile(file, JSON.stringify({ ...valid, html: '<p>changed</p>' }));
    expect(await store.get(input.versionId, input.sourceRecordId, owner)).toBeNull();
    await fs.writeFile(file, '{partial');
    expect(await store.get(input.versionId, input.sourceRecordId, owner)).toBeNull();
    expect(await store.save(input, owner)).toBe('COLLISION');
  });
  it('rejects expired and unconfigured roots without deletion or fallback', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'cvf-draft-expiry-'));
    const store = new HtmlDraftSnapshotStore({ kind: 'local-synthetic', root, production: false }, () => now);
    expect(await store.save(input, owner)).toBe('SAVED');
    const expired = new HtmlDraftSnapshotStore({ kind: 'local-synthetic', root, production: false }, () => now + 86_400_000);
    expect(await expired.get(input.versionId, input.sourceRecordId, owner)).toBeNull();
    expect(() => new HtmlDraftSnapshotStore({ kind: 'local-synthetic', root: '.', production: false })).toThrow();
  });
});
