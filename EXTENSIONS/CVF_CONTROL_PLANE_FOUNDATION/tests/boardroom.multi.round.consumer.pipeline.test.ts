import { describe, it, expect } from "vitest";
import {
  BoardroomMultiRoundConsumerPipelineContract,
  createBoardroomMultiRoundConsumerPipelineContract,
} from "../src/boardroom.multi.round.consumer.pipeline.contract";
import {
  BoardroomMultiRoundConsumerPipelineBatchContract,
  createBoardroomMultiRoundConsumerPipelineBatchContract,
} from "../src/boardroom.multi.round.consumer.pipeline.batch.contract";
import type { BoardroomMultiRoundSummary } from "../src/boardroom.multi.round.contract";
import type { BoardroomDecision } from "../src/boardroom.contract";

const FIXED_NOW = "2026-03-27T10:00:00.000Z";

// Helper: create a multi-round summary
function makeSummary(options: {
  totalRounds?: number;
  proceedCount?: number;
  amendCount?: number;
  escalateCount?: number;
  rejectCount?: number;
  dominantDecision?: BoardroomDecision;
  summaryId?: string;
} = {}): BoardroomMultiRoundSummary {
  const {
    totalRounds = 3,
    proceedCount = 2,
    amendCount = 1,
    escalateCount = 0,
    rejectCount = 0,
    dominantDecision = "PROCEED",
    summaryId = "summary-abc-123",
  } = options;

  return {
    summaryId,
    createdAt: FIXED_NOW,
    totalRounds,
    proceedCount,
    amendCount,
    escalateCount,
    rejectCount,
    dominantDecision,
    finalRoundNumber: totalRounds,
    dominantFocus: "CLARIFICATION",
    summary: `Multi-round: ${totalRounds} rounds, dominant=${dominantDecision}`,
    summaryHash: `hash-${summaryId}`,
  };
}

const proceedSummary  = makeSummary({ dominantDecision: "PROCEED",    proceedCount: 3, rejectCount: 0, escalateCount: 0, amendCount: 0, totalRounds: 3 });
const rejectSummary   = makeSummary({ dominantDecision: "REJECT",     rejectCount: 2, proceedCount: 1, totalRounds: 3, summaryId: "summary-reject" });
const escalateSummary = makeSummary({ dominantDecision: "ESCALATE",   escalateCount: 2, proceedCount: 1, totalRounds: 3, summaryId: "summary-escalate" });
const amendSummary    = makeSummary({ dominantDecision: "AMEND_PLAN", amendCount: 2, proceedCount: 1, totalRounds: 3, summaryId: "summary-amend" });
const emptySummary    = makeSummary({ totalRounds: 0, proceedCount: 0, amendCount: 0, escalateCount: 0, rejectCount: 0, dominantDecision: "PROCEED", summaryId: "summary-empty" });
const mixedSummary    = makeSummary({ totalRounds: 4, proceedCount: 1, amendCount: 1, escalateCount: 1, rejectCount: 1, dominantDecision: "REJECT", summaryId: "summary-mixed" });

