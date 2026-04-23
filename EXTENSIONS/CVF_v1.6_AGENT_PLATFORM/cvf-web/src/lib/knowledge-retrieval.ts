import { getKnowledgeCollectionScopes } from '@/lib/policy-reader';
import { knowledgeStore } from '@/lib/knowledge-store';
import { KNOWLEDGE_COLLECTIONS } from '@/lib/knowledge-seed';

export type { KnowledgeChunk, KnowledgeCollectionDefinition } from '@/lib/knowledge-store';
import type { KnowledgeChunk, KnowledgeCollectionDefinition } from '@/lib/knowledge-store';

export interface EffectiveKnowledgeCollection extends KnowledgeCollectionDefinition {
  chunkCount: number;
}

export interface KnowledgeQueryResult {
  chunks: Array<KnowledgeChunk & { collectionId: string; collectionName: string; score: number }>;
  matchedChunkCount: number;
  allowedChunkCount: number;
  droppedChunkCount: number;
  allowedCollectionIds: string[];
  droppedCollectionIds: string[];
}

const _storeAutoSeeds = process.env.NODE_ENV !== 'test';
let _storeSeeded = false;
function ensureStoreSeeded(): void {
  if (_storeAutoSeeds) return;
  if (_storeSeeded) return;
  _storeSeeded = true;
  knowledgeStore.seed(KNOWLEDGE_COLLECTIONS);
}

export const getRegisteredCollectionIds = (): string[] => knowledgeStore.getEphemeralCollectionIds();

function tokenize(input: string): string[] {
  return [...new Set(
    input
      .toLowerCase()
      .match(/[a-z0-9_-]{3,}/g)
      ?.filter(token => token.length >= 3) ?? [],
  )];
}

function scoreChunk(queryTokens: string[], chunk: KnowledgeChunk, collection: KnowledgeCollectionDefinition): number {
  const haystack = [
    collection.name,
    collection.description,
    chunk.content,
    chunk.keywords.join(' '),
  ].join(' ').toLowerCase();

  return queryTokens.reduce((score, token) => (
    haystack.includes(token) ? score + 1 : score
  ), 0);
}

function scopeAllowsCollection(
  collection: KnowledgeCollectionDefinition,
  scope?: { orgId?: string; teamId?: string },
): boolean {
  const orgAllowed = collection.orgId === null || collection.orgId === scope?.orgId;
  const teamAllowed = collection.teamId === null || collection.teamId === scope?.teamId;
  return orgAllowed && teamAllowed;
}

async function getEffectiveCollections(): Promise<KnowledgeCollectionDefinition[]> {
  const scopeOverrides = await getKnowledgeCollectionScopes();

  ensureStoreSeeded();
  const allCollections = knowledgeStore.getCollections();

  return allCollections.map(collection => {
    const override = scopeOverrides.get(collection.id);
    if (!override) return collection;

    return {
      ...collection,
      orgId: override.orgId,
      teamId: override.teamId,
    };
  });
}

export async function listKnowledgeCollections(): Promise<EffectiveKnowledgeCollection[]> {
  const collections = await getEffectiveCollections();

  return collections.map(collection => ({
    ...collection,
    chunkCount: collection.chunks.length,
  }));
}

export async function queryKnowledgeChunks(input: {
  intent: string;
  orgId?: string;
  teamId?: string;
  limit?: number;
  collectionId?: string;
}): Promise<KnowledgeQueryResult> {
  const queryTokens = tokenize(input.intent);
  if (queryTokens.length === 0) {
    return {
      chunks: [],
      matchedChunkCount: 0,
      allowedChunkCount: 0,
      droppedChunkCount: 0,
      allowedCollectionIds: [],
      droppedCollectionIds: [],
    };
  }

  const allEffective = await getEffectiveCollections();
  const collections = input.collectionId
    ? allEffective.filter(c => c.id === input.collectionId)
    : allEffective;
  const scored = collections.flatMap(collection => (
    collection.chunks
      .map(chunk => ({
        ...chunk,
        collectionId: collection.id,
        collectionName: collection.name,
        orgId: collection.orgId,
        teamId: collection.teamId,
        score: scoreChunk(queryTokens, chunk, collection),
      }))
      .filter(chunk => chunk.score >= 2)
  ));

  const allowed = scored
    .filter(chunk => scopeAllowsCollection({
      id: chunk.collectionId,
      name: chunk.collectionName,
      description: '',
      orgId: chunk.orgId,
      teamId: chunk.teamId,
      chunks: [],
    }, input))
    .sort((left, right) => right.score - left.score)
    .slice(0, input.limit ?? 4)
    .map(({ id, content, keywords, collectionId, collectionName, score }) => ({ id, content, keywords, collectionId, collectionName, score }));

  const dropped = scored.filter(chunk => !scopeAllowsCollection({
    id: chunk.collectionId,
    name: chunk.collectionName,
    description: '',
    orgId: chunk.orgId,
    teamId: chunk.teamId,
    chunks: [],
  }, input));

  return {
    chunks: allowed,
    matchedChunkCount: scored.length,
    allowedChunkCount: allowed.length,
    droppedChunkCount: dropped.length,
    allowedCollectionIds: [...new Set(allowed.map(chunk => chunk.collectionId))],
    droppedCollectionIds: [...new Set(dropped.map(chunk => chunk.collectionId))],
  };
}

export function formatKnowledgeChunks(
  chunks: Array<KnowledgeChunk & { collectionId: string; collectionName: string; score?: number }>,
): string | null {
  if (chunks.length === 0) return null;

  return chunks.map(chunk => (
    `### ${chunk.collectionName}\n- Collection: ${chunk.collectionId}\n- Evidence: ${chunk.content}`
  )).join('\n\n');
}
