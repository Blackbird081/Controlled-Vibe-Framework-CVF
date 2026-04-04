import { describe, it, expect } from "vitest";
import {
  MultiAgentCoordinationSummaryConsumerPipelineContract,
  createMultiAgentCoordinationSummaryConsumerPipelineContract,
} from "../src/execution.multi.agent.coordination.summary.consumer.pipeline.contract";
import type {
  MultiAgentCoordinationSummaryConsumerPipelineRequest,
} from "../src/execution.multi.agent.coordination.summary.consumer.pipeline.contract";
import type { MultiAgentCoordinationResult } from "../src/execution.multi.agent.coordination.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T11:00:00.000Z";

function fixedNow(): string {
  return FIXED_NOW;
}

function makeCoordinationResult(
  id: string,
  status: "COORDINATED" | "PARTIAL" | "FAILED",
): MultiAgentCoordinationResult {
  return {
    coordinationId: id,
    coordinatedAt: FIXED_NOW,
    agents: [],
    totalTasksDistributed: status === "COORDINATED" ? 4 : status === "PARTIAL" ? 2 : 0,
    coordinationStatus: status,
    coordinationHash: `hash-${id}`,
  };
}

function makeRequest(
  opts: {
    results?: MultiAgentCoordinationResult[];
    consumerId?: string;
  } = {},
): MultiAgentCoordinationSummaryConsumerPipelineRequest {
  return {
    coordinationResults: opts.results ?? [
      makeCoordinationResult("c1", "COORDINATED"),
      makeCoordinationResult("c2", "COORDINATED"),
    ],
    consumerId: opts.consumerId,
  };
}

function makeContract(): MultiAgentCoordinationSummaryConsumerPipelineContract {
  return createMultiAgentCoordinationSummaryConsumerPipelineContract({ now: fixedNow });
}

