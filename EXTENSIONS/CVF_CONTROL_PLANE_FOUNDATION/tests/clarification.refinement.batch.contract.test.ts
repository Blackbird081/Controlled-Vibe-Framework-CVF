import { describe, it, expect } from "vitest";
import {
  ClarificationRefinementBatchContract,
  createClarificationRefinementBatchContract,
  type ClarificationRefinementRequest,
  type ClarificationRefinementBatch,
} from "../src/clarification.refinement.batch.contract";
import type {
  ReversePromptPacket,
  ClarificationQuestion,
} from "../src/reverse.prompting.contract";
import type { ClarificationAnswer } from "../src/clarification.refinement.contract";
import { FIXED_BATCH_NOW } from "./helpers/cpf.batch.contract.fixtures";

// --- Helpers ---

function makePacket(
  id: string,
  questionCount: number = 2,
  highCount: number = 0,
): ReversePromptPacket {
  const questions: ClarificationQuestion[] = Array.from(
    { length: questionCount },
    (_, i) => ({
      questionId: `q-${id}-${i}`,
      category: "intent_clarity" as const,
      priority: i < highCount ? ("high" as const) : ("low" as const),
      question: `Question ${i} for ${id}?`,
      signal: `signal-${i}`,
    }),
  );

  return {
    packetId: `packet-${id}`,
    createdAt: FIXED_BATCH_NOW,
    sourceRequestId: `req-${id}`,
    questions,
    totalQuestions: questionCount,
    highPriorityCount: highCount,
    signalAnalysis: {
      intentValid: true,
      domainDetected: "test",
      retrievalEmpty: false,
      contextTruncated: false,
      hasWarnings: false,
      warningCount: 0,
    },
  };
}

function makeAnswers(packet: ReversePromptPacket, count?: number): ClarificationAnswer[] {
  const total = count ?? packet.questions.length;
  return packet.questions.slice(0, total).map((q) => ({
    questionId: q.questionId,
    answer: `answer for ${q.questionId}`,
  }));
}

function makeRequest(
  id: string,
  questionCount: number = 2,
  answerCount?: number,
): ClarificationRefinementRequest {
  const packet = makePacket(id, questionCount);
  return { packet, answers: makeAnswers(packet, answerCount) };
}

// --- Tests ---

