import { describe, it, expect } from "vitest";
import {
  BoardroomTransitionGateConsumerPipelineContract,
  createBoardroomTransitionGateConsumerPipelineContract,
} from "../src/boardroom.transition.gate.consumer.pipeline.contract";
import {
  BoardroomTransitionGateConsumerPipelineBatchContract,
  createBoardroomTransitionGateConsumerPipelineBatchContract,
} from "../src/boardroom.transition.gate.consumer.pipeline.batch.contract";
import type { BoardroomTransitionGateResult } from "../src/boardroom.transition.gate.contract";

const FIXED_NOW = "2026-03-27T10:00:00.000Z";

// --- Helpers ---

function makeGate(options: {
  action?: BoardroomTransitionGateResult["action"];
  nextStage?: BoardroomTransitionGateResult["nextStage"];
  allowOrchestration?: boolean;
  escalationRequired?: boolean;
  blockingConditions?: string[];
  gateId?: string;
  gateHash?: string;
} = {}): BoardroomTransitionGateResult {
  const {
    action = "PROCEED_TO_ORCHESTRATION",
    nextStage = "ORCHESTRATION",
    allowOrchestration = true,
    escalationRequired = false,
    blockingConditions = [],
    gateId = "gate-id-proceed",
    gateHash = "gate-hash-proceed",
  } = options;

  return {
    gateId,
    createdAt: FIXED_NOW,
    sourceSessionId: "session-abc",
    sourcePlanId: "plan-abc",
    sourceDecision: "PROCEED",
    action,
    nextStage,
    allowOrchestration,
    escalationRequired,
    rationale: `Gate rationale for ${action}`,
    blockingConditions,
    gateHash,
  };
}

const proceedGate = makeGate({
  action: "PROCEED_TO_ORCHESTRATION",
  nextStage: "ORCHESTRATION",
  allowOrchestration: true,
  escalationRequired: false,
});

const returnGate = makeGate({
  action: "RETURN_TO_DESIGN",
  nextStage: "DESIGN",
  allowOrchestration: false,
  escalationRequired: false,
  blockingConditions: ["Plan contains zero tasks."],
  gateId: "gate-id-design",
  gateHash: "gate-hash-design",
});

const escalateGate = makeGate({
  action: "ESCALATE_FOR_REVIEW",
  nextStage: "BOARDROOM",
  allowOrchestration: false,
  escalationRequired: true,
  blockingConditions: ["1 clarification(s) remain unanswered.", "Risk threshold exceeded."],
  gateId: "gate-id-escalate",
  gateHash: "gate-hash-escalate",
});

const stopGate = makeGate({
  action: "STOP_EXECUTION",
  nextStage: "STOP",
  allowOrchestration: false,
  escalationRequired: true,
  blockingConditions: ["Plan rejected by boardroom."],
  gateId: "gate-id-stop",
  gateHash: "gate-hash-stop",
});

