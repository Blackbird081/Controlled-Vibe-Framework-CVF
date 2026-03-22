import type { ValidatedIntent } from "../../CVF_ECO_v1.0_INTENT_VALIDATION/src/types";
import type {
  RAGDocument,
  RetrievalTier,
} from "../../CVF_ECO_v1.4_RAG_PIPELINE/src/types";
import { IntentPipeline } from "../../CVF_ECO_v1.0_INTENT_VALIDATION/src/intent.pipeline";
import { RAGPipeline } from "../../CVF_ECO_v1.4_RAG_PIPELINE/src/rag.pipeline";
import { GovernanceCanvas } from "../../CVF_ECO_v2.1_GOVERNANCE_CANVAS/src/canvas";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import { ContextFreezer } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/context.freezer";

export interface ControlPlaneIntakeShell {
  intent: IntentPipeline;
  knowledge: RAGPipeline;
  reporting: GovernanceCanvas;
  context: ContextFreezer;
}

export interface IntakeContextChunk {
  id: string;
  source: string;
  content: string;
  relevanceScore: number;
  metadata?: Record<string, unknown>;
}

export interface IntakePackagedContext {
  chunks: IntakeContextChunk[];
  totalTokens: number;
  tokenBudget: number;
  truncated: boolean;
  snapshotHash: string;
}

export interface ControlPlaneIntakeRetrievalOptions {
  maxChunks?: number;
  minRelevance?: number;
  sources?: string[];
  filters?: Record<string, unknown>;
}

export interface ControlPlaneIntakeRequest {
  vibe: string;
  retrievalQuery?: string;
  tokenBudget?: number;
  consumerId?: string;
  retrieval?: ControlPlaneIntakeRetrievalOptions;
}

export interface ControlPlaneIntakeRetrievalSurface {
  query: string;
  chunkCount: number;
  totalCandidates: number;
  retrievalTimeMs: number;
  tiersSearched: RetrievalTier[];
  chunks: IntakeContextChunk[];
}

export interface ControlPlaneIntakeResult {
  requestId: string;
  createdAt: string;
  consumerId?: string;
  intent: ValidatedIntent;
  retrieval: ControlPlaneIntakeRetrievalSurface;
  packagedContext: IntakePackagedContext;
  warnings: string[];
}

export interface ControlPlaneIntakeContractDependencies {
  shell?: ControlPlaneIntakeShell;
  now?: () => string;
}

export class ControlPlaneIntakeContract {
  private readonly shell: ControlPlaneIntakeShell;
  private readonly now: () => string;

