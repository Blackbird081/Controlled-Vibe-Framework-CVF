import { GraphNode, GraphEdge, NodeType, EdgeType } from "./types";

let edgeCounter = 0;

function nextEdgeId(): string {
  edgeCounter++;
  return `EDGE-${String(edgeCounter).padStart(4, "0")}`;
}

export function resetEdgeCounter(): void {
  edgeCounter = 0;
}

export class GraphStore {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Map<string, GraphEdge> = new Map();

  addNode(node: GraphNode): GraphNode {
    this.nodes.set(node.id, node);
    return node;
  }

  getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  removeNode(id: string): boolean {
    if (!this.nodes.delete(id)) return false;
    for (const [eid, edge] of this.edges) {
      if (edge.source === id || edge.target === id) {
        this.edges.delete(eid);
      }
    }
    return true;
  }

  addEdge(source: string, target: string, type: EdgeType, weight: number = 1.0, metadata: Record<string, unknown> = {}): GraphEdge | undefined {
    if (!this.nodes.has(source) || !this.nodes.has(target)) return undefined;
    const edge: GraphEdge = { id: nextEdgeId(), source, target, type, weight, metadata };
    this.edges.set(edge.id, edge);
    return edge;
  }

  getEdge(id: string): GraphEdge | undefined {
    return this.edges.get(id);
  }

  removeEdge(id: string): boolean {
    return this.edges.delete(id);
  }

  getOutEdges(nodeId: string): GraphEdge[] {
    return [...this.edges.values()].filter((e) => e.source === nodeId);
  }

  getInEdges(nodeId: string): GraphEdge[] {
    return [...this.edges.values()].filter((e) => e.target === nodeId);
  }

  getNeighbors(nodeId: string): string[] {
    const neighbors = new Set<string>();
    for (const e of this.edges.values()) {
      if (e.source === nodeId) neighbors.add(e.target);
      if (e.target === nodeId) neighbors.add(e.source);
    }
    return [...neighbors];
  }

  findEdges(type: EdgeType): GraphEdge[] {
    return [...this.edges.values()].filter((e) => e.type === type);
  }

  findNodes(type: NodeType): GraphNode[] {
    return [...this.nodes.values()].filter((n) => n.type === type);
  }

  listNodes(): GraphNode[] {
    return [...this.nodes.values()];
  }

  listEdges(): GraphEdge[] {
    return [...this.edges.values()];
  }

  nodeCount(): number {
    return this.nodes.size;
  }

  edgeCount(): number {
    return this.edges.size;
  }

  clear(): void {
    this.nodes.clear();
    this.edges.clear();
  }
}
