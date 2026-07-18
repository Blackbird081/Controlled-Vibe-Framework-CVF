// CVF MAO-OA-T5 - Operational Operator Projection Focused Tests
//
// Covers deterministic replay, current mode/handoff/next-move preservation,
// evidence readout and freshness reuse, milestone exclusion of INVOCATION and
// non-terminal receipts, canonical lane coverage (including zero counts),
// stable blocked/parked and accepted-material partitions, guard evidence
// honesty (PASS requires evidence, FAIL/BLOCKED stay visible), optional
// session projection pass-through, invalid-input and unsupported-lane
// negatives, caller-array immutability, forbidden-import inspection, and
// local-barrel export. No test performs any filesystem, git, UI, queue, or
// provider action.

import { describe, expect, it } from "vitest";

import { MaoEvidenceLedger } from "../src/mao/evidence.readout.contract";
import type { MaoReceiptKind } from "../src/mao/evidence.readout.contract";
import {
  MAO_OPERATIONAL_CANONICAL_LANES,
  MaoOperationalOperatorProjection,
  buildOperationalOperatorProjection,
} from "../src/mao/operational.operator.projection";
import type {
  MaoOperationalGuardSnapshot,
  MaoOperationalOperatorProjectionInput,
  MaoOperationalWorkspaceItemSnapshot,
} from "../src/mao/operational.operator.projection";
import { MaoOperationalOperatorProjection as BarrelProjection } from "../src/mao";

const T0 = "2026-07-17T00:00:00.000Z";

function iso(offsetMs: number): string {
  return new Date(new Date(T0).getTime() + offsetMs).toISOString();
}

function ledgerWithReceipts(taskGraphId = "graph-1"): MaoEvidenceLedger {
  const ledger = new MaoEvidenceLedger(taskGraphId);
  const kinds: MaoReceiptKind[] = ["GRAPH", "ROLE_RESOLUTION", "INVOCATION", "OUTPUT", "REVIEW", "INTEGRATION"];
  kinds.forEach((kind, index) => {
    ledger.ingest({
      taskGraphId,
      taskId: "t1",
      receiptKind: kind,
      fields: { role: "worker" },
      recordedAt: iso(index * 1000),
    });
  });
  return ledger;
}

function workspaceItem(overrides: Partial<MaoOperationalWorkspaceItemSnapshot> = {}): MaoOperationalWorkspaceItemSnapshot {
  return {
    itemId: "item-1",
    lane: "execution",
    status: "active",
    evidencePaths: ["docs/reviews/CVF_MAO_OA_T5_WORKER_RETURN_2026-07-17.md"],
    ...overrides,
  };
}

function guardSnapshot(overrides: Partial<MaoOperationalGuardSnapshot> = {}): MaoOperationalGuardSnapshot {
  return {
    checker: "governance/compat/check_governed_file_size.py",
    status: "PASS",
    evidencePath: "docs/reviews/CVF_MAO_OA_T5_WORKER_RETURN_2026-07-17.md",
    ...overrides,
  };
}

function projectionInput(overrides: Partial<MaoOperationalOperatorProjectionInput> = {}): MaoOperationalOperatorProjectionInput {
  return {
    currentMode: "mao_oa_t5_dispatched_worker_next",
    activeHandoff: "AGENT_HANDOFF_V45_2026-07-16.md",
    nextAllowedMove: "execute MAO-OA-T5 worker",
    ledger: ledgerWithReceipts(),
    terminalOutcomeEvidenceIds: new Set<string>(),
    generatedAt: T0,
    evaluatedAt: T0,
    staleAfterMs: 60000,
    workspaceItems: [workspaceItem()],
    guardSnapshots: [guardSnapshot()],
    ...overrides,
  };
}

