/**
 * CPF Gateway Consumer Batch Contract — Dedicated Tests (W45-T1)
 * ================================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   GatewayConsumerBatchContract.batch — empty batch:
 *     - dominantStatus NONE
 *     - all counts zero
 *     - receipts empty array
 *     - batchId and batchHash non-empty strings
 *
 *   GatewayConsumerBatchContract.batch — single PARTIAL signal:
 *     - totalRequests 1
 *     - partialCount 1, others 0
 *     - dominantStatus PARTIAL
 *
 *   GatewayConsumerBatchContract.batch — single DEGRADED signal:
 *     - totalRequests 1
 *     - degradedCount 1, others 0
 *     - dominantStatus DEGRADED
 *
 *   GatewayConsumerBatchContract.batch — single COMPLETE signal:
 *     - totalRequests 1
 *     - completedCount 1, others 0
 *     - dominantStatus COMPLETE
 *
 *   GatewayConsumerBatchContract.batch — dominant status resolution:
 *     - DEGRADED dominates PARTIAL
 *     - DEGRADED dominates COMPLETE
 *     - PARTIAL dominates COMPLETE
 *
 *   GatewayConsumerBatchContract.batch — count accuracy:
 *     - mixed batch counts all status types correctly
 *     - all counts sum to totalRequests
 *     - totalRequests equals receipts array length
 *     - warnedCount equals receipts with warnings.length > 0
 *
 *   GatewayConsumerBatchContract.batch — totalChunksRetrieved:
 *     - zero for PARTIAL receipts (no RAG docs)
 *     - sums intakeResult.retrieval.chunkCount across receipts
 *
 *   GatewayConsumerBatchContract.batch — output shape:
 *     - result has all required fields
 *     - createdAt equals injected timestamp
 *     - batchId differs from batchHash
 *
 *   GatewayConsumerBatchContract.batch — determinism:
 *     - same batchHash for identical signals
 *     - different batchHash for different batch size
 */

import { describe, it, expect } from "vitest";
import {
  GatewayConsumerBatchContract,
  createGatewayConsumerBatchContract,
  type GatewayConsumptionBatchResult,
} from "../src/gateway.consumer.batch.contract";
import type { GatewaySignalRequest } from "../src/ai.gateway.contract";
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
const PARTIAL_SIGNAL_RAW = "build a feature";

/**
 * DEGRADED: vibe too short (<5 chars) → intent.valid = false.
 */
const DEGRADED_SIGNAL_RAW = "hi";

/**
 * COMPLETE: valid intent + pre-seeded RAG docs → chunkCount > 0.
 */
const COMPLETE_SIGNAL_RAW = "analyze system requirements";