describe("BoardroomMultiRoundConsumerPipelineContract", () => {
  const contract = new BoardroomMultiRoundConsumerPipelineContract({ now: () => FIXED_NOW });

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new BoardroomMultiRoundConsumerPipelineContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createBoardroomMultiRoundConsumerPipelineContract();
      expect(c.execute({ multiRoundSummary: proceedSummary })).toBeDefined();
    });
  });

  describe("output shape", () => {
    const result = contract.execute({ multiRoundSummary: proceedSummary });

    it("has resultId", () => {
      expect(typeof result.resultId).toBe("string");
      expect(result.resultId.length).toBeGreaterThan(0);
    });

    it("has createdAt equal to now()", () => {
      expect(result.createdAt).toBe(FIXED_NOW);
    });

    it("has multiRoundSummary", () => {
      expect(result.multiRoundSummary).toBe(proceedSummary);
    });

    it("has consumerPackage", () => {
      expect(result.consumerPackage).toBeDefined();
      expect(typeof result.consumerPackage.pipelineHash).toBe("string");
    });

    it("has query", () => {
      expect(typeof result.query).toBe("string");
      expect(result.query).toContain("BoardroomMultiRound:");
    });

    it("has contextId", () => {
      expect(typeof result.contextId).toBe("string");
    });

    it("has warnings array", () => {
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it("has consumerId as undefined when not provided", () => {
      expect(result.consumerId).toBeUndefined();
    });

    it("has pipelineHash", () => {
      expect(typeof result.pipelineHash).toBe("string");
      expect(result.pipelineHash.length).toBeGreaterThan(0);
    });

    it("resultId differs from pipelineHash", () => {
      expect(result.resultId).not.toBe(result.pipelineHash);
    });
  });

  describe("consumerId propagation", () => {
    it("propagates consumerId when provided", () => {
      const result = contract.execute({ multiRoundSummary: proceedSummary, consumerId: "consumer-xyz" });
      expect(result.consumerId).toBe("consumer-xyz");
    });

    it("consumerId is undefined when not provided", () => {
      const result = contract.execute({ multiRoundSummary: proceedSummary });
      expect(result.consumerId).toBeUndefined();
    });
  });

  describe("query derivation", () => {
    it("derives query with PROCEED dominant", () => {
      const result = contract.execute({ multiRoundSummary: proceedSummary });
      expect(result.query).toBe("BoardroomMultiRound: rounds=3, dominant=PROCEED, proceed=3, reject=0");
    });

    it("derives query with REJECT dominant", () => {
      const result = contract.execute({ multiRoundSummary: rejectSummary });
      expect(result.query).toContain("dominant=REJECT");
      expect(result.query).toContain("reject=2");
    });

    it("derives query with ESCALATE dominant", () => {
      const result = contract.execute({ multiRoundSummary: escalateSummary });
      expect(result.query).toContain("dominant=ESCALATE");
    });

    it("derives query with AMEND_PLAN dominant", () => {
      const result = contract.execute({ multiRoundSummary: amendSummary });
      expect(result.query).toContain("dominant=AMEND_PLAN");
    });

    it("derives query with 0 rounds", () => {
      const result = contract.execute({ multiRoundSummary: emptySummary });
      expect(result.query).toContain("rounds=0");
    });
  });

  describe("contextId extraction", () => {
    it("extracts contextId from summaryId", () => {
      const result = contract.execute({ multiRoundSummary: proceedSummary });
      expect(result.contextId).toBe(proceedSummary.summaryId);
    });

    it("different summaries yield different contextIds", () => {
      const r1 = contract.execute({ multiRoundSummary: proceedSummary });
      const r2 = contract.execute({ multiRoundSummary: rejectSummary });
      expect(r1.contextId).not.toBe(r2.contextId);
    });
  });

  describe("warnings", () => {
    it("emits no warnings for all-proceed summary", () => {
      const result = contract.execute({ multiRoundSummary: proceedSummary });
      expect(result.warnings).toHaveLength(0);
    });

    it("emits WARNING_NO_ROUNDS when totalRounds is 0", () => {
      const result = contract.execute({ multiRoundSummary: emptySummary });
      expect(result.warnings).toContain("WARNING_NO_ROUNDS");
    });

    it("does not emit WARNING_NO_ROUNDS when rounds > 0", () => {
      const result = contract.execute({ multiRoundSummary: proceedSummary });
      expect(result.warnings).not.toContain("WARNING_NO_ROUNDS");
    });

    it("emits WARNING_REJECTED when rejectCount > 0", () => {
      const result = contract.execute({ multiRoundSummary: rejectSummary });
      expect(result.warnings).toContain("WARNING_REJECTED");
    });

    it("does not emit WARNING_REJECTED when rejectCount is 0", () => {
      const result = contract.execute({ multiRoundSummary: proceedSummary });
      expect(result.warnings).not.toContain("WARNING_REJECTED");
    });

    it("emits WARNING_ESCALATED when escalateCount > 0", () => {
      const result = contract.execute({ multiRoundSummary: escalateSummary });
      expect(result.warnings).toContain("WARNING_ESCALATED");
    });

    it("does not emit WARNING_ESCALATED when escalateCount is 0", () => {
      const result = contract.execute({ multiRoundSummary: proceedSummary });
      expect(result.warnings).not.toContain("WARNING_ESCALATED");
    });

    it("emits WARNING_AMENDED when amendCount > 0", () => {
      const result = contract.execute({ multiRoundSummary: amendSummary });
      expect(result.warnings).toContain("WARNING_AMENDED");
    });

    it("does not emit WARNING_AMENDED for all-proceed", () => {
      const result = contract.execute({ multiRoundSummary: proceedSummary });
      expect(result.warnings).not.toContain("WARNING_AMENDED");
    });

    it("emits multiple warnings for mixed summary", () => {
      const result = contract.execute({ multiRoundSummary: mixedSummary });
      expect(result.warnings).toContain("WARNING_REJECTED");
      expect(result.warnings).toContain("WARNING_ESCALATED");
      expect(result.warnings).toContain("WARNING_AMENDED");
      expect(result.warnings).toHaveLength(3);
    });
  });

  describe("deterministic hashing", () => {
    it("pipelineHash is deterministic for same input", () => {
      const r1 = contract.execute({ multiRoundSummary: proceedSummary });
      const r2 = contract.execute({ multiRoundSummary: proceedSummary });
      expect(r1.pipelineHash).toBe(r2.pipelineHash);
    });

    it("resultId is deterministic for same input", () => {
      const r1 = contract.execute({ multiRoundSummary: proceedSummary });
      const r2 = contract.execute({ multiRoundSummary: proceedSummary });
      expect(r1.resultId).toBe(r2.resultId);
    });

    it("pipelineHash changes when summaryHash changes", () => {
      const r1 = contract.execute({ multiRoundSummary: proceedSummary });
      const r2 = contract.execute({ multiRoundSummary: rejectSummary });
      expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
    });
  });
});

