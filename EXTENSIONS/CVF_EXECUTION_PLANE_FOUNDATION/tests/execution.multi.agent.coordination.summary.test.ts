import { describe, it, expect } from "vitest";
import {
  MultiAgentCoordinationSummaryContract,
  createMultiAgentCoordinationSummaryContract,
} from "../src/execution.multi.agent.coordination.summary.contract";
import type { MultiAgentCoordinationResult } from "../src";

// ─── W2-T9 CP2: MultiAgentCoordinationSummaryContract ────────────────────────

const FIXED_NOW = () => "2026-03-23T11:00:00.000Z";

function makeResult(
  coordinationStatus: MultiAgentCoordinationResult["coordinationStatus"],
): MultiAgentCoordinationResult {
  return {
    coordinationId: "coord-" + coordinationStatus,
    coordinatedAt: "2026-03-23T10:00:00.000Z",
    agents: [],
    totalTasksDistributed: 0,
    coordinationStatus,
    coordinationHash: "hash-" + coordinationStatus,
  };
}

describe("W2-T9 CP2: MultiAgentCoordinationSummaryContract", () => {
  it("createMultiAgentCoordinationSummaryContract returns a MultiAgentCoordinationSummaryContract instance", () => {
    expect(createMultiAgentCoordinationSummaryContract()).toBeInstanceOf(
      MultiAgentCoordinationSummaryContract,
    );
  });

  it("summarize counts COORDINATED, PARTIAL, FAILED correctly", () => {
    const contract = createMultiAgentCoordinationSummaryContract({ now: FIXED_NOW });
    const results = [
      makeResult("COORDINATED"),
      makeResult("COORDINATED"),
      makeResult("PARTIAL"),
      makeResult("FAILED"),
    ];
    const summary = contract.summarize(results);
    expect(summary.totalCoordinations).toBe(4);
    expect(summary.coordinatedCount).toBe(2);
    expect(summary.partialCount).toBe(1);
    expect(summary.failedCount).toBe(1);
  });

  it("dominantStatus is FAILED when any FAILED result exists", () => {
    const contract = createMultiAgentCoordinationSummaryContract({ now: FIXED_NOW });
    const results = [makeResult("COORDINATED"), makeResult("FAILED")];
    expect(contract.summarize(results).dominantStatus).toBe("FAILED");
  });

  it("dominantStatus is PARTIAL when PARTIAL exists and no FAILED", () => {
    const contract = createMultiAgentCoordinationSummaryContract({ now: FIXED_NOW });
    const results = [makeResult("COORDINATED"), makeResult("PARTIAL")];
    expect(contract.summarize(results).dominantStatus).toBe("PARTIAL");
  });

  it("dominantStatus is COORDINATED when all COORDINATED", () => {
    const contract = createMultiAgentCoordinationSummaryContract({ now: FIXED_NOW });
    const results = [makeResult("COORDINATED"), makeResult("COORDINATED")];
    expect(contract.summarize(results).dominantStatus).toBe("COORDINATED");
  });

  it("empty input returns zero counts and COORDINATED dominantStatus", () => {
    const contract = createMultiAgentCoordinationSummaryContract({ now: FIXED_NOW });
    const summary = contract.summarize([]);
    expect(summary.totalCoordinations).toBe(0);
    expect(summary.coordinatedCount).toBe(0);
    expect(summary.dominantStatus).toBe("COORDINATED");
  });

  it("summaryHash is deterministic for same inputs", () => {
    const contract = createMultiAgentCoordinationSummaryContract({ now: FIXED_NOW });
    const results = [makeResult("COORDINATED"), makeResult("PARTIAL")];
    const s1 = contract.summarize(results);
    const s2 = contract.summarize(results);
    expect(s1.summaryHash).toBe(s2.summaryHash);
    expect(s1.summaryId).toBe(s2.summaryId);
  });

  it("summaryHash changes when status composition changes", () => {
    const contract = createMultiAgentCoordinationSummaryContract({ now: FIXED_NOW });
    const r1 = contract.summarize([makeResult("COORDINATED")]);
    const r2 = contract.summarize([makeResult("FAILED")]);
    expect(r1.summaryHash).not.toBe(r2.summaryHash);
  });
});
