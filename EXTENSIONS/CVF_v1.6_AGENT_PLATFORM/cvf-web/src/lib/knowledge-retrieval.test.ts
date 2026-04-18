import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { appendKnowledgeCollectionScopeEvent } from '@/lib/policy-events';

import {
  formatKnowledgeChunks,
  listKnowledgeCollections,
  queryKnowledgeChunks,
} from './knowledge-retrieval';

describe('knowledge-retrieval', () => {
  const originalPath = process.env.CVF_CONTROL_PLANE_EVENTS_PATH;
  let tempDir = '';

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-knowledge-retrieval-'));
    process.env.CVF_CONTROL_PLANE_EVENTS_PATH = path.join(tempDir, 'events.json');
  });

  afterEach(async () => {
    if (originalPath) {
      process.env.CVF_CONTROL_PLANE_EVENTS_PATH = originalPath;
    } else {
      delete process.env.CVF_CONTROL_PLANE_EVENTS_PATH;
    }
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('returns only tenant-matching chunks for org_a/team_a', async () => {
    const result = await queryKnowledgeChunks({
      intent: 'Need tenant-a partition alpha-scope guidance',
      orgId: 'org_a',
      teamId: 'team_a',
    });

    expect(result.allowedChunkCount).toBe(1);
    expect(result.chunks[0].content).toContain('TENANT-A-SIGNAL');
    expect(result.droppedChunkCount).toBe(0);
  });

  it('drops cross-tenant chunks and reports filtering stats', async () => {
    const result = await queryKnowledgeChunks({
      intent: 'Need tenant-a tenant-b partition guidance',
      orgId: 'org_a',
      teamId: 'team_a',
    });

    expect(result.allowedCollectionIds).toContain('tenant-org-a-private');
    expect(result.droppedCollectionIds).toContain('tenant-org-b-private');
    expect(result.droppedChunkCount).toBeGreaterThan(0);
    expect(result.chunks.some(chunk => chunk.content.includes('SHADOW-BETA'))).toBe(false);
  });

  it('applies latest admin scope overrides when listing collections', async () => {
    await appendKnowledgeCollectionScopeEvent({
      collectionId: 'cvf-engineering-runbooks',
      orgId: 'org_cvf',
      teamId: 'team_exec',
      setBy: 'usr_1',
      setAt: '2026-04-18T10:00:00.000Z',
    });

    const collections = await listKnowledgeCollections();
    const target = collections.find(collection => collection.id === 'cvf-engineering-runbooks');

    expect(target?.orgId).toBe('org_cvf');
    expect(target?.teamId).toBe('team_exec');
  });

  it('formats retrieved chunks into a governed knowledge block payload', () => {
    const formatted = formatKnowledgeChunks([
      {
        id: 'chunk-1',
        collectionId: 'collection-1',
        collectionName: 'Collection 1',
        content: 'Governed evidence goes here.',
        keywords: ['governed'],
      },
    ]);

    expect(formatted).toContain('Collection 1');
    expect(formatted).toContain('Governed evidence goes here.');
  });
});
