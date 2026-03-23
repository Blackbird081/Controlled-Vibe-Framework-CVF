import type { KnowledgeItem } from "./knowledge.query.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type ExtendedSegmentType =
  | "QUERY"
  | "KNOWLEDGE"
  | "CODE"
  | "STRUCTURED"
  | "METADATA"
  | "SYSTEM";

export interface TypedContextSegment {
  segmentId: string;
  segmentType: ExtendedSegmentType;
  content: string;
  tokenEstimate: number;
  priorityRank: number; // lower = higher priority; 1 = highest
  source?: string;
}

export interface SegmentTypeConstraints {
  allowedTypes?: ExtendedSegmentType[];          // if set, only these types are emitted
  typeTokenCaps?: Partial<Record<ExtendedSegmentType, number>>; // per-type max tokens
  typePriorityOrder?: ExtendedSegmentType[];     // explicit ordering; types not listed go last
}

export interface ContextPackagerRequest {
  query: string;
  contextId: string;
  knowledgeItems?: KnowledgeItem[];
  codeSnippets?: Array<{ id: string; content: string; source?: string }>;
  structuredData?: Array<{ id: string; content: string; source?: string }>;
  metadata?: Record<string, string>;
  maxTokens?: number;
  segmentTypeConstraints?: SegmentTypeConstraints;
}

export interface PerTypeTokenBreakdown {
  QUERY: number;
  KNOWLEDGE: number;
  CODE: number;
  STRUCTURED: number;
  METADATA: number;
  SYSTEM: number;
}

export interface TypedContextPackage {
  packageId: string;
  builtAt: string;
  contextId: string;
  query: string;
  segments: TypedContextSegment[];
  totalSegments: number;
  estimatedTokens: number;
  perTypeTokens: PerTypeTokenBreakdown;
  packageHash: string;
}

export interface ContextPackagerContractDependencies {
  now?: () => string;
  estimateTokens?: (content: string) => number;
}

// --- Helpers ---

const DEFAULT_PRIORITY_ORDER: ExtendedSegmentType[] = [
  "QUERY",
  "CODE",
  "KNOWLEDGE",
  "STRUCTURED",
  "METADATA",
  "SYSTEM",
];

function defaultEstimateTokens(content: string): number {
  return Math.ceil(content.length / 4);
}

function resolveTypePriority(
  type: ExtendedSegmentType,
  order: ExtendedSegmentType[],
): number {
  const idx = order.indexOf(type);
  return idx === -1 ? order.length + 1 : idx + 1;
}

function emptyBreakdown(): PerTypeTokenBreakdown {
  return { QUERY: 0, KNOWLEDGE: 0, CODE: 0, STRUCTURED: 0, METADATA: 0, SYSTEM: 0 };
}

// --- Contract ---

export class ContextPackagerContract {
  private readonly now: () => string;
  private readonly estimateTokens: (content: string) => number;

  constructor(dependencies: ContextPackagerContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.estimateTokens = dependencies.estimateTokens ?? defaultEstimateTokens;
  }

