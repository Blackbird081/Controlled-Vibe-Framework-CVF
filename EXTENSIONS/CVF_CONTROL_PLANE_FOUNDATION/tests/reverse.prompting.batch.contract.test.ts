import { describe, it, expect } from "vitest";
import {
  ReversePromptingBatchContract,
  createReversePromptingBatchContract,
  type ReversePromptingBatchResult,
} from "../src/reverse.prompting.batch.contract";
import { ReversePromptingContract } from "../src/reverse.prompting.contract";
import type { ControlPlaneIntakeResult } from "../src/intake.contract";
import type { ValidatedIntent } from "../../CVF_ECO_v1.0_INTENT_VALIDATION/src/types";
import type { Domain } from "../../CVF_ECO_v1.0_INTENT_VALIDATION/src/types";

// --- Helpers ---

const FIXED_NOW = "2026-04-01T00:00:00.000Z";

function makeIntent(domain: Domain, valid = true): ValidatedIntent {
  return {
    intent: {
      domain,
      action: "test-action",
      object: "test-object",
      limits: {},
      requireApproval: false,
      confidence: valid ? 0.9 : 0.2,
      rawVibe: `test vibe for ${domain}`,
    },
    rules: [],
    constraints: [],
    timestamp: 0,
    pipelineVersion: "1.0",
    valid,
    errors: valid ? [] : ["low confidence"],
  };
}

interface IntakeOptions {
  domain?: Domain;
  valid?: boolean;
  chunkCount?: number;
  truncated?: boolean;
  warnings?: string[];
}

function makeIntakeResult(id: string, options: IntakeOptions = {}): ControlPlaneIntakeResult {
  const {
    domain = "finance" as Domain,
    valid = true,
    chunkCount = 1,
    truncated = false,
    warnings = [],
  } = options;
  const chunks = Array.from({ length: chunkCount }, (_, i) => ({
    id: `chunk-${i}`,
    source: "test",
    content: `content ${i}`,
    relevanceScore: 0.8,
  }));
  return {
    requestId: id,
    createdAt: FIXED_NOW,
    consumerId: "test-consumer",
    intent: makeIntent(domain, valid),
    retrieval: {
      query: `query for ${domain}`,
      chunkCount,
      totalCandidates: chunkCount,
      retrievalTimeMs: 10,
      tiersSearched: [],
      chunks,
    },
    packagedContext: {
      chunks,
      totalTokens: chunkCount * 32,
      tokenBudget: 256,
      truncated,
      snapshotHash: `snap-${id}`,
    },
    warnings,
  };
}

function makeContracts() {
  const contract = new ReversePromptingContract({ now: () => FIXED_NOW });
  const batchContract = new ReversePromptingBatchContract({ now: () => FIXED_NOW });
  return { contract, batchContract };
}

// --- Scenario helpers ---

// 0 questions: valid, specific domain, has chunks, not truncated, no warnings
function cleanIntake(id: string): ControlPlaneIntakeResult {
  return makeIntakeResult(id, { domain: "finance" as Domain, valid: true, chunkCount: 1, truncated: false, warnings: [] });
}

// 1 high question: invalid intent → intent_clarity (high)
function highIntake(id: string): ControlPlaneIntakeResult {
  return makeIntakeResult(id, { domain: "finance" as Domain, valid: false, chunkCount: 1, truncated: false, warnings: [] });
}

// 1 medium question: truncated context → scope_boundary (medium)
function mediumIntake(id: string): ControlPlaneIntakeResult {
  return makeIntakeResult(id, { domain: "finance" as Domain, valid: true, chunkCount: 1, truncated: true, warnings: [] });
}

// --- Tests ---

