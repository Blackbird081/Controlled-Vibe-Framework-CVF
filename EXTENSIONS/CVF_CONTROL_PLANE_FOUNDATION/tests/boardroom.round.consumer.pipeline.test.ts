import { describe, it, expect } from "vitest";
import {
  BoardroomRoundConsumerPipelineContract,
  createBoardroomRoundConsumerPipelineContract,
} from "../src/boardroom.round.consumer.pipeline.contract";
import {
  BoardroomRoundConsumerPipelineBatchContract,
  createBoardroomRoundConsumerPipelineBatchContract,
} from "../src/boardroom.round.consumer.pipeline.batch.contract";
import type { BoardroomRound, RefinementFocus } from "../src/boardroom.round.contract";
import type { BoardroomDecision } from "../src/boardroom.contract";

const FIXED_NOW = "2026-03-27T10:00:00.000Z";

// --- Helpers ---

function makeRound(options: {
  refinementFocus?: RefinementFocus;
  sourceDecision?: BoardroomDecision;
  roundNumber?: number;
  roundId?: string;
  roundHash?: string;
} = {}): BoardroomRound {
  const {
    refinementFocus = "CLARIFICATION",
    sourceDecision = "PROCEED",
    roundNumber = 1,
    roundId = `round-id-${refinementFocus}`,
    roundHash = `round-hash-${refinementFocus}`,
  } = options;

  return {
    roundId,
    roundNumber,
    createdAt: FIXED_NOW,
    sourceSessionId: "session-abc",
    sourceDecision,
    refinementFocus,
    refinementNote: `Note for ${refinementFocus}`,
    roundHash,
  };
}

const clarificationRound = makeRound({ refinementFocus: "CLARIFICATION", sourceDecision: "PROCEED" });
const amendmentRound = makeRound({ refinementFocus: "TASK_AMENDMENT", sourceDecision: "AMEND_PLAN" });
const escalationRound = makeRound({ refinementFocus: "ESCALATION_REVIEW", sourceDecision: "ESCALATE" });
const riskRound = makeRound({ refinementFocus: "RISK_REVIEW", sourceDecision: "REJECT" });

