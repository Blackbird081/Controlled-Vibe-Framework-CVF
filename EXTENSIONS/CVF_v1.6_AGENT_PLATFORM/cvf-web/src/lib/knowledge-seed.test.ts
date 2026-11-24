import { describe, expect, it } from 'vitest';
import { DeterministicClock, SequentialIdFactory } from 'cvf-refinery';
import { KNOWLEDGE_COLLECTIONS, resolveSystemSeedSot3Source } from './knowledge-seed';
import { evaluateSot3KnowledgeActivation, type Sot3KnowledgeChunkInput } from './sot3-knowledge-adapter';

const base = (chunks: Sot3KnowledgeChunkInput[], organization = 'org_a', team: string | null = 'team_a') => ({
  chunks, organization, team, actorId: 'usr_a', requestId: 'req-seed', policyVersion: 'v1', ruleVersion: 'v1',
  clock: new DeterministicClock('2026-11-14T00:00:00.000Z', 1000), ids: new SequentialIdFactory(),
});

const seedChunks = KNOWLEDGE_COLLECTIONS.flatMap((collection) => collection.chunks.map((chunk) => ({ collection, chunk })));

describe('built-in seed provenance (SOT3 system seed)', () => {
  it('declares system provenance on every built-in seed chunk, never an exemption', () => {
    expect(seedChunks.length).toBeGreaterThan(0);
    for (const { chunk } of seedChunks) {
      expect(chunk.sot3Source).toMatchObject({
        sourceId: `system-seed:${chunk.id}`, sourceType: 'POLICY', owner: 'cvf-platform-seed', captureStatus: 'CAPTURED',
      });
      expect(chunk.sot3Source?.expectedContentHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    }
  });

  it.each(seedChunks.map(({ collection, chunk }) => [chunk.id, collection.id] as const))(
    'approves seed chunk %s through the full Refinery, Kernel and Flow lifecycle (ENFORCE)', (chunkId, collectionId) => {
      const collection = KNOWLEDGE_COLLECTIONS.find((item) => item.id === collectionId)!;
      const chunk = collection.chunks.find((item) => item.id === chunkId)!;
      const result = evaluateSot3KnowledgeActivation(
        base([{ id: chunk.id, content: chunk.content, collectionId, sot3Source: chunk.sot3Source }]), 'ENFORCE');
      expect(result.terminalOutcome).toBe('APPROVED');
      expect(result.failureStage).toBeNull();
      expect(result.traces[0].sourceId).toBe(`system-seed:${chunk.id}`);
    });

  it('resolves the declaration from the code-owned seed by collection and chunk id only', () => {
    expect(resolveSystemSeedSot3Source('cvf-global-governance', 'global-guardrails-001')?.sourceId).toBe('system-seed:global-guardrails-001');
    expect(resolveSystemSeedSot3Source('cvf-global-governance', 'someone-elses-chunk')).toBeUndefined();
    expect(resolveSystemSeedSot3Source('user-collection', 'global-guardrails-001')).toBeUndefined();
  });

  it('does not vouch for edited content that reuses a seed id: the content hash fails and Refinery rejects', () => {
    const seed = KNOWLEDGE_COLLECTIONS[0].chunks[0];
    const result = evaluateSot3KnowledgeActivation(
      base([{ id: seed.id, content: `${seed.content} (edited)`, collectionId: KNOWLEDGE_COLLECTIONS[0].id, sot3Source: resolveSystemSeedSot3Source(KNOWLEDGE_COLLECTIONS[0].id, seed.id) }]), 'ENFORCE');
    expect(result.terminalOutcome).toBe('REJECTED');
    expect(result.failureStage).toBe('REFINERY_NOT_READY');
  });

  it('keeps provenance mandatory for user and project knowledge without a declaration', () => {
    const result = evaluateSot3KnowledgeActivation(base([{ id: 'user-chunk', content: 'user content', collectionId: 'user-col', sot3Source: resolveSystemSeedSot3Source('user-col', 'user-chunk') }]), 'ENFORCE');
    expect(result.terminalOutcome).toBe('REJECTED');
    expect(result.failureStage).toBe('MISSING_PROVENANCE');
  });
});
