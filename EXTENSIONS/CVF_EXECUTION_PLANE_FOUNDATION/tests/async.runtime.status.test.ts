/**
 * EPF Async Runtime & Status — Dedicated Tests (W6-T23)
 * ======================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   AsyncCommandRuntimeContract.issue:
 *     - asyncStatus is always "PENDING"
 *     - estimatedTimeoutMs = max(1000, executedCount * 1000) for executedCount=0
 *     - estimatedTimeoutMs = max(1000, executedCount * 1000) for executedCount=5
 *     - estimatedTimeoutMs = max(1000, executedCount * 1000) for executedCount=1
 *     - sourceRuntimeId = result.runtimeId
 *     - sourceGateId = result.gateId
 *     - recordCount = result.records.length
 *     - executedCount propagated from result
 *     - failedCount propagated from result
 *     - custom estimateTimeout override respected
 *     - ticketHash and ticketId are deterministic for same inputs and timestamp
 *     - issuedAt set to injected now()
 *     - factory createAsyncCommandRuntimeContract returns working instance
 *
 *   AsyncExecutionStatusContract.assess:
 *     - empty → totalTickets=0, COMPLETED dominant, "No async execution tickets" summary
 *     - single FAILED ticket → failedCount=1, FAILED dominant
 *     - single RUNNING ticket → runningCount=1, RUNNING dominant (no failed)
 *     - single PENDING ticket → pendingCount=1, PENDING dominant (no failed/running)
 *     - single COMPLETED ticket → completedCount=1, COMPLETED dominant
 *     - FAILED dominates RUNNING when both present
 *     - FAILED dominates PENDING when both present
 *     - RUNNING dominates PENDING when both present
 *     - counts accurate for mixed input (FAILED+RUNNING+PENDING+COMPLETED)
 *     - totalTickets equals input length
 *     - summary mentions non-zero status buckets
 *     - summary mentions dominant status
 *     - summaryHash and summaryId deterministic for same inputs and timestamp
 *     - createdAt set to injected now()
 *     - factory createAsyncExecutionStatusContract returns working instance
 */

import { describe, it, expect } from "vitest";

import {
  AsyncCommandRuntimeContract,
  createAsyncCommandRuntimeContract,
} from "../src/execution.async.runtime.contract";
import type { AsyncCommandRuntimeTicket } from "../src/execution.async.runtime.contract";
import {
  AsyncExecutionStatusContract,
  createAsyncExecutionStatusContract,
} from "../src/execution.async.status.contract";
import type { CommandRuntimeResult } from "../src/command.runtime.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T02:00:00.000Z";
const fixedNow = () => FIXED_NOW;

let _rSeq = 0;
function makeRuntimeResult(
  executedCount: number,
  failedCount: number,
  recordCount = 0,
): CommandRuntimeResult {
  const n = ++_rSeq;
  const records = Array.from({ length: recordCount }, (_, i) => ({
    assignmentId: `a-${n}-${i}`,
    taskId: `t-${n}-${i}`,
    gateDecision: "ALLOW",
    status: "EXECUTED" as const,
    executionHash: `eh-${n}-${i}`,
    notes: "",
  }));
  return {
    runtimeId: `runtime-${n}`,
    gateId: `gate-${n}`,
    executedAt: FIXED_NOW,
    records,
    executedCount,
    sandboxedCount: 0,
    skippedCount: 0,
    failedCount,
    runtimeHash: `rh-${n}`,
    summary: `runtime summary ${n}`,
  };
}

function makeTicket(asyncStatus: AsyncCommandRuntimeTicket["asyncStatus"]): AsyncCommandRuntimeTicket {
  const n = ++_rSeq;
  return {
    ticketId: `ticket-${n}`,
    issuedAt: FIXED_NOW,
    sourceRuntimeId: `runtime-${n}`,
    sourceGateId: `gate-${n}`,
    asyncStatus,
    recordCount: 1,
    executedCount: 1,
    failedCount: asyncStatus === "FAILED" ? 1 : 0,
    estimatedTimeoutMs: 1000,
    ticketHash: `th-${n}`,
  };
}

