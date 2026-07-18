import { describe, expect, it } from "vitest";
import {
  KGR_DETERMINISTIC_TIMESTAMP,
  KGR_GUARD_POLICIES,
  buildKgrStore,
  createKgrEdge,
  createKgrEdgeId,
  createKgrNode,
  createKgrNodeId,
  getKgrGuardPolicy,
} from "../src/knowledge-graph-store";

describe("KGR knowledge graph store", () => {
  it("creates deterministic node and edge ids", () => {
    expect(createKgrNodeId("policy", "docs/guard spec.md", "G-GM-08")).toBe(
      "kgr:policy:docs/guard_spec.md:G-GM-08",
    );

    expect(createKgrEdgeId("governed_by", "a", "b")).toBe(
      "kgr-edge:governed_by:a->b",
    );
  });

  it("creates nodes with deterministic default timestamps", () => {
    const first = createKgrNode({
      kind: "policy",
      name: "G-GM-08",
      sourcePath: "docs/guard.md",
      confidence: 0.9,
      governanceTag: "CVF_COMPLIANT",
    });
    const second = createKgrNode({
      kind: "policy",
      name: "G-GM-08",
      sourcePath: "docs/guard.md",
      confidence: 0.9,
      governanceTag: "CVF_COMPLIANT",
    });

    expect(first).toEqual(second);
    expect(first.createdAt).toBe(KGR_DETERMINISTIC_TIMESTAMP);
  });

  it("retains only edges with existing endpoints", () => {
    const source = createKgrNode({
      kind: "document",
      name: "source",
      sourcePath: "docs/source.md",
      confidence: 0.8,
      governanceTag: "CVF_COMPLIANT",
    });
    const target = createKgrNode({
      kind: "policy",
      name: "target",
      sourcePath: "docs/target.md",
      confidence: 0.8,
      governanceTag: "CVF_COMPLIANT",
    });
    const valid = createKgrEdge({
      kind: "relates_to",
      fromId: source.id,
      toId: target.id,
      confidence: 0.7,
    });
    const orphan = createKgrEdge({
      kind: "relates_to",
      fromId: source.id,
      toId: "missing-node",
      confidence: 0.7,
    });

    const store = buildKgrStore([target, source], [orphan, valid]);

    expect(store.nodeCount).toBe(2);
    expect(store.edgeCount).toBe(1);
    expect(store.edges).toEqual([valid]);
    expect(store.findNodeById(source.id)).toEqual(source);
    expect(store.findEdgesFrom(source.id)).toEqual([valid]);
    expect(store.findEdgesTo(target.id)).toEqual([valid]);
    expect(store.findEdgesByKind("relates_to")).toEqual([valid]);
  });

  it("exposes all eight graph-memory guard policy records", () => {
    expect(KGR_GUARD_POLICIES).toHaveLength(8);
    expect(getKgrGuardPolicy("G-GM-08")).toMatchObject({
      name: "Compliance Guard",
      cvfOwnerExists: true,
    });
  });
});