const BASE_REQUEST = makeRequest();
const FAILED_REQUEST = makeRequest({ results: [makeCoordinationResult("f1", "FAILED")] });
const PARTIAL_REQUEST = makeRequest({ results: [makeCoordinationResult("p1", "PARTIAL")] });
const EMPTY_REQUEST = makeRequest({ results: [] });

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("MultiAgentCoordinationSummaryConsumerPipelineContract", () => {
  it("is instantiable via factory", () => {
    const contract = createMultiAgentCoordinationSummaryConsumerPipelineContract();
    expect(contract).toBeInstanceOf(MultiAgentCoordinationSummaryConsumerPipelineContract);
  });

  it("execute returns a result with expected shape", () => {
    const result = makeContract().execute(BASE_REQUEST);
    expect(result).toHaveProperty("resultId");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("coordinationSummary");
    expect(result).toHaveProperty("consumerPackage");
    expect(result).toHaveProperty("pipelineHash");
    expect(result).toHaveProperty("warnings");
  });

  it("createdAt matches injected now", () => {
    const result = makeContract().execute(BASE_REQUEST);
    expect(result.createdAt).toBe(FIXED_NOW);
  });

  it("all coordinated — no warnings", () => {
    const result = makeContract().execute(BASE_REQUEST);
    expect(result.coordinationSummary.dominantStatus).toBe("COORDINATED");
    expect(result.warnings).toHaveLength(0);
  });

  it("FAILED status — warning contains [coordination] prefix", () => {
    const result = makeContract().execute(FAILED_REQUEST);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain("[coordination]");
  });

  it("FAILED status — warning references 'failed agent coordination'", () => {
    const result = makeContract().execute(FAILED_REQUEST);
    expect(result.warnings[0]).toContain("failed agent coordination");
  });

  it("FAILED status — warning references 'review agent dependencies'", () => {
    const result = makeContract().execute(FAILED_REQUEST);
    expect(result.warnings[0]).toContain("review agent dependencies");
  });

  it("PARTIAL status — warning contains [coordination] prefix", () => {
    const result = makeContract().execute(PARTIAL_REQUEST);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain("[coordination]");
  });

  it("PARTIAL status — warning references 'partial agent coordination'", () => {
    const result = makeContract().execute(PARTIAL_REQUEST);
    expect(result.warnings[0]).toContain("partial agent coordination");
  });

  it("PARTIAL status — warning references 'some agents did not complete'", () => {
    const result = makeContract().execute(PARTIAL_REQUEST);
    expect(result.warnings[0]).toContain("some agents did not complete");
  });

  it("query contains dominantStatus", () => {
    const result = makeContract().execute(BASE_REQUEST);
    expect(result.consumerPackage.query).toContain("COORDINATED");
  });

  it("query contains 'coordinations'", () => {
    const result = makeContract().execute(BASE_REQUEST);
    expect(result.consumerPackage.query).toContain("coordinations");
  });

  it("query contains 'failed'", () => {
    const result = makeContract().execute(FAILED_REQUEST);
    expect(result.consumerPackage.query).toContain("failed");
  });

  it("query length is at most 120 chars", () => {
    const longResults = Array.from({ length: 20 }, (_, i) =>
      makeCoordinationResult(`c${i}`, "COORDINATED"),
    );
    const result = makeContract().execute(makeRequest({ results: longResults }));
    expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
  });

  it("consumerPackage contextId matches coordinationSummary.summaryId", () => {
    const result = makeContract().execute(BASE_REQUEST);
    expect(result.consumerPackage.contextId).toBe(result.coordinationSummary.summaryId);
  });

  it("pipelineHash and resultId are non-empty strings", () => {
    const result = makeContract().execute(BASE_REQUEST);
    expect(typeof result.pipelineHash).toBe("string");
    expect(result.pipelineHash.length).toBeGreaterThan(0);
    expect(typeof result.resultId).toBe("string");
    expect(result.resultId.length).toBeGreaterThan(0);
  });

  it("pipelineHash differs from resultId", () => {
    const result = makeContract().execute(BASE_REQUEST);
    expect(result.pipelineHash).not.toBe(result.resultId);
  });

  it("is deterministic — same input yields same hashes", () => {
    const contract = makeContract();
    const r1 = contract.execute(BASE_REQUEST);
    const r2 = contract.execute(BASE_REQUEST);
    expect(r1.pipelineHash).toBe(r2.pipelineHash);
    expect(r1.resultId).toBe(r2.resultId);
  });

  it("different inputs produce different pipelineHash", () => {
    const contract = makeContract();
    const r1 = contract.execute(BASE_REQUEST);
    const r2 = contract.execute(FAILED_REQUEST);
    expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
  });

  it("coordinationSummary.totalCoordinations reflects input length", () => {
    const result = makeContract().execute(
      makeRequest({ results: [makeCoordinationResult("a", "COORDINATED"), makeCoordinationResult("b", "PARTIAL")] }),
    );
    expect(result.coordinationSummary.totalCoordinations).toBe(2);
  });

  it("coordinationSummary.failedCount is correct", () => {
    const result = makeContract().execute(
      makeRequest({
        results: [
          makeCoordinationResult("x", "FAILED"),
          makeCoordinationResult("y", "COORDINATED"),
        ],
      }),
    );
    expect(result.coordinationSummary.failedCount).toBe(1);
  });

  it("empty results — dominantStatus is COORDINATED, no warnings", () => {
    const result = makeContract().execute(EMPTY_REQUEST);
    expect(result.coordinationSummary.dominantStatus).toBe("COORDINATED");
    expect(result.warnings).toHaveLength(0);
  });

  it("consumerId carried through to result", () => {
    const result = makeContract().execute(makeRequest({ consumerId: "consumer-mac" }));
    expect(result.consumerId).toBe("consumer-mac");
  });

  it("consumerId is undefined when not provided", () => {
    const result = makeContract().execute(BASE_REQUEST);
    expect(result.consumerId).toBeUndefined();
  });
});
