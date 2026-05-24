import type {
  GraphKnowledgeService,
  GraphNode,
} from "./knowledge/graph/schema/graph-schema";

export const MEMORY_RETRIEVAL_POLICY_VERSION =
  "cvf.memoryRetrievalPolicy.phase2b.v1";

export type MemoryRetrievalMethod =
  | "keyword"
  | "semantic"
  | "recency"
  | "audit_trust"
  | "graph_search";

export interface MemoryRetrievalCandidate {
  id: string;
  scope: string;
  summary: string;
  content?: string;
  createdAt: number;
  auditTrust: number;
  lifecycleState: "working" | "episodic" | "semantic" | "procedural" | "expired" | "disputed";
  containsSecret?: boolean;
}

export interface MemoryRetrievalRequest {
  method: MemoryRetrievalMethod;
  query: string;
  scope: string;
  actorAuthorized: boolean;
  candidates: readonly MemoryRetrievalCandidate[];
  maxResults?: number;
}

export interface MemoryRetrievalPolicyOptions {
  graphKnowledgeService?: Pick<GraphKnowledgeService, "queryImpact">;
}

export interface MemoryRetrievalResult {
  contractVersion: typeof MEMORY_RETRIEVAL_POLICY_VERSION;
  method: MemoryRetrievalMethod;
  status: "allowed" | "denied" | "deferred";
  reason: string;
  selected: readonly MemoryRetrievalCandidate[];
  excluded: readonly { id: string; reason: string }[];
  rawMemoryReleased: false;
}

const BLOCKED_STATES = new Set(["expired", "disputed"]);

function graphConfidenceToAuditTrust(confidence: GraphNode["confidence"]): number {
  if (confidence === "high") return 0.95;
  if (confidence === "medium") return 0.75;
  return 0.55;
}

function extractGraphTargetSymbols(query: string): readonly string[] {
  return query
    .split(/[^A-Za-z0-9_$]+/g)
    .map((item) => item.trim())
    .filter((item) => item.length > 1);
}

function graphNodeToMemoryCandidate(
  node: GraphNode,
  scope: string,
): MemoryRetrievalCandidate {
  return {
    id: `graph:${node.id}`,
    scope,
    summary: `Graph ${node.kind} ${node.name} in ${node.filePath}`,
    content: `confidence=${node.confidence}; graph output is advisory evidence only`,
    createdAt: 0,
    auditTrust: graphConfidenceToAuditTrust(node.confidence),
    lifecycleState: "semantic",
  };
}

function matchesQuery(candidate: MemoryRetrievalCandidate, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (normalized.length === 0) {
    return true;
  }
  return `${candidate.summary} ${candidate.content ?? ""}`.toLowerCase().includes(normalized);
}

export function evaluateRetrievalRequest(
  request: MemoryRetrievalRequest,
  options: MemoryRetrievalPolicyOptions = {},
): MemoryRetrievalResult {
  if (!request.actorAuthorized) {
    return {
      contractVersion: MEMORY_RETRIEVAL_POLICY_VERSION,
      method: request.method,
      status: "denied",
      reason: "actor_not_authorized_for_memory_retrieval",
      selected: [],
      excluded: request.candidates.map((candidate) => ({
        id: candidate.id,
        reason: "policy_denied",
      })),
      rawMemoryReleased: false,
    };
  }

  if (request.method === "graph_search") {
    if (!options.graphKnowledgeService) {
      return {
        contractVersion: MEMORY_RETRIEVAL_POLICY_VERSION,
        method: request.method,
        status: "deferred",
        reason: "graph_search_requires_injected_graph_knowledge_service",
        selected: [],
        excluded: request.candidates.map((candidate) => ({
          id: candidate.id,
          reason: "graph_search_service_not_available",
        })),
        rawMemoryReleased: false,
      };
    }

    const targetSymbols = extractGraphTargetSymbols(request.query);
    const graphResult = options.graphKnowledgeService.queryImpact({
      queryId: `memory-graph-search:${request.scope}`,
      targetSymbols,
      maxDepth: 1,
    });
    const selected = [...graphResult.resolvedNodes]
      .sort((a, b) => {
        const aExact = targetSymbols.includes(a.name) ? 0 : 1;
        const bExact = targetSymbols.includes(b.name) ? 0 : 1;
        if (aExact !== bExact) return aExact - bExact;
        if (a.kind === "file" && b.kind !== "file") return 1;
        if (a.kind !== "file" && b.kind === "file") return -1;
        return a.name.localeCompare(b.name);
      })
      .map((node) => graphNodeToMemoryCandidate(node, request.scope));

    return {
      contractVersion: MEMORY_RETRIEVAL_POLICY_VERSION,
      method: request.method,
      status: "allowed",
      reason: "graph_search_policy_applied_advisory_only",
      selected: selected.slice(0, request.maxResults ?? 5),
      excluded: request.candidates
        .filter((candidate) =>
          candidate.scope !== request.scope ||
          candidate.containsSecret === true ||
          BLOCKED_STATES.has(candidate.lifecycleState)
        )
        .map((candidate) => ({
          id: candidate.id,
          reason: candidate.scope !== request.scope
            ? "out_of_scope"
            : candidate.containsSecret === true
              ? "privacy_filtered"
              : candidate.lifecycleState,
        })),
      rawMemoryReleased: false,
    };
  }

  const excluded: { id: string; reason: string }[] = [];
  const selected = request.candidates.filter((candidate) => {
    if (candidate.scope !== request.scope) {
      excluded.push({ id: candidate.id, reason: "out_of_scope" });
      return false;
    }
    if (candidate.containsSecret === true) {
      excluded.push({ id: candidate.id, reason: "privacy_filtered" });
      return false;
    }
    if (BLOCKED_STATES.has(candidate.lifecycleState)) {
      excluded.push({ id: candidate.id, reason: candidate.lifecycleState });
      return false;
    }
    if ((request.method === "keyword" || request.method === "semantic") &&
      !matchesQuery(candidate, request.query)) {
      excluded.push({ id: candidate.id, reason: "low_relevance" });
      return false;
    }
    return true;
  });

  const sorted = [...selected].sort((a, b) => {
    if (request.method === "audit_trust") {
      return b.auditTrust - a.auditTrust || b.createdAt - a.createdAt;
    }
    return b.createdAt - a.createdAt;
  });

  return {
    contractVersion: MEMORY_RETRIEVAL_POLICY_VERSION,
    method: request.method,
    status: "allowed",
    reason: "memory_retrieval_policy_applied",
    selected: sorted.slice(0, request.maxResults ?? 5),
    excluded,
    rawMemoryReleased: false,
  };
}
