import { describe, it, expect } from "vitest";
import {
  AsyncExecutionStatusConsumerPipelineContract,
  createAsyncExecutionStatusConsumerPipelineContract,
} from "../src/execution.async.status.consumer.pipeline.contract";
import type { AsyncExecutionStatusConsumerPipelineRequest } from "../src/execution.async.status.consumer.pipeline.contract";
import type { AsyncCommandRuntimeTicket } from "../src/execution.async.runtime.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTicket(
  asyncStatus: AsyncCommandRuntimeTicket["asyncStatus"] = "COMPLETED",
  overrides: Partial<AsyncCommandRuntimeTicket> = {},
): AsyncCommandRuntimeTicket {
  return {
    ticketId: "ticket-001",
    issuedAt: "2026-03-25T10:00:00.000Z",
    sourceRuntimeId: "runtime-001",
    sourceGateId: "gate-001",
    asyncStatus,
    recordCount: 5,
    executedCount: 5,
    failedCount: asyncStatus === "FAILED" ? 1 : 0,
    estimatedTimeoutMs: 5000,
    ticketHash: `hash-ticket-${asyncStatus}`,
    ...overrides,
  };
}

function makeRequest(
  tickets: AsyncCommandRuntimeTicket[] = [makeTicket()],
  overrides: Partial<AsyncExecutionStatusConsumerPipelineRequest> = {},
): AsyncExecutionStatusConsumerPipelineRequest {
  return { tickets, ...overrides };
}

function fixedNow(ts = "2026-03-25T10:00:00.000Z"): () => string {
  return () => ts;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AsyncExecutionStatusConsumerPipelineContract", () => {
  it("returns a result with all required fields for COMPLETED status", () => {
    const contract = createAsyncExecutionStatusConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.resultId).toBeTruthy();
    expect(result.createdAt).toBe("2026-03-25T10:00:00.000Z");
    expect(result.statusSummary).toBeDefined();
    expect(result.statusSummary.dominantStatus).toBe("COMPLETED");
    expect(result.consumerPackage).toBeDefined();
    expect(result.pipelineHash).toBeTruthy();
    expect(result.warnings).toEqual([]);
  });

  it("derives query: [async-status] dominantStatus — N ticket(s)", () => {
    const contract = createAsyncExecutionStatusConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([makeTicket("COMPLETED")]));

    expect(result.consumerPackage.query).toBe("[async-status] COMPLETED — 1 ticket(s)");
  });

  it("query is bounded at 120 chars", () => {
    const contract = createAsyncExecutionStatusConsumerPipelineContract({ now: fixedNow() });
    const manyTickets = Array.from({ length: 9999 }, () => makeTicket("COMPLETED"));
    const result = contract.execute(makeRequest(manyTickets));

    expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
  });

  it("contextId on consumerPackage equals statusSummary.summaryId", () => {
    const contract = createAsyncExecutionStatusConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.consumerPackage.contextId).toBe(result.statusSummary.summaryId);
  });

  it("FAILED ticket produces FAILED dominant status and warning", () => {
    const contract = createAsyncExecutionStatusConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([makeTicket("FAILED")]));

    expect(result.statusSummary.dominantStatus).toBe("FAILED");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("[async-execution-status] dominant status FAILED");
    expect(result.warnings[0]).toContain("failed tickets require immediate intervention");
  });

  it("RUNNING ticket (no failures) produces RUNNING dominant status and warning", () => {
    const contract = createAsyncExecutionStatusConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([makeTicket("RUNNING")]));

    expect(result.statusSummary.dominantStatus).toBe("RUNNING");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("[async-execution-status] dominant status RUNNING");
    expect(result.warnings[0]).toContain("execution in progress");
  });

  it("PENDING ticket (no failures or running) produces PENDING dominant status and no warning", () => {
    const contract = createAsyncExecutionStatusConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([makeTicket("PENDING")]));

    expect(result.statusSummary.dominantStatus).toBe("PENDING");
    expect(result.warnings).toEqual([]);
  });

  it("COMPLETED-only tickets produce COMPLETED dominant status and no warnings", () => {
    const contract = createAsyncExecutionStatusConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([makeTicket("COMPLETED"), makeTicket("COMPLETED")]));

    expect(result.statusSummary.dominantStatus).toBe("COMPLETED");
    expect(result.warnings).toEqual([]);
  });

  it("FAILED dominates RUNNING (FAILED > RUNNING)", () => {
    const contract = createAsyncExecutionStatusConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([makeTicket("RUNNING"), makeTicket("FAILED")]));

    expect(result.statusSummary.dominantStatus).toBe("FAILED");
  });

  it("RUNNING dominates PENDING (RUNNING > PENDING)", () => {
    const contract = createAsyncExecutionStatusConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([makeTicket("PENDING"), makeTicket("RUNNING")]));

    expect(result.statusSummary.dominantStatus).toBe("RUNNING");
  });

  it("empty tickets produce COMPLETED dominant status and no warnings", () => {
    const contract = createAsyncExecutionStatusConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([]));

    expect(result.statusSummary.totalTickets).toBe(0);
    expect(result.statusSummary.dominantStatus).toBe("COMPLETED");
    expect(result.warnings).toEqual([]);
    expect(result.pipelineHash).toBeTruthy();
  });

  it("consumerId is preserved when provided", () => {
    const contract = createAsyncExecutionStatusConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([makeTicket()], { consumerId: "consumer-xyz" }));

    expect(result.consumerId).toBe("consumer-xyz");
  });

  it("consumerId is undefined when not provided", () => {
    const contract = createAsyncExecutionStatusConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.consumerId).toBeUndefined();
  });

  it("resultId differs from pipelineHash", () => {
    const contract = createAsyncExecutionStatusConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.resultId).not.toBe(result.pipelineHash);
  });

  it("consumerPackage contains estimatedTokens", () => {
    const contract = createAsyncExecutionStatusConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(typeof result.consumerPackage.typedContextPackage.estimatedTokens).toBe("number");
  });

  it("is deterministic — same input produces identical hashes", () => {
    const contract = createAsyncExecutionStatusConsumerPipelineContract({ now: fixedNow() });
    const r1 = contract.execute(makeRequest());
    const r2 = contract.execute(makeRequest());

    expect(r1.pipelineHash).toBe(r2.pipelineHash);
    expect(r1.resultId).toBe(r2.resultId);
    expect(r1.statusSummary.summaryHash).toBe(r2.statusSummary.summaryHash);
  });

  it("different asyncStatus produces different hashes", () => {
    const contract = createAsyncExecutionStatusConsumerPipelineContract({ now: fixedNow() });
    const r1 = contract.execute(makeRequest([makeTicket("COMPLETED")]));
    const r2 = contract.execute(makeRequest([makeTicket("FAILED")]));

    expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
  });

  it("factory function creates a working contract", () => {
    const contract = createAsyncExecutionStatusConsumerPipelineContract({ now: fixedNow() });
    expect(contract).toBeInstanceOf(AsyncExecutionStatusConsumerPipelineContract);
    const result = contract.execute(makeRequest());
    expect(result.pipelineHash).toBeTruthy();
  });

  it("direct instantiation works identically to factory", () => {
    const now = fixedNow();
    const direct = new AsyncExecutionStatusConsumerPipelineContract({ now });
    const via = createAsyncExecutionStatusConsumerPipelineContract({ now });

    const r1 = direct.execute(makeRequest());
    const r2 = via.execute(makeRequest());

    expect(r1.pipelineHash).toBe(r2.pipelineHash);
  });
});
