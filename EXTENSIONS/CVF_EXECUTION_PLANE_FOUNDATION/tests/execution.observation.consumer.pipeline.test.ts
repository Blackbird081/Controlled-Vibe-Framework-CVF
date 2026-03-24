import { describe, it, expect } from "vitest";
import {
  ExecutionObservationConsumerPipelineContract,
  createExecutionObservationConsumerPipelineContract,
} from "../src/execution.observation.consumer.pipeline.contract";
import type {
  ExecutionObservationConsumerPipelineRequest,
} from "../src/execution.observation.consumer.pipeline.contract";
import type { ExecutionPipelineReceipt } from "../src/execution.pipeline.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T13:00:00.000Z";

function fixedNow(): string {
  return FIXED_NOW;
}

function makeReceipt(
  executedCount: number,
  failedCount: number,
  sandboxedCount: number,
  skippedCount: number,
  id: string = "receipt-001",
): ExecutionPipelineReceipt {
  const totalEntries = executedCount + failedCount + sandboxedCount + skippedCount;
  return {
    pipelineReceiptId: id,
    createdAt: FIXED_NOW,
    bridgeReceiptId: "bridge-001",
    orchestrationId: "orch-001",
    gateId: "gate-001",
    runtimeId: "runtime-001",
    commandRuntimeResult: {
      runtimeId: "runtime-001",
      gateId: "gate-001",
      executedAt: FIXED_NOW,
      records: [],
      executedCount,
      sandboxedCount,
      skippedCount,
      failedCount,
      runtimeHash: `rhash-${id}`,
      summary: "test summary",
    },
    totalEntries,
    executedCount,
    sandboxedCount,
    skippedCount,
    failedCount,
    pipelineStages: [],
    pipelineHash: `phash-${id}`,
    warnings: [],
  };
}

function makeRequest(
  receipt: ExecutionPipelineReceipt,
  consumerId?: string,
): ExecutionObservationConsumerPipelineRequest {
  return { receipt, consumerId };
}

function makeContract(): ExecutionObservationConsumerPipelineContract {
  return createExecutionObservationConsumerPipelineContract({ now: fixedNow });
}