describe("BoardroomTransitionGateConsumerPipelineContract", () => {
  const contract = new BoardroomTransitionGateConsumerPipelineContract({
    now: () => FIXED_NOW,
  });

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new BoardroomTransitionGateConsumerPipelineContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createBoardroomTransitionGateConsumerPipelineContract();
      expect(c.execute({ gateResult: proceedGate })).toBeDefined();
    });
  });

  describe("output shape", () => {
    const result = contract.execute({ gateResult: proceedGate });

    it("has resultId", () => {
      expect(typeof result.resultId).toBe("string");
      expect(result.resultId.length).toBeGreaterThan(0);
    });

    it("has createdAt equal to now()", () => {
      expect(result.createdAt).toBe(FIXED_NOW);
    });

    it("has gateResult", () => {
      expect(result.gateResult).toBe(proceedGate);
    });

    it("has consumerPackage", () => {
      expect(result.consumerPackage).toBeDefined();
      expect(typeof result.consumerPackage.pipelineHash).toBe("string");
    });

    it("has query string", () => {
      expect(typeof result.query).toBe("string");
      expect(result.query).toContain("BoardroomTransitionGate:");
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
      const result = contract.execute({ gateResult: proceedGate, consumerId: "consumer-x" });
      expect(result.consumerId).toBe("consumer-x");
    });

    it("consumerId is undefined when not provided", () => {
      const result = contract.execute({ gateResult: proceedGate });
      expect(result.consumerId).toBeUndefined();
    });
  });

  describe("query derivation", () => {
    it("derives PROCEED query correctly", () => {
      const result = contract.execute({ gateResult: proceedGate });
      expect(result.query).toBe(
        "BoardroomTransitionGate: action=PROCEED_TO_ORCHESTRATION, nextStage=ORCHESTRATION, blocked=0",
      );
    });

    it("includes blocked condition count in query", () => {
      const result = contract.execute({ gateResult: escalateGate });
      expect(result.query).toContain("blocked=2");
    });

    it("derives STOP_EXECUTION query", () => {
      const result = contract.execute({ gateResult: stopGate });
      expect(result.query).toContain("action=STOP_EXECUTION");
      expect(result.query).toContain("nextStage=STOP");
    });

    it("derives RETURN_TO_DESIGN query", () => {
      const result = contract.execute({ gateResult: returnGate });
      expect(result.query).toContain("action=RETURN_TO_DESIGN");
      expect(result.query).toContain("nextStage=DESIGN");
    });

    it("derives ESCALATE_FOR_REVIEW query", () => {
      const result = contract.execute({ gateResult: escalateGate });
      expect(result.query).toContain("action=ESCALATE_FOR_REVIEW");
    });
  });

  describe("contextId extraction", () => {
    it("contextId equals gateId", () => {
      const result = contract.execute({ gateResult: proceedGate });
      expect(result.contextId).toBe(proceedGate.gateId);
    });

    it("different gates yield different contextIds", () => {
      const r1 = contract.execute({ gateResult: proceedGate });
      const r2 = contract.execute({ gateResult: stopGate });
      expect(r1.contextId).not.toBe(r2.contextId);
    });
  });

  describe("warnings", () => {
    it("emits no warnings for PROCEED gate", () => {
      const result = contract.execute({ gateResult: proceedGate });
      expect(result.warnings).toHaveLength(0);
    });

    it("emits WARNING_EXECUTION_STOPPED for STOP_EXECUTION", () => {
      const result = contract.execute({ gateResult: stopGate });
      expect(result.warnings).toContain("WARNING_EXECUTION_STOPPED");
    });

    it("does not emit WARNING_EXECUTION_STOPPED for PROCEED", () => {
      const result = contract.execute({ gateResult: proceedGate });
      expect(result.warnings).not.toContain("WARNING_EXECUTION_STOPPED");
    });

    it("emits WARNING_ESCALATION_REQUIRED when escalationRequired", () => {
      const result = contract.execute({ gateResult: escalateGate });
      expect(result.warnings).toContain("WARNING_ESCALATION_REQUIRED");
    });

    it("does not emit WARNING_ESCALATION_REQUIRED for PROCEED", () => {
      const result = contract.execute({ gateResult: proceedGate });
      expect(result.warnings).not.toContain("WARNING_ESCALATION_REQUIRED");
    });

    it("emits WARNING_ORCHESTRATION_BLOCKED when not allowed", () => {
      const result = contract.execute({ gateResult: returnGate });
      expect(result.warnings).toContain("WARNING_ORCHESTRATION_BLOCKED");
    });

    it("does not emit WARNING_ORCHESTRATION_BLOCKED for PROCEED", () => {
      const result = contract.execute({ gateResult: proceedGate });
      expect(result.warnings).not.toContain("WARNING_ORCHESTRATION_BLOCKED");
    });

    it("emits WARNING_BLOCKING_CONDITIONS when conditions exist", () => {
      const result = contract.execute({ gateResult: returnGate });
      expect(result.warnings).toContain("WARNING_BLOCKING_CONDITIONS");
    });

    it("does not emit WARNING_BLOCKING_CONDITIONS for empty list", () => {
      const result = contract.execute({ gateResult: proceedGate });
      expect(result.warnings).not.toContain("WARNING_BLOCKING_CONDITIONS");
    });

    it("emits all 4 warnings for STOP_EXECUTION gate", () => {
      const result = contract.execute({ gateResult: stopGate });
      expect(result.warnings).toContain("WARNING_EXECUTION_STOPPED");
      expect(result.warnings).toContain("WARNING_ESCALATION_REQUIRED");
      expect(result.warnings).toContain("WARNING_ORCHESTRATION_BLOCKED");
      expect(result.warnings).toContain("WARNING_BLOCKING_CONDITIONS");
      expect(result.warnings).toHaveLength(4);
    });

    it("WARNING_EXECUTION_STOPPED is first in severity order", () => {
      const result = contract.execute({ gateResult: stopGate });
      expect(result.warnings[0]).toBe("WARNING_EXECUTION_STOPPED");
    });
  });

  describe("deterministic hashing", () => {
    it("pipelineHash is deterministic for same input", () => {
      const r1 = contract.execute({ gateResult: proceedGate });
      const r2 = contract.execute({ gateResult: proceedGate });
      expect(r1.pipelineHash).toBe(r2.pipelineHash);
    });

    it("resultId is deterministic for same input", () => {
      const r1 = contract.execute({ gateResult: proceedGate });
      const r2 = contract.execute({ gateResult: proceedGate });
      expect(r1.resultId).toBe(r2.resultId);
    });

    it("pipelineHash differs for different gates", () => {
      const r1 = contract.execute({ gateResult: proceedGate });
      const r2 = contract.execute({ gateResult: stopGate });
      expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
    });
  });
});

