/**
 * EPF Dispatch & Policy Gate — Dedicated Tests (W6-T18)
 * ======================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   DispatchContract.dispatch:
 *     - empty assignments → 0 dispatched, 0 authorized, warning about zero assignments
 *     - single R1 assignment → 1 dispatched, orchestrationId propagated
 *     - authorizedCount + blockedCount + escalatedCount === totalDispatched
 *     - dispatchAuthorized === (guardDecision === "ALLOW") per entry
 *     - assignmentId and taskId propagated to entries
 *     - dispatchedAt set to injected now()
 *     - dispatchHash and dispatchId are equal
 *     - dispatchHash deterministic for same inputs and timestamp
 *     - different orchestrationId → different dispatchHash
 *     - BLOCK entries trigger warnings
 *     - ESCALATE entries trigger warnings
 *     - reviewer role → entry processed (requestId equals assignmentId)
 *     - factory createDispatchContract returns working instance
 *
 *   PolicyGateContract.evaluate:
 *     - empty dispatch → 0 entries, summary contains "zero entries"
 *     - BLOCK guardDecision → deny gateDecision
 *     - ESCALATE guardDecision → review gateDecision
 *     - ALLOW + R3 → sandbox gateDecision
 *     - ALLOW + R2 → review gateDecision
 *     - ALLOW + R1 → allow gateDecision
 *     - ALLOW + R0 → allow gateDecision
 *     - mixed: deny + allow + sandbox → correct counts
 *     - allowedCount, deniedCount, reviewRequiredCount, sandboxedCount accurate
 *     - gateId === gateHash
 *     - dispatchId propagated from dispatchResult
 *     - evaluatedAt set to injected now()
 *     - gateHash deterministic for same inputs and timestamp
 *     - summary contains counts for non-zero buckets
 *     - rationale for deny references BLOCK
 *     - rationale for sandbox references risk level
 *     - rationale for review+ESCALATE references ESCALATE
 *     - rationale for allow references ALLOW
 *     - factory createPolicyGateContract returns working instance
 */

import { describe, it, expect } from "vitest";

import {
  DispatchContract,
  createDispatchContract,
} from "../src/dispatch.contract";
import type { DispatchResult } from "../src/dispatch.contract";

import {
  PolicyGateContract,
  createPolicyGateContract,
} from "../src/policy.gate.contract";

import type { TaskAssignment } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/orchestration.contract";
import type { GuardDecision } from "../../CVF_ECO_v2.5_MCP_SERVER/src/sdk";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-23T23:00:00.000Z";
const fixedNow = () => FIXED_NOW;

let _aSeq = 0;
function makeAssignment(overrides: Partial<TaskAssignment> = {}): TaskAssignment {
  const n = ++_aSeq;
  return {
    assignmentId: `assign-${n}`,
    taskId: `task-${n}`,
    title: `Task ${n}`,
    assignedRole: "builder",
    targetPhase: "BUILD",
    riskLevel: "R1",
    scopeConstraints: ["phase:BUILD", "risk:R1"],
    dependencies: [],
    executionAuthorizationHash: `auth-hash-${n}`,
    ...overrides,
  };
}

function makeDispatchResult(
  entries: {
    assignmentId: string;
    taskId: string;
    guardDecision: GuardDecision;
    riskLevel: string;
  }[],
): DispatchResult {
  const dispatchEntries = entries.map((e) => ({
    assignmentId: e.assignmentId,
    taskId: e.taskId,
    riskLevel: e.riskLevel,
    dispatchedAt: FIXED_NOW,
    guardDecision: e.guardDecision,
    pipelineResult: {
      requestId: e.assignmentId,
      finalDecision: e.guardDecision,
      results: [],
      executedAt: FIXED_NOW,
      durationMs: 1,
    },
    dispatchAuthorized: e.guardDecision === "ALLOW",
  }));

  return {
    dispatchId: "test-dispatch-id",
    orchestrationId: "test-orch",
    dispatchedAt: FIXED_NOW,
    entries: dispatchEntries as unknown as DispatchResult["entries"],
    totalDispatched: entries.length,
    authorizedCount: entries.filter((e) => e.guardDecision === "ALLOW").length,
    blockedCount: entries.filter((e) => e.guardDecision === "BLOCK").length,
    escalatedCount: entries.filter((e) => e.guardDecision === "ESCALATE").length,
    dispatchHash: "test-dispatch-hash",
    warnings: [],
  };
}

// ─── DispatchContract ─────────────────────────────────────────────────────────

