import { describe, it, expect } from "vitest";
import {
  DispatchConsumerPipelineContract,
  createDispatchConsumerPipelineContract,
} from "../src/dispatch.consumer.pipeline.contract";
import {
  DispatchConsumerPipelineBatchContract,
  createDispatchConsumerPipelineBatchContract,
} from "../src/dispatch.consumer.pipeline.batch.contract";
import type { DispatchResult, DispatchEntry } from "../src/dispatch.contract";

const FIXED_NOW = "2026-03-27T10:00:00.000Z";

// Helper: create test dispatch result
function makeDispatchResult(options: {
  totalDispatched?: number;
  authorizedCount?: number;
  blockedCount?: number;
  escalatedCount?: number;
  dispatchId?: string;
} = {}): DispatchResult {
  const {
    totalDispatched = 3,
    authorizedCount = 2,
    blockedCount = 1,
    escalatedCount = 0,
    dispatchId = "dispatch-123",
  } = options;

  const entries: DispatchEntry[] = [];
  for (let i = 0; i < totalDispatched; i++) {
    const isAuthorized = i < authorizedCount;
    entries.push({
      assignmentId: `assignment-${i}`,
      taskId: `task-${i}`,
      riskLevel: "R1",
      dispatchedAt: FIXED_NOW,
      guardDecision: isAuthorized ? "ALLOW" : "BLOCK",
      pipelineResult: {
        requestId: `request-${i}`,
        finalDecision: isAuthorized ? "ALLOW" : "BLOCK",
        pipelineHash: `hash-${i}`,
        blockedBy: isAuthorized ? undefined : "test-policy",
        escalatedBy: undefined,
        agentGuidance: undefined,
      },
      dispatchAuthorized: isAuthorized,
      blockedBy: isAuthorized ? undefined : "test-policy",
    });
  }

  return {
    dispatchId,
    orchestrationId: "orchestration-456",
    dispatchedAt: FIXED_NOW,
    entries,
    totalDispatched,
    authorizedCount,
    blockedCount,
    escalatedCount,
    dispatchHash: "dispatch-hash-123",
    warnings: [],
  };
}

const normalDispatch = makeDispatchResult({ totalDispatched: 3, authorizedCount: 3, blockedCount: 0 });
const blockedDispatch = makeDispatchResult({ totalDispatched: 3, authorizedCount: 1, blockedCount: 2 });
const escalatedDispatch = makeDispatchResult({ totalDispatched: 3, authorizedCount: 2, blockedCount: 0, escalatedCount: 1 });
const emptyDispatch = makeDispatchResult({ totalDispatched: 0, authorizedCount: 0, blockedCount: 0 });

