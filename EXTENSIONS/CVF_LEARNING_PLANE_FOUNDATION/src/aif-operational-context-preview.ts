import {
  evaluateRetrievalRequest,
  type MemoryRetrievalCandidate,
  type MemoryRetrievalMethod,
  type MemoryRetrievalResult,
} from "./memory-retrieval-policy";
import {
  packageMemoryContext,
  type ExcludedMemoryItem,
  type MemoryContextBlock,
  type MemoryContextItem,
} from "./memory-context-packager";
import type { GraphKnowledgeService } from "./knowledge/graph/schema/graph-schema";

export const AIF_OPERATIONAL_CONTEXT_PREVIEW_VERSION =
  "cvf.aifOperationalContextPreview.v1";

export type AifOperationalContextPreviewStatus = "ready" | "partial" | "denied";

export interface AifOperationalContextPreviewInput {
  purpose: string;
  scope: string;
  riskLevel: string;
  query: string;
  actorAuthorized: boolean;
  candidates: readonly MemoryRetrievalCandidate[];
  tokenBudget: number;
  maxResults?: number;
  retrievalMethods?: readonly MemoryRetrievalMethod[];
}

export interface AifOperationalContextPreviewOptions {
  graphKnowledgeService?: Pick<GraphKnowledgeService, "queryImpact">;
}

export interface AifOperationalContextPreview {
  contractVersion: typeof AIF_OPERATIONAL_CONTEXT_PREVIEW_VERSION;
  status: AifOperationalContextPreviewStatus;
  reason: string;
  retrievalResults: readonly MemoryRetrievalResult[];
  contextBlock: MemoryContextBlock;
  evidence: {
    rawMemoryReleased: false;
    liveRouteInjected: false;
    canReinject: false;
    graphAdvisoryOnly: true;
  };
}

const DEFAULT_RETRIEVAL_METHODS: readonly MemoryRetrievalMethod[] = [
  "keyword",
  "graph_search",
];

function estimateTokens(summary: string): number {
  return Math.max(1, Math.ceil(summary.split(/\s+/).filter(Boolean).length * 1.25));
}

function toContextItem(candidate: MemoryRetrievalCandidate): MemoryContextItem {
  const constraints = [
    "Summary-only operational preview; raw memory is not released.",
    ...(candidate.id.startsWith("graph:")
      ? ["Graph evidence is advisory only and has no approval authority."]
      : []),
  ];

  return {
    id: candidate.id,
    summary: candidate.summary,
    scope: candidate.scope,
    constraints,
    tokenEstimate: estimateTokens(candidate.summary) + 8,
  };
}

function uniqueSelectedItems(results: readonly MemoryRetrievalResult[]): MemoryContextItem[] {
  const seen = new Set<string>();
  const items: MemoryContextItem[] = [];

  for (const result of results) {
    for (const candidate of result.selected) {
      if (seen.has(candidate.id)) continue;
      seen.add(candidate.id);
      items.push(toContextItem(candidate));
    }
  }

  return items;
}

function uniqueExcludedItems(results: readonly MemoryRetrievalResult[]): ExcludedMemoryItem[] {
  const seen = new Set<string>();
  const excluded: ExcludedMemoryItem[] = [];

  for (const result of results) {
    for (const item of result.excluded) {
      const key = `${item.id}:${item.reason}`;
      if (seen.has(key)) continue;
      seen.add(key);
      excluded.push(item);
    }
  }

  return excluded;
}

function resolveStatus(results: readonly MemoryRetrievalResult[]): AifOperationalContextPreviewStatus {
  if (results.every((result) => result.status === "denied")) return "denied";
  if (results.some((result) => result.status === "deferred")) return "partial";
  return "ready";
}

function resolveReason(status: AifOperationalContextPreviewStatus): string {
  if (status === "denied") return "actor_not_authorized_for_aif_operational_context_preview";
  if (status === "partial") return "aif_operational_context_preview_partial";
  return "aif_operational_context_preview_ready";
}

export function buildAifOperationalContextPreview(
  input: AifOperationalContextPreviewInput,
  options: AifOperationalContextPreviewOptions = {},
): AifOperationalContextPreview {
  const methods = input.retrievalMethods ?? DEFAULT_RETRIEVAL_METHODS;
  const retrievalResults = methods.map((method) =>
    evaluateRetrievalRequest({
      method,
      query: input.query,
      scope: input.scope,
      actorAuthorized: input.actorAuthorized,
      candidates: input.candidates,
      maxResults: input.maxResults,
    }, method === "graph_search" ? options : {})
  );
  const status = resolveStatus(retrievalResults);
  const contextBlock = packageMemoryContext({
    purpose: input.purpose,
    scope: input.scope,
    riskLevel: input.riskLevel,
    approvedMemory: status === "denied" ? [] : uniqueSelectedItems(retrievalResults),
    excludedMemory: uniqueExcludedItems(retrievalResults),
    policyDecision: status === "denied"
      ? "deny"
      : status === "partial"
        ? "partial_summary_only"
        : "allow_summary_only",
    tokenBudget: input.tokenBudget,
  });

  return {
    contractVersion: AIF_OPERATIONAL_CONTEXT_PREVIEW_VERSION,
    status,
    reason: resolveReason(status),
    retrievalResults,
    contextBlock,
    evidence: {
      rawMemoryReleased: false,
      liveRouteInjected: false,
      canReinject: false,
      graphAdvisoryOnly: true,
    },
  };
}
