/**
 * CVF Knowledge Facade (Control Plane)
 * =====================================
 * Single entry point for ALL knowledge/context operations.
 * Delegates to the `CP1` control-plane shell so public knowledge/context
 * entrypoints stay aligned with the tranche-local foundation package.
 *
 * Per XP-02: Execution → Knowledge MUST go through this facade.
 *
 * @module cvf-plane-facades/knowledge
 */

import {
  createControlPlaneIntakeContract,
  createControlPlaneFoundationShell,
  createRetrievalContract,
  createPackagingContract,
  createConsumerContract,
  type ControlPlaneFoundationShell,
  type ControlPlaneIntakeResult,
  type ConsumptionReceipt,
  type ValidatedIntent,
} from 'cvf-control-plane-foundation';

// ─── Types ────────────────────────────────────────────────────────────

export interface ContextChunk {
  id: string;
  source: string;
  content: string;
  relevanceScore: number;
  metadata?: Record<string, unknown>;
}

export interface RetrievalOptions {
  maxChunks?: number;
  minRelevance?: number;
  sources?: string[];
  filters?: Record<string, unknown>;
}

export interface PackagedContext {
  chunks: ContextChunk[];
  totalTokens: number;
  tokenBudget: number;
  truncated: boolean;
  snapshotHash: string;
}

export interface IntakeRequest {
  vibe: string;
  retrievalQuery?: string;
  tokenBudget?: number;
  consumerId?: string;
  retrieval?: RetrievalOptions;
}

export interface IntakeResult {
  requestId: string;
  createdAt: string;
  consumerId?: string;
  intent: ValidatedIntent;
  retrieval: {
    query: string;
    chunkCount: number;
    totalCandidates: number;
    retrievalTimeMs: number;
    tiersSearched: string[];
    chunks: ContextChunk[];
  };
  packagedContext: PackagedContext;
  warnings: string[];
}

export interface FilteredContent {
  content: string;
  piiDetected: boolean;
  piiTypes?: string[];
  filteredCount: number;
}

export interface KnowledgeFacadeDependencies {
  shell?: ControlPlaneFoundationShell;
  now?: () => string;
}

export interface ConsumerFacadeRequest {
  vibe: string;
  consumerId: string;
  retrievalQuery?: string;
  tokenBudget?: number;
  retrieval?: RetrievalOptions;
  executionId?: string;
}

// ─── Knowledge Facade ─────────────────────────────────────────────────

export class KnowledgeFacade {
  private shell: ControlPlaneFoundationShell;
  private readonly now: () => string;
  private retrievalLog: Array<{ query: string; chunkCount: number; timestamp: string }> = [];