// ─── AsyncCommandRuntimeContract ──────────────────────────────────────────────

describe("AsyncCommandRuntimeContract.issue", () => {
  const contract = new AsyncCommandRuntimeContract({ now: fixedNow });

  it("asyncStatus is always 'PENDING'", () => {
    const ticket = contract.issue(makeRuntimeResult(3, 0));
    expect(ticket.asyncStatus).toBe("PENDING");
  });

  describe("estimatedTimeoutMs = max(1000, executedCount * 1000)", () => {
    it("executedCount=0 → 1000 (floor)", () => {
      const ticket = contract.issue(makeRuntimeResult(0, 0));
      expect(ticket.estimatedTimeoutMs).toBe(1000);
    });

    it("executedCount=1 → 1000 (equal to floor)", () => {
      const ticket = contract.issue(makeRuntimeResult(1, 0));
      expect(ticket.estimatedTimeoutMs).toBe(1000);
    });

    it("executedCount=5 → 5000", () => {
      const ticket = contract.issue(makeRuntimeResult(5, 0));
      expect(ticket.estimatedTimeoutMs).toBe(5000);
    });
  });

  it("sourceRuntimeId = result.runtimeId", () => {
    const result = makeRuntimeResult(2, 0);
    expect(contract.issue(result).sourceRuntimeId).toBe(result.runtimeId);
  });

  it("sourceGateId = result.gateId", () => {
    const result = makeRuntimeResult(2, 0);
    expect(contract.issue(result).sourceGateId).toBe(result.gateId);
  });

  it("recordCount = result.records.length", () => {
    const result = makeRuntimeResult(3, 0, 3);
    expect(contract.issue(result).recordCount).toBe(3);
  });

  it("executedCount propagated from result", () => {
    const result = makeRuntimeResult(7, 0);
    expect(contract.issue(result).executedCount).toBe(7);
  });

  it("failedCount propagated from result", () => {
    const result = makeRuntimeResult(4, 2);
    expect(contract.issue(result).failedCount).toBe(2);
  });

  it("custom estimateTimeout override respected", () => {
    const custom = new AsyncCommandRuntimeContract({
      now: fixedNow,
      estimateTimeout: () => 99999,
    });
    expect(custom.issue(makeRuntimeResult(1, 0)).estimatedTimeoutMs).toBe(99999);
  });

  it("ticketHash and ticketId are deterministic for same inputs and timestamp", () => {
    const result = makeRuntimeResult(3, 1);
    const t1 = contract.issue(result);
    const t2 = contract.issue(result);
    expect(t1.ticketHash).toBe(t2.ticketHash);
    expect(t1.ticketId).toBe(t2.ticketId);
  });

  it("issuedAt set to injected now()", () => {
    expect(contract.issue(makeRuntimeResult(1, 0)).issuedAt).toBe(FIXED_NOW);
  });

  it("factory createAsyncCommandRuntimeContract returns working instance", () => {
    const c = createAsyncCommandRuntimeContract({ now: fixedNow });
    const ticket = c.issue(makeRuntimeResult(2, 0));
    expect(ticket.asyncStatus).toBe("PENDING");
    expect(ticket.issuedAt).toBe(FIXED_NOW);
  });
});

// ─── AsyncExecutionStatusContract ─────────────────────────────────────────────

