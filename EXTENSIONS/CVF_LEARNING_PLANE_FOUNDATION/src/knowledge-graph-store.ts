export const KGR_STORE_CONTRACT_VERSION =
  "cvf.knowledgeGraphRetrieval.kgr1.t2.v1" as const;

export const KGR_DETERMINISTIC_TIMESTAMP = "1970-01-01T00:00:00.000Z";

export type KgrNodeKind =
  | "variable"
  | "concept"
  | "document"
  | "diagram"
  | "policy"
  | "skill"
  | "agent"
  | "workflow";

export type KgrNodeKindAll =
  | "file"
  | "module"
  | "function"
  | "class"
  | "method"
  | "interface"
  | KgrNodeKind;

export type KgrEdgeKind =
  | "defines"
  | "relates_to"
  | "documented_by"
  | "governed_by"
  | "executed_by"
  | "part_of";

export type KgrEdgeKindAll =
  | "declares"
  | "imports"
  | "exports"
  | "calls"
  | "depends_on"
  | "contains"
  | KgrEdgeKind;

export interface KgrNode {
  readonly id: string;
  readonly kind: KgrNodeKindAll;
  readonly name: string;
  readonly sourcePath: string;
  readonly description?: string;
  readonly confidence: number;
  readonly governanceTag: "CVF_COMPLIANT" | "PENDING_REVIEW" | "UNREVIEWED";
  readonly createdAt: string;
}

export interface KgrEdge {
  readonly id: string;
  readonly kind: KgrEdgeKindAll;
  readonly fromId: string;
  readonly toId: string;
  readonly confidence: number;
}

export interface KgrStore {
  readonly contractVersion: typeof KGR_STORE_CONTRACT_VERSION;
  readonly nodes: readonly KgrNode[];
  readonly edges: readonly KgrEdge[];
  readonly nodeCount: number;
  readonly edgeCount: number;
  findNodeById(id: string): KgrNode | undefined;
  findNodesByKind(kind: KgrNodeKindAll): readonly KgrNode[];
  findNodesBySourcePath(sourcePath: string): readonly KgrNode[];
  findEdgesFrom(fromId: string): readonly KgrEdge[];
  findEdgesTo(toId: string): readonly KgrEdge[];
  findEdgesByKind(kind: KgrEdgeKindAll): readonly KgrEdge[];
}

export type KgrGuardPolicyId =
  | "G-GM-01"
  | "G-GM-02"
  | "G-GM-03"
  | "G-GM-04"
  | "G-GM-05"
  | "G-GM-06"
  | "G-GM-07"
  | "G-GM-08";

export interface KgrGuardPolicy {
  readonly id: KgrGuardPolicyId;
  readonly name: string;
  readonly description: string;
  readonly cvfOwnerExists: boolean;
  readonly cvfOwnerPath?: string;
}

function sanitizeKgrIdPart(value: string): string {
  return value.replace(/[^A-Za-z0-9_.:/\\-]+/g, "_");
}

export function createKgrNodeId(
  kind: KgrNodeKindAll,
  sourcePath: string,
  name: string,
): string {
  return `kgr:${kind}:${sanitizeKgrIdPart(sourcePath)}:${sanitizeKgrIdPart(name)}`;
}

export function createKgrEdgeId(
  kind: KgrEdgeKindAll,
  fromId: string,
  toId: string,
): string {
  return `kgr-edge:${kind}:${fromId}->${toId}`;
}

export function createKgrNode(
  input: Omit<KgrNode, "id" | "createdAt"> & { readonly createdAt?: string },
): KgrNode {
  return {
    ...input,
    id: createKgrNodeId(input.kind, input.sourcePath, input.name),
    createdAt: input.createdAt ?? KGR_DETERMINISTIC_TIMESTAMP,
  };
}

export function createKgrEdge(input: Omit<KgrEdge, "id">): KgrEdge {
  return {
    ...input,
    id: createKgrEdgeId(input.kind, input.fromId, input.toId),
  };
}