  pack(request: ContextPackagerRequest): TypedContextPackage {
    const builtAt = this.now();
    const constraints = request.segmentTypeConstraints ?? {};
    const allowedTypes = constraints.allowedTypes;
    const typeTokenCaps = constraints.typeTokenCaps ?? {};
    const priorityOrder = constraints.typePriorityOrder ?? DEFAULT_PRIORITY_ORDER;
    const maxTokens =
      request.maxTokens !== undefined && request.maxTokens > 0
        ? request.maxTokens
        : Infinity;

    const isAllowed = (t: ExtendedSegmentType) =>
      !allowedTypes || allowedTypes.includes(t);

    // Build candidate segments in priority order
    type CandidateSegment = Omit<TypedContextSegment, "priorityRank">;
    const candidates: CandidateSegment[] = [];

    // QUERY (always attempt first)
    if (isAllowed("QUERY")) {
      const segId = computeDeterministicHash(
        "w1-t12-cp2-seg-query",
        request.contextId,
        request.query,
      );
      candidates.push({
        segmentId: segId,
        segmentType: "QUERY",
        content: request.query,
        tokenEstimate: this.estimateTokens(request.query),
      });
    }

    // CODE snippets
    if (isAllowed("CODE") && request.codeSnippets) {
      for (const snippet of request.codeSnippets) {
        const segId = computeDeterministicHash(
          "w1-t12-cp2-seg-code",
          request.contextId,
          snippet.id,
        );
        candidates.push({
          segmentId: segId,
          segmentType: "CODE",
          content: snippet.content,
          tokenEstimate: this.estimateTokens(snippet.content),
          source: snippet.source,
        });
      }
    }

    // KNOWLEDGE items
    if (isAllowed("KNOWLEDGE") && request.knowledgeItems) {
      for (const item of request.knowledgeItems) {
        const content = `${item.title}: ${item.content}`;
        const segId = computeDeterministicHash(
          "w1-t12-cp2-seg-knowledge",
          request.contextId,
          item.itemId,
        );
        candidates.push({
          segmentId: segId,
          segmentType: "KNOWLEDGE",
          content,
          tokenEstimate: this.estimateTokens(content),
          source: item.source,
        });
      }
    }

    // STRUCTURED data
    if (isAllowed("STRUCTURED") && request.structuredData) {
      for (const item of request.structuredData) {
        const segId = computeDeterministicHash(
          "w1-t12-cp2-seg-structured",
          request.contextId,
          item.id,
        );
        candidates.push({
          segmentId: segId,
          segmentType: "STRUCTURED",
          content: item.content,
          tokenEstimate: this.estimateTokens(item.content),
          source: item.source,
        });
      }
    }

    // METADATA entries
    if (isAllowed("METADATA") && request.metadata) {
      for (const [key, value] of Object.entries(request.metadata)) {
        const content = `${key}: ${value}`;
        const segId = computeDeterministicHash(
          "w1-t12-cp2-seg-metadata",
          request.contextId,
          key,
        );
        candidates.push({
          segmentId: segId,
          segmentType: "METADATA",
          content,
          tokenEstimate: this.estimateTokens(content),
        });
      }
    }

    // Sort candidates by priority order
    candidates.sort(
      (a, b) =>
        resolveTypePriority(a.segmentType, priorityOrder) -
        resolveTypePriority(b.segmentType, priorityOrder),
    );

    // Assign priority ranks, apply per-type caps and global maxTokens
    const selectedSegments: TypedContextSegment[] = [];
    let accumulatedTokens = 0;
    const perTypeAccumulated: Record<ExtendedSegmentType, number> = {
      QUERY: 0, KNOWLEDGE: 0, CODE: 0, STRUCTURED: 0, METADATA: 0, SYSTEM: 0,
    };

    for (const candidate of candidates) {
      if (accumulatedTokens >= maxTokens) break;

      const typeCap = typeTokenCaps[candidate.segmentType];
      if (
        typeCap !== undefined &&
        perTypeAccumulated[candidate.segmentType] + candidate.tokenEstimate > typeCap
      ) {
        continue;
      }

      if (accumulatedTokens + candidate.tokenEstimate > maxTokens) break;

      const priorityRank = resolveTypePriority(candidate.segmentType, priorityOrder);
      selectedSegments.push({ ...candidate, priorityRank });
      accumulatedTokens += candidate.tokenEstimate;
      perTypeAccumulated[candidate.segmentType] += candidate.tokenEstimate;
    }

    const estimatedTokens = selectedSegments.reduce(
      (sum, s) => sum + s.tokenEstimate,
      0,
    );

    const perTypeTokens: PerTypeTokenBreakdown = {
      QUERY: perTypeAccumulated.QUERY,
      KNOWLEDGE: perTypeAccumulated.KNOWLEDGE,
      CODE: perTypeAccumulated.CODE,
      STRUCTURED: perTypeAccumulated.STRUCTURED,
      METADATA: perTypeAccumulated.METADATA,
      SYSTEM: perTypeAccumulated.SYSTEM,
    };

    const packageHash = computeDeterministicHash(
      "w1-t12-cp2-context-packager",
      `${builtAt}:${request.contextId}`,
      `segments:${selectedSegments.length}:tokens:${estimatedTokens}`,
      `query:${request.query}`,
    );

    const packageId = computeDeterministicHash(
      "w1-t12-cp2-package-id",
      packageHash,
      builtAt,
    );

    return {
      packageId,
      builtAt,
      contextId: request.contextId,
      query: request.query,
      segments: selectedSegments,
      totalSegments: selectedSegments.length,
      estimatedTokens,
      perTypeTokens,
      packageHash,
    };
  }
}

export function createContextPackagerContract(
  dependencies?: ContextPackagerContractDependencies,
): ContextPackagerContract {
  return new ContextPackagerContract(dependencies);
}
