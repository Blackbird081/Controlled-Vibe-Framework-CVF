/**
 * CPF Consumer Batch Contract — Dedicated Tests (W44-T1)
 * ========================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   ConsumerBatchContract.batch — empty batch:
 *     - dominantStatus NONE
 *     - all counts zero
 *     - receipts empty array
 *     - batchId and batchHash non-empty strings
 *
 *   ConsumerBatchContract.batch — single PARTIAL request:
 *     - totalRequests 1
 *     - partialCount 1, others 0
 *     - dominantStatus PARTIAL
 *
 *   ConsumerBatchContract.batch — single DEGRADED request:
 *     - totalRequests 1
 *     - degradedCount 1, others 0
 *     - dominantStatus DEGRADED
 *
 *   ConsumerBatchContract.batch — single COMPLETE request:
 *     - totalRequests 1
 *     - completeCount 1, others 0
 *     - dominantStatus COMPLETE
 *
 *   ConsumerBatchContract.batch — dominant status resolution:
 *     - DEGRADED dominates PARTIAL
 *     - DEGRADED dominates COMPLETE
 *     - PARTIAL dominates COMPLETE
 *
 *   ConsumerBatchContract.batch — count accuracy:
 *     - mixed batch counts all status types correctly
 *     - all counts sum to totalRequests
 *     - totalRequests equals receipts array length
 *     - frozenCount counts only receipts with freeze defined
 *
 *   ConsumerBatchContract.batch — totalChunksRetrieved:
 *     - zero for PARTIAL receipts (no RAG docs)
 *     - sums intake.retrieval.chunkCount across receipts
 *
 *   ConsumerBatchContract.batch — output shape:
 *     - result has all required fields
 *     - createdAt equals injected timestamp
 *     - batchId differs from batchHash
 *
 *   ConsumerBatchContract.batch — determinism:
 *     - same batchHash for identical requests
 *     - different batchHash for different batch size
 */

import { describe, it, expect } from "vitest";
import {
  ConsumerBatchContract,
  createConsumerBatchContract,
  type ConsumerBatch,
} from "../src/consumer.batch.contract";
import type { ConsumerRequest } from "../src/consumer.contract";
import type { ControlPlaneIntakeShell } from "../src/intake.contract";
import { IntentPipeline } from "../../CVF_ECO_v1.0_INTENT_VALIDATION/src/intent.pipeline";
import { RAGPipeline } from "../../CVF_ECO_v1.4_RAG_PIPELINE/src/rag.pipeline";
import { GovernanceCanvas } from "../../CVF_ECO_v2.1_GOVERNANCE_CANVAS/src/canvas";
import { ContextFreezer } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/context.freezer";
import { FIXED_BATCH_NOW } from "./helpers/cpf.batch.contract.fixtures";

// --- Helpers ---

const FIXED_NOW = FIXED_BATCH_NOW;

/**
 * PARTIAL: valid intent, no RAG docs → chunkCount === 0.
 */
const PARTIAL_VIBE = "build a feature";

/**
 * DEGRADED: vibe too short (<5 chars) → intent.valid = false.
 */
const DEGRADED_VIBE = "hi";

/**
 * COMPLETE: valid intent + pre-seeded RAG docs → chunkCount > 0.
 */
const COMPLETE_VIBE = "analyze system requirements";

function makeShellWithDocs(): ControlPlaneIntakeShell {
  const rag = new RAGPipeline();
  rag.getStore().add({
    id: "test-doc-complete",
    title: "analyze system requirements guide",
    content: "how to analyze system requirements for software projects",
    tier: "T3_OPERATIONAL",
    documentType: "context_snippet",
    tags: [],
    metadata: {},
  });
  return {
    intent: new IntentPipeline(),
    knowledge: rag,
    reporting: new GovernanceCanvas(),
    context: new ContextFreezer(),
  };
}

function makePartialContract(): ConsumerBatchContract {
  return new ConsumerBatchContract({ now: () => FIXED_NOW });
}

function makeCompleteContract(): ConsumerBatchContract {
  return new ConsumerBatchContract({
    contractDependencies: { shell: makeShellWithDocs() },
    now: () => FIXED_NOW,
  });
}

function req(vibe: string, executionId?: string): ConsumerRequest {
  return { vibe, consumerId: `consumer-${vibe.slice(0, 4)}`, executionId };
}

// --- empty batch ---

