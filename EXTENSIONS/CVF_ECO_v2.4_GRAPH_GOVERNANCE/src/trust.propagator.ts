import { GraphStore } from "./graph.store";
import { TrustPropagation } from "./types";

export class TrustPropagator {
  private decayFactor: number;

  constructor(decayFactor: number = 0.8) {
    this.decayFactor = decayFactor;
  }

  propagate(store: GraphStore, nodeId: string): TrustPropagation {
    const node = store.getNode(nodeId);
    if (!node) {
      return { nodeId, originalTrust: 0, propagatedTrust: 0, influencers: [] };
    }

    const inEdges = store.getInEdges(nodeId).filter((e) => e.type === "trusts");
    const influencers: TrustPropagation["influencers"] = [];
    let totalInfluence = 0;

    for (const edge of inEdges) {
      const sourceNode = store.getNode(edge.source);
      if (!sourceNode) continue;

      const contribution = sourceNode.trust * edge.weight * this.decayFactor;
      influencers.push({ nodeId: edge.source, contribution });
      totalInfluence += contribution;
    }

    const propagatedTrust = influencers.length > 0
      ? Math.min((node.trust + totalInfluence / influencers.length) / 2, 1.0)
      : node.trust;

    return {
      nodeId,
      originalTrust: node.trust,
      propagatedTrust,
      influencers,
    };
  }

  propagateAll(store: GraphStore): TrustPropagation[] {
    return store.listNodes().map((n) => this.propagate(store, n.id));
  }

  applyPropagation(store: GraphStore): Map<string, number> {
    const results = this.propagateAll(store);
    const updates = new Map<string, number>();

    for (const result of results) {
      const node = store.getNode(result.nodeId);
      if (node) {
        node.trust = result.propagatedTrust;
        updates.set(result.nodeId, result.propagatedTrust);
      }
    }

    return updates;
  }
}