const FAILED_RECEIPT = makeReceipt(0, 2, 0, 0, "receipt-failed");
const GATED_RECEIPT = makeReceipt(0, 0, 0, 3, "receipt-gated");
const SANDBOXED_RECEIPT = makeReceipt(0, 0, 2, 0, "receipt-sandboxed");
const PARTIAL_RECEIPT = makeReceipt(2, 0, 1, 0, "receipt-partial");
const SUCCESS_RECEIPT = makeReceipt(3, 0, 0, 0, "receipt-success");

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ExecutionObservationConsumerPipelineContract", () => {
  it("is instantiable via factory", () => {
    const contract = createExecutionObservationConsumerPipelineContract();
    expect(contract).toBeInstanceOf(ExecutionObservationConsumerPipelineContract);
  });

  it("execute returns a result with expected shape", () => {
    const result = makeContract().execute(makeRequest(SUCCESS_RECEIPT));
    expect(result).toHaveProperty("resultId");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("observation");
    expect(result).toHaveProperty("consumerPackage");
    expect(result).toHaveProperty("pipelineHash");
    expect(result).toHaveProperty("warnings");
  });

  it("createdAt matches injected now", () => {
    const result = makeContract().execute(makeRequest(SUCCESS_RECEIPT));
    expect(result.createdAt).toBe(FIXED_NOW);
  });

  it("FAILED — warning contains [observation] prefix", () => {
    const result = makeContract().execute(makeRequest(FAILED_RECEIPT));
    expect(result.observation.outcomeClass).toBe("FAILED");
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain("[observation]");
  });

  it("FAILED — warning references 'failed execution outcome'", () => {
    const result = makeContract().execute(makeRequest(FAILED_RECEIPT));
    expect(result.warnings[0]).toContain("failed execution outcome");
  });

  it("FAILED — warning references 'review execution pipeline'", () => {
    const result = makeContract().execute(makeRequest(FAILED_RECEIPT));
    expect(result.warnings[0]).toContain("review execution pipeline");
  });

  it("GATED — warning references 'gated execution outcome'", () => {
    const result = makeContract().execute(makeRequest(GATED_RECEIPT));
    expect(result.observation.outcomeClass).toBe("GATED");
    expect(result.warnings[0]).toContain("gated execution outcome");
  });

  it("GATED — warning references 'review policy gate'", () => {
    const result = makeContract().execute(makeRequest(GATED_RECEIPT));
    expect(result.warnings[0]).toContain("review policy gate");
  });

  it("SANDBOXED — warning references 'sandboxed execution outcome'", () => {
    const result = makeContract().execute(makeRequest(SANDBOXED_RECEIPT));
    expect(result.observation.outcomeClass).toBe("SANDBOXED");
    expect(result.warnings[0]).toContain("sandboxed execution outcome");
  });

  it("SANDBOXED — warning references 'review sandbox policy'", () => {
    const result = makeContract().execute(makeRequest(SANDBOXED_RECEIPT));
    expect(result.warnings[0]).toContain("review sandbox policy");
  });

  it("PARTIAL — warning references 'partial execution outcome'", () => {
    const result = makeContract().execute(makeRequest(PARTIAL_RECEIPT));
    expect(result.observation.outcomeClass).toBe("PARTIAL");
    expect(result.warnings[0]).toContain("partial execution outcome");
  });

  it("PARTIAL — warning references 'some entries did not complete'", () => {
    const result = makeContract().execute(makeRequest(PARTIAL_RECEIPT));
    expect(result.warnings[0]).toContain("some entries did not complete");
  });

  it("SUCCESS — no warnings", () => {
    const result = makeContract().execute(makeRequest(SUCCESS_RECEIPT));
    expect(result.observation.outcomeClass).toBe("SUCCESS");
    expect(result.warnings).toHaveLength(0);
  });

  it("query contains outcomeClass", () => {
    const result = makeContract().execute(makeRequest(FAILED_RECEIPT));
    expect(result.consumerPackage.query).toContain("FAILED");
  });

  it("query contains 'observation'", () => {
    const result = makeContract().execute(makeRequest(SUCCESS_RECEIPT));
    expect(result.consumerPackage.query).toContain("observation");
  });

  it("query contains 'failed'", () => {
    const result = makeContract().execute(makeRequest(FAILED_RECEIPT));
    expect(result.consumerPackage.query).toContain("failed");
  });

  it("query length is at most 120 chars", () => {
    const result = makeContract().execute(makeRequest(SUCCESS_RECEIPT));
    expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
  });

  it("consumerPackage contextId matches observation.observationId", () => {
    const result = makeContract().execute(makeRequest(SUCCESS_RECEIPT));
    expect(result.consumerPackage.contextId).toBe(result.observation.observationId);
  });

  it("pipelineHash and resultId are non-empty strings", () => {
    const result = makeContract().execute(makeRequest(SUCCESS_RECEIPT));
    expect(typeof result.pipelineHash).toBe("string");
    expect(result.pipelineHash.length).toBeGreaterThan(0);
    expect(typeof result.resultId).toBe("string");
    expect(result.resultId.length).toBeGreaterThan(0);
  });

  it("pipelineHash differs from resultId", () => {
    const result = makeContract().execute(makeRequest(SUCCESS_RECEIPT));
    expect(result.pipelineHash).not.toBe(result.resultId);
  });

  it("is deterministic — same input yields same hashes", () => {
    const contract = makeContract();
    const r1 = contract.execute(makeRequest(SUCCESS_RECEIPT));
    const r2 = contract.execute(makeRequest(SUCCESS_RECEIPT));
    expect(r1.pipelineHash).toBe(r2.pipelineHash);
    expect(r1.resultId).toBe(r2.resultId);
  });

  it("different inputs produce different pipelineHash", () => {
    const contract = makeContract();
    const r1 = contract.execute(makeRequest(FAILED_RECEIPT));
    const r2 = contract.execute(makeRequest(SUCCESS_RECEIPT));
    expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
  });

  it("observation.totalEntries matches receipt input", () => {
    const result = makeContract().execute(makeRequest(FAILED_RECEIPT));
    expect(result.observation.totalEntries).toBe(FAILED_RECEIPT.totalEntries);
  });

  it("consumerId carried through to result", () => {
    const result = makeContract().execute(makeRequest(SUCCESS_RECEIPT, "consumer-obs"));
    expect(result.consumerId).toBe("consumer-obs");
  });

  it("consumerId is undefined when not provided", () => {
    const result = makeContract().execute(makeRequest(SUCCESS_RECEIPT));
    expect(result.consumerId).toBeUndefined();
  });
});