describe("MaoOperationalOperatorProjection / buildOperationalOperatorProjection", () => {
  it("exports MaoOperationalOperatorProjection from the MAO local barrel", () => {
    expect(BarrelProjection).toBe(MaoOperationalOperatorProjection);
  });

  // --- Deterministic replay ---

  it("produces a structurally identical readout for identical inputs", () => {
    const first = buildOperationalOperatorProjection(projectionInput());
    const second = buildOperationalOperatorProjection(projectionInput());
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(JSON.stringify(first.readout)).toBe(JSON.stringify(second.readout));
    }
  });

  it("can also be invoked through the MaoOperationalOperatorProjection class", () => {
    const projection = new MaoOperationalOperatorProjection();
    const result = projection.build(projectionInput());
    expect(result.ok).toBe(true);
  });

  // --- Session facts preserved ---

  it("preserves currentMode, activeHandoff, and nextAllowedMove exactly", () => {
    const result = buildOperationalOperatorProjection(
      projectionInput({ currentMode: "mode-x", activeHandoff: "handoff-x.md", nextAllowedMove: "move-x" }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.readout.currentMode).toBe("mode-x");
      expect(result.readout.activeHandoff).toBe("handoff-x.md");
      expect(result.readout.nextAllowedMove).toBe("move-x");
      expect(result.readout.readModelOnly).toBe(true);
    }
  });

  // --- Evidence readout / freshness reuse ---

  it("reuses buildEvidenceReadout output for the evidenceReadout field", () => {
    const ledger = ledgerWithReceipts();
    const result = buildOperationalOperatorProjection(projectionInput({ ledger }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.readout.evidenceReadout.totalReceipts).toBe(6);
      expect(result.readout.evidenceReadout.taskGraphId).toBe("graph-1");
    }
  });

  it("classifies freshness as CURRENT when evaluated within staleAfterMs", () => {
    const result = buildOperationalOperatorProjection(projectionInput({ evaluatedAt: iso(6000), staleAfterMs: 60000 }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.readout.freshness).toBe("CURRENT");
  });

  it("classifies freshness as STALE when evaluated well beyond staleAfterMs", () => {
    const result = buildOperationalOperatorProjection(projectionInput({ evaluatedAt: iso(120000), staleAfterMs: 1000 }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.readout.freshness).toBe("STALE");
  });

  // --- Milestone filtering ---

  it("excludes INVOCATION receipts and non-terminal OUTPUT/REVIEW receipts from milestones", () => {
    const ledger = ledgerWithReceipts();
    const result = buildOperationalOperatorProjection(projectionInput({ ledger, terminalOutcomeEvidenceIds: new Set() }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      const kinds = result.readout.milestones.map((m) => m.milestoneKind);
      expect(kinds).toEqual(["GRAPH_CREATED", "TASK_ADMITTED", "CLOSURE"]);
    }
  });

  // --- Canonical lane coverage including zero counts ---

  it("returns a deterministic count for every canonical lane, including zero counts", () => {
    const result = buildOperationalOperatorProjection(projectionInput({ workspaceItems: [workspaceItem({ lane: "execution" })] }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Object.keys(result.readout.laneCounts).sort()).toEqual([...MAO_OPERATIONAL_CANONICAL_LANES].sort());
      expect(result.readout.laneCounts.execution).toBe(1);
      expect(result.readout.laneCounts.intake).toBe(0);
      expect(result.readout.laneCounts.blocked).toBe(0);
    }
  });

  // --- Blocked/parked and accepted-material partitions ---

  it("partitions blocked and parked items separately from accepted-material items, sorted deterministically", () => {
    const items: MaoOperationalWorkspaceItemSnapshot[] = [
      workspaceItem({ itemId: "z-blocked", lane: "blocked", evidencePaths: [] }),
      workspaceItem({ itemId: "a-parked", lane: "parked", evidencePaths: [] }),
      workspaceItem({ itemId: "m-accepted", lane: "accepted_material" }),
      workspaceItem({ itemId: "b-accepted", lane: "accepted_material" }),
    ];
    const result = buildOperationalOperatorProjection(projectionInput({ workspaceItems: items }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.readout.blockedAndParkedItems.map((i) => i.itemId)).toEqual(["a-parked", "z-blocked"]);
      expect(result.readout.acceptedMaterialItems.map((i) => i.itemId)).toEqual(["b-accepted", "m-accepted"]);
    }
  });

  // --- Guard evidence honesty ---

  it("accepts a PASS guard that carries a non-empty evidence path", () => {
    const result = buildOperationalOperatorProjection(
      projectionInput({ guardSnapshots: [guardSnapshot({ status: "PASS", evidencePath: "docs/reviews/x.md" })] }),
    );
    expect(result.ok).toBe(true);
  });

  it("fails closed on a PASS guard with no evidence path", () => {
    const result = buildOperationalOperatorProjection(
      projectionInput({ guardSnapshots: [guardSnapshot({ status: "PASS", evidencePath: null })] }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("UNBACKED_GUARD_PASS");
  });

  it("fails closed on a PASS guard with an empty-string evidence path", () => {
    const result = buildOperationalOperatorProjection(
      projectionInput({ guardSnapshots: [guardSnapshot({ status: "PASS", evidencePath: "   " })] }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("UNBACKED_GUARD_PASS");
  });

  it("keeps FAIL and BLOCKED guards visible without requiring evidence", () => {
    const result = buildOperationalOperatorProjection(
      projectionInput({
        guardSnapshots: [
          guardSnapshot({ checker: "check-a", status: "FAIL", evidencePath: null }),
          guardSnapshot({ checker: "check-b", status: "BLOCKED", evidencePath: null }),
        ],
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.readout.guardSnapshots.map((g) => g.status)).toEqual(["FAIL", "BLOCKED"]);
    }
  });

  // --- Optional session projection pass-through ---

  it("returns a null sessionProjection when none is supplied", () => {
    const result = buildOperationalOperatorProjection(projectionInput());
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.readout.sessionProjection).toBeNull();
  });

  it("carries a supplied session projection through exactly, without building or mutating it", () => {
    const sessionProjection = { required: true, materialCommitRef: "abc1234", surfacePaths: Object.freeze(["CVF_SESSION_MEMORY.md"]) };
    const result = buildOperationalOperatorProjection(projectionInput({ sessionProjection }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.readout.sessionProjection).toBe(sessionProjection);
    }
  });

  // --- Invalid input / unsupported lane negatives ---

  it("fails closed on an empty currentMode", () => {
    const result = buildOperationalOperatorProjection(projectionInput({ currentMode: "" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("INVALID_SESSION_FACTS");
  });

  it("fails closed on an empty activeHandoff", () => {
    const result = buildOperationalOperatorProjection(projectionInput({ activeHandoff: "   " }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("INVALID_SESSION_FACTS");
  });

  it("fails closed on an empty nextAllowedMove", () => {
    const result = buildOperationalOperatorProjection(projectionInput({ nextAllowedMove: "" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("INVALID_SESSION_FACTS");
  });

  it("fails closed on a workspace item declaring an unsupported lane", () => {
    const result = buildOperationalOperatorProjection(
      projectionInput({ workspaceItems: [workspaceItem({ lane: "not_a_real_lane" as unknown as MaoOperationalWorkspaceItemSnapshot["lane"] })] }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("UNSUPPORTED_LANE");
  });

  // --- Caller array/record immutability ---

  it("does not mutate the caller's workspaceItems or guardSnapshots arrays", () => {
    const items = [workspaceItem({ itemId: "b" }), workspaceItem({ itemId: "a" })];
    const guards = [guardSnapshot({ checker: "b" }), guardSnapshot({ checker: "a" })];
    const itemsCopy = items.map((i) => ({ ...i }));
    const guardsCopy = guards.map((g) => ({ ...g }));

    buildOperationalOperatorProjection(projectionInput({ workspaceItems: items, guardSnapshots: guards }));

    expect(items).toEqual(itemsCopy);
    expect(guards).toEqual(guardsCopy);
  });

  // --- Source import discipline ---

  it("imports no filesystem, generator, UI, queue, provider, process, network, or git owner", async () => {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const sourcePath = join(__dirname, "..", "src", "mao", "operational.operator.projection.ts");
    const source = await readFile(sourcePath, "utf8");
    expect(source).not.toMatch(/node:fs/);
    expect(source).not.toMatch(/node:child_process/);
    expect(source).not.toMatch(/node:https?/);
    expect(source).not.toMatch(/generate_active_session_state|generate_agent_workspace_state/);
    expect(source).not.toMatch(/CVF_CONTROL_PLANE_FOUNDATION/);
  });
});
