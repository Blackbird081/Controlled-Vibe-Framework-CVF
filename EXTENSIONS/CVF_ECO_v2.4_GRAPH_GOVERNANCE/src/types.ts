export type EdgeType = "depends_on" | "delegates_to" | "monitors" | "trusts" | "reports_to" | "collaborates";
export type NodeType = "agent" | "service" | "policy" | "resource";

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  trust: number;
  metadata: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  weight: number;
  metadata: Record<string, unknown>;
}

export interface DependencyChain {
  from: string;
  to: string;
  path: string[];
  depth: number;
  totalWeight: number;
}

export interface TrustPropagation {
  nodeId: string;
  originalTrust: number;
  propagatedTrust: number;
  influencers: Array<{ nodeId: string; contribution: number }>;
}

export interface GraphAnalysis {
  nodeCount: number;
  edgeCount: number;
  isolatedNodes: string[];
  mostConnected: { nodeId: string; connections: number } | null;
  avgTrust: number;
  cycles: string[][];
}