describe("BoardroomTransitionGateConsumerPipelineBatchContract", () => {
  const pipelineContract = new BoardroomTransitionGateConsumerPipelineContract({
    now: () => FIXED_NOW,
  });
  const batchContract = new BoardroomTransitionGateConsumerPipelineBatchContract({
    now: () => FIXED_NOW,
  });

  function makeResult(gate: BoardroomTransitionGateResult) {
    return pipelineContract.execute({ gateResult: gate });
  }

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new BoardroomTransitionGateConsumerPipelineBatchContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createBoardroomTransitionGateConsumerPipelineBatchContract();
      expect(c.batch([])).toBeDefined();
    });
  });

  describe("output shape", () => {
    const batch = batchContract.batch([makeResult(proceedGate)]);

    it("has batchId", () => {
      expect(typeof batch.batchId).toBe("string");
    });

    it("has batchHash", () => {
      expect(typeof batch.batchHash).toBe("string");
    });

    it("batchId differs from batchHash", () => {
      expect(batch.batchId).not.toBe(batch.batchHash);
    });

    it("has createdAt", () => {
      expect(batch.createdAt).toBe(FIXED_NOW);
    });

    it("has totalGates", () => {
      expect(typeof batch.totalGates).toBe("number");
    });

    it("has allowedCount", () => {
      expect(typeof batch.allowedCount).toBe("number");
    });

    it("has blockedCount", () => {
      expect(typeof batch.blockedCount).toBe("number");
    });

    it("has escalationRequiredCount", () => {
      expect(typeof batch.escalationRequiredCount).toBe("number");
    });

    it("has dominantAction", () => {
      expect(["PROCEED_TO_ORCHESTRATION", "RETURN_TO_DESIGN", "ESCALATE_FOR_REVIEW", "STOP_EXECUTION"]).toContain(
        batch.dominantAction,
      );
    });

    it("has dominantTokenBudget", () => {
      expect(typeof batch.dominantTokenBudget).toBe("number");
    });
  });

  describe("aggregation", () => {
    it("calculates totalGates correctly", () => {
      const batch = batchContract.batch([
        makeResult(proceedGate),
        makeResult(stopGate),
      ]);
      expect(batch.totalGates).toBe(2);
    });

    it("calculates allowedCount correctly", () => {
      const batch = batchContract.batch([
        makeResult(proceedGate),
        makeResult(stopGate),
        makeResult(returnGate),
      ]);
      expect(batch.allowedCount).toBe(1);
    });

    it("calculates blockedCount correctly", () => {
      const batch = batchContract.batch([
        makeResult(proceedGate),
        makeResult(stopGate),
        makeResult(returnGate),
      ]);
      expect(batch.blockedCount).toBe(2);
    });

    it("calculates escalationRequiredCount correctly", () => {
      const batch = batchContract.batch([
        makeResult(proceedGate),
        makeResult(escalateGate),
        makeResult(stopGate),
      ]);
      expect(batch.escalationRequiredCount).toBe(2);
    });

    it("handles empty batch", () => {
      const batch = batchContract.batch([]);
      expect(batch.totalGates).toBe(0);
      expect(batch.allowedCount).toBe(0);
      expect(batch.blockedCount).toBe(0);
      expect(batch.escalationRequiredCount).toBe(0);
      expect(batch.dominantTokenBudget).toBe(0);
      expect(batch.dominantAction).toBe("PROCEED_TO_ORCHESTRATION");
    });
  });

  describe("dominant action calculation", () => {
    it("selects STOP_EXECUTION regardless of count (severity-first)", () => {
      const batch = batchContract.batch([
        makeResult(stopGate),
        makeResult(proceedGate),
        makeResult(proceedGate),
      ]);
      expect(batch.dominantAction).toBe("STOP_EXECUTION");
    });

    it("selects PROCEED when all gates proceed", () => {
      const batch = batchContract.batch([
        makeResult(proceedGate),
        makeResult(proceedGate),
      ]);
      expect(batch.dominantAction).toBe("PROCEED_TO_ORCHESTRATION");
    });

    it("selects ESCALATE_FOR_REVIEW over RETURN_TO_DESIGN (severity-first)", () => {
      const batch = batchContract.batch([
        makeResult(escalateGate),
        makeResult(returnGate),
      ]);
      expect(batch.dominantAction).toBe("ESCALATE_FOR_REVIEW");
    });
  });

  describe("deterministic hashing", () => {
    it("batchHash is deterministic for same input", () => {
      const results = [makeResult(proceedGate)];
      const b1 = batchContract.batch(results);
      const b2 = batchContract.batch(results);
      expect(b1.batchHash).toBe(b2.batchHash);
    });

    it("batchId is deterministic for same input", () => {
      const results = [makeResult(proceedGate)];
      const b1 = batchContract.batch(results);
      const b2 = batchContract.batch(results);
      expect(b1.batchId).toBe(b2.batchId);
    });
  });
});
