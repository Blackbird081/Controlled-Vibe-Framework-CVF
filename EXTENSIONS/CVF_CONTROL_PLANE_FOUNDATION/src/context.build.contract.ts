import type { KnowledgeItem } from "./knowledge.query.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type ContextSegmentType = "QUERY" | "KNOWLEDGE" | "METADATA" | "SYSTEM";

export interface ContextSegment {
  segmentId: string;
  segmentType: ContextSegmentType;
  content: string;
  tokenEstimate: number;
  source?: string;
}

export interface ContextBuildRequest {
  query: string;
  contextId: string;
  knowledgeItems?: KnowledgeItem[];
  metadata?: Record<string, string>;
  maxTokens?: number; // total token cap; 0 or undefined = no cap
}

export interface ContextPackage {
  packageId: string;
  builtAt: string;
  contextId: string;
  query: string;
  segments: ContextSegment[];
  totalSegments: number;
  estimatedTokens: number;
  packageHash: string;
}

export interface ContextBuildContractDependencies {
  now?: () => string;
  estimateTokens?: (content: string) => number;
}

// --- Token estimation ---

function defaultEstimateTokens(content: string): number {
  // Simple approximation: ~4 characters per token
  return Math.ceil(content.length / 4);
}

// --- Contract ---

export class ContextBuildContract {
  private readonly now: () => string;
  private readonly estimateTokens: (content: string) => number;

  constructor(dependencies: ContextBuildContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.estimateTokens = dependencies.estimateTokens ?? defaultEstimateTokens;
  }

  build(request: ContextBuildRequest): ContextPackage {
    const builtAt = this.now();
    const maxTokens = request.maxTokens && request.maxTokens > 0 ? request.maxTokens : Infinity;
    const segments: ContextSegment[] = [];
    let accumulatedTokens = 0;

    // 1. QUERY segment (always first)
    const queryTokens = this.estimateTokens(request.query);
    const querySegmentId = computeDeterministicHash(
      "w1-t11-cp1-seg-query",
      request.contextId,
      request.query,
    );
    segments.push({
      segmentId: querySegmentId,
      segmentType: "QUERY",
      content: request.query,
      tokenEstimate: queryTokens,
    });
    accumulatedTokens += queryTokens;

    // 2. KNOWLEDGE segments
    if (request.knowledgeItems) {
      for (const item of request.knowledgeItems) {
        if (accumulatedTokens >= maxTokens) break;
        const content = `${item.title}: ${item.content}`;
        const tokens = this.estimateTokens(content);
        if (accumulatedTokens + tokens > maxTokens) break;
        const segId = computeDeterministicHash(
          "w1-t11-cp1-seg-knowledge",
          request.contextId,
          item.itemId,
        );
        segments.push({
          segmentId: segId,
          segmentType: "KNOWLEDGE",
          content,
          tokenEstimate: tokens,
          source: item.source,
        });
        accumulatedTokens += tokens;
      }
    }

    // 3. METADATA segments
    if (request.metadata) {
      for (const [key, value] of Object.entries(request.metadata)) {
        if (accumulatedTokens >= maxTokens) break;
        const content = `${key}: ${value}`;
        const tokens = this.estimateTokens(content);
        if (accumulatedTokens + tokens > maxTokens) break;
        const segId = computeDeterministicHash(
          "w1-t11-cp1-seg-metadata",
          request.contextId,
          key,
        );
        segments.push({
          segmentId: segId,
          segmentType: "METADATA",
          content,
          tokenEstimate: tokens,
        });
        accumulatedTokens += tokens;
      }
    }

    const estimatedTokens = segments.reduce((sum, s) => sum + s.tokenEstimate, 0);

    const packageHash = computeDeterministicHash(
      "w1-t11-cp1-context-package",
      `${builtAt}:${request.contextId}`,
      `segments:${segments.length}:tokens:${estimatedTokens}`,
      `query:${request.query}`,
    );

    const packageId = computeDeterministicHash(
      "w1-t11-cp1-package-id",
      packageHash,
      builtAt,
    );

    return {
      packageId,
      builtAt,
      contextId: request.contextId,
      query: request.query,
      segments,
      totalSegments: segments.length,
      estimatedTokens,
      packageHash,
    };
  }
}

export function createContextBuildContract(
  dependencies?: ContextBuildContractDependencies,
): ContextBuildContract {
  return new ContextBuildContract(dependencies);
}
