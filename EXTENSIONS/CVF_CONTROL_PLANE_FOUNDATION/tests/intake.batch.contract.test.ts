/**
 * CPF Intake Batch Contract — Dedicated Tests (W35-T1)
 * =====================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   IntakeBatchContract constructor / factory:
 *     - creates a valid instance
 *     - factory creates a valid instance
 *
 *   IntakeBatchContract.batch — empty batch:
 *     - dominantStatus NONE
 *     - totalRequests 0
 *     - completeCount 0
 *     - partialCount 0
 *     - degradedCount 0
 *     - results empty array
 *     - valid batchHash string for empty input
 *
 *   IntakeBatchContract.batch — single PARTIAL request:
 *     - totalRequests 1
 *     - partialCount 1, others 0
 *     - dominantStatus PARTIAL
 *
 *   IntakeBatchContract.batch — single DEGRADED request:
 *     - totalRequests 1
 *     - degradedCount 1, others 0
 *     - dominantStatus DEGRADED
 *
 *   IntakeBatchContract.batch — single COMPLETE request:
 *     - totalRequests 1
 *     - completeCount 1, others 0
 *     - dominantStatus COMPLETE
 *
 *   IntakeBatchContract.batch — dominant status resolution:
 *     - DEGRADED dominates PARTIAL
 *     - DEGRADED dominates COMPLETE
 *     - PARTIAL dominates COMPLETE
 *
 *   IntakeBatchContract.batch — count accuracy:
 *     - mixed batch counts all status types correctly
 *     - all counts sum to totalRequests
 *     - totalRequests equals results array length
 *
 *   IntakeBatchContract.batch — output shape:
 *     - result has all required fields
 *     - createdAt equals injected timestamp
 *     - batchId and batchHash are non-empty strings
 *     - batchId differs from batchHash
 *     - each result has requestId, createdAt, intent, warnings
 *
 *   IntakeBatchContract.batch — determinism:
 *     - same batchHash for identical requests
 *     - same batchId for identical requests
 *     - different batchHash for different batch size
 */

import { describe, it, expect } from "vitest";
import {
  IntakeBatchContract,
  createIntakeBatchContract,
  type IntakeBatch,
} from "../src/intake.batch.contract";
import type {
  ControlPlaneIntakeRequest,
  ControlPlaneIntakeShell,
} from "../src/intake.contract";
import { IntentPipeline } from "../../CVF_ECO_v1.0_INTENT_VALIDATION/src/intent.pipeline";
import { RAGPipeline } from "../../CVF_ECO_v1.4_RAG_PIPELINE/src/rag.pipeline";
import { GovernanceCanvas } from "../../CVF_ECO_v2.1_GOVERNANCE_CANVAS/src/canvas";
import { ContextFreezer } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/context.freezer";
import { FIXED_BATCH_NOW } from "./helpers/cpf.batch.contract.fixtures";

// --- Helpers ---

const FIXED_NOW = FIXED_BATCH_NOW;

/**
 * PARTIAL: valid intent (build → code_security domain, action=build), no RAG docs → warnings present.
 */
const PARTIAL_VIBE = "build a feature";

/**
 * DEGRADED: vibe too short (<5 chars) → intent.valid = false.
 */
const DEGRADED_VIBE = "hi";

