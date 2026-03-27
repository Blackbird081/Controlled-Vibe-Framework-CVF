import { describe, it, expect } from "vitest";
import {
  BoardroomConsumerPipelineContract,
  createBoardroomConsumerPipelineContract,
} from "../src/boardroom.consumer.pipeline.contract";
import {
  BoardroomConsumerPipelineBatchContract,
  createBoardroomConsumerPipelineBatchContract,
} from "../src/boardroom.consumer.pipeline.batch.contract";
import type { BoardroomSession, BoardroomDecision } from "../src/boardroom.contract";

const FIXED_NOW = "2026-03-27T10:00:00.000Z";

// Helper: create test boardroom session
function makeBoardroomSession(options: {
  decision?: BoardroomDecision;
  clarifications?: number;
  pendingClarifications?: number;
  sessionId?: string;
} = {}): BoardroomSession {
  const {
    decision = "PROCEED",
    clarifications = 0,
    pendingClarifications = 0,
    sessionId = "session-123",
  } = options;

  const clarificationEntries = [];
  for (let i = 0; i < clarifications; i++) {
    clarificationEntries.push({
      questionId: `q${i}`,
      question: `Question ${i}?`,
      answer: i < clarifications - pendingClarifications ? `Answer ${i}` : undefined,
      status: (i < clarifications - pendingClarifications ? "answered" : "pending") as "answered" | "pending" | "skipped",
    });
  }

  return {
    sessionId,
    createdAt: FIXED_NOW,
    planId: "plan-456",
    consumerId: "consumer-789",
    clarifications: clarificationEntries,
    decision: {
      decision,
      rationale: `Decision: ${decision}`,
    },
    governanceSnapshot: {
      totalSessions: 1,
      totalActions: 5,
      cumulativeRisk: 10,
      highestRisk: "R2",
      verdictBreakdown: { ALLOW: 1, WARN: 0, ESCALATE: 0, BLOCK: 0 },
      domainBreakdown: { "test-domain": 1 },
    },
    finalPlan: {
      planId: "plan-456",
      planHash: "hash-789",
      consumerId: "consumer-789",
      domainDetected: "test-domain",
      totalTasks: 5,
      tasks: [],
      riskSummary: { R0: 3, R1: 2, R2: 0, R3: 0 },
      warnings: [],
    },
    sessionHash: "session-hash-123",
    warnings: [],
  };
}

const proceedSession = makeBoardroomSession({ decision: "PROCEED" });
const rejectSession = makeBoardroomSession({ decision: "REJECT" });
const amendSession = makeBoardroomSession({ decision: "AMEND_PLAN", clarifications: 2, pendingClarifications: 2 });
const escalateSession = makeBoardroomSession({ decision: "ESCALATE", clarifications: 3 });

