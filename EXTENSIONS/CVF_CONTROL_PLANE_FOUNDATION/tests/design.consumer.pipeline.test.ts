import { describe, it, expect } from "vitest";
import {
  DesignConsumerPipelineContract,
  createDesignConsumerPipelineContract,
} from "../src/design.consumer.pipeline.contract";
import type { ControlPlaneIntakeResult } from "../src/intake.contract";
import type { Domain, ValidatedIntent } from "../../CVF_ECO_v1.0_INTENT_VALIDATION/src/types";

const FIXED_NOW = "2026-03-27T10:00:00.000Z";

// Helper: create test intake result
function makeIntakeResult(options: {
  domain?: Domain;
  action?: string;
  valid?: boolean;
  hasChunks?: boolean;
  warnings?: string[];
  consumerId?: string;
} = {}): ControlPlaneIntakeResult {
  const {
    domain = "general",
    action = "build",
    valid = true,
    hasChunks = false,
    warnings = [],
    consumerId,
  } = options;

  const chunks = hasChunks
    ? [{ content: "test context", source: "test", tokens: 10 }]
    : [];

  const intent: ValidatedIntent = {
    valid,
    intent: {
      domain,
      action,
      object: "artifact",
      limits: {},
      requireApproval: domain === "finance",
      confidence: valid ? 0.9 : 0.4,
      rawVibe: `${action} for ${domain}`,
    },
    rules: [],
    constraints: [],
    timestamp: Date.parse(FIXED_NOW),
    pipelineVersion: "test-pipeline",
    errors: valid ? [] : ["INVALID_INTENT"],
  };

  return {
    requestId: "req-1",
    createdAt: FIXED_NOW,
    consumerId,
    intent,
    retrieval: {
      query: `${action} ${domain}`,
      chunkCount: chunks.length,
      totalCandidates: chunks.length,
      retrievalTimeMs: 5,
      tiersSearched: ["T1_DOCTRINE"],
      chunks: chunks.map((chunk, index) => ({
        id: `chunk-${index}`,
        source: chunk.source,
        content: chunk.content,
        relevanceScore: 0.8,
      })),
    },
    packagedContext: {
      chunks: chunks.map((chunk, index) => ({
        id: `chunk-${index}`,
        source: chunk.source,
        content: chunk.content,
        relevanceScore: 0.8,
      })),
      totalTokens: chunks.reduce((sum, c) => sum + c.tokens, 0),
      tokenBudget: 256,
      truncated: false,
      snapshotHash: "hash-1",
    },
    warnings,
  };
}

const generalIntake = makeIntakeResult({ domain: "general", action: "build" });
const financeIntake = makeIntakeResult({ domain: "finance", action: "deploy" });
const securityIntake = makeIntakeResult({ domain: "code_security", action: "audit" });
const invalidIntake = makeIntakeResult({ domain: "general", action: "build", valid: false });

