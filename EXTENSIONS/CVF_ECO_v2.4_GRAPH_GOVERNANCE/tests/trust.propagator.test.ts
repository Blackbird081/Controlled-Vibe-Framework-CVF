/**
 * CVF ECO v2.4 Graph Governance — Trust Propagator Dedicated Tests (W6-T39)
 * ==========================================================================
 * GC-023: dedicated file — never merge into governance.graph.test.ts.
 *
 * Coverage:
 *   TrustPropagator.propagate:
 *     - node not found in store → {originalTrust:0, propagatedTrust:0, influencers:[]}
 *     - node with no in-edges → propagatedTrust = node.trust (unchanged)
 *     - node with in-edge type != "trusts" → not used as influencer
 *     - node with single "trusts" in-edge → contribution = source.trust * edge.weight * decayFactor
 *     - propagatedTrust = min((node.trust + avg(contributions)) / 2, 1.0)
 *     - node with multiple "trusts" in-edges → avg(contributions)
 *     - propagatedTrust capped at 1.0 (decayFactor=1.0, all trusts at 1.0)
 *     - influencers array matches contributing source nodes
 *     - originalTrust = node.trust at time of call
 *     - nodeId propagated in result
 *     - custom decayFactor applied (e.g. 0.5)
 *   TrustPropagator.propagateAll:
 *     - empty store → returns []
 *     - returns TrustPropagation for every node in store
 *   TrustPropagator.applyPropagation:
 *     - updates node.trust in store to propagatedTrust value
 *     - returns Map<nodeId, newTrust> with all updated values
 *     - empty store → returns empty Map
 */

import { describe, it, expect, beforeEach } from "vitest";

import { GraphStore, resetEdgeCounter } from "../src/graph.store";
import { TrustPropagator } from "../src/trust.propagator";
import type { GraphNode } from "../src/types";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeNode(id: string, trust: number): GraphNode {
  return { id, type: "agent", label: id, trust, metadata: {} };
}

// ─── TrustPropagator.propagate ────────────────────────────────────────────────

describe("TrustPropagator.propagate", () => {
  let store: GraphStore;
  const propagator = new TrustPropagator(0.8);

  beforeEach(() => {
    resetEdgeCounter();
    store = new GraphStore();
  });

  describe("node not found", () => {
    it("unknown nodeId → originalTrust=0, propagatedTrust=0, influencers=[]", () => {
      const result = propagator.propagate(store, "unknown");
      expect(result.originalTrust).toBe(0);
      expect(result.propagatedTrust).toBe(0);
      expect(result.influencers).toEqual([]);
      expect(result.nodeId).toBe("unknown");
    });
  });

  describe("no in-edges", () => {
    it("isolated node → propagatedTrust = originalTrust", () => {
      store.addNode(makeNode("A", 0.6));
      const result = propagator.propagate(store, "A");
      expect(result.propagatedTrust).toBe(0.6);
      expect(result.originalTrust).toBe(0.6);
      expect(result.influencers).toHaveLength(0);
    });
  });

  describe("in-edge type filtering", () => {
    it("in-edge type 'depends_on' (not 'trusts') → no influencer", () => {
      store.addNode(makeNode("A", 0.9));
      store.addNode(makeNode("B", 0.5));
      store.addEdge("A", "B", "depends_on", 1.0);
      const result = propagator.propagate(store, "B");
      expect(result.influencers).toHaveLength(0);
      expect(result.propagatedTrust).toBe(0.5); // unchanged
    });
  });

  describe("single trusts edge", () => {
    it("contribution = source.trust * edge.weight * decayFactor", () => {
      // source.trust=0.9, weight=1.0, decayFactor=0.8 → contribution=0.72
      // node.trust=0.5 → propagatedTrust = (0.5 + 0.72) / 2 = 0.61
      store.addNode(makeNode("S", 0.9));
      store.addNode(makeNode("T", 0.5));
      store.addEdge("S", "T", "trusts", 1.0);
      const result = propagator.propagate(store, "T");
      expect(result.influencers).toHaveLength(1);
      expect(result.influencers[0].nodeId).toBe("S");
      expect(result.influencers[0].contribution).toBeCloseTo(0.72);
      expect(result.propagatedTrust).toBeCloseTo(0.61);
    });

    it("edge weight affects contribution proportionally", () => {
      // source.trust=0.8, weight=0.5, decayFactor=0.8 → contribution=0.32
      // node.trust=0.4 → propagatedTrust = (0.4 + 0.32) / 2 = 0.36
      store.addNode(makeNode("S", 0.8));
      store.addNode(makeNode("T", 0.4));
      store.addEdge("S", "T", "trusts", 0.5);
      const result = propagator.propagate(store, "T");
      expect(result.influencers[0].contribution).toBeCloseTo(0.32);
      expect(result.propagatedTrust).toBeCloseTo(0.36);
    });
  });

  describe("multiple trusts edges", () => {
    it("two sources → avg(contributions) used", () => {
      // S1: trust=0.8, weight=1.0 → contribution=0.64
      // S2: trust=0.4, weight=1.0 → contribution=0.32
      // avg = (0.64+0.32)/2 = 0.48
      // node.trust=0.5 → propagatedTrust = (0.5 + 0.48) / 2 = 0.49
      store.addNode(makeNode("S1", 0.8));
      store.addNode(makeNode("S2", 0.4));
      store.addNode(makeNode("T", 0.5));
      store.addEdge("S1", "T", "trusts", 1.0);
      store.addEdge("S2", "T", "trusts", 1.0);
      const result = propagator.propagate(store, "T");
      expect(result.influencers).toHaveLength(2);
      expect(result.propagatedTrust).toBeCloseTo(0.49);
    });
  });

  describe("cap at 1.0", () => {
    it("propagatedTrust capped at 1.0 when formula exceeds 1.0", () => {
      // decayFactor=1.0, source.trust=1.0, weight=1.0 → contribution=1.0
      // node.trust=1.0 → propagatedTrust = min((1.0 + 1.0)/2, 1.0) = 1.0
      const maxPropagator = new TrustPropagator(1.0);
      store.addNode(makeNode("S", 1.0));
      store.addNode(makeNode("T", 1.0));
      store.addEdge("S", "T", "trusts", 1.0);
      const result = maxPropagator.propagate(store, "T");
      expect(result.propagatedTrust).toBe(1.0);
    });
  });

  describe("output fields", () => {
    it("nodeId propagated in result", () => {
      store.addNode(makeNode("MyNode", 0.5));
      const result = propagator.propagate(store, "MyNode");
      expect(result.nodeId).toBe("MyNode");
    });

    it("originalTrust = node.trust at call time", () => {
      store.addNode(makeNode("A", 0.75));
      const result = propagator.propagate(store, "A");
      expect(result.originalTrust).toBe(0.75);
    });
  });

  describe("custom decayFactor", () => {
    it("decayFactor=0.5 reduces contribution proportionally", () => {
      // source.trust=1.0, weight=1.0, decayFactor=0.5 → contribution=0.5
      // node.trust=0.5 → propagatedTrust = (0.5 + 0.5) / 2 = 0.5
      const halfDecayPropagator = new TrustPropagator(0.5);
      store.addNode(makeNode("S", 1.0));
      store.addNode(makeNode("T", 0.5));
      store.addEdge("S", "T", "trusts", 1.0);
      const result = halfDecayPropagator.propagate(store, "T");
      expect(result.influencers[0].contribution).toBeCloseTo(0.5);
      expect(result.propagatedTrust).toBeCloseTo(0.5);
    });
  });
});

