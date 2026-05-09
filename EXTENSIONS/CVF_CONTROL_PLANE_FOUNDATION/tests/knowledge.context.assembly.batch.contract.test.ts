import { describe, it, expect } from "vitest";
import {
  KnowledgeContextAssemblyBatchContract,
  createKnowledgeContextAssemblyBatchContract,
  type KnowledgeContextAssemblyBatch,
} from "../src/knowledge.context.assembly.batch.contract";
import type { KnowledgeContextAssemblyRequest } from "../src/knowledge.context.assembly.contract";
import type { RankedKnowledgeItem } from "../src/knowledge.ranking.contract";
import { FIXED_BATCH_NOW } from "./helpers/cpf.batch.contract.fixtures";

// ─── W75-T1: KnowledgeContextAssemblyBatchContract ───────────────────────────

function makeBatchContract(): KnowledgeContextAssemblyBatchContract {
  return new KnowledgeContextAssemblyBatchContract({ now: () => FIXED_BATCH_NOW });
}

function makeItem(itemId: string, rank: number): RankedKnowledgeItem {
  return {
    itemId,
    title: `Title ${itemId}`,
    content: `Content ${itemId}`,
    relevanceScore: 0.8,
    source: "test",
    compositeScore: 0.75,
    scoreBreakdown: { relevanceContribution: 0.6, tierContribution: 0.1, recencyContribution: 0.05 },
    rank,
  };
}

function makeRequest(suffix: string): KnowledgeContextAssemblyRequest {
  return { rankedItems: [makeItem(`item-${suffix}`, 1)] };
}

// --- empty batch ---

describe("KnowledgeContextAssemblyBatchContract — empty batch", () => {
  it("returns totalAssembled = 0 for empty input", () => {
    expect(makeBatchContract().batch([]).totalAssembled).toBe(0);
  });

  it("returns empty packets array for empty input", () => {
    expect(makeBatchContract().batch([]).packets).toHaveLength(0);
  });

  it("batchId differs from batchHash for empty input", () => {
    const b = makeBatchContract().batch([]);
    expect(b.batchId).not.toBe(b.batchHash);
  });

  it("createdAt is injected timestamp", () => {
    expect(makeBatchContract().batch([]).createdAt).toBe(FIXED_BATCH_NOW);
  });
});

// --- single request ---

describe("KnowledgeContextAssemblyBatchContract — single request", () => {
  it("returns totalAssembled = 1", () => {
    expect(makeBatchContract().batch([makeRequest("a")]).totalAssembled).toBe(1);
  });

  it("packet totalEntries = 1 for single-item request", () => {
    expect(makeBatchContract().batch([makeRequest("a")]).packets[0].totalEntries).toBe(1);
  });
});

// --- multiple requests ---

describe("KnowledgeContextAssemblyBatchContract — multiple requests", () => {
  it("returns correct totalAssembled for multiple requests", () => {
    expect(
      makeBatchContract().batch([makeRequest("a"), makeRequest("b"), makeRequest("c")]).totalAssembled,
    ).toBe(3);
  });

  it("packets are in request order", () => {
    const reqs = [makeRequest("a"), makeRequest("b"), makeRequest("c")];
    const b = makeBatchContract().batch(reqs);
    expect(b.packets[0].entries[0].itemId).toBe("item-a");
    expect(b.packets[1].entries[0].itemId).toBe("item-b");
    expect(b.packets[2].entries[0].itemId).toBe("item-c");
  });
});

// --- output shape ---

describe("KnowledgeContextAssemblyBatchContract — output shape", () => {
  it("batch result has all required fields", () => {
    const b: KnowledgeContextAssemblyBatch = makeBatchContract().batch([makeRequest("a")]);
    expect(b).toHaveProperty("batchId");
    expect(b).toHaveProperty("batchHash");
    expect(b).toHaveProperty("createdAt");
    expect(b).toHaveProperty("totalAssembled");
    expect(b).toHaveProperty("packets");
  });
});

// --- determinism ---

describe("KnowledgeContextAssemblyBatchContract — determinism", () => {
  it("same requests + same timestamp → same batchHash", () => {
    const reqs = [makeRequest("a"), makeRequest("b")];
    const b1 = makeBatchContract().batch(reqs);
    const b2 = makeBatchContract().batch(reqs);
    expect(b1.batchHash).toBe(b2.batchHash);
  });

  it("different totalAssembled → different batchHash", () => {
    const b1 = makeBatchContract().batch([makeRequest("a")]);
    const b2 = makeBatchContract().batch([makeRequest("a"), makeRequest("b")]);
    expect(b1.batchHash).not.toBe(b2.batchHash);
  });

  it("batchId always differs from batchHash", () => {
    const b = makeBatchContract().batch([makeRequest("a")]);
    expect(b.batchId).not.toBe(b.batchHash);
  });
});

// --- factory ---

describe("KnowledgeContextAssemblyBatchContract — factory", () => {
  it("createKnowledgeContextAssemblyBatchContract returns working instance", () => {
    const c = createKnowledgeContextAssemblyBatchContract({ now: () => FIXED_BATCH_NOW });
    expect(c.batch([makeRequest("x")]).totalAssembled).toBe(1);
  });

  it("factory with no args uses live timestamp", () => {
    const c = createKnowledgeContextAssemblyBatchContract();
    expect(c.batch([]).createdAt).toBeTruthy();
  });
});