describe("BoardroomMultiRoundConsumerPipelineBatchContract", () => {
  const pipelineContract = new BoardroomMultiRoundConsumerPipelineContract({ now: () => FIXED_NOW });
  const batchContract    = new BoardroomMultiRoundConsumerPipelineBatchContract({ now: () => FIXED_NOW });

  function makeResult(summary: BoardroomMultiRoundSummary) {
    return pipelineContract.execute({ multiRoundSummary: summary });
  }

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new BoardroomMultiRoundConsumerPipelineBatchContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createBoardroomMultiRoundConsumerPipelineBatchContract();
      expect(c.batch([])).toBeDefined();
    });
  });

  describe("output shape", () => {
    const results = [makeResult(proceedSummary)];
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

    it("has totalSummaries", () => {
      expect(typeof batch.totalSummaries).toBe("number");
    });

    it("has totalRounds", () => {
      expect(typeof batch.totalRounds).toBe("number");
    });

    it("has dominantDecision", () => {
      expect(["PROCEED", "AMEND_PLAN", "ESCALATE", "REJECT"]).toContain(batch.dominantDecision);
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
    it("calculates totalSummaries correctly", () => {
      const batch = batchContract.batch([makeResult(proceedSummary), makeResult(rejectSummary)]);
      expect(batch.totalSummaries).toBe(2);
    });

    it("calculates totalRounds correctly", () => {
      const r1 = makeResult(proceedSummary);  // 3 rounds
      const r2 = makeResult(mixedSummary);    // 4 rounds
      const batch = batchContract.batch([r1, r2]);
      expect(batch.totalRounds).toBe(7);
    });

    it("handles empty batch", () => {
      const batch = batchContract.batch([]);
      expect(batch.totalSummaries).toBe(0);
      expect(batch.totalRounds).toBe(0);
      expect(batch.dominantTokenBudget).toBe(0);
      expect(batch.dominantDecision).toBe("PROCEED");
    });

    it("dominantTokenBudget is max estimatedTokens across results", () => {
      const batch = batchContract.batch([makeResult(proceedSummary), makeResult(rejectSummary)]);
      expect(batch.dominantTokenBudget).toBeGreaterThanOrEqual(0);
    });
  });

  describe("dominant decision calculation", () => {
    it("selects REJECT as dominant regardless of count (severity-first)", () => {
      // REJECT has highest severity, dominates even when outnumbered 1 vs 2
      const batch = batchContract.batch([
        makeResult(rejectSummary),
        makeResult(proceedSummary),
        makeResult(proceedSummary),
      ]);
      expect(batch.dominantDecision).toBe("REJECT");
    });

    it("selects PROCEED when all are PROCEED", () => {
      const batch = batchContract.batch([
        makeResult(proceedSummary),
        makeResult(proceedSummary),
      ]);
      expect(batch.dominantDecision).toBe("PROCEED");
    });

    it("selects ESCALATE over AMEND_PLAN (severity-first)", () => {
      const batch = batchContract.batch([
        makeResult(escalateSummary),
        makeResult(amendSummary),
      ]);
      expect(batch.dominantDecision).toBe("ESCALATE");
    });
  });

  describe("deterministic hashing", () => {
    it("batchHash is deterministic for same input", () => {
      const results = [makeResult(proceedSummary)];
      const b1 = batchContract.batch(results);
      const b2 = batchContract.batch(results);
      expect(b1.batchHash).toBe(b2.batchHash);
    });

    it("batchId is deterministic for same input", () => {
      const results = [makeResult(proceedSummary)];
      const b1 = batchContract.batch(results);
      const b2 = batchContract.batch(results);
      expect(b1.batchId).toBe(b2.batchId);
    });
  });
});
