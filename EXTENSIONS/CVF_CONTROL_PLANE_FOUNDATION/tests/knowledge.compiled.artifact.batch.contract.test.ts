import { describe, it, expect } from "vitest";
import {
  CompiledKnowledgeArtifactBatchContract,
  createCompiledKnowledgeArtifactBatchContract,
  type CompiledKnowledgeArtifactBatch,
} from "../src/knowledge.compiled.artifact.batch.contract";
import type { CompiledKnowledgeArtifactCompileRequest } from "../src/knowledge.compiled.artifact.contract";
import { FIXED_BATCH_NOW } from "./helpers/cpf.batch.contract.fixtures";

// ─── W72-T4 CP2: CompiledKnowledgeArtifactBatchContract ──────────────────────

function makeRequest(
  contextId: string,
  overrides: Partial<CompiledKnowledgeArtifactCompileRequest> = {},
): CompiledKnowledgeArtifactCompileRequest {
  return {
    contextId,
    artifactType: "concept",
    sourceIds: ["src-001"],
    citationRef: "Test citation",
    citationTrail: ["raw:src-001"],
    compiledBy: "test-agent",
    content: `Content for context ${contextId}`,
    ...overrides,
  };
}

function makeBatchContract(): CompiledKnowledgeArtifactBatchContract {
  return new CompiledKnowledgeArtifactBatchContract({ now: () => FIXED_BATCH_NOW });
}

// --- empty batch ---

describe("CompiledKnowledgeArtifactBatchContract — empty batch", () => {
  it("returns totalCompiled = 0 for empty input", () => {
    expect(makeBatchContract().batch([]).totalCompiled).toBe(0);
  });

  it("returns empty artifacts array for empty input", () => {
    expect(makeBatchContract().batch([]).artifacts).toHaveLength(0);
  });

  it("returns valid batchHash for empty input", () => {
    const result = makeBatchContract().batch([]);
    expect(typeof result.batchHash).toBe("string");
    expect(result.batchHash.length).toBeGreaterThan(0);
  });

  it("returns valid batchId for empty input", () => {
    const result = makeBatchContract().batch([]);
    expect(typeof result.batchId).toBe("string");
    expect(result.batchId.length).toBeGreaterThan(0);
  });

  it("batchId differs from batchHash for empty input", () => {
    const result = makeBatchContract().batch([]);
    expect(result.batchId).not.toBe(result.batchHash);
  });
});

// --- single request ---

describe("CompiledKnowledgeArtifactBatchContract — single request", () => {
  it("returns totalCompiled = 1 for single request", () => {
    expect(makeBatchContract().batch([makeRequest("ctx-1")]).totalCompiled).toBe(1);
  });

  it("delegates to CompiledKnowledgeArtifactContract and returns artifact", () => {
    const result = makeBatchContract().batch([makeRequest("ctx-1")]);
    expect(result.artifacts).toHaveLength(1);
    expect(result.artifacts[0].contextId).toBe("ctx-1");
  });

  it("artifact has governanceStatus pending", () => {
    const result = makeBatchContract().batch([makeRequest("ctx-1")]);
    expect(result.artifacts[0].governanceStatus).toBe("pending");
  });

  it("artifact has governedAt null", () => {
    const result = makeBatchContract().batch([makeRequest("ctx-1")]);
    expect(result.artifacts[0].governedAt).toBeNull();
  });
});

// --- multiple requests ---

describe("CompiledKnowledgeArtifactBatchContract — multiple requests", () => {
  it("returns correct totalCompiled for multiple requests", () => {
    const result = makeBatchContract().batch([
      makeRequest("ctx-a"),
      makeRequest("ctx-b"),
      makeRequest("ctx-c"),
    ]);
    expect(result.totalCompiled).toBe(3);
  });

  it("artifacts are mapped in request order", () => {
    const result = makeBatchContract().batch([
      makeRequest("ctx-a"),
      makeRequest("ctx-b"),
      makeRequest("ctx-c"),
    ]);
    expect(result.artifacts[0].contextId).toBe("ctx-a");
    expect(result.artifacts[1].contextId).toBe("ctx-b");
    expect(result.artifacts[2].contextId).toBe("ctx-c");
  });
});

// --- output shape ---