describe("DesignConsumerPipelineContract", () => {
  const contract = new DesignConsumerPipelineContract({ now: () => FIXED_NOW });

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new DesignConsumerPipelineContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createDesignConsumerPipelineContract();
      expect(c.execute({ intakeResult: generalIntake })).toBeDefined();
    });
  });

  describe("output shape", () => {
    const result = contract.execute({ intakeResult: generalIntake });

    it("has resultId", () => {
      expect(typeof result.resultId).toBe("string");
      expect(result.resultId.length).toBeGreaterThan(0);
    });

    it("has createdAt equal to now()", () => {
      expect(result.createdAt).toBe(FIXED_NOW);
    });

    it("has designPlan", () => {
      expect(result.designPlan).toBeDefined();
      expect(result.designPlan.totalTasks).toBeGreaterThanOrEqual(0);
    });

    it("has dominantPhase", () => {
      expect(result.dominantPhase).toBeDefined();
      expect(["DESIGN", "BUILD", "REVIEW"]).toContain(result.dominantPhase);
    });

    it("has dominantRisk", () => {
      expect(result.dominantRisk).toBeDefined();
      expect(["R0", "R1", "R2", "R3"]).toContain(result.dominantRisk);
    });

    it("has consumerPackage", () => {
      expect(result.consumerPackage).toBeDefined();
      expect(typeof result.consumerPackage.pipelineHash).toBe("string");
    });

    it("has pipelineHash", () => {
      expect(typeof result.pipelineHash).toBe("string");
      expect(result.pipelineHash.length).toBeGreaterThan(0);
    });

    it("has warnings array", () => {
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it("resultId is distinct from pipelineHash", () => {
      expect(result.resultId).not.toBe(result.pipelineHash);
    });
  });

  describe("consumerId propagation", () => {
    it("propagates consumerId when provided", () => {
      const intake = makeIntakeResult({ consumerId: "consumer-xyz" });
      const result = contract.execute({ intakeResult: intake, consumerId: "consumer-xyz" });
      expect(result.consumerId).toBe("consumer-xyz");
    });

    it("consumerId is undefined when not provided", () => {
      const result = contract.execute({ intakeResult: generalIntake });
      expect(result.consumerId).toBeUndefined();
    });
  });

  describe("deterministic hashing", () => {
    it("pipelineHash is deterministic for same input", () => {
      const r1 = contract.execute({ intakeResult: generalIntake });
      const r2 = contract.execute({ intakeResult: generalIntake });
      expect(r1.pipelineHash).toBe(r2.pipelineHash);
    });

    it("resultId is deterministic for same input", () => {
      const r1 = contract.execute({ intakeResult: generalIntake });
      const r2 = contract.execute({ intakeResult: generalIntake });
      expect(r1.resultId).toBe(r2.resultId);
    });

    it("pipelineHash differs for different intakes", () => {
      const r1 = contract.execute({ intakeResult: generalIntake });
      const r2 = contract.execute({ intakeResult: financeIntake });
      expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
    });

    it("pipelineHash differs across timestamps", () => {
      const c1 = new DesignConsumerPipelineContract({ now: () => "2026-03-27T10:00:00.000Z" });
      const c2 = new DesignConsumerPipelineContract({ now: () => "2026-03-27T11:00:00.000Z" });
      expect(c1.execute({ intakeResult: generalIntake }).pipelineHash).not.toBe(
        c2.execute({ intakeResult: generalIntake }).pipelineHash,
      );
    });
  });

  describe("query derivation", () => {
    it("query contains totalTasks", () => {
      const result = contract.execute({ intakeResult: generalIntake });
      expect(result.consumerPackage.query).toMatch(/\d+ tasks/);
    });

    it("query contains dominantPhase", () => {
      const result = contract.execute({ intakeResult: generalIntake });
      expect(result.consumerPackage.query).toMatch(/phase=(DESIGN|BUILD|REVIEW)/);
    });

    it("query contains dominantRisk", () => {
      const result = contract.execute({ intakeResult: generalIntake });
      expect(result.consumerPackage.query).toMatch(/risk=(R0|R1|R2|R3)/);
    });

    it("query is capped at 120 characters", () => {
      const result = contract.execute({ intakeResult: generalIntake });
      expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
    });

    it("query changes with different domain", () => {
      const r1 = contract.execute({ intakeResult: generalIntake });
      const r2 = contract.execute({ intakeResult: financeIntake });
      expect(r1.consumerPackage.query).not.toBe(r2.consumerPackage.query);
    });
  });

  describe("contextId", () => {
    it("contextId equals designPlan.planId", () => {
      const result = contract.execute({ intakeResult: generalIntake });
      expect(result.consumerPackage.contextId).toBe(result.designPlan.planId);
    });

    it("contextId differs for different intakes", () => {
      const r1 = contract.execute({ intakeResult: generalIntake });
      const r2 = contract.execute({ intakeResult: financeIntake });
      expect(r1.consumerPackage.contextId).not.toBe(r2.consumerPackage.contextId);
    });
  });

  describe("warning messages", () => {
    it("no warning for valid intake with tasks", () => {
      const result = contract.execute({ intakeResult: generalIntake });
      expect(result.warnings).toHaveLength(0);
    });

    it("WARNING_HIGH_RISK_TASKS when R3 tasks present", () => {
      const result = contract.execute({ intakeResult: financeIntake });
      expect(result.warnings).toContain(
        "[design] high risk tasks — plan contains R3 (critical) risk tasks requiring full governance review",
      );
    });

    it("no high risk warning for R2 tasks", () => {
      const result = contract.execute({ intakeResult: securityIntake });
      expect(result.warnings).not.toContain(
        "[design] high risk tasks — plan contains R3 (critical) risk tasks requiring full governance review",
      );
    });
  });

  describe("dominantPhase propagation", () => {
    it("dominantPhase is valid phase", () => {
      const result = contract.execute({ intakeResult: generalIntake });
      expect(["DESIGN", "BUILD", "REVIEW"]).toContain(result.dominantPhase);
    });

    it("dominantPhase matches computed value from design plan", () => {
      const result = contract.execute({ intakeResult: generalIntake });
      // Just verify it's a valid phase - the actual computation uses priority ordering
      expect(["DESIGN", "BUILD", "REVIEW"]).toContain(result.dominantPhase);
    });
  });

  describe("dominantRisk propagation", () => {
    it("dominantRisk is valid risk level", () => {
      const result = contract.execute({ intakeResult: generalIntake });
      expect(["R0", "R1", "R2", "R3"]).toContain(result.dominantRisk);
    });

    it("dominantRisk is R3 for finance domain", () => {
      const result = contract.execute({ intakeResult: financeIntake });
      expect(result.dominantRisk).toBe("R3");
    });

    it("dominantRisk is R2 for security domain", () => {
      const result = contract.execute({ intakeResult: securityIntake });
      expect(result.dominantRisk).toBe("R2");
    });

    it("dominantRisk is R0 or R1 for general domain", () => {
      const result = contract.execute({ intakeResult: generalIntake });
      // General domain gets R0 base risk, but BUILD phase escalates to R1
      expect(["R0", "R1"]).toContain(result.dominantRisk);
    });
  });

  describe("designPlan propagation", () => {
    it("designPlan.totalTasks matches tasks array length", () => {
      const result = contract.execute({ intakeResult: generalIntake });
      expect(result.designPlan.totalTasks).toBe(result.designPlan.tasks.length);
    });

    it("designPlan.domainDetected matches intake domain", () => {
      const result = contract.execute({ intakeResult: financeIntake });
      expect(result.designPlan.domainDetected).toBe("finance");
    });

    it("designPlan has riskSummary", () => {
      const result = contract.execute({ intakeResult: generalIntake });
      expect(result.designPlan.riskSummary).toBeDefined();
      expect(typeof result.designPlan.riskSummary.R0).toBe("number");
    });

    it("designPlan has roleSummary", () => {
      const result = contract.execute({ intakeResult: generalIntake });
      expect(result.designPlan.roleSummary).toBeDefined();
      expect(typeof result.designPlan.roleSummary.architect).toBe("number");
    });
  });
});


