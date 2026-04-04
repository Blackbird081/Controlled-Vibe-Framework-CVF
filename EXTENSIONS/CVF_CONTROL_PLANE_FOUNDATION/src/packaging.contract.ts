import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import { ContextFreezer } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/context.freezer";

// ─── Types ────────────────────────────────────────────────────────────

export interface PackagingChunk {
  id: string;
  source: string;
  content: string;
  relevanceScore: number;
  metadata?: Record<string, unknown>;
}

export interface PackagingRequest {
  chunks: PackagingChunk[];
  tokenBudget: number;
  executionId?: string;
}

export interface FreezeReceipt {
  executionId: string;
  frozenContextHash: string;
}

export interface PackagingResultSurface {
  chunks: PackagingChunk[];
  totalTokens: number;
  tokenBudget: number;
  truncated: boolean;
  snapshotHash: string;
  freeze?: FreezeReceipt;
}

export interface PackagingContractDependencies {
  context?: ContextFreezer;
}

// ─── Packaging Contract ──────────────────────────────────────────────

export class PackagingContract {
  private readonly context: ContextFreezer;

  constructor(dependencies: PackagingContractDependencies = {}) {
    this.context = dependencies.context ?? new ContextFreezer();
  }

  getContext(): ContextFreezer {
    return this.context;
  }

  package(request: PackagingRequest): PackagingResultSurface {
    let totalTokens = 0;
    const selectedChunks: PackagingChunk[] = [];

    for (const chunk of request.chunks) {
      const chunkTokens = estimateTokenCount(chunk.content);
      if (totalTokens + chunkTokens <= request.tokenBudget) {
        selectedChunks.push(chunk);
        totalTokens += chunkTokens;
      }
    }

    const snapshotHash = computeDeterministicHash(
      "control-plane-intake-context",
      `budget:${request.tokenBudget}`,
      `tokens:${totalTokens}:selected:${selectedChunks.length}:truncated:${selectedChunks.length < request.chunks.length}`,
      serializeChunks(selectedChunks),
    );

    let freeze: FreezeReceipt | undefined;
    if (
      typeof request.executionId === "string" &&
      request.executionId.length > 0
    ) {
      const fileHashes: Record<string, string> = {};
      for (const chunk of selectedChunks) {
        fileHashes[chunk.id] = computeDeterministicHash(
          "packaging-chunk",
          chunk.id,
          chunk.content,
          chunk.source,
        );
      }

      const frozenContextHash = this.context.freeze(
        request.executionId,
        fileHashes,
        snapshotHash,
      );

      freeze = {
        executionId: request.executionId,
        frozenContextHash,
      };
    }

    return {
      chunks: selectedChunks,
      totalTokens,
      tokenBudget: request.tokenBudget,
      truncated: selectedChunks.length < request.chunks.length,
      snapshotHash,
      freeze,
    };
  }
}

// ─── Factory ─────────────────────────────────────────────────────────

export function createPackagingContract(
  dependencies?: PackagingContractDependencies,
): PackagingContract {
  return new PackagingContract(dependencies);
}

// ─── Shared Helpers (extracted from intake.contract.ts) ──────────────

export function estimateTokenCount(content: string): number {
  return Math.ceil(content.length / 4);
}

export function serializeChunks(chunks: PackagingChunk[]): string {
  if (chunks.length === 0) {
    return "empty";
  }

  return chunks
    .map((chunk) =>
      JSON.stringify({
        id: chunk.id,
        source: chunk.source,
        content: chunk.content,
        relevanceScore: chunk.relevanceScore,
        metadata: sortValue(chunk.metadata ?? {}),
      }),
    )
    .join("|");
}

export function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sortValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nestedValue]) => [key, sortValue(nestedValue)]),
    );
  }

  return value;
}
