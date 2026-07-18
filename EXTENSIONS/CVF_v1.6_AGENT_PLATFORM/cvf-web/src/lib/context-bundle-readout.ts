import { createHash } from 'node:crypto';
import type { GovernanceEvidenceReceipt } from '@/lib/ai';
import type { AifMemoryReinjectionReceipt } from '@/lib/aif-memory-reinjection';
import type { KnowledgeQueryResult } from '@/lib/knowledge-retrieval';
import type { RouteRequestContextReadout } from '@/lib/route-request-context-readout';
import type { DurableMemoryReceipt } from 'cvf-learning-plane-foundation';

export const CONTEXT_BUNDLE_READOUT_VERSION = 'cvf.mlw2.contextBundleReadout.rt1.v1';

export type ContextBundleCacheBoundary =
  | 'STATIC_ONLY'
  | 'PROFILE_CACHE_ALLOWED'
  | 'DYNAMIC_REBUILD_REQUIRED';

export interface ContextBundleSourceMapEntry {
  sourceType: 'knowledge_retrieval' | 'durable_memory_summary' | 'aif_memory_summary';
  evidencePointer: string;
  injected: boolean;
  collectionId?: string | null;
  chunkCount?: number;
  allowedCollectionIds?: string[];
  memoryIds?: string[];
}

export interface ContextBundleReadout {
  readoutVersion: typeof CONTEXT_BUNDLE_READOUT_VERSION;
  bundleId: string;
  sourceMap: ContextBundleSourceMapEntry[];
  retrievalTrace: {
    source: string;
    requestedCollectionId: string | null;
    allowedCollectionIds: string[];
    chunkCount: number;
    injected: boolean;
  };
  requestContext: {
    readoutVersion: string;
    readiness: string;
    profile: string;
    budgetTier: string;
    approxTokens: number;
    detectedSignals: readonly string[];
    missingSignals: readonly string[];
  };
  tokenBudgetDecision: {
    tier: string;
    approxTokens: number;
    withinAdvisoryBoundary: boolean;
  };
  cacheBoundary: ContextBundleCacheBoundary;
  bundleHash: string;
  rawContextReleased: false;
  canReinject: false;
  runtimeContextMutationAuthorized: false;
  boundaries: string[];
}

function sortStable(input: unknown): unknown {
  if (Array.isArray(input)) return input.map(sortStable);
  if (!input || typeof input !== 'object') return input;
  return Object.fromEntries(
    Object.entries(input as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => [key, sortStable(value)]),
  );
}

function stableJson(input: unknown): string {
  return JSON.stringify(sortStable(input));
}

function sha256(input: unknown): string {
  return createHash('sha256').update(stableJson(input), 'utf8').digest('hex');
}

function memoryIds(receipt?: DurableMemoryReceipt | AifMemoryReinjectionReceipt): string[] {
  if (!receipt || !Array.isArray(receipt.memoryIds)) return [];
  return receipt.memoryIds.filter((id): id is string => typeof id === 'string' && id.length > 0);
}

export function buildContextBundleReadout(input: {
  receipt: GovernanceEvidenceReceipt;
  requestContextReadout: RouteRequestContextReadout;
  retrievalResult: KnowledgeQueryResult;
  requestedKnowledgeCollectionId: string | null;
  knowledgeSource: string;
  knowledgeInjected: boolean;
  durableMemoryRead?: DurableMemoryReceipt;
  aifMemoryReinjection?: AifMemoryReinjectionReceipt;
}): ContextBundleReadout {
  const durableMemoryIds = memoryIds(input.durableMemoryRead);
  const aifMemoryIds = memoryIds(input.aifMemoryReinjection);
  const sourceMap: ContextBundleSourceMapEntry[] = [];

  if (input.knowledgeInjected || input.retrievalResult.allowedChunkCount > 0) {
    sourceMap.push({
      sourceType: 'knowledge_retrieval',
      evidencePointer: `receipt:${input.receipt.receiptId}:knowledge`,
      injected: input.knowledgeInjected,
      collectionId: input.requestedKnowledgeCollectionId,
      chunkCount: input.retrievalResult.allowedChunkCount,
      allowedCollectionIds: input.retrievalResult.allowedCollectionIds,
    });
  }

  if (durableMemoryIds.length > 0) {
    sourceMap.push({
      sourceType: 'durable_memory_summary',
      evidencePointer: `receipt:${input.receipt.receiptId}:durableMemoryRead`,
      injected: input.durableMemoryRead?.decision === 'allowed',
      memoryIds: durableMemoryIds,
    });
  }

  if (aifMemoryIds.length > 0) {
    sourceMap.push({
      sourceType: 'aif_memory_summary',
      evidencePointer: `receipt:${input.receipt.receiptId}:aifMemoryReinjection`,
      injected: input.aifMemoryReinjection?.injected === true,
      memoryIds: aifMemoryIds,
    });
  }

  const cacheBoundary: ContextBundleCacheBoundary =
    sourceMap.length > 0 ? 'DYNAMIC_REBUILD_REQUIRED' : 'STATIC_ONLY';
  const tokenBudgetDecision = {
    tier: input.requestContextReadout.budgetTier,
    approxTokens: input.requestContextReadout.approxTokens,
    withinAdvisoryBoundary: input.requestContextReadout.readiness !== 'needs_context_compaction',
  };
  const hashInput = {
    receiptId: input.receipt.receiptId,
    policySnapshotId: input.receipt.policySnapshotId,
    sourceMap,
    retrievalTrace: {
      source: input.knowledgeSource,
      requestedCollectionId: input.requestedKnowledgeCollectionId,
      allowedCollectionIds: input.retrievalResult.allowedCollectionIds,
      chunkCount: input.retrievalResult.allowedChunkCount,
      injected: input.knowledgeInjected,
    },
    requestContext: {
      readoutVersion: input.requestContextReadout.readoutVersion,
      readiness: input.requestContextReadout.readiness,
      profile: input.requestContextReadout.profile,
      budgetTier: input.requestContextReadout.budgetTier,
      approxTokens: input.requestContextReadout.approxTokens,
      detectedSignals: input.requestContextReadout.detectedSignals,
      missingSignals: input.requestContextReadout.missingSignals,
    },
    tokenBudgetDecision,
    cacheBoundary,
  };

  return {
    readoutVersion: CONTEXT_BUNDLE_READOUT_VERSION,
    bundleId: `mlw2-${input.receipt.receiptId}`,
    sourceMap,
    retrievalTrace: hashInput.retrievalTrace,
    requestContext: hashInput.requestContext,
    tokenBudgetDecision,
    cacheBoundary,
    bundleHash: sha256(hashInput),
    rawContextReleased: false,
    canReinject: false,
    runtimeContextMutationAuthorized: false,
    boundaries: [
      'source_map_metadata_only',
      'no_raw_retrieval_release',
      'no_raw_memory_release',
      'no_context_cache_claim',
      'no_autonomous_context_mutation',
    ],
  };
}