function makeShellWithDocs(): ControlPlaneIntakeShell {
  const rag = new RAGPipeline();
  rag.getStore().add({
    id: "test-doc-gateway-consumer",
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

function makePartialContract(): GatewayConsumerBatchContract {
  return new GatewayConsumerBatchContract({ now: () => FIXED_NOW });
}

function makeCompleteContract(): GatewayConsumerBatchContract {
  return new GatewayConsumerBatchContract({
    contractDependencies: {
      intakeDependencies: { shell: makeShellWithDocs() },
    },
    now: () => FIXED_NOW,
  });
}

function sig(rawSignal: string, consumerId?: string): GatewaySignalRequest {
  return { rawSignal, consumerId: consumerId ?? `consumer-${rawSignal.slice(0, 4)}` };
}

// --- empty batch ---

describe("GatewayConsumerBatchContract.batch — empty batch", () => {
  it("returns dominantStatus NONE for empty input", () => {
    const contract = makePartialContract();
    expect(contract.batch([]).dominantStatus).toBe("NONE");
  });

  it("all counts are zero for empty input", () => {
    const contract = makePartialContract();
    const result = contract.batch([]);
    expect(result.totalRequests).toBe(0);
    expect(result.completedCount).toBe(0);
    expect(result.partialCount).toBe(0);
    expect(result.degradedCount).toBe(0);
    expect(result.warnedCount).toBe(0);
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

// --- single PARTIAL signal ---

describe("GatewayConsumerBatchContract.batch — single PARTIAL signal", () => {
  it("totalRequests is 1", () => {
    const contract = makePartialContract();
    expect(contract.batch([sig(PARTIAL_SIGNAL_RAW)]).totalRequests).toBe(1);
  });

  it("partialCount is 1, completedCount and degradedCount are 0", () => {
    const contract = makePartialContract();
    const result = contract.batch([sig(PARTIAL_SIGNAL_RAW)]);
    expect(result.partialCount).toBe(1);
    expect(result.completedCount).toBe(0);
    expect(result.degradedCount).toBe(0);
  });

  it("dominantStatus is PARTIAL", () => {
    const contract = makePartialContract();
    expect(contract.batch([sig(PARTIAL_SIGNAL_RAW)]).dominantStatus).toBe("PARTIAL");
  });
});

// --- single DEGRADED signal ---

describe("GatewayConsumerBatchContract.batch — single DEGRADED signal", () => {
  it("totalRequests is 1", () => {
    const contract = makePartialContract();
    expect(contract.batch([sig(DEGRADED_SIGNAL_RAW)]).totalRequests).toBe(1);
  });

  it("degradedCount is 1, completedCount and partialCount are 0", () => {
    const contract = makePartialContract();
    const result = contract.batch([sig(DEGRADED_SIGNAL_RAW)]);
    expect(result.degradedCount).toBe(1);
    expect(result.completedCount).toBe(0);
    expect(result.partialCount).toBe(0);
  });

  it("dominantStatus is DEGRADED", () => {
    const contract = makePartialContract();
    expect(contract.batch([sig(DEGRADED_SIGNAL_RAW)]).dominantStatus).toBe("DEGRADED");
  });
});

// --- single COMPLETE signal ---

describe("GatewayConsumerBatchContract.batch — single COMPLETE signal", () => {
  it("totalRequests is 1", () => {
    const contract = makeCompleteContract();
    expect(contract.batch([sig(COMPLETE_SIGNAL_RAW)]).totalRequests).toBe(1);
  });

  it("completedCount is 1, partialCount and degradedCount are 0", () => {
    const contract = makeCompleteContract();
    const result = contract.batch([sig(COMPLETE_SIGNAL_RAW)]);
    expect(result.completedCount).toBe(1);
    expect(result.partialCount).toBe(0);
    expect(result.degradedCount).toBe(0);
  });

  it("dominantStatus is COMPLETE", () => {
    const contract = makeCompleteContract();
    expect(contract.batch([sig(COMPLETE_SIGNAL_RAW)]).dominantStatus).toBe("COMPLETE");
  });
});

// --- dominant status resolution ---

describe("GatewayConsumerBatchContract.batch — dominant status resolution", () => {
  it("DEGRADED dominates PARTIAL", () => {
    const contract = makePartialContract();
    const result = contract.batch([sig(PARTIAL_SIGNAL_RAW), sig(DEGRADED_SIGNAL_RAW)]);
    expect(result.dominantStatus).toBe("DEGRADED");
  });

  it("DEGRADED dominates COMPLETE", () => {
    const contract = makeCompleteContract();
    const result = contract.batch([sig(COMPLETE_SIGNAL_RAW), sig(DEGRADED_SIGNAL_RAW)]);
    expect(result.dominantStatus).toBe("DEGRADED");
  });

  it("PARTIAL dominates COMPLETE", () => {
    const contract = makeCompleteContract();
    const result = contract.batch([sig(COMPLETE_SIGNAL_RAW), sig(PARTIAL_SIGNAL_RAW)]);
    expect(result.dominantStatus).toBe("PARTIAL");
  });
});

// --- count accuracy ---

describe("GatewayConsumerBatchContract.batch — count accuracy", () => {
  it("counts all status types correctly in a mixed batch", () => {
    const contract = makePartialContract();
    const result = contract.batch([
      sig(PARTIAL_SIGNAL_RAW),
      sig(PARTIAL_SIGNAL_RAW),
      sig(DEGRADED_SIGNAL_RAW),
    ]);
    expect(result.totalRequests).toBe(3);
    expect(result.partialCount).toBe(2);
    expect(result.degradedCount).toBe(1);
    expect(result.completedCount).toBe(0);
  });

  it("all status counts sum to totalRequests", () => {
    const contract = makePartialContract();
    const result = contract.batch([
      sig(PARTIAL_SIGNAL_RAW),
      sig(DEGRADED_SIGNAL_RAW),
      sig(PARTIAL_SIGNAL_RAW),
    ]);
    expect(
      result.completedCount + result.partialCount + result.degradedCount,
    ).toBe(result.totalRequests);
  });

  it("totalRequests equals receipts array length", () => {
    const contract = makePartialContract();
    const result = contract.batch([sig(PARTIAL_SIGNAL_RAW), sig(DEGRADED_SIGNAL_RAW)]);
    expect(result.totalRequests).toBe(result.receipts.length);
  });

  it("warnedCount equals count of receipts with warnings", () => {
    const contract = makePartialContract();
    const result = contract.batch([sig(PARTIAL_SIGNAL_RAW), sig(DEGRADED_SIGNAL_RAW)]);
    const expectedWarnedCount = result.receipts.filter(
      (r) => r.warnings.length > 0,
    ).length;
    expect(result.warnedCount).toBe(expectedWarnedCount);
  });
});

// --- totalChunksRetrieved ---

describe("GatewayConsumerBatchContract.batch — totalChunksRetrieved", () => {
  it("totalChunksRetrieved is 0 for PARTIAL receipts (no RAG docs)", () => {
    const contract = makePartialContract();
    const result = contract.batch([sig(PARTIAL_SIGNAL_RAW), sig(PARTIAL_SIGNAL_RAW)]);
    expect(result.totalChunksRetrieved).toBe(0);
  });

  it("totalChunksRetrieved sums intakeResult.retrieval.chunkCount across receipts", () => {
    const contract = makeCompleteContract();
    const result = contract.batch([sig(COMPLETE_SIGNAL_RAW), sig(COMPLETE_SIGNAL_RAW)]);
    expect(result.totalChunksRetrieved).toBeGreaterThan(0);
    expect(result.totalChunksRetrieved).toBe(
      result.receipts.reduce(
        (sum, r) => sum + r.intakeResult.retrieval.chunkCount,
        0,
      ),
    );
  });
});

// --- output shape ---

describe("GatewayConsumerBatchContract.batch — output shape", () => {
  it("result has all required fields", () => {
    const result = makePartialContract().batch([sig(PARTIAL_SIGNAL_RAW)]);
    expect(result).toHaveProperty("batchId");
    expect(result).toHaveProperty("batchHash");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("totalRequests");
    expect(result).toHaveProperty("completedCount");
    expect(result).toHaveProperty("partialCount");
    expect(result).toHaveProperty("degradedCount");
    expect(result).toHaveProperty("warnedCount");
    expect(result).toHaveProperty("totalChunksRetrieved");
    expect(result).toHaveProperty("dominantStatus");
    expect(result).toHaveProperty("receipts");
  });

  it("createdAt equals injected timestamp", () => {
    const result = makePartialContract().batch([sig(PARTIAL_SIGNAL_RAW)]);
    expect(result.createdAt).toBe(FIXED_NOW);
  });

  it("batchId differs from batchHash", () => {
    const result = makePartialContract().batch([sig(PARTIAL_SIGNAL_RAW)]);
    expect(result.batchId).not.toBe(result.batchHash);
  });
});

// --- determinism ---

describe("GatewayConsumerBatchContract.batch — determinism", () => {
  it("produces same batchHash for identical signals", () => {
    const contractA = makePartialContract();
    const contractB = makePartialContract();
    expect(
      contractA.batch([sig(PARTIAL_SIGNAL_RAW), sig(DEGRADED_SIGNAL_RAW)]).batchHash,
    ).toBe(
      contractB.batch([sig(PARTIAL_SIGNAL_RAW), sig(DEGRADED_SIGNAL_RAW)]).batchHash,
    );
  });

  it("produces different batchHash for different batch size", () => {
    const contract = makePartialContract();
    const r1 = contract.batch([sig(PARTIAL_SIGNAL_RAW)]);
    const r2 = contract.batch([sig(PARTIAL_SIGNAL_RAW), sig(PARTIAL_SIGNAL_RAW)]);
    expect(r1.batchHash).not.toBe(r2.batchHash);
  });
});

// --- factory ---

describe("GatewayConsumerBatchContract factory", () => {
  it("createGatewayConsumerBatchContract returns a valid instance", () => {
    const contract = createGatewayConsumerBatchContract({ now: () => FIXED_NOW });
    expect(contract).toBeInstanceOf(GatewayConsumerBatchContract);
  });

  it("factory instance batch([]) returns NONE dominantStatus", () => {
    const contract = createGatewayConsumerBatchContract({ now: () => FIXED_NOW });
    expect(contract.batch([]).dominantStatus).toBe("NONE");
  });

  it("factory instance produces non-empty batchHash", () => {
    const contract = createGatewayConsumerBatchContract({ now: () => FIXED_NOW });
    const result = contract.batch([sig(PARTIAL_SIGNAL_RAW)]);
    expect(result.batchHash.length).toBeGreaterThan(0);
  });
});
