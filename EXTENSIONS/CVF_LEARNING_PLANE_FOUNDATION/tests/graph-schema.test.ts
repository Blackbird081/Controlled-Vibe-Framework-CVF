import { describe, expect, it } from "vitest";
import {
  createDependencyGraph,
  createGraphEdge,
  createGraphNode,
  GRAPH_KNOWLEDGE_SCHEMA_VERSION,
} from "../src/knowledge/graph/schema/graph-schema";

describe("graph knowledge schema phase 1", () => {
  it("creates deterministic nodes, edges, and filters dangling edges", () => {
    const file = createGraphNode({
      kind: "file",
      name: "src/a.ts",
      filePath: "src/a.ts",
      confidence: "high",
    });
    const fn = createGraphNode({
      kind: "function",
      name: "run",
      filePath: "src/a.ts",
      confidence: "high",
    });
    const edge = createGraphEdge({
      kind: "declares",
      from: file.id,
      to: fn.id,
      confidence: "high",
    });
    const dangling = createGraphEdge({
      kind: "calls",
      from: fn.id,
      to: "missing",
      confidence: "low",
    });

    const graph = createDependencyGraph([file, fn, fn], [edge, dangling]);

    expect(graph.schemaVersion).toBe(GRAPH_KNOWLEDGE_SCHEMA_VERSION);
    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toEqual([edge]);
  });
});