// ─── TrustPropagator.propagateAll ────────────────────────────────────────────

describe("TrustPropagator.propagateAll", () => {
  const propagator = new TrustPropagator(0.8);

  beforeEach(() => {
    resetEdgeCounter();
  });

  it("empty store → returns []", () => {
    const store = new GraphStore();
    expect(propagator.propagateAll(store)).toEqual([]);
  });

  it("returns TrustPropagation for every node", () => {
    const store = new GraphStore();
    store.addNode(makeNode("A", 0.5));
    store.addNode(makeNode("B", 0.7));
    const results = propagator.propagateAll(store);
    expect(results).toHaveLength(2);
    const nodeIds = results.map((r) => r.nodeId);
    expect(nodeIds).toContain("A");
    expect(nodeIds).toContain("B");
  });
});

// ─── TrustPropagator.applyPropagation ────────────────────────────────────────

describe("TrustPropagator.applyPropagation", () => {
  const propagator = new TrustPropagator(0.8);

  beforeEach(() => {
    resetEdgeCounter();
  });

  it("empty store → returns empty Map", () => {
    const store = new GraphStore();
    const result = propagator.applyPropagation(store);
    expect(result.size).toBe(0);
  });

  it("updates node.trust in store to propagatedTrust", () => {
    const store = new GraphStore();
    store.addNode(makeNode("S", 0.9));
    store.addNode(makeNode("T", 0.5));
    store.addEdge("S", "T", "trusts", 1.0);

    propagator.applyPropagation(store);
    const updatedT = store.getNode("T");
    expect(updatedT!.trust).toBeCloseTo(0.61);
  });

  it("returns Map with nodeId→newTrust for all nodes", () => {
    const store = new GraphStore();
    store.addNode(makeNode("A", 0.5));
    store.addNode(makeNode("B", 0.7));
    const result = propagator.applyPropagation(store);
    expect(result.has("A")).toBe(true);
    expect(result.has("B")).toBe(true);
    expect(result.get("A")).toBeCloseTo(0.5); // no influencer, unchanged
  });
});
