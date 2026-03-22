import type {
  RAGDocument,
  RetrievalTier,
} from "../../CVF_ECO_v1.4_RAG_PIPELINE/src/types";
import { RAGPipeline } from "../../CVF_ECO_v1.4_RAG_PIPELINE/src/rag.pipeline";

// ─── Types ────────────────────────────────────────────────────────────

export interface RetrievalChunk {
  id: string;
  source: string;
  content: string;
  relevanceScore: number;
  metadata?: Record<string, unknown>;
}

export interface RetrievalRequestOptions {
  maxChunks?: number;
  minRelevance?: number;
  sources?: string[];
  filters?: Record<string, unknown>;
}

export interface RetrievalRequest {
  query: string;
  options?: RetrievalRequestOptions;
}

export interface RetrievalResultSurface {
  query: string;
  chunkCount: number;
  totalCandidates: number;
  retrievalTimeMs: number;
  tiersSearched: RetrievalTier[];
  chunks: RetrievalChunk[];
}

export interface RetrievalContractDependencies {
  knowledge?: RAGPipeline;
}

// ─── Unified Retrieval Contract ───────────────────────────────────────

export class RetrievalContract {
  private readonly knowledge: RAGPipeline;

  constructor(dependencies: RetrievalContractDependencies = {}) {
    this.knowledge = dependencies.knowledge ?? new RAGPipeline();
  }

  getKnowledge(): RAGPipeline {
    return this.knowledge;
  }

  retrieve(request: RetrievalRequest): RetrievalResultSurface {
    const options = request.options;
    const ragResult = this.knowledge.query({
      query: request.query,
      maxResults: options?.maxChunks ?? 10,
      minScore: options?.minRelevance ?? 0.01,
      domain: readStringFilter(options?.filters?.domain),
      tags: readStringList(options?.filters?.tags),
    });

    const chunks = ragResult.documents
      .map((document) => mapDocument(document))
      .filter((chunk) => matchesFilters(chunk, options));

    return {
      query: request.query,
      chunkCount: chunks.length,
      totalCandidates: ragResult.totalCandidates,
      retrievalTimeMs: ragResult.retrievalTimeMs,
      tiersSearched: ragResult.tiersSearched,
      chunks,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────

export function createRetrievalContract(
  dependencies?: RetrievalContractDependencies,
): RetrievalContract {
  return new RetrievalContract(dependencies);
}

// ─── Shared Helpers (extracted from duplicated logic) ─────────────────

export function mapDocument(document: RAGDocument): RetrievalChunk {
  return {
    id: document.id,
    source: resolveSource(document),
    content: document.content,
    relevanceScore: document.score ?? 0,
    metadata: {
      title: document.title,
      tier: document.tier,
      documentType: document.documentType,
      domain: document.domain,
      tags: document.tags,
      ...document.metadata,
    },
  };
}

export function resolveSource(document: RAGDocument): string {
  if (
    typeof document.metadata.source === "string" &&
    document.metadata.source.length > 0
  ) {
    return document.metadata.source;
  }

  return document.title;
}

export function matchesFilters(
  chunk: RetrievalChunk,
  options?: RetrievalRequestOptions,
): boolean {
  if (
    options?.sources &&
    options.sources.length > 0 &&
    !options.sources.includes(chunk.source)
  ) {
    return false;
  }

  const filters = options?.filters;
  if (!filters) {
    return true;
  }

  for (const [key, expected] of Object.entries(filters)) {
    if (key === "domain" || key === "tags") {
      continue;
    }

    const actual = chunk.metadata?.[key];
    if (Array.isArray(expected)) {
      if (!Array.isArray(actual)) {
        return false;
      }

      const expectedValues = expected.map((value) => String(value));
      const actualValues = actual.map((value) => String(value));
      const hasOverlap = expectedValues.some((value) =>
        actualValues.includes(value),
      );
      if (!hasOverlap) {
        return false;
      }
      continue;
    }

    if (actual !== expected) {
      return false;
    }
  }

  return true;
}

export function readStringFilter(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function readStringList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const items = value.filter(
    (entry): entry is string => typeof entry === "string" && entry.length > 0,
  );
  return items.length > 0 ? items : undefined;
}