describe("BoardroomConsumerPipelineContract", () => {
  const contract = new BoardroomConsumerPipelineContract({ now: () => FIXED_NOW });

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new BoardroomConsumerPipelineContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createBoardroomConsumerPipelineContract();
      expect(c.execute({ boardroomSession: proceedSession })).toBeDefined();
    });
  });

  describe("output shape", () => {
    const result = contract.execute({ boardroomSession: proceedSession });

    it("has resultId", () => {
      expect(typeof result.resultId).toBe("string");
      expect(result.resultId.length).toBeGreaterThan(0);
    });

    it("has createdAt equal to now()", () => {
      expect(result.createdAt).toBe(FIXED_NOW);
    });

    it("has boardroomSession", () => {
      expect(result.boardroomSession).toBeDefined();
      expect(result.boardroomSession).toBe(proceedSession);
    });

    it("has consumerPackage", () => {
      expect(result.consumerPackage).toBeDefined();
      expect(typeof result.consumerPackage.pipelineHash).toBe("string");
    });

    it("has query", () => {
      expect(typeof result.query).toBe("string");
      expect(result.query).toContain("BoardroomSession:");
    });

    it("has contextId", () => {
      expect(typeof result.contextId).toBe("string");
      expect(result.contextId).toBe(proceedSession.sessionId);
    });

    it("has warnings array", () => {
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it("has pipelineHash", () => {
      expect(typeof result.pipelineHash).toBe("string");
      expect(result.pipelineHash.length).toBeGreaterThan(0);
    });

    it("resultId is distinct from pipelineHash", () => {
      expect(result.resultId).not.toBe(result.pipelineHash);
    });
  });

  describe("consumerId propagation", () => {
    it("propagates consumerId when provided", () => {
      const result = contract.execute({ boardroomSession: proceedSession, consumerId: "consumer-xyz" });
      expect(result.consumerId).toBe("consumer-xyz");
    });

    it("consumerId is undefined when not provided", () => {
      const result = contract.execute({ boardroomSession: proceedSession });
      expect(result.consumerId).toBeUndefined();
    });
  });

  describe("query derivation", () => {
    it("derives query with PROCEED decision", () => {
      const result = contract.execute({ boardroomSession: proceedSession });
      expect(result.query).toBe("BoardroomSession: 1 rounds, decision=PROCEED, clarifications=0");
    });

    it("derives query with REJECT decision", () => {
      const result = contract.execute({ boardroomSession: rejectSession });
      expect(result.query).toBe("BoardroomSession: 1 rounds, decision=REJECT, clarifications=0");
    });

    it("derives query with AMEND_PLAN decision", () => {
      const result = contract.execute({ boardroomSession: amendSession });
      expect(result.query).toBe("BoardroomSession: 1 rounds, decision=AMEND_PLAN, clarifications=2");
    });

    it("derives query with ESCALATE decision", () => {
      const result = contract.execute({ boardroomSession: escalateSession });
      expect(result.query).toBe("BoardroomSession: 1 rounds, decision=ESCALATE, clarifications=3");
    });
  });

  describe("contextId extraction", () => {
    it("extracts contextId from sessionId", () => {
      const session = makeBoardroomSession({ sessionId: "session-xyz-789" });
      const result = contract.execute({ boardroomSession: session });
      expect(result.contextId).toBe("session-xyz-789");
    });
  });

  describe("warnings", () => {
    it("emits WARNING_PENDING_CLARIFICATIONS when clarifications are pending", () => {
      const result = contract.execute({ boardroomSession: amendSession });
      expect(result.warnings).toContain("WARNING_PENDING_CLARIFICATIONS");
    });

    it("does not emit WARNING_PENDING_CLARIFICATIONS when all clarifications are answered", () => {
      const session = makeBoardroomSession({ clarifications: 2, pendingClarifications: 0 });
      const result = contract.execute({ boardroomSession: session });
      expect(result.warnings).not.toContain("WARNING_PENDING_CLARIFICATIONS");
    });

    it("does not emit WARNING_PENDING_CLARIFICATIONS when no clarifications", () => {
      const result = contract.execute({ boardroomSession: proceedSession });
      expect(result.warnings).not.toContain("WARNING_PENDING_CLARIFICATIONS");
    });

    it("emits no warnings for normal session", () => {
      const result = contract.execute({ boardroomSession: proceedSession });
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe("deterministic hashing", () => {
    it("pipelineHash is deterministic for same input", () => {
      const r1 = contract.execute({ boardroomSession: proceedSession });
      const r2 = contract.execute({ boardroomSession: proceedSession });
      expect(r1.pipelineHash).toBe(r2.pipelineHash);
    });

    it("resultId is deterministic for same input", () => {
      const r1 = contract.execute({ boardroomSession: proceedSession });
      const r2 = contract.execute({ boardroomSession: proceedSession });
      expect(r1.resultId).toBe(r2.resultId);
    });
  });
});

describe("BoardroomConsumerPipelineBatchContract", () => {
  const pipelineContract = new BoardroomConsumerPipelineContract({ now: () => FIXED_NOW });
  const batchContract = new BoardroomConsumerPipelineBatchContract({ now: () => FIXED_NOW });

  function makeResult(decision: BoardroomDecision, clarifications = 0) {
    const session = makeBoardroomSession({ decision, clarifications });
    return pipelineContract.execute({ boardroomSession: session });
  }

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new BoardroomConsumerPipelineBatchContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createBoardroomConsumerPipelineBatchContract();
      expect(c.batch([])).toBeDefined();
    });
  });

  describe("output shape", () => {
    const results = [makeResult("PROCEED")];
    const batch = batchContract.batch(results);

    it("has batchId", () => {
      expect(typeof batch.batchId).toBe("string");
      expect(batch.batchId.length).toBeGreaterThan(0);
    });

    it("has batchHash", () => {
      expect(typeof batch.batchHash).toBe("string");
      expect(batch.batchHash.length).toBeGreaterThan(0);
    });

    it("has createdAt", () => {
      expect(batch.createdAt).toBe(FIXED_NOW);
    });

    it("has totalSessions", () => {
      expect(typeof batch.totalSessions).toBe("number");
      expect(batch.totalSessions).toBe(1);
    });

    it("has totalRounds", () => {
      expect(typeof batch.totalRounds).toBe("number");
      expect(batch.totalRounds).toBe(1);
    });

    it("has overallDominantDecision", () => {
      expect(typeof batch.overallDominantDecision).toBe("string");
      expect(["PROCEED", "REJECT", "AMEND_PLAN", "ESCALATE"]).toContain(batch.overallDominantDecision);
    });

    it("has totalClarifications", () => {
      expect(typeof batch.totalClarifications).toBe("number");
    });

    it("has dominantTokenBudget", () => {
      expect(typeof batch.dominantTokenBudget).toBe("number");
    });

    it("has results array", () => {
      expect(Array.isArray(batch.results)).toBe(true);
      expect(batch.results).toHaveLength(1);
    });

    it("batchId differs from batchHash", () => {
      expect(batch.batchId).not.toBe(batch.batchHash);
    });
  });

  describe("aggregation", () => {
    it("calculates totalSessions correctly", () => {
      const results = [makeResult("PROCEED"), makeResult("REJECT"), makeResult("AMEND_PLAN")];
      const batch = batchContract.batch(results);
      expect(batch.totalSessions).toBe(3);
    });

    it("calculates totalRounds correctly", () => {
      const results = [makeResult("PROCEED"), makeResult("REJECT"), makeResult("AMEND_PLAN"), makeResult("ESCALATE")];
      const batch = batchContract.batch(results);
      expect(batch.totalRounds).toBe(4);
    });

    it("calculates totalClarifications correctly", () => {
      const results = [makeResult("PROCEED", 1), makeResult("REJECT", 2), makeResult("AMEND_PLAN", 0)];
      const batch = batchContract.batch(results);
      expect(batch.totalClarifications).toBe(3);
    });

    it("selects dominant decision based on frequency (PROCEED)", () => {
      const results = [makeResult("PROCEED"), makeResult("PROCEED"), makeResult("REJECT")];
      const batch = batchContract.batch(results);
      expect(batch.overallDominantDecision).toBe("PROCEED");
    });

    it("selects dominant decision based on frequency (REJECT)", () => {
      const results = [makeResult("REJECT"), makeResult("REJECT"), makeResult("PROCEED")];
      const batch = batchContract.batch(results);
      expect(batch.overallDominantDecision).toBe("REJECT");
    });

    it("breaks ties using priority order (PROCEED > REJECT)", () => {
      const results = [makeResult("PROCEED"), makeResult("REJECT")];
      const batch = batchContract.batch(results);
      expect(batch.overallDominantDecision).toBe("PROCEED");
    });

    it("breaks ties using priority order (REJECT > AMEND_PLAN)", () => {
      const results = [makeResult("REJECT"), makeResult("AMEND_PLAN")];
      const batch = batchContract.batch(results);
      expect(batch.overallDominantDecision).toBe("REJECT");
    });

    it("breaks ties using priority order (AMEND_PLAN > ESCALATE)", () => {
      const results = [makeResult("AMEND_PLAN"), makeResult("ESCALATE")];
      const batch = batchContract.batch(results);
      expect(batch.overallDominantDecision).toBe("AMEND_PLAN");
    });

    it("calculates dominantTokenBudget as max", () => {
      const results = [makeResult("PROCEED"), makeResult("REJECT"), makeResult("AMEND_PLAN")];
      const batch = batchContract.batch(results);
      expect(batch.dominantTokenBudget).toBeGreaterThan(0);
    });

    it("handles empty batch with dominantTokenBudget = 0", () => {
      const batch = batchContract.batch([]);
      expect(batch.totalSessions).toBe(0);
      expect(batch.totalRounds).toBe(0);
      expect(batch.totalClarifications).toBe(0);
      expect(batch.dominantTokenBudget).toBe(0);
      expect(batch.overallDominantDecision).toBe("PROCEED");
    });
  });

  describe("deterministic hashing", () => {
    it("batchHash is deterministic for same input", () => {
      const results = [makeResult("PROCEED")];
      const b1 = batchContract.batch(results);
      const b2 = batchContract.batch(results);
      expect(b1.batchHash).toBe(b2.batchHash);
    });

    it("batchId is deterministic for same input", () => {
      const results = [makeResult("PROCEED")];
      const b1 = batchContract.batch(results);
      const b2 = batchContract.batch(results);
      expect(b1.batchId).toBe(b2.batchId);
    });
  });
});
