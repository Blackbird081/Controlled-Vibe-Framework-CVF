import { describe, it, expect, beforeEach } from "vitest";
import { GovernanceGraph, resetEdgeCounter } from "../src/governance.graph";

describe("GovernanceGraph", () => {
  let graph: GovernanceGraph;

  beforeEach(() => {
    graph = new GovernanceGraph();
    resetEdgeCounter();
  });

  describe("node helpers", () => {
    it("adds agents with default trust", () => {
      const agent = graph.addAgent("A1", "Finance Bot");
      expect(agent.type).toBe("agent");
      expect(agent.trust).toBe(0.5);
    });

    it("adds services with higher default trust", () => {
      const svc = graph.addService("S1", "Auth Service");
      expect(svc.trust).toBe(0.7);
    });

    it("adds policies with full trust", () => {
      const pol = graph.addPolicy("P1", "Finance Policy");
      expect(pol.trust).toBe(1.0);
    });
  });

  describe("dependency chains", () => {
    beforeEach(() => {
      graph.addAgent("A", "Agent A");
      graph.addAgent("B", "Agent B");
      graph.addAgent("C", "Agent C");
      graph.addService("S", "Service");
      graph.connect("A", "B", "depends_on");
      graph.connect("B", "C", "depends_on");
      graph.connect("C", "S", "delegates_to");
    });

    it("finds direct dependency", () => {
      const chain = graph.findDependencyChain("A", "B");
      expect(chain).not.toBeNull();
      expect(chain!.depth).toBe(1);
      expect(chain!.path).toEqual(["A", "B"]);
    });

    it("finds transitive dependency chain", () => {
      const chain = graph.findDependencyChain("A", "S");
      expect(chain).not.toBeNull();
      expect(chain!.depth).toBe(3);
      expect(chain!.path).toEqual(["A", "B", "C", "S"]);
    });

    it("returns null for no path", () => {
      graph.addAgent("X", "Isolated");
      expect(graph.findDependencyChain("A", "X")).toBeNull();
    });
  });

  describe("trust propagation", () => {
    it("propagates trust from high-trust nodes", () => {
      graph.addAgent("A", "High Trust", 0.9);
      graph.addAgent("B", "Low Trust", 0.3);
      graph.connect("A", "B", "trusts", 1.0);

      const updates = graph.propagateTrust();
      expect(updates.get("B")!).toBeGreaterThan(0.3);
    });

    it("does not exceed 1.0 after propagation", () => {
      graph.addAgent("A", "Full Trust", 1.0);
      graph.addAgent("B", "High Trust", 0.9);
      graph.connect("A", "B", "trusts", 1.0);

      const updates = graph.propagateTrust();
      expect(updates.get("B")!).toBeLessThanOrEqual(1.0);
    });

    it("isolated nodes keep original trust", () => {
      graph.addAgent("X", "Isolated", 0.6);
      const updates = graph.propagateTrust();
      expect(updates.get("X")!).toBe(0.6);
    });
  });

  describe("graph analysis", () => {
    it("counts nodes and edges", () => {
      graph.addAgent("A", "A");
      graph.addAgent("B", "B");
      graph.connect("A", "B", "trusts");
      const analysis = graph.analyze();
      expect(analysis.nodeCount).toBe(2);
      expect(analysis.edgeCount).toBe(1);
    });

    it("identifies isolated nodes", () => {
      graph.addAgent("A", "Connected");
      graph.addAgent("B", "Connected");
      graph.addAgent("C", "Isolated");
      graph.connect("A", "B", "trusts");
      const analysis = graph.analyze();
      expect(analysis.isolatedNodes).toContain("C");
      expect(analysis.isolatedNodes.length).toBe(1);
    });

    it("finds most connected node", () => {
      graph.addAgent("A", "Hub");
      graph.addAgent("B", "B");
      graph.addAgent("C", "C");
      graph.addAgent("D", "D");
      graph.connect("A", "B", "trusts");
      graph.connect("A", "C", "monitors");
      graph.connect("A", "D", "delegates_to");
      const analysis = graph.analyze();
      expect(analysis.mostConnected!.nodeId).toBe("A");
      expect(analysis.mostConnected!.connections).toBe(3);
    });

    it("computes average trust", () => {
      graph.addAgent("A", "A", 0.8);
      graph.addAgent("B", "B", 0.4);
      const analysis = graph.analyze();
      expect(analysis.avgTrust).toBeCloseTo(0.6);
    });

    it("detects cycles", () => {
      graph.addAgent("A", "A");
      graph.addAgent("B", "B");
      graph.addAgent("C", "C");
      graph.connect("A", "B", "depends_on");
      graph.connect("B", "C", "depends_on");
      graph.connect("C", "A", "depends_on");
      const analysis = graph.analyze();
      expect(analysis.cycles.length).toBeGreaterThan(0);
    });

    it("no cycles in acyclic graph", () => {
      graph.addAgent("A", "A");
      graph.addAgent("B", "B");
      graph.addAgent("C", "C");
      graph.connect("A", "B", "depends_on");
      graph.connect("B", "C", "depends_on");
      const analysis = graph.analyze();
      expect(analysis.cycles.length).toBe(0);
    });
  });

  describe("end-to-end", () => {
    it("full governance network scenario", () => {
      const admin = graph.addAgent("admin", "Admin Agent", 0.9);
      const finance = graph.addAgent("fin", "Finance Bot", 0.5);
      const code = graph.addAgent("code", "Code Bot", 0.5);
      const policy = graph.addPolicy("pol", "Governance Policy");
      const db = graph.addResource("db", "Database");

      graph.connect("admin", "fin", "trusts", 0.8);
      graph.connect("admin", "code", "trusts", 0.7);
      graph.connect("fin", "db", "depends_on");
      graph.connect("code", "db", "depends_on");
      graph.connect("pol", "fin", "monitors");
      graph.connect("pol", "code", "monitors");

      const analysis = graph.analyze();
      expect(analysis.nodeCount).toBe(5);
      expect(analysis.edgeCount).toBe(6);
      expect(analysis.isolatedNodes.length).toBe(0);

      graph.propagateTrust();
      expect(graph.getStore().getNode("fin")!.trust).toBeGreaterThan(0.5);

      const chain = graph.findDependencyChain("fin", "db");
      expect(chain).not.toBeNull();
      expect(chain!.depth).toBe(1);
    });
  });
});
