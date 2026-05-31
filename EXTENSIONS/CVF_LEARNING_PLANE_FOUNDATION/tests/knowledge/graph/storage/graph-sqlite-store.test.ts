import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildSymbolIndexFromSources, createInMemoryGraphKnowledgeService } from "../../../../src/knowledge/graph/index/symbol-index";
import { GraphSQLiteStore } from "../../../../src/knowledge/graph/storage/graph-sqlite-store";

let tempDir = "";

function dbPath(name: string): string {
  return path.join(tempDir, name);
}

describe("GraphSQLiteStore", () => {
  beforeEach(() => {
    tempDir = path.join(tmpdir(), `cvf-graph-store-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("roundtrips a SymbolIndex through SQLite storage", () => {
    const store = new GraphSQLiteStore();
    const index = buildSymbolIndexFromSources([
      {
        filePath: "src/example.ts",
        source: "export function alpha() { return beta(); }\nfunction beta() { return true; }",
      },
    ]);
    const targetDb = dbPath("graph.db");

    store.save(index, targetDb);
    const loaded = store.load(targetDb);

    expect(loaded).not.toBeNull();
    expect(loaded?.graph.nodes.map((node) => node.name)).toEqual(
      expect.arrayContaining(["alpha", "beta", "src/example.ts"]),
    );
    expect(loaded?.byName.get("alpha")?.[0].filePath).toBe("src/example.ts");
    expect(loaded?.graph.edges.length).toBeGreaterThan(0);
  });

  it("returns null for a missing or empty graph database", () => {
    const store = new GraphSQLiteStore();
    const emptyDb = dbPath("empty.db");

    expect(store.load(dbPath("missing.db"))).toBeNull();
    store.save(buildSymbolIndexFromSources([]), emptyDb);
    expect(store.load(emptyDb)).toBeNull();
  });

  it("handles corrupt databases as a null load result", () => {
    const store = new GraphSQLiteStore();
    const targetDb = dbPath("corrupt.db");
    writeFileSync(targetDb, "not a sqlite database", "utf8");

    expect(store.load(targetDb)).toBeNull();
  });

  it("can be injected into the in-memory graph service without changing its interface", async () => {
    const store = new GraphSQLiteStore();
    const targetDb = dbPath("service.db");
    const service = createInMemoryGraphKnowledgeService([
      {
        filePath: "src/service.ts",
        source: "export class ServiceThing { run() { return true; } }",
      },
    ], {
      persistenceStore: store,
      dbPath: targetDb,
    });

    expect(service.queryImpact({
      queryId: "q1",
      targetSymbols: ["ServiceThing"],
    }).resolvedNodes.map((node) => node.name)).toContain("ServiceThing");

    const restored = createInMemoryGraphKnowledgeService([], {
      persistenceStore: store,
      dbPath: targetDb,
    });

    expect(restored.queryImpact({
      queryId: "q2",
      targetSymbols: ["ServiceThing"],
    }).resolvedNodes.map((node) => node.name)).toContain("ServiceThing");
    await expect(service.buildIndex([])).resolves.toHaveProperty("graph");
  });
});
