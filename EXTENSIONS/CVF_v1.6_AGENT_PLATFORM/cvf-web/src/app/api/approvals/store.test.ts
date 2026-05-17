import { describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, readFile } from 'node:fs/promises';

import { FileBackedApprovalStore } from './store';

describe('FileBackedApprovalStore', () => {
    it('persists approval records to disk and reloads them', async () => {
        const tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-approval-store-'));
        const storePath = path.join(tempDir, 'approvals.json');

        const store = new FileBackedApprovalStore(storePath);
        store.set('apr-persist-1', {
            id: 'apr-persist-1',
            templateId: 'tpl-1',
            templateName: 'Template One',
            intent: 'deploy',
            reason: 'persist me',
            expiresAt: new Date(Date.now() + 60_000).toISOString(),
            status: 'pending',
            submittedAt: new Date().toISOString(),
            requestHash: 'hash-1',
            requestSnapshot: {
                templateId: 'tpl-1',
                templateName: 'Template One',
                intent: 'deploy',
            },
        });

        const raw = JSON.parse(await readFile(storePath, 'utf8')) as Array<{ id: string }>;
        expect(raw).toHaveLength(1);
        expect(raw[0].id).toBe('apr-persist-1');

        const reloadedStore = new FileBackedApprovalStore(storePath);
        expect(reloadedStore.get('apr-persist-1')).toMatchObject({
            templateId: 'tpl-1',
            requestHash: 'hash-1',
        });
    });
});