describe("DispatchConsumerPipelineContract", () => {
  const contract = new DispatchConsumerPipelineContract({ now: () => FIXED_NOW });

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new DispatchConsumerPipelineContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createDispatchConsumerPipelineContract();
      expect(c.execute({ dispatchResult: normalDispatch })).toBeDefined();
    });
  });

  describe("output shape", () => {
    const result = contract.execute({ dispatchResult: normalDispatch });

    it("has resultId", () => {
      expect(typeof result.resultId).toBe("string");
      expect(result.resultId.length).toBeGreaterThan(0);
    });

    it("has createdAt equal to now()", () => {
      expect(result.createdAt).toBe(FIXED_NOW);
    });

    it("has dispatchResult", () => {
      expect(result.dispatchResult).toBeDefined();
      expect(result.dispatchResult).toBe(normalDispatch);
    });

    it("has consumerPackage", () => {
      expect(result.consumerPackage).toBeDefined();
      expect(typeof result.consumerPackage.pipelineHash).toBe("string");
    });

    it("has query", () => {
      expect(typeof result.query).toBe("string");
      expect(result.query).toContain("Dispatch:");
    });

    it("has contextId", () => {
      expect(typeof result.contextId).toBe("string");
      expect(result.contextId).toBe(normalDispatch.dispatchId);
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
      const result = contract.execute({ dispatchResult: normalDispatch, consumerId: "consumer-xyz" });
      expect(result.consumerId).toBe("consumer-xyz");
    });

    it("consumerId is undefined when not provided", () => {
      const result = contract.execute({ dispatchResult: normalDispatch });
      expect(result.consumerId).toBeUndefined();
    });
  });

  describe("query derivation", () => {
    it("derives query with normal dispatch", () => {
      const result = contract.execute({ dispatchResult: normalDispatch });
      expect(result.query).toBe("Dispatch: total=3, authorized=3, blocked=0");
    });

    it("derives query with blocked dispatches", () => {
      const result = contract.execute({ dispatchResult: blockedDispatch });
      expect(result.query).toBe("Dispatch: total=3, authorized=1, blocked=2");
    });

    it("derives query with empty dispatch", () => {
      const result = contract.execute({ dispatchResult: emptyDispatch });
      expect(result.query).toBe("Dispatch: total=0, authorized=0, blocked=0");
    });
  });

  describe("contextId extraction", () => {
    it("extracts contextId from dispatchId", () => {
      const dispatch = makeDispatchResult({ dispatchId: "dispatch-xyz-789" });
      const result = contract.execute({ dispatchResult: dispatch });
      expect(result.contextId).toBe("dispatch-xyz-789");
    });
  });

  describe("warnings", () => {
    it("emits WARNING_BLOCKED_DISPATCHES when dispatches are blocked", () => {
      const result = contract.execute({ dispatchResult: blockedDispatch });
      expect(result.warnings).toContain("WARNING_BLOCKED_DISPATCHES");
    });

    it("does not emit WARNING_BLOCKED_DISPATCHES when no blocks", () => {
      const result = contract.execute({ dispatchResult: normalDispatch });
      expect(result.warnings).not.toContain("WARNING_BLOCKED_DISPATCHES");
    });

    it("emits WARNING_ESCALATED_DISPATCHES when dispatches are escalated", () => {
      const result = contract.execute({ dispatchResult: escalatedDispatch });
      expect(result.warnings).toContain("WARNING_ESCALATED_DISPATCHES");
    });

    it("does not emit WARNING_ESCALATED_DISPATCHES when no escalations", () => {
      const result = contract.execute({ dispatchResult: normalDispatch });
      expect(result.warnings).not.toContain("WARNING_ESCALATED_DISPATCHES");
    });

    it("emits WARNING_NO_DISPATCHES when total is 0", () => {
      const result = contract.execute({ dispatchResult: emptyDispatch });
      expect(result.warnings).toContain("WARNING_NO_DISPATCHES");
    });

    it("emits no warnings for normal dispatch", () => {
      const result = contract.execute({ dispatchResult: normalDispatch });
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe("deterministic hashing", () => {
    it("pipelineHash is deterministic for same input", () => {
      const r1 = contract.execute({ dispatchResult: normalDispatch });
      const r2 = contract.execute({ dispatchResult: normalDispatch });
      expect(r1.pipelineHash).toBe(r2.pipelineHash);
    });

    it("resultId is deterministic for same input", () => {
      const r1 = contract.execute({ dispatchResult: normalDispatch });
      const r2 = contract.execute({ dispatchResult: normalDispatch });
      expect(r1.resultId).toBe(r2.resultId);
    });
  });
});

describe("DispatchConsumerPipelineBatchContract", () => {
  const pipelineContract = new DispatchConsumerPipelineContract({ now: () => FIXED_NOW });
  const batchContract = new DispatchConsumerPipelineBatchContract({ now: () => FIXED_NOW });

  function makeResult(totalDispatched: number, authorizedCount: number, blockedCount: number) {
    const dispatch = makeDispatchResult({ totalDispatched, authorizedCount, blockedCount });
    return pipelineContract.execute({ dispatchResult: dispatch });
  }

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new DispatchConsumerPipelineBatchContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createDispatchConsumerPipelineBatchContract();
      expect(c.batch([])).toBeDefined();
    });
  });

  describe("output shape", () => {
    const results = [makeResult(3, 3, 0)];
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

    it("has totalDispatches", () => {
      expect(typeof batch.totalDispatches).toBe("number");
    });

    it("has totalAuthorized", () => {
      expect(typeof batch.totalAuthorized).toBe("number");
    });

    it("has totalBlocked", () => {
      expect(typeof batch.totalBlocked).toBe("number");
    });

    it("has totalEscalated", () => {
      expect(typeof batch.totalEscalated).toBe("number");
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
    it("calculates totalDispatches correctly", () => {
      const results = [makeResult(3, 3, 0), makeResult(2, 2, 0), makeResult(5, 5, 0)];
      const batch = batchContract.batch(results);
      expect(batch.totalDispatches).toBe(10);
    });

    it("calculates totalAuthorized correctly", () => {
      const results = [makeResult(3, 2, 1), makeResult(2, 1, 1), makeResult(5, 4, 1)];
      const batch = batchContract.batch(results);
      expect(batch.totalAuthorized).toBe(7);
    });

    it("calculates totalBlocked correctly", () => {
      const results = [makeResult(3, 2, 1), makeResult(2, 1, 1), makeResult(5, 4, 1)];
      const batch = batchContract.batch(results);
      expect(batch.totalBlocked).toBe(3);
    });

    it("calculates dominantTokenBudget as max", () => {
      const results = [makeResult(3, 3, 0), makeResult(2, 2, 0), makeResult(5, 5, 0)];
      const batch = batchContract.batch(results);
      expect(batch.dominantTokenBudget).toBeGreaterThan(0);
    });

    it("handles empty batch with dominantTokenBudget = 0", () => {
      const batch = batchContract.batch([]);
      expect(batch.totalDispatches).toBe(0);
      expect(batch.totalAuthorized).toBe(0);
      expect(batch.totalBlocked).toBe(0);
      expect(batch.totalEscalated).toBe(0);
      expect(batch.dominantTokenBudget).toBe(0);
    });
  });

  describe("deterministic hashing", () => {
    it("batchHash is deterministic for same input", () => {
      const results = [makeResult(3, 3, 0)];
      const b1 = batchContract.batch(results);
      const b2 = batchContract.batch(results);
      expect(b1.batchHash).toBe(b2.batchHash);
    });

    it("batchId is deterministic for same input", () => {
      const results = [makeResult(3, 3, 0)];
      const b1 = batchContract.batch(results);
      const b2 = batchContract.batch(results);
      expect(b1.batchId).toBe(b2.batchId);
    });
  });
});