  constructor(dependencies: KnowledgeFacadeDependencies = {}) {
    this.shell = dependencies.shell ?? createControlPlaneFoundationShell();
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  /**
   * Retrieve context chunks via the unified `CP2` retrieval contract.
   * Delegates to `RetrievalContract` instead of reimplementing mapping/filtering.
   */
  retrieveContext(query: string, options?: RetrievalOptions): ContextChunk[] {
    const retrievalContract = createRetrievalContract({
      knowledge: this.shell.knowledge,
    });
    const result = retrievalContract.retrieve({
      query,
      options,
    });

    this.retrievalLog.push({
      query,
      chunkCount: result.chunkCount,
      timestamp: this.now(),
    });

    return result.chunks;
  }

  /**
   * Package context chunks within a token budget.
   * Uses the deterministic hash line from the `CP1` shell so the wrapper no
   * longer invents its own hash formula.
   */
  packageContext(chunks: ContextChunk[], tokenBudget: number): PackagedContext {
    const packagingContract = createPackagingContract({
      context: this.shell.context,
    });
    const result = packagingContract.package({ chunks, tokenBudget });
    return {
      chunks: result.chunks,
      totalTokens: result.totalTokens,
      tokenBudget: result.tokenBudget,
      truncated: result.truncated,
      snapshotHash: result.snapshotHash,
    };
  }

  /**
   * Consume the full intake pipeline end-to-end and produce a governed
   * `ConsumptionReceipt` proving the pipeline was exercised.
   * This is the CP4 real consumer path entry point.
   */
  consume(request: ConsumerFacadeRequest): ConsumptionReceipt {
    const contract = createConsumerContract({
      shell: this.shell,
      context: this.shell.context,
      now: this.now,
    });
    const receipt = contract.consume({
      vibe: request.vibe,
      consumerId: request.consumerId,
      retrievalQuery: request.retrievalQuery,
      tokenBudget: request.tokenBudget,
      retrieval: request.retrieval,
      executionId: request.executionId,
    });

    this.retrievalLog.push({
      query: receipt.intake.retrieval.query,
      chunkCount: receipt.intake.retrieval.chunkCount,
      timestamp: receipt.consumedAt,
    });

    return receipt;
  }

  /**
   * Build one usable intake baseline by validating the vibe, retrieving
   * source-backed context, and packaging it behind one caller-facing result.
   */
  prepareIntake(request: IntakeRequest): IntakeResult {
    const contract = createControlPlaneIntakeContract({
      shell: this.shell,
      now: this.now,
    });
    const result = contract.execute({
      vibe: request.vibe,
      retrievalQuery: request.retrievalQuery,
      tokenBudget: request.tokenBudget,
      consumerId: request.consumerId,
      retrieval: request.retrieval,
    });

    this.retrievalLog.push({
      query: result.retrieval.query,
      chunkCount: result.retrieval.chunkCount,
      timestamp: result.createdAt,
    });

    return this.mapIntakeResult(result);
  }

  /**
   * Filter PII/secrets from content before sending to LLM.
   * Per Target-State 7.3.4: Agents do not call AI providers directly.
   * Privacy filter is part of the Control Plane gateway.
   *
   * CURRENT: Pattern-based detection.
   * FUTURE: ML-based PII detection.
   */
  filterPII(content: string): FilteredContent {
    const piiPatterns: Array<{ pattern: RegExp; type: string }> = [
      { pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, type: 'email' },
      { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, type: 'phone' },
      { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, type: 'ssn' },
      { pattern: /\b(?:sk-|api[_-]?key[_-]?)[a-zA-Z0-9]{20,}\b/gi, type: 'api_key' },
      { pattern: /-----BEGIN (?:RSA )?PRIVATE KEY-----/g, type: 'private_key' },
    ];

    let filteredContent = content;
    const detectedTypes: string[] = [];
    let filteredCount = 0;

    for (const { pattern, type } of piiPatterns) {
      const matches = filteredContent.match(pattern);
      if (matches) {
        detectedTypes.push(type);
        filteredCount += matches.length;
        filteredContent = filteredContent.replace(pattern, `[REDACTED:${type}]`);
      }
    }

    return {
      content: filteredContent,
      piiDetected: filteredCount > 0,
      piiTypes: detectedTypes.length > 0 ? detectedTypes : undefined,
      filteredCount,
    };
  }

  /**
   * Get retrieval activity log.
   */
  getRetrievalLog(): ReadonlyArray<{ query: string; chunkCount: number; timestamp: string }> {
    return this.retrievalLog;
  }

  private mapIntakeResult(result: ControlPlaneIntakeResult): IntakeResult {
    return {
      requestId: result.requestId,
      createdAt: result.createdAt,
      consumerId: result.consumerId,
      intent: result.intent,
      retrieval: {
        query: result.retrieval.query,
        chunkCount: result.retrieval.chunkCount,
        totalCandidates: result.retrieval.totalCandidates,
        retrievalTimeMs: result.retrieval.retrievalTimeMs,
        tiersSearched: result.retrieval.tiersSearched,
        chunks: result.retrieval.chunks,
      },
      packagedContext: result.packagedContext,
      warnings: result.warnings,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────

export function createKnowledgeFacade(
  dependencies?: KnowledgeFacadeDependencies,
): KnowledgeFacade {
  return new KnowledgeFacade(dependencies);
}
