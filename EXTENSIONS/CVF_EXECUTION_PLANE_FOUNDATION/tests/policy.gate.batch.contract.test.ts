import { describe, it, expect } from "vitest";
import {
  PolicyGateBatchContract,
  createPolicyGateBatchContract,
} from "../src/policy.gate.batch.contract";
import type { PolicyGateBatchInput } from "../src/policy.gate.batch.contract";
import type { DispatchResult, DispatchEntry } from "../src/dispatch.contract";
import type { GuardDecision } from "../../CVF_ECO_v2.5_MCP_SERVER/src/sdk";

// --- Test Helpers ---

let _seq = 0;
function makeEntry(
  guardDecision: GuardDecision,
  riskLevel: "R0" | "R1" | "R2" | "R3",
): DispatchEntry {
  _seq++;
  return {
    assignmentId: `assignment-${_seq}`,
    taskId: `task-${_seq}`,
    riskLevel,
    dispatchedAt: "2026-04-05T00:00:00.000Z",
    guardDecision,
    pipelineResult: {
      finalDecision: guardDecision,
      stages: [],
      pipelineHash: `hash-${_seq}`,
    } as any,
    dispatchAuthorized: guardDecision === "ALLOW",
  };
}

function makeDispatchResult(
  entries: DispatchEntry[],
  id = "dispatch-001",
): DispatchResult {
  const authorized = entries.filter((e) => e.dispatchAuthorized).length;
  const blocked = entries.filter((e) => e.guardDecision === "BLOCK").length;
  const escalated = entries.filter((e) => e.guardDecision === "ESCALATE").length;
  return {
    dispatchId: id,
    orchestrationId: `orch-${id}`,
    dispatchedAt: "2026-04-05T00:00:00.000Z",
    entries,
    totalDispatched: entries.length,
    authorizedCount: authorized,
    blockedCount: blocked,
    escalatedCount: escalated,
    dispatchHash: `dispatch-hash-${id}`,
    warnings: [],
    summary: `Dispatch summary for ${id}`,
  } as any;
}

function makeInput(entries: DispatchEntry[], id?: string): PolicyGateBatchInput {
  return { dispatchResult: makeDispatchResult(entries, id) };
}

const FIXED_TS = "2026-04-05T10:00:00.000Z";
const fixedNow = () => FIXED_TS;

// --- Tests ---

