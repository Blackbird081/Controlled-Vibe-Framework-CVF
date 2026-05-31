import { describe, expect, it } from "vitest";
import { buildSymbolIndexFromSources } from "../src/knowledge/graph/index/symbol-index";
import {
  mapTaskToQuery,
  resolveBlastRadius,
} from "../src/context_builder/graph/task-query-mapper";

describe("task query mapper phase 1", () => {
  it("maps task language into bounded graph query classes", () => {
    expect(mapTaskToQuery("debug provider router bug", {
      queryId: "q-debug",
      targetSymbols: ["route"],
    })).toMatchObject({
      queryType: "debug",
      maxDepth: 1,
    });

    expect(mapTaskToQuery("refactor risk around provider registry", {
      queryId: "q-risk",
      changedFiles: ["src/provider.ts"],
    })).toMatchObject({
      queryType: "refactor",
      maxDepth: 2,
    });
  });

  it("resolves advisory blast radius from changed files", () => {
    const index = buildSymbolIndexFromSources([
      {
        filePath: "src/provider.ts",
        source: "export function route() { return select(); } function select() { return true; }",
      },
    ]);
    const query = mapTaskToQuery("review changed provider", {
      queryId: "q-1",
      changedFiles: ["src/provider.ts"],
    });

    const result = resolveBlastRadius(query, index);

    expect(result.affectedFiles).toEqual(["src/provider.ts"]);
    expect(result.resolvedNodes.length).toBeGreaterThan(1);
    expect(result.warnings).toContain("graph_context_pack_is_advisory_evidence_only");
  });
});
