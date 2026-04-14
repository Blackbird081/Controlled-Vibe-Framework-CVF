import { describe, it, expect } from "vitest";
import {
  KnowledgeMaintenanceBatchContract,
  createKnowledgeMaintenanceBatchContract,
  type KnowledgeMaintenanceBatch,
} from "../src/knowledge.maintenance.batch.contract";
import type { KnowledgeMaintenanceRequest } from "../src/knowledge.maintenance.contract";
import { CompiledKnowledgeArtifactContract } from "../src/knowledge.compiled.artifact.contract";
import type { CompiledKnowledgeArtifact } from "../src/knowledge.compiled.artifact.contract";
import { FIXED_BATCH_NOW } from "./helpers/cpf.batch.contract.fixtures";

// ─── W73-T2: KnowledgeMaintenanceBatchContract ───────────────────────────────

const COMPILE_NOW  = "2026-01-01T00:00:00.000Z";
const GOVERN_NOW   = "2026-01-02T00:00:00.000Z";

function makeApprovedArtifact(contextId: string): CompiledKnowledgeArtifact {
  const compiler = new CompiledKnowledgeArtifactContract({ now: () => COMPILE_NOW });
  const a = compiler.compile({
    contextId,
    artifactType: "concept",
    sourceIds: ["src-001"],
    citationRef: "Test",
    citationTrail: ["raw:src-001"],
    compiledBy: "test-agent",
    content: `Content for ${contextId}`,
  });
  return new CompiledKnowledgeArtifactContract({ now: () => GOVERN_NOW })
    .govern(a, { decision: "approved" });
}

function makeRequest(contextId: string): KnowledgeMaintenanceRequest {
  return {
    artifact: makeApprovedArtifact(contextId),
    checks: [],
  };
}

function makeBatchContract(): KnowledgeMaintenanceBatchContract {
  return new KnowledgeMaintenanceBatchContract({ now: () => FIXED_BATCH_NOW });
}

// --- empty batch ---

describe("KnowledgeMaintenanceBatchContract — empty batch", () => {
  it("returns totalEvaluated = 0 for empty input", () => {
    expect(makeBatchContract().batch([]).totalEvaluated).toBe(0);
  });

  it("returns empty results array for empty input", () => {
    expect(makeBatchContract().batch([]).results).toHaveLength(0);
  });

  it("batchId differs from batchHash for empty input", () => {
    const b = makeBatchContract().batch([]);
    expect(b.batchId).not.toBe(b.batchHash);
  });
});

// --- single request ---

describe("KnowledgeMaintenanceBatchContract — single request", () => {
  it("returns totalEvaluated = 1", () => {
    expect(makeBatchContract().batch([makeRequest("ctx-1")]).totalEvaluated).toBe(1);
  });

  it("result contains the evaluated artifact's artifactId", () => {
    const req = makeRequest("ctx-1");
    const b = makeBatchContract().batch([req]);
    expect(b.results[0].artifactId).toBe(req.artifact.artifactId);
  });
});

// --- multiple requests ---

describe("KnowledgeMaintenanceBatchContract — multiple requests", () => {
  it("returns correct totalEvaluated for multiple requests", () => {
    const b = makeBatchContract().batch([
      makeRequest("ctx-a"),
      makeRequest("ctx-b"),
      makeRequest("ctx-c"),
    ]);
    expect(b.totalEvaluated).toBe(3);
  });

  it("results are in request order", () => {
    const reqs = [makeRequest("ctx-a"), makeRequest("ctx-b"), makeRequest("ctx-c")];
    const b = makeBatchContract().batch(reqs);
    expect(b.results[0].artifactId).toBe(reqs[0].artifact.artifactId);
    expect(b.results[1].artifactId).toBe(reqs[1].artifact.artifactId);
    expect(b.results[2].artifactId).toBe(reqs[2].artifact.artifactId);
  });
});

// --- output shape ---

describe("KnowledgeMaintenanceBatchContract — output shape", () => {
  it("batch result has all required fields", () => {
    const b: KnowledgeMaintenanceBatch = makeBatchContract().batch([makeRequest("ctx-1")]);
    expect(b).toHaveProperty("batchId");
    expect(b).toHaveProperty("batchHash");
    expect(b).toHaveProperty("createdAt");
    expect(b).toHaveProperty("totalEvaluated");
    expect(b).toHaveProperty("results");
  });

  it("createdAt is injected timestamp", () => {
    expect(makeBatchContract().batch([]).createdAt).toBe(FIXED_BATCH_NOW);
  });
});

// --- determinism ---

describe("KnowledgeMaintenanceBatchContract — determinism", () => {
  it("same requests + same timestamp → same batchHash", () => {
    const reqs = [makeRequest("ctx-1"), makeRequest("ctx-2")];
    const b1 = makeBatchContract().batch(reqs);
    const b2 = makeBatchContract().batch(reqs);
    expect(b1.batchHash).toBe(b2.batchHash);
  });

  it("different totalEvaluated → different batchHash", () => {
    const b1 = makeBatchContract().batch([makeRequest("ctx-1")]);
    const b2 = makeBatchContract().batch([makeRequest("ctx-1"), makeRequest("ctx-2")]);
    expect(b1.batchHash).not.toBe(b2.batchHash);
  });

  it("batchId always differs from batchHash", () => {
    const b = makeBatchContract().batch([makeRequest("ctx-1")]);
    expect(b.batchId).not.toBe(b.batchHash);
  });
});

// --- factory ---

describe("KnowledgeMaintenanceBatchContract — factory", () => {
  it("createKnowledgeMaintenanceBatchContract returns working instance", () => {
    const c = createKnowledgeMaintenanceBatchContract({ now: () => FIXED_BATCH_NOW });
    expect(c.batch([makeRequest("ctx-factory")]).totalEvaluated).toBe(1);
  });

  it("factory with no args uses live timestamp", () => {
    const c = createKnowledgeMaintenanceBatchContract();
    expect(c.batch([]).createdAt).toBeTruthy();
  });
});
