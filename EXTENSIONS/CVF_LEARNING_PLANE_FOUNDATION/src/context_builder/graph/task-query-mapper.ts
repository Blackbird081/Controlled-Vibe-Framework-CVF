import type { SymbolIndex } from "../../knowledge/graph/index/symbol-index";
import type { GraphQueryResult } from "../../knowledge/graph/schema/graph-schema";

export type TaskQueryType =
  | "pr_review"
  | "delta"
  | "debug"
  | "refactor"
  | "test"
  | "onboarding"
  | "change_risk";

export interface TaskQuery {
  queryId: string;
  queryType: TaskQueryType;
  changedFiles: readonly string[];
  targetSymbols: readonly string[];
  maxDepth: number;
}

export function mapTaskToQuery(
  taskDescription: string,
  hints: {
    queryId: string;
    changedFiles?: readonly string[];
    targetSymbols?: readonly string[];
  },
): TaskQuery {
  const normalized = taskDescription.toLowerCase();
  let queryType: TaskQueryType = "delta";
  if (normalized.includes("review")) {
    queryType = "pr_review";
  } else if (normalized.includes("debug") || normalized.includes("bug")) {
    queryType = "debug";
  } else if (normalized.includes("refactor")) {
    queryType = "refactor";
  } else if (normalized.includes("test")) {
    queryType = "test";
  } else if (normalized.includes("onboard")) {
    queryType = "onboarding";
  } else if (normalized.includes("risk")) {
    queryType = "change_risk";
  }

  return {
    queryId: hints.queryId,
    queryType,
    changedFiles: hints.changedFiles ?? [],
    targetSymbols: hints.targetSymbols ?? [],
    maxDepth: queryType === "change_risk" || queryType === "refactor" ? 2 : 1,
  };
}

export function resolveBlastRadius(
  query: TaskQuery,
  index: SymbolIndex,
): GraphQueryResult {
  const seedNodes = index.graph.nodes.filter((node) =>
    query.changedFiles.includes(node.filePath) || query.targetSymbols.includes(node.name)
  );
  const nodeIds = new Set(seedNodes.map((node) => node.id));

  for (let depth = 0; depth < query.maxDepth; depth += 1) {
    for (const edge of index.graph.edges) {
      if (nodeIds.has(edge.from) || nodeIds.has(edge.to)) {
        nodeIds.add(edge.from);
        nodeIds.add(edge.to);
      }
    }
  }

  const resolvedNodes = index.graph.nodes.filter((node) => nodeIds.has(node.id));
  const resolvedEdges = index.graph.edges.filter((edge) =>
    nodeIds.has(edge.from) && nodeIds.has(edge.to)
  );
  const affectedFiles = [...new Set(resolvedNodes.map((node) => node.filePath))];

  return {
    queryId: query.queryId,
    queryType: query.queryType,
    inputScope: [...query.changedFiles, ...query.targetSymbols],
    resolvedNodes,
    resolvedEdges,
    affectedFiles,
    confidenceSummary: resolvedNodes.some((node) => node.confidence === "low") ? "low" : "medium",
    tokenBudgetEstimate: resolvedNodes.length * 80 + resolvedEdges.length * 20,
    warnings: ["graph_context_pack_is_advisory_evidence_only"],
  };
}
