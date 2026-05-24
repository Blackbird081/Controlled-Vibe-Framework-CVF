export const GRAPH_KNOWLEDGE_SCHEMA_VERSION =
  "cvf.graphKnowledge.phase1.v1";

export type GraphNodeKind =
  | "file"
  | "module"
  | "function"
  | "class"
  | "method"
  | "interface";

export type GraphEdgeKind =
  | "declares"
  | "imports"
  | "exports"
  | "calls"
  | "depends_on"
  | "contains";

export type GraphConfidence = "high" | "medium" | "low";

export interface GraphNode {
  id: string;
  kind: GraphNodeKind;
  name: string;
  filePath: string;
  line?: number;
  confidence: GraphConfidence;
}

export interface GraphEdge {
  id: string;
  kind: GraphEdgeKind;
  from: string;
  to: string;
  confidence: GraphConfidence;
}

export interface DependencyGraph {
  schemaVersion: typeof GRAPH_KNOWLEDGE_SCHEMA_VERSION;
  nodes: readonly GraphNode[];
  edges: readonly GraphEdge[];
}

export interface GraphSourceFile {
  filePath: string;
  source: string;
}

export interface GraphQueryResult {
  queryId: string;
  queryType: string;
  inputScope: readonly string[];
  resolvedNodes: readonly GraphNode[];
  resolvedEdges: readonly GraphEdge[];
  affectedFiles: readonly string[];
  confidenceSummary: GraphConfidence;
  tokenBudgetEstimate: number;
  warnings: readonly string[];
}

export interface GraphKnowledgeService {
  buildIndex(files: readonly string[]): Promise<unknown>;
  queryImpact(input: {
    queryId: string;
    changedFiles?: readonly string[];
    targetSymbols?: readonly string[];
    maxDepth?: number;
  }): GraphQueryResult;
}

function sanitizeId(value: string): string {
  return value.replace(/[^A-Za-z0-9_.:/-]+/g, "_");
}

export function createGraphNode(input: Omit<GraphNode, "id">): GraphNode {
  return {
    ...input,
    id: `${input.kind}:${sanitizeId(input.filePath)}:${sanitizeId(input.name)}`,
  };
}

export function createGraphEdge(input: Omit<GraphEdge, "id">): GraphEdge {
  return {
    ...input,
    id: `${input.kind}:${sanitizeId(input.from)}->${sanitizeId(input.to)}`,
  };
}

export function createDependencyGraph(
  nodes: readonly GraphNode[],
  edges: readonly GraphEdge[],
): DependencyGraph {
  const nodeById = new Map<string, GraphNode>();
  const edgeById = new Map<string, GraphEdge>();

  for (const node of nodes) {
    nodeById.set(node.id, node);
  }
  for (const edge of edges) {
    if (nodeById.has(edge.from) && nodeById.has(edge.to)) {
      edgeById.set(edge.id, edge);
    }
  }

  return {
    schemaVersion: GRAPH_KNOWLEDGE_SCHEMA_VERSION,
    nodes: [...nodeById.values()],
    edges: [...edgeById.values()],
  };
}