describe("PolicyGateBatchContract", () => {
  describe("empty batch", () => {
    it("returns NONE for empty input", () => {
      const contract = new PolicyGateBatchContract({ now: fixedNow });
      const result = contract.batch([]);
      expect(result.dominantDecision).toBe("NONE");
    });

    it("returns zero counts for empty batch", () => {
      const contract = new PolicyGateBatchContract({ now: fixedNow });
      const result = contract.batch([]);
      expect(result.totalAllowed).toBe(0);
      expect(result.totalDenied).toBe(0);
      expect(result.totalReviewRequired).toBe(0);
      expect(result.totalSandboxed).toBe(0);
      expect(result.totalPending).toBe(0);
      expect(result.totalEntries).toBe(0);
      expect(result.warnedCount).toBe(0);
      expect(result.results).toHaveLength(0);
    });

    it("produces valid batchId and batchHash for empty batch", () => {
      const contract = new PolicyGateBatchContract({ now: fixedNow });
      const result = contract.batch([]);
      expect(typeof result.batchId).toBe("string");
      expect(result.batchId.length).toBeGreaterThan(0);
      expect(typeof result.batchHash).toBe("string");
      expect(result.batchHash.length).toBeGreaterThan(0);
    });
  });

  describe("FULLY_ALLOWED", () => {
    it("single dispatch all allow → FULLY_ALLOWED", () => {
      const contract = new PolicyGateBatchContract({ now: fixedNow });
      const input = makeInput([makeEntry("ALLOW", "R1"), makeEntry("ALLOW", "R1")]);
      const result = contract.batch([input]);
      expect(result.dominantDecision).toBe("FULLY_ALLOWED");
    });

    it("multiple dispatches all fully allowed → FULLY_ALLOWED", () => {
      const contract = new PolicyGateBatchContract({ now: fixedNow });
      const inputs = [
        makeInput([makeEntry("ALLOW", "R1")], "d-1"),
        makeInput([makeEntry("ALLOW", "R0"), makeEntry("ALLOW", "R1")], "d-2"),
      ];
      const result = contract.batch(inputs);
      expect(result.dominantDecision).toBe("FULLY_ALLOWED");
    });
  });

  describe("FULLY_BLOCKED", () => {
    it("single dispatch all deny → FULLY_BLOCKED", () => {
      const contract = new PolicyGateBatchContract({ now: fixedNow });
      const input = makeInput([makeEntry("BLOCK", "R3"), makeEntry("BLOCK", "R3")]);
      const result = contract.batch([input]);
      expect(result.dominantDecision).toBe("FULLY_BLOCKED");
    });

    it("single dispatch all review (no allow) → FULLY_BLOCKED", () => {
      const contract = new PolicyGateBatchContract({ now: fixedNow });
      const input = makeInput([makeEntry("ESCALATE", "R2"), makeEntry("ALLOW", "R2")]);
      const result = contract.batch([input]);
      expect(result.dominantDecision).toBe("FULLY_BLOCKED");
    });

    it("single dispatch all sandbox → FULLY_BLOCKED", () => {
      const contract = new PolicyGateBatchContract({ now: fixedNow });
      const input = makeInput([makeEntry("ALLOW", "R3"), makeEntry("ALLOW", "R3")]);
      const result = contract.batch([input]);
      expect(result.dominantDecision).toBe("FULLY_BLOCKED");
    });

    it("multiple dispatches all blocked → FULLY_BLOCKED", () => {
      const contract = new PolicyGateBatchContract({ now: fixedNow });
      const inputs = [
        makeInput([makeEntry("BLOCK", "R3")], "d-1"),
        makeInput([makeEntry("BLOCK", "R2")], "d-2"),
      ];
      const result = contract.batch(inputs);
      expect(result.dominantDecision).toBe("FULLY_BLOCKED");
    });
  });

  describe("PARTIALLY_ALLOWED", () => {
    it("allow + deny → PARTIALLY_ALLOWED", () => {
      const contract = new PolicyGateBatchContract({ now: fixedNow });
      const input = makeInput([makeEntry("ALLOW", "R1"), makeEntry("BLOCK", "R3")]);
      const result = contract.batch([input]);
      expect(result.dominantDecision).toBe("PARTIALLY_ALLOWED");
    });

    it("allow + review (escalate) → PARTIALLY_ALLOWED", () => {
      const contract = new PolicyGateBatchContract({ now: fixedNow });
      const input = makeInput([makeEntry("ALLOW", "R1"), makeEntry("ESCALATE", "R2")]);
      const result = contract.batch([input]);
      expect(result.dominantDecision).toBe("PARTIALLY_ALLOWED");
    });

    it("allow + sandbox (R3) → PARTIALLY_ALLOWED", () => {
      const contract = new PolicyGateBatchContract({ now: fixedNow });
      const input = makeInput([makeEntry("ALLOW", "R0"), makeEntry("ALLOW", "R3")]);
      const result = contract.batch([input]);
      expect(result.dominantDecision).toBe("PARTIALLY_ALLOWED");
    });

    it("mixed across multiple dispatches → PARTIALLY_ALLOWED", () => {
      const contract = new PolicyGateBatchContract({ now: fixedNow });
      const inputs = [
        makeInput([makeEntry("ALLOW", "R1")], "d-1"),
        makeInput([makeEntry("BLOCK", "R3")], "d-2"),
      ];
      const result = contract.batch(inputs);
      expect(result.dominantDecision).toBe("PARTIALLY_ALLOWED");
    });
  });

  describe("aggregate counts", () => {
    it("totalAllowed sums allowedCount across all results", () => {
      const contract = new PolicyGateBatchContract({ now: fixedNow });
      const inputs = [
        makeInput([makeEntry("ALLOW", "R1"), makeEntry("ALLOW", "R0")], "d-1"),
        makeInput([makeEntry("ALLOW", "R1")], "d-2"),
      ];
      const result = contract.batch(inputs);
      expect(result.totalAllowed).toBe(3);
    });

    it("totalDenied sums deniedCount across all results", () => {
      const contract = new PolicyGateBatchContract({ now: fixedNow });
      const inputs = [
        makeInput([makeEntry("BLOCK", "R3"), makeEntry("ALLOW", "R1")], "d-1"),
        makeInput([makeEntry("BLOCK", "R3")], "d-2"),
      ];
      const result = contract.batch(inputs);
      expect(result.totalDenied).toBe(2);
    });

    it("totalReviewRequired sums reviewRequiredCount across all results", () => {
      const contract = new PolicyGateBatchContract({ now: fixedNow });
      const inputs = [
        makeInput([makeEntry("ESCALATE", "R2"), makeEntry("ALLOW", "R2")], "d-1"),
        makeInput([makeEntry("ESCALATE", "R1")], "d-2"),
      ];
      const result = contract.batch(inputs);
      expect(result.totalReviewRequired).toBe(3);
    });

    it("totalSandboxed sums sandboxedCount across all results", () => {
      const contract = new PolicyGateBatchContract({ now: fixedNow });
      const inputs = [
        makeInput([makeEntry("ALLOW", "R3"), makeEntry("ALLOW", "R3")], "d-1"),
        makeInput([makeEntry("ALLOW", "R3")], "d-2"),
      ];
      const result = contract.batch(inputs);
      expect(result.totalSandboxed).toBe(3);
    });

    it("totalEntries sums entry count across all results", () => {
      const contract = new PolicyGateBatchContract({ now: fixedNow });
      const inputs = [
        makeInput([makeEntry("ALLOW", "R1"), makeEntry("ALLOW", "R1")], "d-1"),
        makeInput([makeEntry("BLOCK", "R3")], "d-2"),
      ];
      const result = contract.batch(inputs);
      expect(result.totalEntries).toBe(3);
    });

    it("warnedCount counts results with denied/review/sandbox > 0", () => {
      const contract = new PolicyGateBatchContract({ now: fixedNow });
      const inputs = [
        makeInput([makeEntry("ALLOW", "R1")], "d-clean"),
        makeInput([makeEntry("ALLOW", "R1"), makeEntry("BLOCK", "R3")], "d-warned-1"),
        makeInput([makeEntry("ALLOW", "R1"), makeEntry("ESCALATE", "R2")], "d-warned-2"),
      ];
      const result = contract.batch(inputs);
      expect(result.warnedCount).toBe(2);
    });
  });

  describe("determinism", () => {
    it("same inputs + same timestamp → same batchHash", () => {
      const c1 = new PolicyGateBatchContract({ now: fixedNow });
      const c2 = new PolicyGateBatchContract({ now: fixedNow });
      const inputs = [makeInput([makeEntry("ALLOW", "R1"), makeEntry("BLOCK", "R3")], "d-det")];
      expect(c1.batch(inputs).batchHash).toBe(c2.batch(inputs).batchHash);
    });

    it("batchId differs from batchHash", () => {
      const contract = new PolicyGateBatchContract({ now: fixedNow });
      const result = contract.batch([makeInput([makeEntry("ALLOW", "R1")], "d-ids")]);
      expect(result.batchId).not.toBe(result.batchHash);
    });

    it("different timestamp → different batchHash", () => {
      const c1 = new PolicyGateBatchContract({ now: () => "2026-04-05T10:00:00.000Z" });
      const c2 = new PolicyGateBatchContract({ now: () => "2026-04-05T11:00:00.000Z" });
      const inputs = [makeInput([makeEntry("ALLOW", "R1")], "d-ts")];
      expect(c1.batch(inputs).batchHash).not.toBe(c2.batch(inputs).batchHash);
    });
  });

  describe("factory", () => {
    it("createPolicyGateBatchContract returns working instance", () => {
      const contract = createPolicyGateBatchContract({ now: fixedNow });
      const result = contract.batch([makeInput([makeEntry("ALLOW", "R1")], "d-factory")]);
      expect(result.dominantDecision).toBe("FULLY_ALLOWED");
    });
  });
});