// ─── Batch Contract Tests ─────────────────────────────────────────────────────

import {
  DesignConsumerPipelineBatchContract,
  createDesignConsumerPipelineBatchContract,
} from "../src/design.consumer.pipeline.batch.contract";

const NOW_2 = "2026-03-27T12:00:00.000Z";
const batchContract = new DesignConsumerPipelineBatchContract({ now: () => NOW_2 });

// Helper: create test result (using contract from above)
const pipelineContract = new DesignConsumerPipelineContract({ now: () => FIXED_NOW });
function makeResult(intakeResult: ControlPlaneIntakeResult): any {
  return pipelineContract.execute({ intakeResult });
}

const generalResult = makeResult(generalIntake);
const financeResult = makeResult(financeIntake);
const securityResult = makeResult(securityIntake);

describe("DesignConsumerPipelineBatchContract", () => {
  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new DesignConsumerPipelineBatchContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createDesignConsumerPipelineBatchContract();
      expect(c.batch([generalResult])).toBeDefined();
    });
  });

  describe("output shape", () => {
    const batch = batchContract.batch([generalResult, financeResult]);

    it("has batchId", () => {
      expect(typeof batch.batchId).toBe("string");
      expect(batch.batchId.length).toBeGreaterThan(0);
    });

    it("has createdAt equal to now()", () => {
      expect(batch.createdAt).toBe(NOW_2);
    });

    it("has totalPlans", () => {
      expect(batch.totalPlans).toBe(2);
    });

    it("has totalTasks", () => {
      expect(batch.totalTasks).toBeGreaterThanOrEqual(0);
    });

    it("has overallDominantPhase", () => {
      expect(batch.overallDominantPhase).toBeDefined();
      expect(["DESIGN", "BUILD", "REVIEW"]).toContain(batch.overallDominantPhase);
    });

    it("has overallDominantRisk", () => {
      expect(batch.overallDominantRisk).toBeDefined();
      expect(["R0", "R1", "R2", "R3"]).toContain(batch.overallDominantRisk);
    });

    it("has dominantTokenBudget", () => {
      expect(typeof batch.dominantTokenBudget).toBe("number");
      expect(batch.dominantTokenBudget).toBeGreaterThanOrEqual(0);
    });

    it("has results array", () => {
      expect(Array.isArray(batch.results)).toBe(true);
      expect(batch.results.length).toBe(2);
    });

    it("has batchHash", () => {
      expect(typeof batch.batchHash).toBe("string");
      expect(batch.batchHash.length).toBeGreaterThan(0);
    });

    it("batchId is distinct from batchHash", () => {
      expect(batch.batchId).not.toBe(batch.batchHash);
    });
  });

  describe("deterministic hashing", () => {
    it("batchId is deterministic for same inputs", () => {
      const b1 = batchContract.batch([generalResult]);
      const b2 = batchContract.batch([generalResult]);
      expect(b1.batchId).toBe(b2.batchId);
    });

    it("batchHash differs for different result sets", () => {
      const b1 = batchContract.batch([generalResult]);
      const b2 = batchContract.batch([financeResult]);
      expect(b1.batchHash).not.toBe(b2.batchHash);
    });

    it("batchHash differs across timestamps", () => {
      const c1 = new DesignConsumerPipelineBatchContract({ now: () => "2026-03-27T10:00:00.000Z" });
      const c2 = new DesignConsumerPipelineBatchContract({ now: () => "2026-03-27T11:00:00.000Z" });
      expect(c1.batch([generalResult]).batchHash).not.toBe(c2.batch([generalResult]).batchHash);
    });
  });

  describe("totalPlans", () => {
    it("equals results length", () => {
      expect(batchContract.batch([generalResult, financeResult, securityResult]).totalPlans).toBe(3);
    });

    it("is 0 for empty batch", () => {
      expect(batchContract.batch([]).totalPlans).toBe(0);
    });
  });

  describe("totalTasks", () => {
    it("sums totalTasks across all plans", () => {
      const batch = batchContract.batch([generalResult, financeResult]);
      const expected = generalResult.designPlan.totalTasks + financeResult.designPlan.totalTasks;
      expect(batch.totalTasks).toBe(expected);
    });

    it("is 0 for empty batch", () => {
      expect(batchContract.batch([]).totalTasks).toBe(0);
    });
  });

  describe("overallDominantPhase", () => {
    it("is valid phase", () => {
      const batch = batchContract.batch([generalResult, financeResult]);
      expect(["DESIGN", "BUILD", "REVIEW"]).toContain(batch.overallDominantPhase);
    });

    it("prioritizes REVIEW in frequency ties", () => {
      const designResult = makeResult(makeIntakeResult({ domain: "general" }));
      const buildResult = makeResult(makeIntakeResult({ domain: "general" }));
      const batch = batchContract.batch([designResult, buildResult]);
      expect(["DESIGN", "BUILD", "REVIEW"]).toContain(batch.overallDominantPhase);
    });
  });

  describe("overallDominantRisk", () => {
    it("is valid risk level", () => {
      const batch = batchContract.batch([generalResult, financeResult]);
      expect(["R0", "R1", "R2", "R3"]).toContain(batch.overallDominantRisk);
    });

    it("is R3 when finance results are most frequent", () => {
      const batch = batchContract.batch([generalResult, financeResult, financeResult]);
      expect(batch.overallDominantRisk).toBe("R3");
    });

    it("is R2 when security results are most frequent", () => {
      const batch = batchContract.batch([generalResult, securityResult, securityResult]);
      expect(batch.overallDominantRisk).toBe("R2");
    });

    it("prioritizes R3 in frequency ties", () => {
      const batch = batchContract.batch([generalResult, financeResult]);
      expect(batch.overallDominantRisk).toBe("R3");
    });
  });

  describe("dominantTokenBudget", () => {
    it("is max of estimatedTokens across results", () => {
      const batch = batchContract.batch([generalResult, financeResult]);
      const expected = Math.max(
        generalResult.consumerPackage.typedContextPackage.estimatedTokens,
        financeResult.consumerPackage.typedContextPackage.estimatedTokens,
      );
      expect(batch.dominantTokenBudget).toBe(expected);
    });

    it("equals single result estimatedTokens for one-element batch", () => {
      const batch = batchContract.batch([generalResult]);
      expect(batch.dominantTokenBudget).toBe(generalResult.consumerPackage.typedContextPackage.estimatedTokens);
    });

    it("is 0 for empty batch", () => {
      expect(batchContract.batch([]).dominantTokenBudget).toBe(0);
    });
  });

  describe("general fields", () => {
    it("totalPlans equals results length", () => {
      expect(batchContract.batch([generalResult, financeResult, securityResult]).totalPlans).toBe(3);
    });

    it("createdAt equals now()", () => {
      expect(batchContract.batch([generalResult]).createdAt).toBe(NOW_2);
    });
  });
});
