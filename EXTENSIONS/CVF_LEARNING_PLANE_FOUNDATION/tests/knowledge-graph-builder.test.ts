import { describe, expect, it } from "vitest";
import {
  KGR_BUILDER_CONTRACT_VERSION,
  buildKnowledgeGraph,
  buildKnowledgeGraphFromPaths,
} from "../src/knowledge-graph-builder";
import { KGR_DETERMINISTIC_TIMESTAMP } from "../src/knowledge-graph-store";

const SOURCES = [
  {
    filePath: "docs/CVF_GRAPH_MEMORY_LAYER_SPEC.md",
    content: "References CVF_GRAPH_MEMORY_DATA_MODEL and governance policy.",
  },
  {
    filePath: "docs/CVF_GRAPH_MEMORY_DATA_MODEL.md",
    content: "Node and edge model.",
  },
  {
    filePath: "governance/toolkit/05_OPERATION/CVF_GRAPH_POLICY_GUARD.md",
    content: "Governed by CVF_GRAPH_MEMORY_DATA_MODEL.",
  },
] as const;

describe("KGR knowledge graph builder", () => {
  it("builds a deterministic in-memory graph from supplied source content", () => {
    const first = buildKnowledgeGraph(SOURCES);
    const second = buildKnowledgeGraph(SOURCES);
    const project = (result: typeof first) => ({
      contractVersion: result.contractVersion,
      fileCount: result.fileCount,
      nodeCount: result.nodeCount,
      edgeCount: result.edgeCount,
      warnings: result.warnings,
      builtAt: result.builtAt,
      nodes: result.store.nodes,
      edges: result.store.edges,
    });

    expect(project(first)).toEqual(project(second));
    expect(first.contractVersion).toBe(KGR_BUILDER_CONTRACT_VERSION);
    expect(first.builtAt).toBe(KGR_DETERMINISTIC_TIMESTAMP);
    expect(first.nodeCount).toBe(3);
    expect(first.edgeCount).toBeGreaterThan(0);
  });

  it("classifies documents, policies, and workflows without file I/O", () => {
    const graph = buildKnowledgeGraphFromPaths([
      "docs/example.md",
      "docs/roadmaps/CVF_SAMPLE_ROADMAP_2026-06-01.md",
      "governance/toolkit/CVF_SAMPLE_GUARD.md",
    ]);

    expect(graph.fileCount).toBe(3);
    expect(graph.store.findNodesByKind("document")).toHaveLength(1);
    expect(graph.store.findNodesByKind("workflow")).toHaveLength(1);
    expect(graph.store.findNodesByKind("policy")).toHaveLength(1);
  });

  it("returns a bounded warning for empty input", () => {
    expect(buildKnowledgeGraph([])).toMatchObject({
      fileCount: 0,
      nodeCount: 0,
      edgeCount: 0,
      warnings: ["no_source_files_provided"],
      builtAt: KGR_DETERMINISTIC_TIMESTAMP,
    });
  });
});