/**
 * COMPLETE: valid intent + pre-seeded RAG docs → no warnings.
 * Words: "analyze", "system", "requirements" (all ≥3 chars, score ≥ 0.01).
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

function makePartialContract(): IntakeBatchContract {
  return new IntakeBatchContract({ now: () => FIXED_NOW });
}

function makeCompleteContract(): IntakeBatchContract {
  return new IntakeBatchContract({
    contractDependencies: { shell: makeShellWithDocs() },
    now: () => FIXED_NOW,
  });
}

function req(vibe: string): ControlPlaneIntakeRequest {
  return { vibe };
}

// --- Tests: constructor / factory ---

describe("IntakeBatchContract constructor and factory", () => {
  it("creates a valid instance with no dependencies", () => {
    const contract = new IntakeBatchContract();
    expect(contract).toBeInstanceOf(IntakeBatchContract);
  });

  it("factory creates a valid instance", () => {
    const contract = createIntakeBatchContract({ now: () => FIXED_NOW });
    expect(contract).toBeInstanceOf(IntakeBatchContract);
    const result = contract.batch([]);
    expect(result.dominantStatus).toBe("NONE");
  });
});

// --- Tests: empty batch ---

describe("IntakeBatchContract.batch — empty batch", () => {
  const contract = makePartialContract();

  it("returns dominantStatus NONE for empty input", () => {
    expect(contract.batch([]).dominantStatus).toBe("NONE");
  });

  it("returns totalRequests 0 for empty input", () => {
    expect(contract.batch([]).totalRequests).toBe(0);
  });

  it("returns completeCount 0 for empty input", () => {
    expect(contract.batch([]).completeCount).toBe(0);
  });

  it("returns partialCount 0 for empty input", () => {
    expect(contract.batch([]).partialCount).toBe(0);
  });

  it("returns degradedCount 0 for empty input", () => {
    expect(contract.batch([]).degradedCount).toBe(0);
  });

  it("returns empty results array for empty input", () => {
    expect(contract.batch([]).results).toHaveLength(0);
  });

  it("returns valid batchHash string for empty input", () => {
    const result = contract.batch([]);
    expect(typeof result.batchHash).toBe("string");
    expect(result.batchHash.length).toBeGreaterThan(0);
  });
});

// --- Tests: single PARTIAL request ---

describe("IntakeBatchContract.batch — single PARTIAL request", () => {
  const contract = makePartialContract();

  it("totalRequests is 1", () => {
    expect(contract.batch([req(PARTIAL_VIBE)]).totalRequests).toBe(1);
  });

  it("partialCount is 1, completeCount and degradedCount are 0", () => {
    const result = contract.batch([req(PARTIAL_VIBE)]);
    expect(result.partialCount).toBe(1);
    expect(result.completeCount).toBe(0);
    expect(result.degradedCount).toBe(0);
  });

  it("dominantStatus is PARTIAL", () => {
    expect(contract.batch([req(PARTIAL_VIBE)]).dominantStatus).toBe("PARTIAL");
  });
});

// --- Tests: single DEGRADED request ---

describe("IntakeBatchContract.batch — single DEGRADED request", () => {
  const contract = makePartialContract();

  it("totalRequests is 1", () => {
    expect(contract.batch([req(DEGRADED_VIBE)]).totalRequests).toBe(1);
  });

  it("degradedCount is 1, completeCount and partialCount are 0", () => {
    const result = contract.batch([req(DEGRADED_VIBE)]);
    expect(result.degradedCount).toBe(1);
    expect(result.completeCount).toBe(0);
    expect(result.partialCount).toBe(0);
  });

  it("dominantStatus is DEGRADED", () => {
    expect(contract.batch([req(DEGRADED_VIBE)]).dominantStatus).toBe("DEGRADED");
  });
});

// --- Tests: single COMPLETE request ---

describe("IntakeBatchContract.batch — single COMPLETE request", () => {
  const contract = makeCompleteContract();

  it("totalRequests is 1", () => {
    expect(contract.batch([req(COMPLETE_VIBE)]).totalRequests).toBe(1);
  });

  it("completeCount is 1, partialCount and degradedCount are 0", () => {
    const result = contract.batch([req(COMPLETE_VIBE)]);
    expect(result.completeCount).toBe(1);
    expect(result.partialCount).toBe(0);
    expect(result.degradedCount).toBe(0);
  });

  it("dominantStatus is COMPLETE", () => {
    expect(contract.batch([req(COMPLETE_VIBE)]).dominantStatus).toBe("COMPLETE");
  });
});

// --- Tests: dominant status resolution ---

describe("IntakeBatchContract.batch — dominant status resolution", () => {
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
    const shell = makeShellWithDocs();
    const contract = new IntakeBatchContract({
      contractDependencies: { shell },
      now: () => FIXED_NOW,
    });
    const result = contract.batch([req(COMPLETE_VIBE), req(PARTIAL_VIBE)]);
    expect(result.dominantStatus).toBe("PARTIAL");
  });
});

// --- Tests: count accuracy ---

describe("IntakeBatchContract.batch — count accuracy", () => {
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

  it("all counts sum to totalRequests", () => {
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

  it("totalRequests equals results array length", () => {
    const contract = makePartialContract();
    const result = contract.batch([req(PARTIAL_VIBE), req(DEGRADED_VIBE)]);
    expect(result.totalRequests).toBe(result.results.length);
  });
});

// --- Tests: output shape ---

describe("IntakeBatchContract.batch — output shape", () => {
  it("result has all required fields", () => {
    const result = makePartialContract().batch([req(PARTIAL_VIBE)]);
    expect(result).toHaveProperty("batchId");
    expect(result).toHaveProperty("batchHash");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("totalRequests");
    expect(result).toHaveProperty("completeCount");
    expect(result).toHaveProperty("partialCount");
    expect(result).toHaveProperty("degradedCount");
    expect(result).toHaveProperty("dominantStatus");
    expect(result).toHaveProperty("results");
  });

  it("createdAt equals injected timestamp", () => {
    const result = makePartialContract().batch([req(PARTIAL_VIBE)]);
    expect(result.createdAt).toBe(FIXED_NOW);
  });

  it("batchId and batchHash are non-empty strings", () => {
    const result = makePartialContract().batch([req(PARTIAL_VIBE)]);
    expect(typeof result.batchId).toBe("string");
    expect(result.batchId.length).toBeGreaterThan(0);
    expect(typeof result.batchHash).toBe("string");
    expect(result.batchHash.length).toBeGreaterThan(0);
  });

  it("batchId differs from batchHash", () => {
    const result = makePartialContract().batch([req(PARTIAL_VIBE)]);
    expect(result.batchId).not.toBe(result.batchHash);
  });

  it("each result has requestId, createdAt, intent, warnings fields", () => {
    const result = makePartialContract().batch([req(PARTIAL_VIBE), req(DEGRADED_VIBE)]);
    for (const r of result.results) {
      expect(r).toHaveProperty("requestId");
      expect(r).toHaveProperty("createdAt");
      expect(r).toHaveProperty("intent");
      expect(r).toHaveProperty("warnings");
    }
  });
});

// --- Tests: determinism ---

describe("IntakeBatchContract.batch — determinism", () => {
  it("produces same batchHash for identical requests", () => {
    const contractA = makePartialContract();
    const contractB = makePartialContract();
    expect(
      contractA.batch([req(PARTIAL_VIBE), req(DEGRADED_VIBE)]).batchHash,
    ).toBe(
      contractB.batch([req(PARTIAL_VIBE), req(DEGRADED_VIBE)]).batchHash,
    );
  });

  it("produces same batchId for identical requests", () => {
    const contractA = makePartialContract();
    const contractB = makePartialContract();
    expect(
      contractA.batch([req(PARTIAL_VIBE)]).batchId,
    ).toBe(
      contractB.batch([req(PARTIAL_VIBE)]).batchId,
    );
  });

  it("produces different batchHash for different batch size", () => {
    const contract = makePartialContract();
    const r1 = contract.batch([req(PARTIAL_VIBE)]);
    const r2 = contract.batch([req(PARTIAL_VIBE), req(PARTIAL_VIBE)]);
    expect(r1.batchHash).not.toBe(r2.batchHash);
  });
});
