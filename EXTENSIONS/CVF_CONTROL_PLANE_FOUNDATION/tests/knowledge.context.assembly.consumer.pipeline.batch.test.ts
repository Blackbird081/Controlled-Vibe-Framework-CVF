import { describe, it, expect } from "vitest";
import {
  KnowledgeContextAssemblyConsumerPipelineBatchContract,
  createKnowledgeContextAssemblyConsumerPipelineBatchContract,
} from "../src/knowledge.context.assembly.consumer.pipeline.batch.contract";
import {
  KnowledgeContextAssemblyConsumerPipelineContract,
} from "../src/knowledge.context.assembly.consumer.pipeline.contract";
import type { RankableKnowledgeItem } from "../src/knowledge.ranking.contract";
import { FIXED_BATCH_NOW } from "./helpers/cpf.batch.contract.fixtures";

// ─── W76-T1: KnowledgeContextAssemblyConsumerPipelineBatchContract ────────────

const FIXED_NOW = FIXED_BATCH_NOW;

function makeItem(id: string): RankableKnowledgeItem {
  return { itemId: id, title: `T${id}`, content: `C${id}`, relevanceScore: 0.8, source: "s" };
}

function makePipelineContract() {
  return new KnowledgeContextAssemblyConsumerPipelineContract({ now: () => FIXED_NOW });
}

function makeResult(items: RankableKnowledgeItem[]) {
  return makePipelineContract().execute({
    rankingRequest: { query: "q", contextId: "ctx", candidateItems: items },
  });
}

function makeBatchContract(): KnowledgeContextAssemblyConsumerPipelineBatchContract {
  return new KnowledgeContextAssemblyConsumerPipelineBatchContract({ now: () => FIXED_NOW });
}

// --- empty batch ---

describe("KnowledgeContextAssemblyConsumerPipelineBatchContract — empty batch", () => {
  it("empty results → totalResults = 0", () => {
    expect(makeBatchContract().batch([]).totalResults).toBe(0);
  });

  it("empty results → dominantContextWindowEstimate = 0", () => {
    expect(makeBatchContract().batch([]).dominantContextWindowEstimate).toBe(0);
  });

  it("empty results → emptyAssemblyCount = 0", () => {
    expect(makeBatchContract().batch([]).emptyAssemblyCount).toBe(0);
  });

  it("batchId differs from batchHash for empty input", () => {
    const b = makeBatchContract().batch([]);
    expect(b.batchId).not.toBe(b.batchHash);
  });

  it("createdAt is injected timestamp", () => {
    expect(makeBatchContract().batch([]).createdAt).toBe(FIXED_NOW);
  });
});

// --- single result ---

describe("KnowledgeContextAssemblyConsumerPipelineBatchContract — single result", () => {
  it("totalResults = 1", () => {
    expect(makeBatchContract().batch([makeResult([makeItem("a")])]).totalResults).toBe(1);
  });

  it("dominantContextWindowEstimate equals single packet estimate", () => {
    const r = makeResult([makeItem("a")]);
    const b = makeBatchContract().batch([r]);
    expect(b.dominantContextWindowEstimate).toBe(r.contextPacket.contextWindowEstimate);
  });
});

// --- multiple results ---

describe("KnowledgeContextAssemblyConsumerPipelineBatchContract — multiple results", () => {
  it("totalResults matches input count", () => {
    const results = [makeResult([makeItem("a")]), makeResult([makeItem("b")])];
    expect(makeBatchContract().batch(results).totalResults).toBe(2);
  });

  it("dominantContextWindowEstimate is max across all packets", () => {
    const r1 = makeResult([makeItem("a")]);
    const r2 = makeResult([makeItem("b"), makeItem("c")]);
    const b = makeBatchContract().batch([r1, r2]);
    const expected = Math.max(
      r1.contextPacket.contextWindowEstimate,
      r2.contextPacket.contextWindowEstimate,
    );
    expect(b.dominantContextWindowEstimate).toBe(expected);
  });

  it("emptyAssemblyCount counts results with zero entries", () => {
    const populated = makeResult([makeItem("a")]);
    const empty = makeResult([]);
    const b = makeBatchContract().batch([populated, empty, empty]);
    expect(b.emptyAssemblyCount).toBe(2);
  });
});

// --- output shape ---

describe("KnowledgeContextAssemblyConsumerPipelineBatchContract — output shape", () => {
  it("batch result has all required fields", () => {
    const b = makeBatchContract().batch([makeResult([makeItem("a")])]);
    expect(b).toHaveProperty("batchId");
    expect(b).toHaveProperty("batchHash");
    expect(b).toHaveProperty("createdAt");
    expect(b).toHaveProperty("totalResults");
    expect(b).toHaveProperty("dominantContextWindowEstimate");
    expect(b).toHaveProperty("emptyAssemblyCount");
    expect(b).toHaveProperty("results");
  });
});

// --- determinism ---

describe("KnowledgeContextAssemblyConsumerPipelineBatchContract — determinism", () => {
  it("same results + same timestamp → same batchHash", () => {
    const results = [makeResult([makeItem("a")])];
    const b1 = makeBatchContract().batch(results);
    const b2 = makeBatchContract().batch(results);
    expect(b1.batchHash).toBe(b2.batchHash);
  });

  it("batchId always differs from batchHash", () => {
    const b = makeBatchContract().batch([makeResult([makeItem("a")])]);
    expect(b.batchId).not.toBe(b.batchHash);
  });
});

// --- factory ---

describe("KnowledgeContextAssemblyConsumerPipelineBatchContract — factory", () => {
  it("createKnowledgeContextAssemblyConsumerPipelineBatchContract returns working instance", () => {
    const c = createKnowledgeContextAssemblyConsumerPipelineBatchContract({ now: () => FIXED_NOW });
    expect(c.batch([makeResult([makeItem("x")])]).totalResults).toBe(1);
  });
});
