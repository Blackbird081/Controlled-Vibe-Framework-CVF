import { describe, it, expect } from "vitest";
import {
  KnowledgeContextAssemblyContract,
  createKnowledgeContextAssemblyContract,
  type KnowledgeContextAssemblyRequest,
} from "../src/knowledge.context.assembly.contract";
import type { RankedKnowledgeItem } from "../src/knowledge.ranking.contract";
import type { StructuralNeighbor } from "../src/knowledge.structural.index.contract";
import { FIXED_BATCH_NOW } from "./helpers/cpf.batch.contract.fixtures";

// ─── W75-T1: KnowledgeContextAssemblyContract ────────────────────────────────

const ASSEMBLE_NOW = FIXED_BATCH_NOW;

function makeContract(): KnowledgeContextAssemblyContract {
  return new KnowledgeContextAssemblyContract({ now: () => ASSEMBLE_NOW });
}

function makeRankedItem(overrides: Partial<RankedKnowledgeItem> & { itemId: string; rank: number }): RankedKnowledgeItem {
  const { itemId, rank, ...rest } = overrides;
  return {
    itemId,
    title: `Title for ${itemId}`,
    content: `Content for ${itemId}`,
    relevanceScore: 0.8,
    source: "test-source",
    compositeScore: 0.75,
    scoreBreakdown: { relevanceContribution: 0.6, tierContribution: 0.1, recencyContribution: 0.05 },
    rank,
    ...rest,
  };
}

function makeNeighbor(entityId: string): StructuralNeighbor {
  return { entityId, label: `Label ${entityId}`, relationType: "depends_on", depth: 1 };
}

function makeRequest(overrides: Partial<KnowledgeContextAssemblyRequest> = {}): KnowledgeContextAssemblyRequest {
  return {
    rankedItems: [makeRankedItem({ itemId: "item-1", rank: 1 })],
    ...overrides,
  };
}

// --- factory ---

describe("KnowledgeContextAssemblyContract — factory", () => {
  it("createKnowledgeContextAssemblyContract returns an instance", () => {
    expect(createKnowledgeContextAssemblyContract()).toBeInstanceOf(KnowledgeContextAssemblyContract);
  });
});

// --- empty input ---

describe("KnowledgeContextAssemblyContract — empty input", () => {
  it("empty rankedItems → totalEntries = 0", () => {
    expect(makeContract().assemble({ rankedItems: [] }).totalEntries).toBe(0);
  });

  it("empty rankedItems → entries = []", () => {
    expect(makeContract().assemble({ rankedItems: [] }).entries).toHaveLength(0);
  });

  it("empty rankedItems → contextWindowEstimate = 0", () => {
    expect(makeContract().assemble({ rankedItems: [] }).contextWindowEstimate).toBe(0);
  });

  it("packetId differs from packetHash for empty input", () => {
    const p = makeContract().assemble({ rankedItems: [] });
    expect(p.packetId).not.toBe(p.packetHash);
  });
});

// --- output shape ---

describe("KnowledgeContextAssemblyContract — output shape", () => {
  it("packet has all required fields", () => {
    const p = makeContract().assemble(makeRequest());
    expect(p).toHaveProperty("packetId");
    expect(p).toHaveProperty("packetHash");
    expect(p).toHaveProperty("assembledAt");
    expect(p).toHaveProperty("totalEntries");
    expect(p).toHaveProperty("entries");
    expect(p).toHaveProperty("contextWindowEstimate");
  });

  it("assembledAt matches injected timestamp", () => {
    expect(makeContract().assemble(makeRequest()).assembledAt).toBe(ASSEMBLE_NOW);
  });

  it("totalEntries matches rankedItems length", () => {
    const req = makeRequest({ rankedItems: [
      makeRankedItem({ itemId: "a", rank: 1 }),
      makeRankedItem({ itemId: "b", rank: 2 }),
    ]});
    expect(makeContract().assemble(req).totalEntries).toBe(2);
  });

  it("each entry has all required fields", () => {
    const e = makeContract().assemble(makeRequest()).entries[0];
    expect(e).toHaveProperty("entryId");
    expect(e).toHaveProperty("entryHash");
    expect(e).toHaveProperty("rank");
    expect(e).toHaveProperty("itemId");
    expect(e).toHaveProperty("title");
    expect(e).toHaveProperty("content");
    expect(e).toHaveProperty("compositeScore");
    expect(e).toHaveProperty("structuralNeighbors");
  });

  it("entryId differs from entryHash", () => {
    const e = makeContract().assemble(makeRequest()).entries[0];
    expect(e.entryId).not.toBe(e.entryHash);
  });

  it("entry carries rank through", () => {
    const e = makeContract().assemble(makeRequest()).entries[0];
    expect(e.rank).toBe(1);
  });

  it("entry carries itemId through", () => {
    const e = makeContract().assemble(makeRequest()).entries[0];
    expect(e.itemId).toBe("item-1");
  });

  it("entry carries content through", () => {
    const item = makeRankedItem({ itemId: "item-1", rank: 1, content: "custom content" });
    const e = makeContract().assemble({ rankedItems: [item] }).entries[0];
    expect(e.content).toBe("custom content");
  });

  it("entries are in ranked order", () => {
    const req = makeRequest({ rankedItems: [
      makeRankedItem({ itemId: "a", rank: 1 }),
      makeRankedItem({ itemId: "b", rank: 2 }),
      makeRankedItem({ itemId: "c", rank: 3 }),
    ]});
    const p = makeContract().assemble(req);
    expect(p.entries[0].itemId).toBe("a");
    expect(p.entries[1].itemId).toBe("b");
    expect(p.entries[2].itemId).toBe("c");
  });
});