describe("ReversePromptingBatchContract", () => {
  describe("empty batch", () => {
    it("returns totalPackets=0 for empty batch", () => {
      const { contract, batchContract } = makeContracts();
      const result = batchContract.batch([], contract);
      expect(result.totalPackets).toBe(0);
    });

    it("returns totalQuestions=0 for empty batch", () => {
      const { contract, batchContract } = makeContracts();
      const result = batchContract.batch([], contract);
      expect(result.totalQuestions).toBe(0);
    });

    it("returns all priority counts zero for empty batch", () => {
      const { contract, batchContract } = makeContracts();
      const result = batchContract.batch([], contract);
      expect(result.highCount).toBe(0);
      expect(result.mediumCount).toBe(0);
      expect(result.lowCount).toBe(0);
    });

    it("returns dominantPriority NONE for empty batch", () => {
      const { contract, batchContract } = makeContracts();
      const result = batchContract.batch([], contract);
      expect(result.dominantPriority).toBe("NONE");
    });

    it("returns empty results array for empty batch", () => {
      const { contract, batchContract } = makeContracts();
      const result = batchContract.batch([], contract);
      expect(result.results).toHaveLength(0);
    });

    it("still produces batchHash and batchId for empty batch", () => {
      const { contract, batchContract } = makeContracts();
      const result = batchContract.batch([], contract);
      expect(typeof result.batchHash).toBe("string");
      expect(result.batchHash.length).toBeGreaterThan(0);
      expect(typeof result.batchId).toBe("string");
      expect(result.batchId.length).toBeGreaterThan(0);
    });
  });

  describe("single intake signal routing", () => {
    it("produces 0 questions for clean intake with no signals", () => {
      const { contract, batchContract } = makeContracts();
      const result = batchContract.batch([cleanIntake("i1")], contract);
      expect(result.totalQuestions).toBe(0);
      expect(result.dominantPriority).toBe("NONE");
    });

    it("produces 1 high question for invalid intent intake", () => {
      const { contract, batchContract } = makeContracts();
      const result = batchContract.batch([highIntake("i1")], contract);
      expect(result.highCount).toBe(1);
      expect(result.mediumCount).toBe(0);
      expect(result.dominantPriority).toBe("high");
    });

    it("produces 1 high question for general domain intake", () => {
      const { contract, batchContract } = makeContracts();
      const intake = makeIntakeResult("i1", { domain: "general" as Domain, valid: true, chunkCount: 1 });
      const result = batchContract.batch([intake], contract);
      expect(result.highCount).toBeGreaterThanOrEqual(1);
      expect(result.dominantPriority).toBe("high");
    });

    it("produces 1 high question for empty retrieval intake", () => {
      const { contract, batchContract } = makeContracts();
      const intake = makeIntakeResult("i1", { domain: "finance" as Domain, valid: true, chunkCount: 0 });
      const result = batchContract.batch([intake], contract);
      expect(result.highCount).toBe(1);
      expect(result.dominantPriority).toBe("high");
    });

    it("produces 1 medium question for truncated context intake", () => {
      const { contract, batchContract } = makeContracts();
      const result = batchContract.batch([mediumIntake("i1")], contract);
      expect(result.mediumCount).toBe(1);
      expect(result.highCount).toBe(0);
      expect(result.dominantPriority).toBe("medium");
    });
  });

  describe("dominant priority resolution", () => {
    it("dominantPriority is high when only high questions exist", () => {
      const { contract, batchContract } = makeContracts();
      const result = batchContract.batch([highIntake("i1"), highIntake("i2")], contract);
      expect(result.dominantPriority).toBe("high");
    });

    it("dominantPriority is medium when only medium questions exist", () => {
      const { contract, batchContract } = makeContracts();
      const result = batchContract.batch([mediumIntake("i1"), mediumIntake("i2")], contract);
      expect(result.dominantPriority).toBe("medium");
    });

    it("high wins over medium when highCount exceeds mediumCount", () => {
      const { contract, batchContract } = makeContracts();
      // 2 high intakes → 2 high; 1 medium intake → 1 medium
      const result = batchContract.batch([highIntake("i1"), highIntake("i2"), mediumIntake("i3")], contract);
      expect(result.highCount).toBeGreaterThan(result.mediumCount);
      expect(result.dominantPriority).toBe("high");
    });

    it("medium wins over high when mediumCount exceeds highCount", () => {
      const { contract, batchContract } = makeContracts();
      // 1 high intake; 3 medium intakes
      const result = batchContract.batch(
        [highIntake("i1"), mediumIntake("i2"), mediumIntake("i3"), mediumIntake("i4")],
        contract,
      );
      expect(result.mediumCount).toBeGreaterThan(result.highCount);
      expect(result.dominantPriority).toBe("medium");
    });

    it("high wins tie over medium when counts are equal", () => {
      const { contract, batchContract } = makeContracts();
      // 1 high + 1 medium → highCount=1, mediumCount=1 → tie → high wins
      const result = batchContract.batch([highIntake("i1"), mediumIntake("i2")], contract);
      expect(result.highCount).toBe(result.mediumCount);
      expect(result.dominantPriority).toBe("high");
    });

    it("NONE when all intakes produce zero questions", () => {
      const { contract, batchContract } = makeContracts();
      const result = batchContract.batch([cleanIntake("i1"), cleanIntake("i2"), cleanIntake("i3")], contract);
      expect(result.totalQuestions).toBe(0);
      expect(result.dominantPriority).toBe("NONE");
      expect(result.totalPackets).toBe(3);
    });

    it("multiple high signals in one intake accumulate correctly", () => {
      const { contract, batchContract } = makeContracts();
      // invalid + general + no chunks → 3 high questions in 1 packet
      const intake = makeIntakeResult("i1", { domain: "general" as Domain, valid: false, chunkCount: 0 });
      const result = batchContract.batch([intake], contract);
      expect(result.highCount).toBeGreaterThanOrEqual(2);
      expect(result.dominantPriority).toBe("high");
    });
  });

  describe("count accuracy", () => {
    it("totalQuestions equals sum of packet totalQuestions", () => {
      const { contract, batchContract } = makeContracts();
      const result = batchContract.batch(
        [highIntake("i1"), mediumIntake("i2"), cleanIntake("i3")],
        contract,
      );
      const expectedTotal = result.results.reduce((sum, r) => sum + r.totalQuestions, 0);
      expect(result.totalQuestions).toBe(expectedTotal);
    });

    it("highCount + mediumCount + lowCount equals totalQuestions", () => {
      const { contract, batchContract } = makeContracts();
      const result = batchContract.batch(
        [highIntake("i1"), mediumIntake("i2"), highIntake("i3")],
        contract,
      );
      expect(result.highCount + result.mediumCount + result.lowCount).toBe(result.totalQuestions);
    });

    it("totalPackets equals number of input intake results", () => {
      const { contract, batchContract } = makeContracts();
      const intakes = [highIntake("i1"), mediumIntake("i2"), cleanIntake("i3")];
      const result = batchContract.batch(intakes, contract);
      expect(result.totalPackets).toBe(3);
    });

    it("highCount correctly aggregated across multiple packets", () => {
      const { contract, batchContract } = makeContracts();
      // 3 high intakes → highCount=3
      const result = batchContract.batch([highIntake("i1"), highIntake("i2"), highIntake("i3")], contract);
      expect(result.highCount).toBe(3);
    });
  });

  describe("determinism", () => {
    it("batchHash is deterministic for same inputs and timestamp", () => {
      const intake = highIntake("i1");
      const c1 = new ReversePromptingContract({ now: () => FIXED_NOW });
      const c2 = new ReversePromptingContract({ now: () => FIXED_NOW });
      const b1 = new ReversePromptingBatchContract({ now: () => FIXED_NOW });
      const b2 = new ReversePromptingBatchContract({ now: () => FIXED_NOW });
      expect(b1.batch([intake], c1).batchHash).toBe(b2.batch([intake], c2).batchHash);
    });

    it("batchId is deterministic for same inputs and timestamp", () => {
      const intake = mediumIntake("i1");
      const c1 = new ReversePromptingContract({ now: () => FIXED_NOW });
      const c2 = new ReversePromptingContract({ now: () => FIXED_NOW });
      const b1 = new ReversePromptingBatchContract({ now: () => FIXED_NOW });
      const b2 = new ReversePromptingBatchContract({ now: () => FIXED_NOW });
      expect(b1.batch([intake], c1).batchId).toBe(b2.batch([intake], c2).batchId);
    });

    it("batchHash changes when intake changes", () => {
      const batchContract = new ReversePromptingBatchContract({ now: () => FIXED_NOW });
      const contract = new ReversePromptingContract({ now: () => FIXED_NOW });
      const h1 = batchContract.batch([highIntake("i1")], contract).batchHash;
      const h2 = batchContract.batch([mediumIntake("i2")], contract).batchHash;
      expect(h1).not.toBe(h2);
    });
  });

  describe("output shape", () => {
    it("output contains all required fields", () => {
      const { contract, batchContract } = makeContracts();
      const result: ReversePromptingBatchResult = batchContract.batch([], contract);
      expect(result).toHaveProperty("batchId");
      expect(result).toHaveProperty("batchHash");
      expect(result).toHaveProperty("createdAt");
      expect(result).toHaveProperty("totalPackets");
      expect(result).toHaveProperty("totalQuestions");
      expect(result).toHaveProperty("highCount");
      expect(result).toHaveProperty("mediumCount");
      expect(result).toHaveProperty("lowCount");
      expect(result).toHaveProperty("dominantPriority");
      expect(result).toHaveProperty("results");
    });

    it("createdAt uses injected now function", () => {
      const { contract, batchContract } = makeContracts();
      const result = batchContract.batch([], contract);
      expect(result.createdAt).toBe(FIXED_NOW);
    });

    it("each packet has a packetId", () => {
      const { contract, batchContract } = makeContracts();
      const result = batchContract.batch([highIntake("i1")], contract);
      expect(typeof result.results[0].packetId).toBe("string");
      expect(result.results[0].packetId.length).toBeGreaterThan(0);
    });

    it("batchHash and batchId are distinct strings", () => {
      const { contract, batchContract } = makeContracts();
      const result = batchContract.batch([highIntake("i1")], contract);
      expect(result.batchHash).not.toBe(result.batchId);
    });
  });

  describe("factory", () => {
    it("createReversePromptingBatchContract returns a ReversePromptingBatchContract instance", () => {
      const instance = createReversePromptingBatchContract();
      expect(instance).toBeInstanceOf(ReversePromptingBatchContract);
    });

    it("factory result can call batch without error", () => {
      const contract = new ReversePromptingContract({ now: () => FIXED_NOW });
      const batchContract = createReversePromptingBatchContract({ now: () => FIXED_NOW });
      expect(() => batchContract.batch([highIntake("i1")], contract)).not.toThrow();
    });
  });
});