  constructor(dependencies: ControlPlaneIntakeContractDependencies = {}) {
    this.shell = dependencies.shell ?? createDefaultIntakeShell();
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  execute(request: ControlPlaneIntakeRequest): ControlPlaneIntakeResult {
    const createdAt = this.now();
    const intent = this.shell.intent.validate(request.vibe);
    const retrievalQuery = this.resolveRetrievalQuery(request, intent);
    const ragResult = this.shell.knowledge.query({
      query: retrievalQuery,
      maxResults: request.retrieval?.maxChunks ?? 5,
      minScore: request.retrieval?.minRelevance ?? 0.01,
      domain: this.resolveDomainFilter(request, intent),
      tags: this.readStringList(request.retrieval?.filters?.tags),
    });
    const chunks = ragResult.documents
      .map((document) => this.mapDocument(document))
      .filter((chunk) => this.matchesFilters(chunk, request.retrieval));
    const packagedContext = packageIntakeContext(
      chunks,
      request.tokenBudget ?? 256,
    );
    const requestId = computeDeterministicHash(
      "w1-t2-cp1-intake",
      `${createdAt}:${request.consumerId ?? "anonymous"}`,
      `${request.vibe}:${retrievalQuery}`,
      packagedContext.snapshotHash,
    );

    return {
      requestId,
      createdAt,
      consumerId: request.consumerId,
      intent,
      retrieval: {
        query: retrievalQuery,
        chunkCount: chunks.length,
        totalCandidates: ragResult.totalCandidates,
        retrievalTimeMs: ragResult.retrievalTimeMs,
        tiersSearched: ragResult.tiersSearched,
        chunks,
      },
      packagedContext,
      warnings: this.buildWarnings(intent, chunks),
    };
  }

  private resolveRetrievalQuery(
    request: ControlPlaneIntakeRequest,
    intent: ValidatedIntent,
  ): string {
    if (
      typeof request.retrievalQuery === "string" &&
      request.retrievalQuery.trim().length > 0
    ) {
      return request.retrievalQuery.trim();
    }

    const parts = [
      intent.intent.domain,
      intent.intent.action,
      intent.intent.object,
      intent.intent.rawVibe,
    ]
      .map((value) => value.trim())
      .filter((value) => value.length > 0 && value !== "unknown" && value !== "unspecified");

    return parts.join(" ").trim() || intent.intent.rawVibe.trim();
  }

  private resolveDomainFilter(
    request: ControlPlaneIntakeRequest,
    intent: ValidatedIntent,
  ): string | undefined {
    const directDomain = this.readStringFilter(request.retrieval?.filters?.domain);
    if (directDomain) {
      return directDomain;
    }

    return intent.intent.domain !== "general" ? intent.intent.domain : undefined;
  }

  private buildWarnings(
    intent: ValidatedIntent,
    chunks: IntakeContextChunk[],
  ): string[] {
    const warnings = [...intent.errors];

    if (!intent.valid) {
      warnings.push("Intake contract produced a low-confidence or invalid intent result.");
    }

    if (chunks.length === 0) {
      warnings.push("No retrieval chunks matched the current intake request.");
    }

    return Array.from(new Set(warnings));
  }

  private mapDocument(document: RAGDocument): IntakeContextChunk {
    return {
      id: document.id,
      source: this.resolveSource(document),
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

  private resolveSource(document: RAGDocument): string {
    if (
      typeof document.metadata.source === "string" &&
      document.metadata.source.length > 0
    ) {
      return document.metadata.source;
    }

    return document.title;
  }

  private matchesFilters(
    chunk: IntakeContextChunk,
    options?: ControlPlaneIntakeRetrievalOptions,
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

  private readStringFilter(value: unknown): string | undefined {
    return typeof value === "string" && value.length > 0 ? value : undefined;
  }

  private readStringList(value: unknown): string[] | undefined {
    if (!Array.isArray(value)) {
      return undefined;
    }

    const items = value.filter(
      (entry): entry is string => typeof entry === "string" && entry.length > 0,
    );
    return items.length > 0 ? items : undefined;
  }
}

export function createControlPlaneIntakeContract(
  dependencies?: ControlPlaneIntakeContractDependencies,
): ControlPlaneIntakeContract {
  return new ControlPlaneIntakeContract(dependencies);
}

export function packageIntakeContext(
  chunks: IntakeContextChunk[],
  tokenBudget: number,
): IntakePackagedContext {
  let totalTokens = 0;
  const selectedChunks: IntakeContextChunk[] = [];

  for (const chunk of chunks) {
    const chunkTokens = estimateTokenCount(chunk.content);
    if (totalTokens + chunkTokens <= tokenBudget) {
      selectedChunks.push(chunk);
      totalTokens += chunkTokens;
    }
  }

  return {
    chunks: selectedChunks,
    totalTokens,
    tokenBudget,
    truncated: selectedChunks.length < chunks.length,
    snapshotHash: computeDeterministicHash(
      "control-plane-intake-context",
      `budget:${tokenBudget}`,
      `tokens:${totalTokens}:selected:${selectedChunks.length}:truncated:${selectedChunks.length < chunks.length}`,
      serializeChunks(selectedChunks),
    ),
  };
}

function estimateTokenCount(content: string): number {
  return Math.ceil(content.length / 4);
}

function createDefaultIntakeShell(): ControlPlaneIntakeShell {
  return {
    intent: new IntentPipeline(),
    knowledge: new RAGPipeline(),
    reporting: new GovernanceCanvas(),
    context: new ContextFreezer(),
  };
}

function serializeChunks(chunks: IntakeContextChunk[]): string {
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

function sortValue(value: unknown): unknown {
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
