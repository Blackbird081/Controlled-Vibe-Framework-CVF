import { describe, it, expect } from "vitest";
import {
  KnowledgeContextAssemblyConsumerPipelineContract,
  createKnowledgeContextAssemblyConsumerPipelineContract,
} from "../src/knowledge.context.assembly.consumer.pipeline.contract";
import type {
  KnowledgeContextAssemblyConsumerPipelineRequest,
} from "../src/knowledge.context.assembly.consumer.pipeline.contract";
import type { RankableKnowledgeItem } from "../src/knowledge.ranking.contract";
import type { StructuralNeighbor } from "../src/knowledge.structural.index.contract";

// ─── W76-T1: KnowledgeContextAssemblyConsumerPipelineContract ────────────────

const FIXED_NOW = "2026-04-14T00:00:00.000Z";

function makeItem(id: string, relevanceScore = 0.8): RankableKnowledgeItem {
  return {
    itemId: id,
    title: `Title ${id}`,
    content: `Content for ${id}`,
    relevanceScore,
    source: "test-source",
  };
}

function makeNeighbor(entityId: string): StructuralNeighbor {
  return { entityId, label: `Label ${entityId}`, relationType: "depends_on", depth: 1 };
}

function makeRequest(
  opts: {
    items?: RankableKnowledgeItem[];
    structuralEnrichment?: Record<string, StructuralNeighbor[]>;
    consumerId?: string;
  } = {},
): KnowledgeContextAssemblyConsumerPipelineRequest {
  return {
    rankingRequest: {
      query: "what is the governance lifecycle?",
      contextId: "ctx-test",
      candidateItems: opts.items ?? [makeItem("item-1", 0.9), makeItem("item-2", 0.7)],
    },
    structuralEnrichment: opts.structuralEnrichment,
    consumerId: opts.consumerId,
  };
}

function makeContract(): KnowledgeContextAssemblyConsumerPipelineContract {
  return createKnowledgeContextAssemblyConsumerPipelineContract({ now: () => FIXED_NOW });
}

// --- factory ---

describe("KnowledgeContextAssemblyConsumerPipelineContract — factory", () => {
  it("createKnowledgeContextAssemblyConsumerPipelineContract returns an instance", () => {
    expect(createKnowledgeContextAssemblyConsumerPipelineContract())
      .toBeInstanceOf(KnowledgeContextAssemblyConsumerPipelineContract);
  });
});

// --- output shape ---

describe("KnowledgeContextAssemblyConsumerPipelineContract — output shape", () => {
  it("result has all required fields", () => {
    const r = makeContract().execute(makeRequest());
    expect(r).toHaveProperty("resultId");
    expect(r).toHaveProperty("createdAt");
    expect(r).toHaveProperty("rankedResult");
    expect(r).toHaveProperty("contextPacket");
    expect(r).toHaveProperty("consumerPackage");
    expect(r).toHaveProperty("pipelineHash");
    expect(r).toHaveProperty("warnings");
  });

  it("createdAt matches injected timestamp", () => {
    expect(makeContract().execute(makeRequest()).createdAt).toBe(FIXED_NOW);
  });

  it("consumerId is passed through when provided", () => {
    const r = makeContract().execute(makeRequest({ consumerId: "consumer-abc" }));
    expect(r.consumerId).toBe("consumer-abc");
  });

  it("consumerId is undefined when not provided", () => {
    expect(makeContract().execute(makeRequest()).consumerId).toBeUndefined();
  });

  it("rankedResult has items matching candidateItems", () => {
    const r = makeContract().execute(makeRequest());
    expect(r.rankedResult.totalRanked).toBe(2);
  });

  it("contextPacket has entries matching ranked items", () => {
    const r = makeContract().execute(makeRequest());
    expect(r.contextPacket.totalEntries).toBe(2);
  });

  it("consumerPackage is present", () => {
    expect(makeContract().execute(makeRequest()).consumerPackage).toBeDefined();
  });
});

// --- structural enrichment pass-through ---

describe("KnowledgeContextAssemblyConsumerPipelineContract — structural enrichment", () => {
  it("structural neighbors are attached to the correct entry when enrichment provided", () => {
    const neighbor = makeNeighbor("entity-x");
    const r = makeContract().execute(
      makeRequest({ structuralEnrichment: { "item-1": [neighbor] } }),
    );
    const entry = r.contextPacket.entries.find((e) => e.itemId === "item-1");
    expect(entry?.structuralNeighbors).toHaveLength(1);
    expect(entry?.structuralNeighbors[0].entityId).toBe("entity-x");
  });

  it("no enrichment → all entries have empty structuralNeighbors", () => {
    const r = makeContract().execute(makeRequest());
    expect(r.contextPacket.entries.every((e) => e.structuralNeighbors.length === 0)).toBe(true);
  });

  it("consumerPackage knowledge segments include structural summary from assembled context", () => {
    const neighbor = makeNeighbor("entity-x");
    const r = makeContract().execute(
      makeRequest({ structuralEnrichment: { "item-1": [neighbor] } }),
    );
    const knowledgeSegments = r.consumerPackage.typedContextPackage.segments
      .filter((segment) => segment.segmentType === "KNOWLEDGE");
    expect(knowledgeSegments.some((segment) => segment.content.includes("Structural neighbors"))).toBe(true);
    expect(knowledgeSegments.some((segment) => segment.content.includes("Label entity-x"))).toBe(true);
  });
});

// --- warnings ---

describe("KnowledgeContextAssemblyConsumerPipelineContract — warnings", () => {
  it("no warning when items are present", () => {
    expect(makeContract().execute(makeRequest()).warnings).toHaveLength(0);
  });

  it("warning emitted when no candidate items produce empty context", () => {
    const r = makeContract().execute(makeRequest({ items: [] }));
    expect(r.warnings).toHaveLength(1);
    expect(r.warnings[0]).toContain("empty context");
  });

  it("warning message contains [knowledge-assembly]", () => {
    const r = makeContract().execute(makeRequest({ items: [] }));
    expect(r.warnings[0]).toContain("[knowledge-assembly]");
  });
});

// --- determinism ---

describe("KnowledgeContextAssemblyConsumerPipelineContract — determinism", () => {
  it("same input + same timestamp → same pipelineHash", () => {
    const req = makeRequest();
    const r1 = makeContract().execute(req);
    const r2 = makeContract().execute(req);
    expect(r1.pipelineHash).toBe(r2.pipelineHash);
  });

  it("same pipelineHash → same resultId", () => {
    const req = makeRequest();
    const r1 = makeContract().execute(req);
    const r2 = makeContract().execute(req);
    expect(r1.resultId).toBe(r2.resultId);
  });

  it("different items → different pipelineHash", () => {
    const r1 = makeContract().execute(makeRequest({ items: [makeItem("a", 0.9)] }));
    const r2 = makeContract().execute(makeRequest({ items: [makeItem("b", 0.9)] }));
    expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
  });
});