describe("ConsumerBatchContract.batch — empty batch", () => {
  it("returns dominantStatus NONE for empty input", () => {
    const contract = makePartialContract();
    expect(contract.batch([]).dominantStatus).toBe("NONE");
  });

  it("all counts are zero for empty input", () => {
    const contract = makePartialContract();
    const result = contract.batch([]);
    expect(result.totalRequests).toBe(0);
    expect(result.completeCount).toBe(0);
    expect(result.partialCount).toBe(0);
    expect(result.degradedCount).toBe(0);
    expect(result.frozenCount).toBe(0);
    expect(result.totalChunksRetrieved).toBe(0);
  });

  it("receipts is an empty array for empty input", () => {
    const contract = makePartialContract();
    expect(contract.batch([]).receipts).toHaveLength(0);
  });

  it("batchId and batchHash are non-empty strings for empty input", () => {
    const contract = makePartialContract();
    const result = contract.batch([]);
    expect(typeof result.batchHash).toBe("string");
    expect(result.batchHash.length).toBeGreaterThan(0);
    expect(typeof result.batchId).toBe("string");
    expect(result.batchId.length).toBeGreaterThan(0);
  });
});

// --- single PARTIAL request ---

describe("ConsumerBatchContract.batch — single PARTIAL request", () => {
  it("totalRequests is 1", () => {
    const contract = makePartialContract();
    expect(contract.batch([req(PARTIAL_VIBE)]).totalRequests).toBe(1);
  });

  it("partialCount is 1, completeCount and degradedCount are 0", () => {
    const contract = makePartialContract();
    const result = contract.batch([req(PARTIAL_VIBE)]);
    expect(result.partialCount).toBe(1);
    expect(result.completeCount).toBe(0);
    expect(result.degradedCount).toBe(0);
  });

  it("dominantStatus is PARTIAL", () => {
    const contract = makePartialContract();
    expect(contract.batch([req(PARTIAL_VIBE)]).dominantStatus).toBe("PARTIAL");
  });
});

// --- single DEGRADED request ---

describe("ConsumerBatchContract.batch — single DEGRADED request", () => {
  it("totalRequests is 1", () => {
    const contract = makePartialContract();
    expect(contract.batch([req(DEGRADED_VIBE)]).totalRequests).toBe(1);
  });

  it("degradedCount is 1, completeCount and partialCount are 0", () => {
    const contract = makePartialContract();
    const result = contract.batch([req(DEGRADED_VIBE)]);
    expect(result.degradedCount).toBe(1);
    expect(result.completeCount).toBe(0);
    expect(result.partialCount).toBe(0);
  });

  it("dominantStatus is DEGRADED", () => {
    const contract = makePartialContract();
    expect(contract.batch([req(DEGRADED_VIBE)]).dominantStatus).toBe("DEGRADED");
  });
});

// --- single COMPLETE request ---

describe("ConsumerBatchContract.batch — single COMPLETE request", () => {
  it("totalRequests is 1", () => {
    const contract = makeCompleteContract();
    expect(contract.batch([req(COMPLETE_VIBE)]).totalRequests).toBe(1);
  });

  it("completeCount is 1, partialCount and degradedCount are 0", () => {
    const contract = makeCompleteContract();
    const result = contract.batch([req(COMPLETE_VIBE)]);
    expect(result.completeCount).toBe(1);
    expect(result.partialCount).toBe(0);
    expect(result.degradedCount).toBe(0);
  });

  it("dominantStatus is COMPLETE", () => {
    const contract = makeCompleteContract();
    expect(contract.batch([req(COMPLETE_VIBE)]).dominantStatus).toBe("COMPLETE");
  });
});

// --- dominant status resolution ---

describe("ConsumerBatchContract.batch — dominant status resolution", () => {
  it("DEGRADED dominates PARTIAL", () => {
    const contract = makePartialContract();
    const result = contract.batch([req(PARTIAL_VIBE), req(DEGRADED_VIBE)]);
    expect(result.dominantStatus).toBe("DEGRADED");
  });

  it("DEGRADED dominates COMPLETE", () => {
    const contract = makeCompleteContract();
    const result = contract.batch([req(COMPLETE_VIBE), req(DEGRADED_VIBE)]);
    expect(result.dominantStatus).toBe("DEGRADED");
  });

  it("PARTIAL dominates COMPLETE", () => {
    const contract = new ConsumerBatchContract({
      contractDependencies: { shell: makeShellWithDocs() },
      now: () => FIXED_NOW,
    });
    const result = contract.batch([req(COMPLETE_VIBE), req(PARTIAL_VIBE)]);
    expect(result.dominantStatus).toBe("PARTIAL");
  });
});

// --- count accuracy ---