// --- contextWindowEstimate ---

describe("KnowledgeContextAssemblyContract — contextWindowEstimate", () => {
  it("estimate equals sum of content lengths", () => {
    const items = [
      makeRankedItem({ itemId: "a", rank: 1, content: "abc" }),   // 3
      makeRankedItem({ itemId: "b", rank: 2, content: "defgh" }), // 5
    ];
    expect(makeContract().assemble({ rankedItems: items }).contextWindowEstimate).toBe(8);
  });

  it("single item estimate equals its content length", () => {
    const item = makeRankedItem({ itemId: "a", rank: 1, content: "hello world" });
    expect(makeContract().assemble({ rankedItems: [item] }).contextWindowEstimate).toBe(11);
  });
});

// --- structural enrichment ---

describe("KnowledgeContextAssemblyContract — structural enrichment", () => {
  it("no enrichment → structuralNeighbors = []", () => {
    const e = makeContract().assemble(makeRequest()).entries[0];
    expect(e.structuralNeighbors).toEqual([]);
  });

  it("enrichment for item → neighbors attached", () => {
    const neighbor = makeNeighbor("entity-x");
    const req = makeRequest({ structuralEnrichment: { "item-1": [neighbor] } });
    const e = makeContract().assemble(req).entries[0];
    expect(e.structuralNeighbors).toHaveLength(1);
    expect(e.structuralNeighbors[0].entityId).toBe("entity-x");
  });

  it("enrichment for other item → neighbors not attached to unrelated entry", () => {
    const neighbor = makeNeighbor("entity-x");
    const req: KnowledgeContextAssemblyRequest = {
      rankedItems: [
        makeRankedItem({ itemId: "item-1", rank: 1 }),
        makeRankedItem({ itemId: "item-2", rank: 2 }),
      ],
      structuralEnrichment: { "item-1": [neighbor] },
    };
    const p = makeContract().assemble(req);
    expect(p.entries[0].structuralNeighbors).toHaveLength(1);
    expect(p.entries[1].structuralNeighbors).toHaveLength(0);
  });

  it("multiple neighbors for one item → all attached", () => {
    const neighbors = [makeNeighbor("e1"), makeNeighbor("e2"), makeNeighbor("e3")];
    const req = makeRequest({ structuralEnrichment: { "item-1": neighbors } });
    expect(makeContract().assemble(req).entries[0].structuralNeighbors).toHaveLength(3);
  });
});

// --- determinism ---

describe("KnowledgeContextAssemblyContract — determinism", () => {
  it("same input + same timestamp → same packetHash", () => {
    const req = makeRequest();
    const p1 = makeContract().assemble(req);
    const p2 = makeContract().assemble(req);
    expect(p1.packetHash).toBe(p2.packetHash);
  });

  it("packetHash is time-independent", () => {
    const req = makeRequest();
    const c1 = new KnowledgeContextAssemblyContract({ now: () => "2026-01-01T00:00:00.000Z" });
    const c2 = new KnowledgeContextAssemblyContract({ now: () => "2026-06-01T00:00:00.000Z" });
    expect(c1.assemble(req).packetHash).toBe(c2.assemble(req).packetHash);
  });

  it("different timestamps → different packetId", () => {
    const req = makeRequest();
    const c1 = new KnowledgeContextAssemblyContract({ now: () => "2026-01-01T00:00:00.000Z" });
    const c2 = new KnowledgeContextAssemblyContract({ now: () => "2026-06-01T00:00:00.000Z" });
    expect(c1.assemble(req).packetId).not.toBe(c2.assemble(req).packetId);
  });

  it("different items → different packetHash", () => {
    const p1 = makeContract().assemble({ rankedItems: [makeRankedItem({ itemId: "a", rank: 1, content: "alpha" })] });
    const p2 = makeContract().assemble({ rankedItems: [makeRankedItem({ itemId: "b", rank: 1, content: "beta" })] });
    expect(p1.packetHash).not.toBe(p2.packetHash);
  });

  it("different structural enrichment for same ranked items → different packetHash", () => {
    const rankedItems = [makeRankedItem({ itemId: "item-1", rank: 1, content: "alpha" })];
    const p1 = makeContract().assemble({
      rankedItems,
      structuralEnrichment: { "item-1": [makeNeighbor("entity-a")] },
    });
    const p2 = makeContract().assemble({
      rankedItems,
      structuralEnrichment: { "item-1": [makeNeighbor("entity-b")] },
    });
    expect(p1.packetHash).not.toBe(p2.packetHash);
  });

  it("different title for same itemId/rank/content → different entryHash", () => {
    const p1 = makeContract().assemble({
      rankedItems: [makeRankedItem({ itemId: "item-1", rank: 1, title: "Title A", content: "alpha" })],
    });
    const p2 = makeContract().assemble({
      rankedItems: [makeRankedItem({ itemId: "item-1", rank: 1, title: "Title B", content: "alpha" })],
    });
    expect(p1.entries[0].entryHash).not.toBe(p2.entries[0].entryHash);
  });

  it("entryHash is time-independent", () => {
    const req = makeRequest();
    const c1 = new KnowledgeContextAssemblyContract({ now: () => "2026-01-01T00:00:00.000Z" });
    const c2 = new KnowledgeContextAssemblyContract({ now: () => "2026-06-01T00:00:00.000Z" });
    expect(c1.assemble(req).entries[0].entryHash).toBe(c2.assemble(req).entries[0].entryHash);
  });
});