describe("CompiledKnowledgeArtifactBatchContract — output shape", () => {
  it("batch result has all required fields", () => {
    const result: CompiledKnowledgeArtifactBatch = makeBatchContract().batch([
      makeRequest("ctx-shape"),
    ]);
    expect(result).toHaveProperty("batchId");
    expect(result).toHaveProperty("batchHash");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("totalCompiled");
    expect(result).toHaveProperty("artifacts");
  });

  it("createdAt is injected timestamp", () => {
    const result = makeBatchContract().batch([makeRequest("ctx-ts")]);
    expect(result.createdAt).toBe(FIXED_BATCH_NOW);
  });

  it("each artifact has all required CompiledKnowledgeArtifact fields", () => {
    const result = makeBatchContract().batch([makeRequest("ctx-fields")]);
    const a = result.artifacts[0];
    expect(a).toHaveProperty("artifactId");
    expect(a).toHaveProperty("artifactType");
    expect(a).toHaveProperty("compiledAt");
    expect(a).toHaveProperty("sourceIds");
    expect(a).toHaveProperty("citationRef");
    expect(a).toHaveProperty("citationTrail");
    expect(a).toHaveProperty("contextId");
    expect(a).toHaveProperty("compiledBy");
    expect(a).toHaveProperty("content");
    expect(a).toHaveProperty("artifactHash");
    expect(a).toHaveProperty("governedAt");
    expect(a).toHaveProperty("governanceStatus");
    expect(a).toHaveProperty("rejectionReason");
  });
});

// --- determinism ---

describe("CompiledKnowledgeArtifactBatchContract — determinism", () => {
  it("produces same batchHash for same requests and same timestamp", () => {
    const r1 = makeBatchContract().batch([makeRequest("ctx-1"), makeRequest("ctx-2")]);
    const r2 = makeBatchContract().batch([makeRequest("ctx-1"), makeRequest("ctx-2")]);
    expect(r1.batchHash).toBe(r2.batchHash);
  });

  it("produces same batchId for same requests and same timestamp", () => {
    const r1 = makeBatchContract().batch([makeRequest("ctx-1")]);
    const r2 = makeBatchContract().batch([makeRequest("ctx-1")]);
    expect(r1.batchId).toBe(r2.batchId);
  });

  it("produces different batchHash for different totalCompiled", () => {
    const r1 = makeBatchContract().batch([makeRequest("ctx-1")]);
    const r2 = makeBatchContract().batch([makeRequest("ctx-1"), makeRequest("ctx-2")]);
    expect(r1.batchHash).not.toBe(r2.batchHash);
  });

  it("batchId always differs from batchHash", () => {
    const result = makeBatchContract().batch([makeRequest("ctx-1")]);
    expect(result.batchId).not.toBe(result.batchHash);
  });
});

// --- hash variance by content ---

describe("CompiledKnowledgeArtifactBatchContract — hash variance by content", () => {
  it("produces different batchHash when artifact content differs (same totalCompiled)", () => {
    const r1 = makeBatchContract().batch([makeRequest("ctx-1", { content: "alpha content" })]);
    const r2 = makeBatchContract().batch([makeRequest("ctx-1", { content: "beta content" })]);
    expect(r1.totalCompiled).toBe(r2.totalCompiled);
    expect(r1.batchHash).not.toBe(r2.batchHash);
  });

  it("produces different batchHash when sourceIds differ (same totalCompiled)", () => {
    const r1 = makeBatchContract().batch([makeRequest("ctx-1", { sourceIds: ["src-001"] })]);
    const r2 = makeBatchContract().batch([makeRequest("ctx-1", { sourceIds: ["src-999"] })]);
    expect(r1.totalCompiled).toBe(r2.totalCompiled);
    expect(r1.batchHash).not.toBe(r2.batchHash);
  });
});

// --- validation passthrough ---

describe("CompiledKnowledgeArtifactBatchContract — validation passthrough", () => {
  it("throws when any request violates compile gate requirements", () => {
    expect(() =>
      makeBatchContract().batch([
        makeRequest("ctx-valid"),
        makeRequest("ctx-invalid", { citationTrail: [] }),
      ]),
    ).toThrowError("citationTrail");
  });
});

// --- factory ---

describe("CompiledKnowledgeArtifactBatchContract — factory", () => {
  it("createCompiledKnowledgeArtifactBatchContract returns a working instance", () => {
    const contract = createCompiledKnowledgeArtifactBatchContract({
      now: () => FIXED_BATCH_NOW,
    });
    const result = contract.batch([makeRequest("ctx-factory")]);
    expect(result.totalCompiled).toBe(1);
  });

  it("factory with no arguments uses live timestamp", () => {
    const contract = createCompiledKnowledgeArtifactBatchContract();
    const result = contract.batch([]);
    expect(result.createdAt).toBeTruthy();
    expect(result.totalCompiled).toBe(0);
  });
});