describe("ConsumerBatchContract.batch — count accuracy", () => {
  it("counts all status types correctly in a mixed batch", () => {
    const contract = makePartialContract();
    const result = contract.batch([
      req(PARTIAL_VIBE),
      req(PARTIAL_VIBE),
      req(DEGRADED_VIBE),
    ]);
    expect(result.totalRequests).toBe(3);
    expect(result.partialCount).toBe(2);
    expect(result.degradedCount).toBe(1);
    expect(result.completeCount).toBe(0);
  });

  it("all status counts sum to totalRequests", () => {
    const contract = makePartialContract();
    const result = contract.batch([
      req(PARTIAL_VIBE),
      req(DEGRADED_VIBE),
      req(PARTIAL_VIBE),
    ]);
    expect(
      result.completeCount + result.partialCount + result.degradedCount,
    ).toBe(result.totalRequests);
  });

  it("totalRequests equals receipts array length", () => {
    const contract = makePartialContract();
    const result = contract.batch([req(PARTIAL_VIBE), req(DEGRADED_VIBE)]);
    expect(result.totalRequests).toBe(result.receipts.length);
  });

  it("frozenCount counts only receipts with executionId", () => {
    const contract = makePartialContract();
    const result = contract.batch([
      req(PARTIAL_VIBE, "exec-1"),
      req(PARTIAL_VIBE),
      req(PARTIAL_VIBE, "exec-2"),
    ]);
    expect(result.frozenCount).toBe(2);
  });
});

// --- totalChunksRetrieved ---

describe("ConsumerBatchContract.batch — totalChunksRetrieved", () => {
  it("totalChunksRetrieved is 0 for PARTIAL receipts (no RAG docs)", () => {
    const contract = makePartialContract();
    const result = contract.batch([req(PARTIAL_VIBE), req(PARTIAL_VIBE)]);
    expect(result.totalChunksRetrieved).toBe(0);
  });

  it("totalChunksRetrieved sums intake.retrieval.chunkCount across receipts", () => {
    const contract = makeCompleteContract();
    const result = contract.batch([req(COMPLETE_VIBE), req(COMPLETE_VIBE)]);
    expect(result.totalChunksRetrieved).toBeGreaterThan(0);
    expect(result.totalChunksRetrieved).toBe(
      result.receipts.reduce((sum, r) => sum + r.intake.retrieval.chunkCount, 0),
    );
  });
});

// --- output shape ---

describe("ConsumerBatchContract.batch — output shape", () => {
  it("result has all required fields", () => {
    const result = makePartialContract().batch([req(PARTIAL_VIBE)]);
    expect(result).toHaveProperty("batchId");
    expect(result).toHaveProperty("batchHash");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("totalRequests");
    expect(result).toHaveProperty("completeCount");
    expect(result).toHaveProperty("partialCount");
    expect(result).toHaveProperty("degradedCount");
    expect(result).toHaveProperty("frozenCount");
    expect(result).toHaveProperty("totalChunksRetrieved");
    expect(result).toHaveProperty("dominantStatus");
    expect(result).toHaveProperty("receipts");
  });

  it("createdAt equals injected timestamp", () => {
    const result = makePartialContract().batch([req(PARTIAL_VIBE)]);
    expect(result.createdAt).toBe(FIXED_NOW);
  });

  it("batchId differs from batchHash", () => {
    const result = makePartialContract().batch([req(PARTIAL_VIBE)]);
    expect(result.batchId).not.toBe(result.batchHash);
  });
});

// --- determinism ---

describe("ConsumerBatchContract.batch — determinism", () => {
  it("produces same batchHash for identical requests", () => {
    const contractA = makePartialContract();
    const contractB = makePartialContract();
    expect(
      contractA.batch([req(PARTIAL_VIBE), req(DEGRADED_VIBE)]).batchHash,
    ).toBe(
      contractB.batch([req(PARTIAL_VIBE), req(DEGRADED_VIBE)]).batchHash,
    );
  });

  it("produces different batchHash for different batch size", () => {
    const contract = makePartialContract();
    const r1 = contract.batch([req(PARTIAL_VIBE)]);
    const r2 = contract.batch([req(PARTIAL_VIBE), req(PARTIAL_VIBE)]);
    expect(r1.batchHash).not.toBe(r2.batchHash);
  });
});

// --- factory ---

describe("ConsumerBatchContract factory", () => {
  it("createConsumerBatchContract returns a valid instance", () => {
    const contract = createConsumerBatchContract({ now: () => FIXED_NOW });
    expect(contract).toBeInstanceOf(ConsumerBatchContract);
  });

  it("factory instance batch([]) returns NONE dominantStatus", () => {
    const contract = createConsumerBatchContract({ now: () => FIXED_NOW });
    expect(contract.batch([]).dominantStatus).toBe("NONE");
  });

  it("factory instance produces non-empty batchHash", () => {
    const contract = createConsumerBatchContract({ now: () => FIXED_NOW });
    const result = contract.batch([req(PARTIAL_VIBE)]);
    expect(result.batchHash.length).toBeGreaterThan(0);
  });
});