export function buildKgrStore(
  nodes: readonly KgrNode[],
  edges: readonly KgrEdge[],
): KgrStore {
  const nodeById = new Map<string, KgrNode>();
  const nodesByKind = new Map<KgrNodeKindAll, KgrNode[]>();
  const nodesBySource = new Map<string, KgrNode[]>();

  for (const node of nodes) {
    nodeById.set(node.id, node);
    const byKind = nodesByKind.get(node.kind) ?? [];
    byKind.push(node);
    nodesByKind.set(node.kind, byKind);

    const bySource = nodesBySource.get(node.sourcePath) ?? [];
    bySource.push(node);
    nodesBySource.set(node.sourcePath, bySource);
  }

  const validEdges: KgrEdge[] = [];
  const edgesFrom = new Map<string, KgrEdge[]>();
  const edgesTo = new Map<string, KgrEdge[]>();
  const edgesByKind = new Map<KgrEdgeKindAll, KgrEdge[]>();

  for (const edge of edges) {
    if (!nodeById.has(edge.fromId) || !nodeById.has(edge.toId)) {
      continue;
    }
    validEdges.push(edge);

    const from = edgesFrom.get(edge.fromId) ?? [];
    from.push(edge);
    edgesFrom.set(edge.fromId, from);

    const to = edgesTo.get(edge.toId) ?? [];
    to.push(edge);
    edgesTo.set(edge.toId, to);

    const byKind = edgesByKind.get(edge.kind) ?? [];
    byKind.push(edge);
    edgesByKind.set(edge.kind, byKind);
  }

  const allNodes = [...nodeById.values()].sort((a, b) => a.id.localeCompare(b.id));
  const allEdges = [...validEdges].sort((a, b) => a.id.localeCompare(b.id));

  return {
    contractVersion: KGR_STORE_CONTRACT_VERSION,
    nodes: allNodes,
    edges: allEdges,
    nodeCount: allNodes.length,
    edgeCount: allEdges.length,
    findNodeById: (id) => nodeById.get(id),
    findNodesByKind: (kind) => nodesByKind.get(kind) ?? [],
    findNodesBySourcePath: (sourcePath) => nodesBySource.get(sourcePath) ?? [],
    findEdgesFrom: (fromId) => edgesFrom.get(fromId) ?? [],
    findEdgesTo: (toId) => edgesTo.get(toId) ?? [],
    findEdgesByKind: (kind) => edgesByKind.get(kind) ?? [],
  };
}

export const KGR_GUARD_POLICIES: readonly KgrGuardPolicy[] = [
  {
    id: "G-GM-01",
    name: "Graph Priority Guard",
    description: "Prefer graph retrieval when a governed graph index is available.",
    cvfOwnerExists: false,
  },
  {
    id: "G-GM-02",
    name: "No Bypass Guard",
    description: "Prevent bypassing graph provenance for graph-backed retrieval.",
    cvfOwnerExists: false,
  },
  {
    id: "G-GM-03",
    name: "Provenance Guard",
    description: "Preserve source provenance for graph-derived knowledge.",
    cvfOwnerExists: true,
    cvfOwnerPath: "EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/durable-memory-store.ts",
  },
  {
    id: "G-GM-04",
    name: "Integrity Guard",
    description: "Reject orphaned graph edges and unstable graph records.",
    cvfOwnerExists: false,
  },
  {
    id: "G-GM-05",
    name: "Access Control Guard",
    description: "Keep graph readout behind caller authorization.",
    cvfOwnerExists: true,
    cvfOwnerPath: "EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-retrieval-policy.ts",
  },
  {
    id: "G-GM-06",
    name: "Confidentiality Guard",
    description: "Do not expose raw memory through graph retrieval candidates.",
    cvfOwnerExists: true,
    cvfOwnerPath: "EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-retrieval-policy.ts",
  },
  {
    id: "G-GM-07",
    name: "Drift Detection Guard",
    description: "Treat graph views as rebuildable derived views.",
    cvfOwnerExists: false,
  },
  {
    id: "G-GM-08",
    name: "Compliance Guard",
    description: "Exclude graph nodes without CVF_COMPLIANT governance tags.",
    cvfOwnerExists: true,
    cvfOwnerPath: "EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-retrieval-policy.ts",
  },
] as const;

export function getKgrGuardPolicy(id: KgrGuardPolicyId): KgrGuardPolicy | undefined {
  return KGR_GUARD_POLICIES.find((policy) => policy.id === id);
}
