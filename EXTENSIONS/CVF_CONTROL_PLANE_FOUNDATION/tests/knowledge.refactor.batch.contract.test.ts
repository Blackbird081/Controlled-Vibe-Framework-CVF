import { describe, it, expect } from "vitest";
import {
  KnowledgeRefactorBatchContract,
  createKnowledgeRefactorBatchContract,
  type KnowledgeRefactorBatch,
} from "../src/knowledge.refactor.batch.contract";
import type { KnowledgeRefactorRequest } from "../src/knowledge.refactor.contract";
import type { KnowledgeMaintenanceResult } from "../src/knowledge.maintenance.contract";
import { FIXED_BATCH_NOW } from "./helpers/cpf.batch.contract.fixtures";

// ─── W74-T1: KnowledgeRefactorBatchContract ──────────────────────────────────

function makeBatchContract(): KnowledgeRefactorBatchContract {
  return new KnowledgeRefactorBatchContract({ now: () => FIXED_BATCH_NOW });
}

function makeResultWithIssues(artifactId: string): KnowledgeMaintenanceResult {
  const signal = {
    signalId: `sid-${artifactId}`,
    signalHash: `shash-${artifactId}`,
    signalType: "drift" as const,
    artifactId,
    detectedAt: "2026-04-14T00:00:00.000Z",
    message: "drift signal",
  };
  return {
    artifactId,
    evaluatedAt: "2026-04-14T00:00:00.000Z",
    signals: [signal],
    totalSignals: 1,
    hasIssues: true,
    resultHash: `rhash-${artifactId}`,
  };
}

function makeRequest(artifactId: string): KnowledgeRefactorRequest {
  return { result: makeResultWithIssues(artifactId) };
}

// --- empty batch ---

describe("KnowledgeRefactorBatchContract — empty batch", () => {
  it("returns totalProposed = 0 for empty input", () => {
    expect(makeBatchContract().batch([]).totalProposed).toBe(0);
  });

  it("returns empty proposals array for empty input", () => {
    expect(makeBatchContract().batch([]).proposals).toHaveLength(0);
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

describe("KnowledgeRefactorBatchContract — single request", () => {
  it("returns totalProposed = 1", () => {
    expect(makeBatchContract().batch([makeRequest("art-001")]).totalProposed).toBe(1);
  });

  it("proposal artifactId matches input", () => {
    const b = makeBatchContract().batch([makeRequest("art-001")]);
    expect(b.proposals[0].artifactId).toBe("art-001");
  });
});

// --- multiple requests ---

describe("KnowledgeRefactorBatchContract — multiple requests", () => {
  it("returns correct totalProposed for multiple requests", () => {
    const b = makeBatchContract().batch([
      makeRequest("art-a"),
      makeRequest("art-b"),
      makeRequest("art-c"),
    ]);
    expect(b.totalProposed).toBe(3);
  });

  it("proposals are in request order", () => {
    const reqs = [makeRequest("art-a"), makeRequest("art-b"), makeRequest("art-c")];
    const b = makeBatchContract().batch(reqs);
    expect(b.proposals[0].artifactId).toBe("art-a");
    expect(b.proposals[1].artifactId).toBe("art-b");
    expect(b.proposals[2].artifactId).toBe("art-c");
  });
});

// --- output shape ---

describe("KnowledgeRefactorBatchContract — output shape", () => {
  it("batch result has all required fields", () => {
    const b: KnowledgeRefactorBatch = makeBatchContract().batch([makeRequest("art-001")]);
    expect(b).toHaveProperty("batchId");
    expect(b).toHaveProperty("batchHash");
    expect(b).toHaveProperty("createdAt");
    expect(b).toHaveProperty("totalProposed");
    expect(b).toHaveProperty("proposals");
  });
});

// --- determinism ---

describe("KnowledgeRefactorBatchContract — determinism", () => {
  it("same requests + same timestamp → same batchHash", () => {
    const reqs = [makeRequest("art-a"), makeRequest("art-b")];
    const b1 = makeBatchContract().batch(reqs);
    const b2 = makeBatchContract().batch(reqs);
    expect(b1.batchHash).toBe(b2.batchHash);
  });

  it("different totalProposed → different batchHash", () => {
    const b1 = makeBatchContract().batch([makeRequest("art-a")]);
    const b2 = makeBatchContract().batch([makeRequest("art-a"), makeRequest("art-b")]);
    expect(b1.batchHash).not.toBe(b2.batchHash);
  });

  it("batchId always differs from batchHash", () => {
    const b = makeBatchContract().batch([makeRequest("art-a")]);
    expect(b.batchId).not.toBe(b.batchHash);
  });
});

// --- factory ---

describe("KnowledgeRefactorBatchContract — factory", () => {
  it("createKnowledgeRefactorBatchContract returns working instance", () => {
    const c = createKnowledgeRefactorBatchContract({ now: () => FIXED_BATCH_NOW });
    expect(c.batch([makeRequest("art-factory")]).totalProposed).toBe(1);
  });

  it("factory with no args uses live timestamp", () => {
    const c = createKnowledgeRefactorBatchContract();
    expect(c.batch([]).createdAt).toBeTruthy();
  });
});
