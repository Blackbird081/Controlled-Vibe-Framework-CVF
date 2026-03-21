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
  computeDeterministicHash,
  createControlPlaneFoundationShell,
  type ControlPlaneFoundationShell,
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
   * Retrieve context chunks via the `CP1` shell's canonical knowledge delegate.
   */
  retrieveContext(query: string, options?: RetrievalOptions): ContextChunk[] {
    const result = this.shell.knowledge.query({
      query,
      maxResults: options?.maxChunks ?? 10,
      minScore: options?.minRelevance ?? 0.01,
      domain: this.readStringFilter(options?.filters?.domain),
      tags: this.readStringList(options?.filters?.tags),
    });

    const chunks = result.documents
      .map((doc) => ({
        id: doc.id,
        source: this.resolveSource(doc),
        content: doc.content,
        relevanceScore: doc.score ?? 0,
        metadata: {
          title: doc.title,
          tier: doc.tier,
          documentType: doc.documentType,
          domain: doc.domain,
          tags: doc.tags,
          ...doc.metadata,
        },
      }))
      .filter((chunk) => this.matchesFilters(chunk, options));

    this.retrievalLog.push({
      query,
      chunkCount: chunks.length,
      timestamp: this.now(),
    });

    return chunks;
  }

  /**
   * Package context chunks within a token budget.
   * Uses the deterministic hash line from the `CP1` shell so the wrapper no
   * longer invents its own hash formula.
   */
  packageContext(chunks: ContextChunk[], tokenBudget: number): PackagedContext {
    let totalTokens = 0;
    const selectedChunks: ContextChunk[] = [];

    for (const chunk of chunks) {
      const chunkTokens = Math.ceil(chunk.content.length / 4);
      if (totalTokens + chunkTokens <= tokenBudget) {
        selectedChunks.push(chunk);
        totalTokens += chunkTokens;
      }
    }

    const snapshotHash = computeDeterministicHash(
      'knowledge-facade',
      `budget:${tokenBudget}`,
      `tokens:${totalTokens}:selected:${selectedChunks.length}:truncated:${selectedChunks.length < chunks.length}`,
      this.serializeChunks(selectedChunks),
    );

    return {
      chunks: selectedChunks,
      totalTokens,
      tokenBudget,
      truncated: selectedChunks.length < chunks.length,
      snapshotHash,
    };
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

  private resolveSource(doc: {
    title: string;
    metadata: Record<string, unknown>;
  }): string {
    if (typeof doc.metadata.source === 'string' && doc.metadata.source.length > 0) {
      return doc.metadata.source;
    }
    return doc.title;
  }

  private matchesFilters(chunk: ContextChunk, options?: RetrievalOptions): boolean {
    if (options?.sources && options.sources.length > 0 && !options.sources.includes(chunk.source)) {
      return false;
    }

    const filters = options?.filters;
    if (!filters) {
      return true;
    }

    for (const [key, expected] of Object.entries(filters)) {
      if (key === 'domain' || key === 'tags') {
        continue;
      }

      const actual = chunk.metadata?.[key];
      if (Array.isArray(expected)) {
        if (!Array.isArray(actual)) {
          return false;
        }

        const expectedValues = expected.map((value) => String(value));
        const actualValues = actual.map((value) => String(value));
        const hasOverlap = expectedValues.some((value) => actualValues.includes(value));
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
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  }

  private readStringList(value: unknown): string[] | undefined {
    if (!Array.isArray(value)) {
      return undefined;
    }

    const items = value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);
    return items.length > 0 ? items : undefined;
  }

  private serializeChunks(chunks: ContextChunk[]): string {
    if (chunks.length === 0) {
      return 'empty';
    }

    return chunks
      .map((chunk) => JSON.stringify({
        id: chunk.id,
        source: chunk.source,
        content: chunk.content,
        relevanceScore: chunk.relevanceScore,
        metadata: this.sortValue(chunk.metadata ?? {}),
      }))
      .join('|');
  }

  private sortValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((entry) => this.sortValue(entry));
    }

    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, nestedValue]) => [key, this.sortValue(nestedValue)]),
      );
    }

    return value;
  }
}

// ─── Factory ──────────────────────────────────────────────────────────

export function createKnowledgeFacade(
  dependencies?: KnowledgeFacadeDependencies,
): KnowledgeFacade {
  return new KnowledgeFacade(dependencies);
}
