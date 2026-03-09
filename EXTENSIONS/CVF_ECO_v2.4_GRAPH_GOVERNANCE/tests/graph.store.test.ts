import { describe, it, expect, beforeEach } from "vitest";
import { GraphStore, resetEdgeCounter } from "../src/graph.store";

describe("GraphStore", () => {
  let store: GraphStore;

  beforeEach(() => {
    store = new GraphStore();
    resetEdgeCounter();
  });

  describe("nodes", () => {
    it("adds and retrieves node", () => {
      store.addNode({ id: "A", type: "agent", label: "Agent A", trust: 0.5, metadata: {} });
      expect(store.getNode("A")).toBeDefined();
      expect(store.getNode("A")!.label).toBe("Agent A");
    });

    it("removes node and connected edges", () => {
      store.addNode({ id: "A", type: "agent", label: "A", trust: 0.5, metadata: {} });
      store.addNode({ id: "B", type: "agent", label: "B", trust: 0.5, metadata: {} });
      store.addEdge("A", "B", "trusts");
      store.removeNode("A");
      expect(store.getNode("A")).toBeUndefined();
      expect(store.edgeCount()).toBe(0);
    });

    it("finds nodes by type", () => {
      store.addNode({ id: "A1", type: "agent", label: "A1", trust: 0.5, metadata: {} });
      store.addNode({ id: "S1", type: "service", label: "S1", trust: 0.7, metadata: {} });
      store.addNode({ id: "A2", type: "agent", label: "A2", trust: 0.5, metadata: {} });
      expect(store.findNodes("agent").length).toBe(2);
      expect(store.findNodes("service").length).toBe(1);
    });
  });

  describe("edges", () => {
    beforeEach(() => {
      store.addNode({ id: "A", type: "agent", label: "A", trust: 0.5, metadata: {} });
      store.addNode({ id: "B", type: "agent", label: "B", trust: 0.5, metadata: {} });
      store.addNode({ id: "C", type: "service", label: "C", trust: 0.7, metadata: {} });
    });

    it("adds edge between existing nodes", () => {
      const edge = store.addEdge("A", "B", "trusts");
      expect(edge).toBeDefined();
      expect(edge!.id).toMatch(/^EDGE-/);
    });

    it("rejects edge with nonexistent node", () => {
      expect(store.addEdge("A", "X", "trusts")).toBeUndefined();
    });

    it("gets out and in edges", () => {
      store.addEdge("A", "B", "trusts");
      store.addEdge("A", "C", "depends_on");
      store.addEdge("B", "C", "monitors");
      expect(store.getOutEdges("A").length).toBe(2);
      expect(store.getInEdges("C").length).toBe(2);
    });

    it("gets neighbors", () => {
      store.addEdge("A", "B", "trusts");
      store.addEdge("C", "A", "monitors");
      const neighbors = store.getNeighbors("A");
      expect(neighbors).toContain("B");
      expect(neighbors).toContain("C");
    });

    it("finds edges by type", () => {
      store.addEdge("A", "B", "trusts");
      store.addEdge("A", "C", "depends_on");
      expect(store.findEdges("trusts").length).toBe(1);
    });

    it("removes edge", () => {
      const edge = store.addEdge("A", "B", "trusts")!;
      expect(store.removeEdge(edge.id)).toBe(true);
      expect(store.edgeCount()).toBe(0);
    });
  });

  it("counts nodes and edges", () => {
    store.addNode({ id: "A", type: "agent", label: "A", trust: 0.5, metadata: {} });
    store.addNode({ id: "B", type: "agent", label: "B", trust: 0.5, metadata: {} });
    store.addEdge("A", "B", "trusts");
    expect(store.nodeCount()).toBe(2);
    expect(store.edgeCount()).toBe(1);
  });

  it("clears all data", () => {
    store.addNode({ id: "A", type: "agent", label: "A", trust: 0.5, metadata: {} });
    store.clear();
    expect(store.nodeCount()).toBe(0);
    expect(store.edgeCount()).toBe(0);
  });
});
