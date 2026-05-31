import { describe, expect, it } from "vitest";
import {
  buildSymbolIndexFromSources,
  createInMemoryGraphKnowledgeService,
  lookupSymbol,
} from "../src/knowledge/graph/index/symbol-index";

describe("symbol index phase 1", () => {
  it("indexes symbols by name and file", () => {
    const index = buildSymbolIndexFromSources([
      {
        filePath: "src/a.ts",
        source: "export function alpha() { return beta(); } function beta() { return 1; }",
      },
    ]);

    expect(lookupSymbol(index, "alpha")).toHaveLength(1);
    expect(index.byFile.get("src/a.ts")?.some((node) => node.name === "beta")).toBe(true);
  });

  it("exposes an in-memory GraphKnowledgeService impact interface", () => {
    const service = createInMemoryGraphKnowledgeService([
      {
        filePath: "src/a.ts",
        source: "export function alpha() { return beta(); } function beta() { return 1; }",
      },
    ]);

    const result = service.queryImpact({
      queryId: "q-1",
      targetSymbols: ["alpha"],
      maxDepth: 1,
    });

    expect(result.queryId).toBe("q-1");
    expect(result.affectedFiles).toEqual(["src/a.ts"]);
    expect(result.warnings).toContain("graph_outputs_are_evidence_not_authority");
  });
});