describe("ClarificationRefinementBatchContract", () => {
  // Group 1: Instantiation
  describe("instantiation", () => {
    it("creates instance with new without error", () => {
      const contract = new ClarificationRefinementBatchContract();
      expect(contract).toBeDefined();
    });

    it("factory function returns instance", () => {
      const contract = createClarificationRefinementBatchContract();
      expect(contract).toBeDefined();
      expect(contract).toBeInstanceOf(ClarificationRefinementBatchContract);
    });
  });

  // Group 2: Empty batch
  describe("empty batch", () => {
    const contract = new ClarificationRefinementBatchContract({
      now: () => FIXED_BATCH_NOW,
    });

    it("returns totalRefinements: 0 for empty input", () => {
      const result = contract.batch([]);
      expect(result.totalRefinements).toBe(0);
    });

    it("returns dominantConfidenceBoost: 0 for empty input", () => {
      const result = contract.batch([]);
      expect(result.dominantConfidenceBoost).toBe(0);
    });

    it("returns empty results array for empty input", () => {
      const result = contract.batch([]);
      expect(result.results).toEqual([]);
    });

    it("returns valid batchHash string for empty input", () => {
      const result = contract.batch([]);
      expect(typeof result.batchHash).toBe("string");
      expect(result.batchHash.length).toBeGreaterThan(0);
    });

    it("batchId differs from batchHash for empty input", () => {
      const result = contract.batch([]);
      expect(result.batchId).not.toBe(result.batchHash);
    });
  });

  // Group 3: Single request
  describe("single request", () => {
    const contract = new ClarificationRefinementBatchContract({
      now: () => FIXED_BATCH_NOW,
    });

    it("returns totalRefinements: 1 for single request", () => {
      const result = contract.batch([makeRequest("alpha", 2, 2)]);
      expect(result.totalRefinements).toBe(1);
    });

    it("result has correct sourcePacketId", () => {
      const req = makeRequest("beta", 3, 3);
      const result = contract.batch([req]);
      expect(result.results[0].sourcePacketId).toBe("packet-beta");
    });

    it("result has correct answeredCount when all answers provided", () => {
      const result = contract.batch([makeRequest("gamma", 3, 3)]);
      expect(result.results[0].answeredCount).toBe(3);
    });

    it("result has correct skippedCount when no answers provided", () => {
      const result = contract.batch([makeRequest("delta", 3, 0)]);
      expect(result.results[0].skippedCount).toBe(3);
    });

    it("result has correct confidenceBoost for fully answered packet", () => {
      const result = contract.batch([makeRequest("epsilon", 4, 4)]);
      expect(result.results[0].confidenceBoost).toBe(1);
    });

    it("result contains enrichments array", () => {
      const result = contract.batch([makeRequest("zeta", 2, 1)]);
      expect(Array.isArray(result.results[0].enrichments)).toBe(true);
      expect(result.results[0].enrichments.length).toBe(2);
    });
  });

  // Group 4: Multiple requests
  describe("multiple requests", () => {
    const contract = new ClarificationRefinementBatchContract({
      now: () => FIXED_BATCH_NOW,
    });

    it("returns totalRefinements: 2 for two requests", () => {
      const result = contract.batch([
        makeRequest("r1", 2, 2),
        makeRequest("r2", 2, 1),
      ]);
      expect(result.totalRefinements).toBe(2);
    });

    it("returns totalRefinements: 3 for three requests", () => {
      const result = contract.batch([
        makeRequest("r3", 2),
        makeRequest("r4", 2),
        makeRequest("r5", 2),
      ]);
      expect(result.totalRefinements).toBe(3);
    });

    it("results maintain input order", () => {
      const result = contract.batch([
        makeRequest("order-a", 2, 2),
        makeRequest("order-b", 2, 1),
        makeRequest("order-c", 2, 0),
      ]);
      expect(result.results[0].sourcePacketId).toBe("packet-order-a");
      expect(result.results[1].sourcePacketId).toBe("packet-order-b");
      expect(result.results[2].sourcePacketId).toBe("packet-order-c");
    });

    it("each result has correct sourcePacketId", () => {
      const result = contract.batch([
        makeRequest("x1", 2),
        makeRequest("x2", 2),
      ]);
      expect(result.results[0].sourcePacketId).toBe("packet-x1");
      expect(result.results[1].sourcePacketId).toBe("packet-x2");
    });

    it("each result has correct answeredCount", () => {
      const result = contract.batch([
        makeRequest("y1", 4, 4),
        makeRequest("y2", 4, 2),
      ]);
      expect(result.results[0].answeredCount).toBe(4);
      expect(result.results[1].answeredCount).toBe(2);
    });
  });

  // Group 5: dominantConfidenceBoost
  describe("dominantConfidenceBoost", () => {
    const contract = new ClarificationRefinementBatchContract({
      now: () => FIXED_BATCH_NOW,
    });

    it("is 0 for empty batch", () => {
      const result = contract.batch([]);
      expect(result.dominantConfidenceBoost).toBe(0);
    });

    it("equals the single value for single request", () => {
      const result = contract.batch([makeRequest("solo", 4, 2)]);
      const expected = result.results[0].confidenceBoost;
      expect(result.dominantConfidenceBoost).toBe(expected);
    });

    it("picks the maximum across multiple requests", () => {
      const result = contract.batch([
        makeRequest("low", 4, 0),
        makeRequest("high", 4, 4),
        makeRequest("mid", 4, 2),
      ]);
      const max = Math.max(...result.results.map((r) => r.confidenceBoost));
      expect(result.dominantConfidenceBoost).toBe(max);
    });

    it("equals 1 when all questions answered in any request", () => {
      const result = contract.batch([
        makeRequest("partial", 4, 2),
        makeRequest("full", 4, 4),
      ]);
      expect(result.dominantConfidenceBoost).toBe(1);
    });

    it("equals 0 when no questions answered across all requests", () => {
      const result = contract.batch([
        makeRequest("none1", 3, 0),
        makeRequest("none2", 3, 0),
      ]);
      expect(result.dominantConfidenceBoost).toBe(0);
    });
  });

  // Group 6: Determinism
  describe("batch hash and ID determinism", () => {
    it("same inputs produce same batchHash", () => {
      const contract = new ClarificationRefinementBatchContract({
        now: () => FIXED_BATCH_NOW,
      });
      const r1 = contract.batch([makeRequest("det1", 2, 2)]);
      const r2 = contract.batch([makeRequest("det1", 2, 2)]);
      expect(r1.batchHash).toBe(r2.batchHash);
    });

    it("different now() produces different batchHash", () => {
      const c1 = new ClarificationRefinementBatchContract({
        now: () => "2026-04-01T00:00:00.000Z",
      });
      const c2 = new ClarificationRefinementBatchContract({
        now: () => "2026-04-02T00:00:00.000Z",
      });
      const r1 = c1.batch([makeRequest("diff", 2, 2)]);
      const r2 = c2.batch([makeRequest("diff", 2, 2)]);
      expect(r1.batchHash).not.toBe(r2.batchHash);
    });

    it("batchId is deterministic for same inputs", () => {
      const contract = new ClarificationRefinementBatchContract({
        now: () => FIXED_BATCH_NOW,
      });
      const r1 = contract.batch([makeRequest("detid", 2, 1)]);
      const r2 = contract.batch([makeRequest("detid", 2, 1)]);
      expect(r1.batchId).toBe(r2.batchId);
    });

    it("batchId differs from batchHash", () => {
      const contract = new ClarificationRefinementBatchContract({
        now: () => FIXED_BATCH_NOW,
      });
      const result = contract.batch([makeRequest("idhash", 2, 2)]);
      expect(result.batchId).not.toBe(result.batchHash);
    });

    it("batchHash changes when totalRefinements changes", () => {
      const c1 = new ClarificationRefinementBatchContract({
        now: () => FIXED_BATCH_NOW,
      });
      const r1 = c1.batch([makeRequest("cnt1", 2, 2)]);
      const r2 = c1.batch([
        makeRequest("cnt2a", 2, 2),
        makeRequest("cnt2b", 2, 2),
      ]);
      expect(r1.batchHash).not.toBe(r2.batchHash);
    });
  });

  // Group 7: Dependency injection
  describe("dependency injection", () => {
    it("uses injected now() for createdAt", () => {
      const fixedTime = "2026-04-01T12:34:56.000Z";
      const contract = new ClarificationRefinementBatchContract({
        now: () => fixedTime,
      });
      const result = contract.batch([makeRequest("inj", 2, 1)]);
      expect(result.createdAt).toBe(fixedTime);
    });

    it("createdAt is consistent across batch results", () => {
      const contract = new ClarificationRefinementBatchContract({
        now: () => FIXED_BATCH_NOW,
      });
      const result = contract.batch([
        makeRequest("ts1", 2, 2),
        makeRequest("ts2", 2, 2),
      ]);
      expect(result.createdAt).toBe(FIXED_BATCH_NOW);
      expect(result.results.length).toBe(2);
    });
  });
});