describe("AsyncExecutionStatusContract.assess", () => {
  const contract = new AsyncExecutionStatusContract({ now: fixedNow });

  it("empty → totalTickets=0, COMPLETED dominant, 'No async execution tickets' summary", () => {
    const result = contract.assess([]);
    expect(result.totalTickets).toBe(0);
    expect(result.pendingCount).toBe(0);
    expect(result.runningCount).toBe(0);
    expect(result.completedCount).toBe(0);
    expect(result.failedCount).toBe(0);
    expect(result.dominantStatus).toBe("COMPLETED");
    expect(result.summary).toContain("No async execution tickets");
  });

  describe("dominant status derivation", () => {
    it("single FAILED ticket → failedCount=1, FAILED dominant", () => {
      const result = contract.assess([makeTicket("FAILED")]);
      expect(result.failedCount).toBe(1);
      expect(result.dominantStatus).toBe("FAILED");
    });

    it("single RUNNING ticket → runningCount=1, RUNNING dominant", () => {
      const result = contract.assess([makeTicket("RUNNING")]);
      expect(result.runningCount).toBe(1);
      expect(result.dominantStatus).toBe("RUNNING");
    });

    it("single PENDING ticket → pendingCount=1, PENDING dominant", () => {
      const result = contract.assess([makeTicket("PENDING")]);
      expect(result.pendingCount).toBe(1);
      expect(result.dominantStatus).toBe("PENDING");
    });

    it("single COMPLETED ticket → completedCount=1, COMPLETED dominant", () => {
      const result = contract.assess([makeTicket("COMPLETED")]);
      expect(result.completedCount).toBe(1);
      expect(result.dominantStatus).toBe("COMPLETED");
    });

    it("FAILED dominates RUNNING when both present", () => {
      const tickets = [makeTicket("RUNNING"), makeTicket("FAILED")];
      expect(contract.assess(tickets).dominantStatus).toBe("FAILED");
    });

    it("FAILED dominates PENDING when both present", () => {
      const tickets = [makeTicket("PENDING"), makeTicket("FAILED")];
      expect(contract.assess(tickets).dominantStatus).toBe("FAILED");
    });

    it("RUNNING dominates PENDING when both present (no failed)", () => {
      const tickets = [makeTicket("PENDING"), makeTicket("RUNNING")];
      expect(contract.assess(tickets).dominantStatus).toBe("RUNNING");
    });
  });

  it("counts accurate for mixed input", () => {
    const tickets = [
      makeTicket("FAILED"),
      makeTicket("RUNNING"),
      makeTicket("RUNNING"),
      makeTicket("PENDING"),
      makeTicket("COMPLETED"),
      makeTicket("COMPLETED"),
    ];
    const result = contract.assess(tickets);
    expect(result.failedCount).toBe(1);
    expect(result.runningCount).toBe(2);
    expect(result.pendingCount).toBe(1);
    expect(result.completedCount).toBe(2);
  });

  it("totalTickets equals input length", () => {
    const tickets = [
      makeTicket("PENDING"),
      makeTicket("RUNNING"),
      makeTicket("COMPLETED"),
    ];
    expect(contract.assess(tickets).totalTickets).toBe(3);
  });

  describe("summary content", () => {
    it("summary mentions 'pending' for non-zero pendingCount", () => {
      expect(contract.assess([makeTicket("PENDING")]).summary).toContain("pending");
    });

    it("summary mentions 'running' for non-zero runningCount", () => {
      expect(contract.assess([makeTicket("RUNNING")]).summary).toContain("running");
    });

    it("summary mentions 'completed' for non-zero completedCount", () => {
      expect(contract.assess([makeTicket("COMPLETED")]).summary).toContain("completed");
    });

    it("summary mentions 'failed' for non-zero failedCount", () => {
      expect(contract.assess([makeTicket("FAILED")]).summary).toContain("failed");
    });

    it("summary mentions dominant status", () => {
      const result = contract.assess([makeTicket("FAILED")]);
      expect(result.summary).toContain("FAILED");
    });
  });

  it("summaryHash and summaryId are deterministic for same inputs and timestamp", () => {
    const tickets = [makeTicket("RUNNING"), makeTicket("COMPLETED")];
    const r1 = contract.assess(tickets);
    const r2 = contract.assess(tickets);
    expect(r1.summaryHash).toBe(r2.summaryHash);
    expect(r1.summaryId).toBe(r2.summaryId);
  });

  it("createdAt set to injected now()", () => {
    expect(contract.assess([]).createdAt).toBe(FIXED_NOW);
  });

  it("factory createAsyncExecutionStatusContract returns working instance", () => {
    const c = createAsyncExecutionStatusContract({ now: fixedNow });
    const result = c.assess([]);
    expect(result.dominantStatus).toBe("COMPLETED");
    expect(result.createdAt).toBe(FIXED_NOW);
  });
});
