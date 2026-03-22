import type { ValidatedIntent } from "../../CVF_ECO_v1.0_INTENT_VALIDATION/src/types";
import type {
  RetrievalTier,
} from "../../CVF_ECO_v1.4_RAG_PIPELINE/src/types";
import { IntentPipeline } from "../../CVF_ECO_v1.0_INTENT_VALIDATION/src/intent.pipeline";
import { RAGPipeline } from "../../CVF_ECO_v1.4_RAG_PIPELINE/src/rag.pipeline";
import { GovernanceCanvas } from "../../CVF_ECO_v2.1_GOVERNANCE_CANVAS/src/canvas";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import { ContextFreezer } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/context.freezer";
import {
  RetrievalContract,
  readStringFilter,
  type RetrievalChunk,
} from "./retrieval.contract";
import {
  PackagingContract,
  type PackagingChunk,
} from "./packaging.contract";

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
    const domainFilter = this.resolveDomainFilter(request, intent);
    const retrievalContract = new RetrievalContract({
      knowledge: this.shell.knowledge,
    });
    const retrievalResult = retrievalContract.retrieve({
      query: retrievalQuery,
      options: {
        maxChunks: request.retrieval?.maxChunks ?? 5,
        minRelevance: request.retrieval?.minRelevance ?? 0.01,
        sources: request.retrieval?.sources,
        filters: {
          ...request.retrieval?.filters,
          ...(domainFilter ? { domain: domainFilter } : {}),
        },
      },
    });
    const chunks = retrievalResult.chunks;
    const packagingContract = new PackagingContract({
      context: this.shell.context,
    });
    const packagingResult = packagingContract.package({
      chunks,
      tokenBudget: request.tokenBudget ?? 256,
    });
    const packagedContext: IntakePackagedContext = {
      chunks: packagingResult.chunks,
      totalTokens: packagingResult.totalTokens,
      tokenBudget: packagingResult.tokenBudget,
      truncated: packagingResult.truncated,
      snapshotHash: packagingResult.snapshotHash,
    };
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
        chunkCount: retrievalResult.chunkCount,
        totalCandidates: retrievalResult.totalCandidates,
        retrievalTimeMs: retrievalResult.retrievalTimeMs,
        tiersSearched: retrievalResult.tiersSearched,
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
    const directDomain = readStringFilter(request.retrieval?.filters?.domain);
    if (directDomain) {
      return directDomain;
    }

    return intent.intent.domain !== "general" ? intent.intent.domain : undefined;
  }

  private buildWarnings(
    intent: ValidatedIntent,
    chunks: RetrievalChunk[],
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
  const contract = new PackagingContract();
  const result = contract.package({ chunks, tokenBudget });
  return {
    chunks: result.chunks,
    totalTokens: result.totalTokens,
    tokenBudget: result.tokenBudget,
    truncated: result.truncated,
    snapshotHash: result.snapshotHash,
  };
}

function createDefaultIntakeShell(): ControlPlaneIntakeShell {
  return {
    intent: new IntentPipeline(),
    knowledge: new RAGPipeline(),
    reporting: new GovernanceCanvas(),
    context: new ContextFreezer(),
  };
}

