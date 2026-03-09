import { GraphStore, resetEdgeCounter } from "./graph.store";
import { TrustPropagator } from "./trust.propagator";
import { GraphNode, EdgeType, DependencyChain, GraphAnalysis } from "./types";

export { resetEdgeCounter };

export class GovernanceGraph {
  private store: GraphStore;
  private propagator: TrustPropagator;

  constructor(decayFactor?: number) {
    this.store = new GraphStore();
    this.propagator = new TrustPropagator(decayFactor);
  }

  getStore(): GraphStore {
    return this.store;
  }

  addAgent(id: string, label: string, trust: number = 0.5): GraphNode {
    return this.store.addNode({ id, type: "agent", label, trust, metadata: {} });
  }

  addService(id: string, label: string, trust: number = 0.7): GraphNode {
    return this.store.addNode({ id, type: "service", label, trust, metadata: {} });
  }

  addPolicy(id: string, label: string): GraphNode {
    return this.store.addNode({ id, type: "policy", label, trust: 1.0, metadata: {} });
  }

  addResource(id: string, label: string): GraphNode {
    return this.store.addNode({ id, type: "resource", label, trust: 0.5, metadata: {} });
  }

  connect(source: string, target: string, type: EdgeType, weight?: number) {
    return this.store.addEdge(source, target, type, weight);
  }

  findDependencyChain(from: string, to: string): DependencyChain | null {
    const visited = new Set<string>();
    const path: string[] = [];

    const dfs = (current: string): boolean => {
      if (current === to) {
        path.push(current);
        return true;
      }
      if (visited.has(current)) return false;
      visited.add(current);
      path.push(current);

      for (const edge of this.store.getOutEdges(current)) {
        if (edge.type === "depends_on" || edge.type === "delegates_to") {
          if (dfs(edge.target)) return true;
        }
      }

      path.pop();
      return false;
    };

    if (!dfs(from)) return null;

    let totalWeight = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const edges = this.store.getOutEdges(path[i]).filter(
        (e) => e.target === path[i + 1]
      );
      if (edges.length > 0) totalWeight += edges[0].weight;
    }

    return { from, to, path, depth: path.length - 1, totalWeight };
  }

  propagateTrust() {
    return this.propagator.applyPropagation(this.store);
  }

  analyze(): GraphAnalysis {
    const nodes = this.store.listNodes();
    const edges = this.store.listEdges();

    const connectionCount = new Map<string, number>();
    for (const node of nodes) {
      connectionCount.set(node.id, 0);
    }
    for (const edge of edges) {
      connectionCount.set(edge.source, (connectionCount.get(edge.source) ?? 0) + 1);
      connectionCount.set(edge.target, (connectionCount.get(edge.target) ?? 0) + 1);
    }

    const isolatedNodes = nodes.filter((n) => (connectionCount.get(n.id) ?? 0) === 0).map((n) => n.id);

    let mostConnected: GraphAnalysis["mostConnected"] = null;
    let maxConn = 0;
    for (const [nodeId, count] of connectionCount) {
      if (count > maxConn) {
        maxConn = count;
        mostConnected = { nodeId, connections: count };
      }
    }

    const avgTrust = nodes.length > 0
      ? nodes.reduce((sum, n) => sum + n.trust, 0) / nodes.length
      : 0;

    const cycles = this.detectCycles();

    return {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      isolatedNodes,
      mostConnected,
      avgTrust,
      cycles,
    };
  }

  private detectCycles(): string[][] {
    const cycles: string[][] = [];
    const nodes = this.store.listNodes();
    const visited = new Set<string>();
    const inStack = new Set<string>();
    const path: string[] = [];

    const dfs = (nodeId: string): void => {
      visited.add(nodeId);
      inStack.add(nodeId);
      path.push(nodeId);

      for (const edge of this.store.getOutEdges(nodeId)) {
        if (!visited.has(edge.target)) {
          dfs(edge.target);
        } else if (inStack.has(edge.target)) {
          const cycleStart = path.indexOf(edge.target);
          if (cycleStart >= 0) {
            cycles.push([...path.slice(cycleStart), edge.target]);
          }
        }
      }

      path.pop();
      inStack.delete(nodeId);
    };

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        dfs(node.id);
      }
    }

    return cycles;
  }
}