describe("BoardroomRoundConsumerPipelineContract", () => {
  const contract = new BoardroomRoundConsumerPipelineContract({ now: () => FIXED_NOW });

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new BoardroomRoundConsumerPipelineContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createBoardroomRoundConsumerPipelineContract();
      expect(c.execute({ round: clarificationRound })).toBeDefined();
    });
  });

  describe("output shape", () => {
    const result = contract.execute({ round: clarificationRound });

    it("has resultId", () => {
      expect(typeof result.resultId).toBe("string");
      expect(result.resultId.length).toBeGreaterThan(0);
    });

    it("has createdAt equal to now()", () => {
      expect(result.createdAt).toBe(FIXED_NOW);
    });

    it("has round reference", () => {
      expect(result.round).toBe(clarificationRound);
    });

    it("has consumerPackage", () => {
      expect(result.consumerPackage).toBeDefined();
      expect(typeof result.consumerPackage.pipelineHash).toBe("string");
    });

    it("has query string containing BoardroomRound:", () => {
      expect(result.query).toContain("BoardroomRound:");
    });

    it("has contextId", () => {
      expect(typeof result.contextId).toBe("string");
    });

    it("has warnings array", () => {
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it("consumerId is undefined when not provided", () => {
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
    it("propagates provided consumerId", () => {
      const result = contract.execute({ round: clarificationRound, consumerId: "consumer-x" });
      expect(result.consumerId).toBe("consumer-x");
    });

    it("consumerId is undefined when not provided", () => {
      expect(contract.execute({ round: clarificationRound }).consumerId).toBeUndefined();
    });
  });

  describe("query derivation", () => {
    it("includes refinementFocus in query", () => {
      const result = contract.execute({ round: clarificationRound });
      expect(result.query).toContain("focus=CLARIFICATION");
    });

    it("includes sourceDecision in query", () => {
      const result = contract.execute({ round: clarificationRound });
      expect(result.query).toContain("decision=PROCEED");
    });

    it("includes roundNumber in query", () => {
      const result = contract.execute({ round: clarificationRound });
      expect(result.query).toContain("round=1");
    });

    it("derives RISK_REVIEW query correctly", () => {
      const result = contract.execute({ round: riskRound });
      expect(result.query).toContain("focus=RISK_REVIEW");
      expect(result.query).toContain("decision=REJECT");
    });

    it("derives ESCALATION_REVIEW query correctly", () => {
      const result = contract.execute({ round: escalationRound });
      expect(result.query).toContain("focus=ESCALATION_REVIEW");
    });

    it("derives TASK_AMENDMENT query correctly", () => {
      const result = contract.execute({ round: amendmentRound });
      expect(result.query).toContain("focus=TASK_AMENDMENT");
    });
  });

  describe("contextId extraction", () => {
    it("contextId equals round.roundId", () => {
      const result = contract.execute({ round: clarificationRound });
      expect(result.contextId).toBe(clarificationRound.roundId);
    });

    it("different rounds yield different contextIds", () => {
      const r1 = contract.execute({ round: clarificationRound });
      const r2 = contract.execute({ round: riskRound });
      expect(r1.contextId).not.toBe(r2.contextId);
    });
  });

  describe("warnings", () => {
    it("emits no warnings for CLARIFICATION round", () => {
      const result = contract.execute({ round: clarificationRound });
      expect(result.warnings).toHaveLength(0);
    });

    it("emits WARNING_RISK_REVIEW for RISK_REVIEW round", () => {
      const result = contract.execute({ round: riskRound });
      expect(result.warnings).toContain("WARNING_RISK_REVIEW");
    });

    it("emits exactly 1 warning for RISK_REVIEW", () => {
      const result = contract.execute({ round: riskRound });
      expect(result.warnings).toHaveLength(1);
    });

    it("emits WARNING_ESCALATION_REVIEW for ESCALATION_REVIEW round", () => {
      const result = contract.execute({ round: escalationRound });
      expect(result.warnings).toContain("WARNING_ESCALATION_REVIEW");
    });

    it("emits exactly 1 warning for ESCALATION_REVIEW", () => {
      const result = contract.execute({ round: escalationRound });
      expect(result.warnings).toHaveLength(1);
    });

    it("emits WARNING_TASK_AMENDMENT for TASK_AMENDMENT round", () => {
      const result = contract.execute({ round: amendmentRound });
      expect(result.warnings).toContain("WARNING_TASK_AMENDMENT");
    });

    it("emits exactly 1 warning for TASK_AMENDMENT", () => {
      const result = contract.execute({ round: amendmentRound });
      expect(result.warnings).toHaveLength(1);
    });

    it("does not emit WARNING_RISK_REVIEW for CLARIFICATION", () => {
      const result = contract.execute({ round: clarificationRound });
      expect(result.warnings).not.toContain("WARNING_RISK_REVIEW");
    });

    it("does not emit WARNING_ESCALATION_REVIEW for CLARIFICATION", () => {
      const result = contract.execute({ round: clarificationRound });
      expect(result.warnings).not.toContain("WARNING_ESCALATION_REVIEW");
    });

    it("does not emit WARNING_TASK_AMENDMENT for CLARIFICATION", () => {
      const result = contract.execute({ round: clarificationRound });
      expect(result.warnings).not.toContain("WARNING_TASK_AMENDMENT");
    });
  });

  describe("deterministic hashing", () => {
    it("pipelineHash is deterministic for same input", () => {
      const r1 = contract.execute({ round: clarificationRound });
      const r2 = contract.execute({ round: clarificationRound });
      expect(r1.pipelineHash).toBe(r2.pipelineHash);
    });

    it("resultId is deterministic for same input", () => {
      const r1 = contract.execute({ round: clarificationRound });
      const r2 = contract.execute({ round: clarificationRound });
      expect(r1.resultId).toBe(r2.resultId);
    });

    it("pipelineHash differs for different rounds", () => {
      const r1 = contract.execute({ round: clarificationRound });
      const r2 = contract.execute({ round: riskRound });
      expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
    });
  });
});

describe("BoardroomRoundConsumerPipelineBatchContract", () => {
  const pipelineContract = new BoardroomRoundConsumerPipelineContract({ now: () => FIXED_NOW });
  const batchContract = new BoardroomRoundConsumerPipelineBatchContract({ now: () => FIXED_NOW });

  function makeResult(round: BoardroomRound) {
    return pipelineContract.execute({ round });
  }

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new BoardroomRoundConsumerPipelineBatchContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createBoardroomRoundConsumerPipelineBatchContract();
      expect(c.batch([])).toBeDefined();
    });
  });

  describe("output shape", () => {
    const batch = batchContract.batch([makeResult(clarificationRound)]);

    it("has batchId", () => { expect(typeof batch.batchId).toBe("string"); });
    it("has batchHash", () => { expect(typeof batch.batchHash).toBe("string"); });
    it("batchId differs from batchHash", () => { expect(batch.batchId).not.toBe(batch.batchHash); });
    it("has createdAt", () => { expect(batch.createdAt).toBe(FIXED_NOW); });
    it("has totalRounds", () => { expect(typeof batch.totalRounds).toBe("number"); });
    it("has focusCounts with all 4 keys", () => {
      expect(typeof batch.focusCounts.RISK_REVIEW).toBe("number");
      expect(typeof batch.focusCounts.ESCALATION_REVIEW).toBe("number");
      expect(typeof batch.focusCounts.TASK_AMENDMENT).toBe("number");
      expect(typeof batch.focusCounts.CLARIFICATION).toBe("number");
    });
    it("has dominantFocus", () => {
      expect(["RISK_REVIEW", "ESCALATION_REVIEW", "TASK_AMENDMENT", "CLARIFICATION"]).toContain(batch.dominantFocus);
    });
    it("has results array", () => { expect(batch.results).toHaveLength(1); });
  });

  describe("aggregation", () => {
    it("calculates totalRounds correctly", () => {
      const batch = batchContract.batch([makeResult(clarificationRound), makeResult(riskRound)]);
      expect(batch.totalRounds).toBe(2);
    });

    it("counts RISK_REVIEW correctly", () => {
      const batch = batchContract.batch([makeResult(riskRound), makeResult(clarificationRound)]);
      expect(batch.focusCounts.RISK_REVIEW).toBe(1);
      expect(batch.focusCounts.CLARIFICATION).toBe(1);
    });

    it("counts ESCALATION_REVIEW correctly", () => {
      const batch = batchContract.batch([makeResult(escalationRound), makeResult(escalationRound)]);
      expect(batch.focusCounts.ESCALATION_REVIEW).toBe(2);
    });

    it("handles empty batch", () => {
      const batch = batchContract.batch([]);
      expect(batch.totalRounds).toBe(0);
      expect(batch.focusCounts.RISK_REVIEW).toBe(0);
      expect(batch.focusCounts.CLARIFICATION).toBe(0);
      expect(batch.dominantFocus).toBe("CLARIFICATION");
    });
  });

  describe("dominant focus (severity-first)", () => {
    it("RISK_REVIEW dominates regardless of count", () => {
      const batch = batchContract.batch([
        makeResult(riskRound),
        makeResult(clarificationRound),
        makeResult(clarificationRound),
        makeResult(clarificationRound),
      ]);
      expect(batch.dominantFocus).toBe("RISK_REVIEW");
    });

    it("ESCALATION_REVIEW dominates over TASK_AMENDMENT and CLARIFICATION", () => {
      const batch = batchContract.batch([
        makeResult(escalationRound),
        makeResult(amendmentRound),
        makeResult(clarificationRound),
      ]);
      expect(batch.dominantFocus).toBe("ESCALATION_REVIEW");
    });

    it("TASK_AMENDMENT dominates over CLARIFICATION", () => {
      const batch = batchContract.batch([
        makeResult(amendmentRound),
        makeResult(clarificationRound),
      ]);
      expect(batch.dominantFocus).toBe("TASK_AMENDMENT");
    });

    it("CLARIFICATION when all rounds are CLARIFICATION", () => {
      const batch = batchContract.batch([
        makeResult(clarificationRound),
        makeResult(clarificationRound),
      ]);
      expect(batch.dominantFocus).toBe("CLARIFICATION");
    });
  });

  describe("deterministic hashing", () => {
    it("batchHash is deterministic for same input", () => {
      const results = [makeResult(clarificationRound)];
      expect(batchContract.batch(results).batchHash).toBe(batchContract.batch(results).batchHash);
    });

    it("batchId is deterministic for same input", () => {
      const results = [makeResult(clarificationRound)];
      expect(batchContract.batch(results).batchId).toBe(batchContract.batch(results).batchId);
    });
  });
});