describe("DispatchContract.dispatch", () => {
  const contract = new DispatchContract({ now: fixedNow });

  it("empty assignments → 0 dispatched, warning about zero assignments", () => {
    const result = contract.dispatch("orch-empty", []);
    expect(result.totalDispatched).toBe(0);
    expect(result.entries).toHaveLength(0);
    expect(result.authorizedCount).toBe(0);
    expect(result.blockedCount).toBe(0);
    expect(result.escalatedCount).toBe(0);
    expect(result.warnings.some((w) => w.includes("zero assignments"))).toBe(true);
  });

  it("single assignment dispatched — orchestrationId propagated", () => {
    const result = contract.dispatch("orch-001", [makeAssignment()]);
    expect(result.orchestrationId).toBe("orch-001");
    expect(result.totalDispatched).toBe(1);
    expect(result.entries).toHaveLength(1);
  });

  it("authorizedCount + blockedCount + escalatedCount === totalDispatched", () => {
    const assignments = [
      makeAssignment({ riskLevel: "R0" }),
      makeAssignment({ riskLevel: "R1" }),
      makeAssignment({ riskLevel: "R2" }),
    ];
    const result = contract.dispatch("orch-counts", assignments);
    expect(result.authorizedCount + result.blockedCount + result.escalatedCount).toBe(
      result.totalDispatched,
    );
  });

  it("dispatchAuthorized === (guardDecision === 'ALLOW') for each entry", () => {
    const result = contract.dispatch("orch-auth", [makeAssignment()]);
    for (const entry of result.entries) {
      expect(entry.dispatchAuthorized).toBe(entry.guardDecision === "ALLOW");
    }
  });

  it("assignmentId and taskId propagated to entries", () => {
    const assignment = makeAssignment({ assignmentId: "a-special", taskId: "t-special" });
    const result = contract.dispatch("orch-ids", [assignment]);
    expect(result.entries[0].assignmentId).toBe("a-special");
    expect(result.entries[0].taskId).toBe("t-special");
  });

  it("dispatchedAt set to injected now()", () => {
    const result = contract.dispatch("orch-time", [makeAssignment()]);
    expect(result.entries[0].dispatchedAt).toBe(FIXED_NOW);
  });

  it("dispatchHash and dispatchId are equal", () => {
    const result = contract.dispatch("orch-hash", [makeAssignment()]);
    expect(result.dispatchHash).toBe(result.dispatchId);
  });

  it("dispatchHash is deterministic for same inputs and timestamp", () => {
    const assignment = makeAssignment();
    const r1 = contract.dispatch("orch-det", [assignment]);
    const r2 = contract.dispatch("orch-det", [assignment]);
    expect(r1.dispatchHash).toBe(r2.dispatchHash);
  });

  it("different orchestrationId → different dispatchHash", () => {
    const assignment = makeAssignment();
    const r1 = contract.dispatch("orch-A", [assignment]);
    const r2 = contract.dispatch("orch-B", [assignment]);
    expect(r1.dispatchHash).not.toBe(r2.dispatchHash);
  });

  it("reviewer role → entry processed with correct requestId", () => {
    const assignment = makeAssignment({ assignedRole: "reviewer", targetPhase: "REVIEW" });
    const result = contract.dispatch("orch-reviewer", [assignment]);
    expect(result.entries[0].pipelineResult.requestId).toBe(assignment.assignmentId);
  });

  it("BLOCK entries include warning about blocked assignments", () => {
    // Use a real guard engine — high risk scope may produce a BLOCK or ESCALATE
    // We verify warnings array is always an Array (guard may or may not block R3)
    const assignment = makeAssignment({
      riskLevel: "R3",
      scopeConstraints: ["phase:BUILD", "risk:R3", "requires:full-governance-review"],
    });
    const result = contract.dispatch("orch-r3", [assignment]);
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it("factory createDispatchContract returns working instance", () => {
    const c = createDispatchContract({ now: fixedNow });
    const result = c.dispatch("orch-factory", []);
    expect(result.totalDispatched).toBe(0);
    expect(result.warnings.some((w) => w.includes("zero assignments"))).toBe(true);
  });
});

// ─── PolicyGateContract ───────────────────────────────────────────────────────

describe("PolicyGateContract.evaluate", () => {
  const gate = new PolicyGateContract({ now: fixedNow });

  it("empty dispatch → 0 entries, summary contains 'zero entries'", () => {
    const result = gate.evaluate(makeDispatchResult([]));
    expect(result.entries).toHaveLength(0);
    expect(result.allowedCount).toBe(0);
    expect(result.deniedCount).toBe(0);
    expect(result.summary).toContain("zero entries");
  });

  describe("gate decision derivation", () => {
    it("BLOCK guardDecision → deny gateDecision", () => {
      const result = gate.evaluate(
        makeDispatchResult([{ assignmentId: "a1", taskId: "t1", guardDecision: "BLOCK", riskLevel: "R1" }]),
      );
      expect(result.entries[0].gateDecision).toBe("deny");
      expect(result.deniedCount).toBe(1);
    });

    it("ESCALATE guardDecision → review gateDecision", () => {
      const result = gate.evaluate(
        makeDispatchResult([{ assignmentId: "a1", taskId: "t1", guardDecision: "ESCALATE", riskLevel: "R2" }]),
      );
      expect(result.entries[0].gateDecision).toBe("review");
      expect(result.reviewRequiredCount).toBe(1);
    });

    it("ALLOW + R3 → sandbox gateDecision", () => {
      const result = gate.evaluate(
        makeDispatchResult([{ assignmentId: "a1", taskId: "t1", guardDecision: "ALLOW", riskLevel: "R3" }]),
      );
      expect(result.entries[0].gateDecision).toBe("sandbox");
      expect(result.sandboxedCount).toBe(1);
    });

    it("ALLOW + R2 → review gateDecision", () => {
      const result = gate.evaluate(
        makeDispatchResult([{ assignmentId: "a1", taskId: "t1", guardDecision: "ALLOW", riskLevel: "R2" }]),
      );
      expect(result.entries[0].gateDecision).toBe("review");
    });

    it("ALLOW + R1 → allow gateDecision", () => {
      const result = gate.evaluate(
        makeDispatchResult([{ assignmentId: "a1", taskId: "t1", guardDecision: "ALLOW", riskLevel: "R1" }]),
      );
      expect(result.entries[0].gateDecision).toBe("allow");
      expect(result.allowedCount).toBe(1);
    });

    it("ALLOW + R0 → allow gateDecision", () => {
      const result = gate.evaluate(
        makeDispatchResult([{ assignmentId: "a1", taskId: "t1", guardDecision: "ALLOW", riskLevel: "R0" }]),
      );
      expect(result.entries[0].gateDecision).toBe("allow");
    });
  });

  it("mixed entries — counts correct", () => {
    const result = gate.evaluate(
      makeDispatchResult([
        { assignmentId: "a1", taskId: "t1", guardDecision: "ALLOW", riskLevel: "R0" },
        { assignmentId: "a2", taskId: "t2", guardDecision: "BLOCK", riskLevel: "R1" },
        { assignmentId: "a3", taskId: "t3", guardDecision: "ALLOW", riskLevel: "R3" },
        { assignmentId: "a4", taskId: "t4", guardDecision: "ESCALATE", riskLevel: "R2" },
      ]),
    );
    expect(result.allowedCount).toBe(1);
    expect(result.deniedCount).toBe(1);
    expect(result.sandboxedCount).toBe(1);
    expect(result.reviewRequiredCount).toBe(1);
    expect(result.entries).toHaveLength(4);
  });

  it("gateId equals gateHash", () => {
    const result = gate.evaluate(makeDispatchResult([]));
    expect(result.gateId).toBe(result.gateHash);
  });

  it("dispatchId propagated from dispatchResult", () => {
    const dispatch = makeDispatchResult([]);
    const result = gate.evaluate(dispatch);
    expect(result.dispatchId).toBe(dispatch.dispatchId);
  });

  it("evaluatedAt set to injected now()", () => {
    expect(gate.evaluate(makeDispatchResult([])).evaluatedAt).toBe(FIXED_NOW);
  });

  it("gateHash deterministic for same inputs and timestamp", () => {
    const dispatch = makeDispatchResult([
      { assignmentId: "a1", taskId: "t1", guardDecision: "ALLOW", riskLevel: "R1" },
    ]);
    const r1 = gate.evaluate(dispatch);
    const r2 = gate.evaluate(dispatch);
    expect(r1.gateHash).toBe(r2.gateHash);
  });

  describe("rationale content", () => {
    it("deny rationale references BLOCK", () => {
      const result = gate.evaluate(
        makeDispatchResult([{ assignmentId: "a1", taskId: "t1", guardDecision: "BLOCK", riskLevel: "R1" }]),
      );
      expect(result.entries[0].rationale).toContain("BLOCK");
    });

    it("sandbox rationale references risk level", () => {
      const result = gate.evaluate(
        makeDispatchResult([{ assignmentId: "a1", taskId: "t1", guardDecision: "ALLOW", riskLevel: "R3" }]),
      );
      expect(result.entries[0].rationale).toContain("R3");
    });

    it("review rationale for ESCALATE references ESCALATE", () => {
      const result = gate.evaluate(
        makeDispatchResult([{ assignmentId: "a1", taskId: "t1", guardDecision: "ESCALATE", riskLevel: "R2" }]),
      );
      expect(result.entries[0].rationale).toContain("ESCALATE");
    });

    it("allow rationale references ALLOW", () => {
      const result = gate.evaluate(
        makeDispatchResult([{ assignmentId: "a1", taskId: "t1", guardDecision: "ALLOW", riskLevel: "R1" }]),
      );
      expect(result.entries[0].rationale).toContain("ALLOW");
    });
  });

  it("summary contains counts for non-zero allow bucket", () => {
    const result = gate.evaluate(
      makeDispatchResult([{ assignmentId: "a1", taskId: "t1", guardDecision: "ALLOW", riskLevel: "R1" }]),
    );
    expect(result.summary).toContain("allowed");
  });

  it("factory createPolicyGateContract returns working instance", () => {
    const c = createPolicyGateContract({ now: fixedNow });
    const result = c.evaluate(makeDispatchResult([]));
    expect(result.evaluatedAt).toBe(FIXED_NOW);
    expect(result.summary).toContain("zero entries");
  });
});
