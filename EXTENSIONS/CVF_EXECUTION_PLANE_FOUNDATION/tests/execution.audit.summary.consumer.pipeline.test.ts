import { describe, it, expect } from "vitest";
import {
  ExecutionAuditSummaryConsumerPipelineContract,
  createExecutionAuditSummaryConsumerPipelineContract,
} from "../src/execution.audit.summary.consumer.pipeline.contract";
import type { ExecutionAuditSummaryConsumerPipelineRequest } from "../src/execution.audit.summary.consumer.pipeline.contract";
import type { ExecutionObservation } from "../src/execution.observer.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeObservation(
  outcomeClass: ExecutionObservation["outcomeClass"] = "SUCCESS",
  overrides: Partial<ExecutionObservation> = {},
): ExecutionObservation {
  return {
    observationId: "obs-001",
    createdAt: "2026-03-24T10:00:00.000Z",
    sourcePipelineId: "pipeline-001",
    outcomeClass,
    confidenceSignal: 0.9,
    totalEntries: 5,
    executedCount: 5,
    failedCount: 0,
    sandboxedCount: 0,
    skippedCount: 0,
    notes: [],
    observationHash: "hash-obs-001",
    ...overrides,
  };
}

function makeRequest(
  observations: ExecutionObservation[] = [makeObservation()],
  overrides: Partial<ExecutionAuditSummaryConsumerPipelineRequest> = {},
): ExecutionAuditSummaryConsumerPipelineRequest {
  return { observations, ...overrides };
}

function fixedNow(ts = "2026-03-24T10:00:00.000Z"): () => string {
  return () => ts;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ExecutionAuditSummaryConsumerPipelineContract", () => {
  it("returns a result with all required fields for SUCCESS/NONE risk", () => {
    const contract = createExecutionAuditSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.resultId).toBeTruthy();
    expect(result.createdAt).toBe("2026-03-24T10:00:00.000Z");
    expect(result.auditSummary).toBeDefined();
    expect(result.auditSummary.dominantOutcome).toBe("SUCCESS");
    expect(result.auditSummary.overallRisk).toBe("NONE");
    expect(result.consumerPackage).toBeDefined();
    expect(result.pipelineHash).toBeTruthy();
    expect(result.warnings).toEqual([]);
  });

  it("derives query: dominantOutcome:risk:overallRisk:observations:totalObservations", () => {
    const contract = createExecutionAuditSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([makeObservation("SUCCESS")]));

    expect(result.consumerPackage.query).toBe("SUCCESS:risk:NONE:observations:1");
  });

  it("query is bounded at 120 chars", () => {
    const contract = createExecutionAuditSummaryConsumerPipelineContract({ now: fixedNow() });
    const manyObs = Array.from({ length: 999 }, () => makeObservation("SUCCESS"));
    const result = contract.execute(makeRequest(manyObs));

    expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
  });

  it("contextId on consumerPackage equals auditSummary.summaryId", () => {
    const contract = createExecutionAuditSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.consumerPackage.contextId).toBe(result.auditSummary.summaryId);
  });

  it("FAILED observation produces HIGH risk and warning", () => {
    const contract = createExecutionAuditSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([
      makeObservation("FAILED", { failedCount: 2 }),
    ]));

    expect(result.auditSummary.overallRisk).toBe("HIGH");
    expect(result.auditSummary.dominantOutcome).toBe("FAILED");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("[audit] high execution risk");
    expect(result.warnings[0]).toContain("failed observations detected");
  });

  it("GATED observation (no failures) produces MEDIUM risk and warning", () => {
    const contract = createExecutionAuditSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([
      makeObservation("GATED"),
    ]));

    expect(result.auditSummary.overallRisk).toBe("MEDIUM");
    expect(result.auditSummary.dominantOutcome).toBe("GATED");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("[audit] medium execution risk");
    expect(result.warnings[0]).toContain("gated or sandboxed observations detected");
  });

  it("SANDBOXED observation (no failures) produces MEDIUM risk and warning", () => {
    const contract = createExecutionAuditSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([
      makeObservation("SANDBOXED"),
    ]));

    expect(result.auditSummary.overallRisk).toBe("MEDIUM");
    expect(result.warnings[0]).toContain("[audit] medium execution risk");
  });

  it("PARTIAL observation (no failures/gates) produces LOW risk and no warning", () => {
    const contract = createExecutionAuditSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([
      makeObservation("PARTIAL"),
    ]));

    expect(result.auditSummary.overallRisk).toBe("LOW");
    expect(result.warnings).toEqual([]);
  });

  it("SUCCESS-only observations produce NONE risk and no warnings", () => {
    const contract = createExecutionAuditSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([
      makeObservation("SUCCESS"),
      makeObservation("SUCCESS"),
    ]));

    expect(result.auditSummary.overallRisk).toBe("NONE");
    expect(result.warnings).toEqual([]);
  });

  it("empty observations produce NONE risk and no warnings", () => {
    const contract = createExecutionAuditSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([]));

    expect(result.auditSummary.totalObservations).toBe(0);
    expect(result.auditSummary.overallRisk).toBe("NONE");
    expect(result.auditSummary.dominantOutcome).toBe("SUCCESS");
    expect(result.warnings).toEqual([]);
    expect(result.pipelineHash).toBeTruthy();
  });

  it("consumerId is preserved when provided", () => {
    const contract = createExecutionAuditSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([makeObservation()], { consumerId: "consumer-xyz" }));

    expect(result.consumerId).toBe("consumer-xyz");
  });

  it("consumerId is undefined when not provided", () => {
    const contract = createExecutionAuditSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.consumerId).toBeUndefined();
  });

  it("resultId differs from pipelineHash", () => {
    const contract = createExecutionAuditSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.resultId).not.toBe(result.pipelineHash);
  });

  it("consumerPackage contains estimatedTokens", () => {
    const contract = createExecutionAuditSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(typeof result.consumerPackage.typedContextPackage.estimatedTokens).toBe("number");
  });

  it("is deterministic — same input produces identical hashes", () => {
    const contract = createExecutionAuditSummaryConsumerPipelineContract({ now: fixedNow() });
    const r1 = contract.execute(makeRequest());
    const r2 = contract.execute(makeRequest());

    expect(r1.pipelineHash).toBe(r2.pipelineHash);
    expect(r1.resultId).toBe(r2.resultId);
    expect(r1.auditSummary.auditHash).toBe(r2.auditSummary.auditHash);
  });

  it("different outcomeClass produces different hashes", () => {
    const contract = createExecutionAuditSummaryConsumerPipelineContract({ now: fixedNow() });
    const r1 = contract.execute(makeRequest([makeObservation("SUCCESS")]));
    const r2 = contract.execute(makeRequest([makeObservation("FAILED", { failedCount: 1 })]));

    expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
  });

  it("factory function creates a working contract", () => {
    const contract = createExecutionAuditSummaryConsumerPipelineContract({ now: fixedNow() });
    expect(contract).toBeInstanceOf(ExecutionAuditSummaryConsumerPipelineContract);
    const result = contract.execute(makeRequest());
    expect(result.pipelineHash).toBeTruthy();
  });

  it("direct instantiation works identically to factory", () => {
    const now = fixedNow();
    const direct = new ExecutionAuditSummaryConsumerPipelineContract({ now });
    const via = createExecutionAuditSummaryConsumerPipelineContract({ now });

    const r1 = direct.execute(makeRequest());
    const r2 = via.execute(makeRequest());

    expect(r1.pipelineHash).toBe(r2.pipelineHash);
  });
});
