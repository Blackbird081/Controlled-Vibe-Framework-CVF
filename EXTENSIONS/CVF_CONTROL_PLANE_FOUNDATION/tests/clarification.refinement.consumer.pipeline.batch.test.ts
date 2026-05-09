import {
  ClarificationRefinementConsumerPipelineBatchContract,
  createClarificationRefinementConsumerPipelineBatchContract,
} from "../src/clarification.refinement.consumer.pipeline.batch.contract";
import { ClarificationRefinementConsumerPipelineContract } from "../src/clarification.refinement.consumer.pipeline.contract";
import type { ReversePromptPacket, ClarificationQuestion } from "../src/reverse.prompting.contract";
import type { ClarificationAnswer } from "../src/clarification.refinement.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-25T11:00:00.000Z";
const fixedNow = () => FIXED_NOW;

function buildQuestion(id: string): ClarificationQuestion {
  return {
    questionId: id,
    category: "intent_clarity",
    priority: "high",
    question: `Question ${id}?`,
    signal: `signal-${id}`,
  };
}

function buildPacket(questionCount: number, sourceRequestId = "req-batch-1"): ReversePromptPacket {
  const questions: ClarificationQuestion[] = Array.from(
    { length: questionCount },
    (_, i) => buildQuestion(`bq-${i + 1}`),
  );
  return {
    packetId: `packet-batch-${questionCount}-${sourceRequestId}`,
    createdAt: FIXED_NOW,
    sourceRequestId,
    questions,
    totalQuestions: questionCount,
    highPriorityCount: questionCount,
    signalAnalysis: {
      intentValid: false,
      domainDetected: "general",
      retrievalEmpty: questionCount > 0,
      contextTruncated: false,
      hasWarnings: questionCount > 0,
      warningCount: questionCount,
    },
  };
}

const pipelineContract = new ClarificationRefinementConsumerPipelineContract({ now: fixedNow });

function buildResult(
  packet: ReversePromptPacket,
  answers: ClarificationAnswer[] = [],
  consumerId?: string,
) {
  return pipelineContract.execute({ packet, answers, consumerId });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ClarificationRefinementConsumerPipelineBatchContract", () => {
  const batchContract = new ClarificationRefinementConsumerPipelineBatchContract({ now: fixedNow });

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new ClarificationRefinementConsumerPipelineBatchContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createClarificationRefinementConsumerPipelineBatchContract({ now: fixedNow });
      const batch = c.batch([]);
      expect(batch.totalResults).toBe(0);
    });
  });

  describe("empty batch", () => {
    it("empty batch → totalResults=0", () => {
      expect(batchContract.batch([]).totalResults).toBe(0);
    });

    it("empty batch → dominantTokenBudget=0", () => {
      expect(batchContract.batch([]).dominantTokenBudget).toBe(0);
    });

    it("empty batch → lowConfidenceCount=0", () => {
      expect(batchContract.batch([]).lowConfidenceCount).toBe(0);
    });

    it("empty batch → results is empty array", () => {
      expect(batchContract.batch([]).results).toHaveLength(0);
    });

    it("empty batch → batchHash is truthy", () => {
      expect(batchContract.batch([]).batchHash.length).toBeGreaterThan(0);
    });
  });

  describe("batchId vs batchHash", () => {
    it("batchId is distinct from batchHash", () => {
      const r1 = buildResult(buildPacket(2, "req-a"));
      const batch = batchContract.batch([r1]);
      expect(batch.batchId).not.toBe(batch.batchHash);
    });

    it("batchHash is deterministic for same results", () => {
      const r1 = buildResult(buildPacket(1, "req-x"));
      const b1 = batchContract.batch([r1]);
      const b2 = batchContract.batch([r1]);
      expect(b1.batchHash).toBe(b2.batchHash);
    });

    it("batchHash differs when results differ", () => {
      const r1 = buildResult(buildPacket(1, "req-p"));
      const r2 = buildResult(buildPacket(1, "req-q"));
      expect(batchContract.batch([r1]).batchHash).not.toBe(batchContract.batch([r2]).batchHash);
    });
  });

  describe("lowConfidenceCount", () => {
    it("all unanswered (confidenceBoost=0) → all counted as low confidence", () => {
      const r1 = buildResult(buildPacket(2, "req-lc1"));
      const r2 = buildResult(buildPacket(2, "req-lc2"));
      const batch = batchContract.batch([r1, r2]);
      expect(batch.lowConfidenceCount).toBe(2);
    });

    it("all fully answered (confidenceBoost=1.0) → lowConfidenceCount=0", () => {
      const p = buildPacket(2, "req-full");
      const answers: ClarificationAnswer[] = p.questions.map((q) => ({ questionId: q.questionId, answer: "yes" }));
      const r = buildResult(p, answers);
      const batch = batchContract.batch([r]);
      expect(batch.lowConfidenceCount).toBe(0);
    });

    it("exactly 0.5 confidenceBoost → not counted as low confidence", () => {
      const p = buildPacket(2, "req-half");
      const halfAnswers: ClarificationAnswer[] = [
        { questionId: p.questions[0].questionId, answer: "yes" },
      ];
      const r = buildResult(p, halfAnswers);
      const batch = batchContract.batch([r]);
      expect(batch.lowConfidenceCount).toBe(0);
    });

    it("mixed results → correct lowConfidenceCount", () => {
      const pLow = buildPacket(2, "req-mixed-low");
      const pHigh = buildPacket(2, "req-mixed-high");
      const answersHigh: ClarificationAnswer[] = pHigh.questions.map((q) => ({ questionId: q.questionId, answer: "yes" }));
      const rLow = buildResult(pLow, []);
      const rHigh = buildResult(pHigh, answersHigh);
      const batch = batchContract.batch([rLow, rHigh]);
      expect(batch.lowConfidenceCount).toBe(1);
    });
  });

  describe("dominantTokenBudget", () => {
    it("single result → dominantTokenBudget equals its estimatedTokens", () => {
      const r = buildResult(buildPacket(1, "req-token1"));
      const tokens = r.consumerPackage.typedContextPackage.estimatedTokens;
      const batch = batchContract.batch([r]);
      expect(batch.dominantTokenBudget).toBe(tokens);
    });

    it("multiple results → dominantTokenBudget is the max estimatedTokens", () => {
      const r1 = buildResult(buildPacket(1, "req-t1"));
      const r2 = buildResult(buildPacket(2, "req-t2"));
      const expected = Math.max(
        r1.consumerPackage.typedContextPackage.estimatedTokens,
        r2.consumerPackage.typedContextPackage.estimatedTokens,
      );
      const batch = batchContract.batch([r1, r2]);
      expect(batch.dominantTokenBudget).toBe(expected);
    });
  });

  describe("general fields", () => {
    it("createdAt equals injected now()", () => {
      const batch = batchContract.batch([]);
      expect(batch.createdAt).toBe(FIXED_NOW);
    });

    it("totalResults equals results.length", () => {
      const r1 = buildResult(buildPacket(1, "req-c1"));
      const r2 = buildResult(buildPacket(1, "req-c2"));
      const batch = batchContract.batch([r1, r2]);
      expect(batch.totalResults).toBe(2);
    });

    it("results array is preserved on the batch", () => {
      const r1 = buildResult(buildPacket(1, "req-p1"));
      const batch = batchContract.batch([r1]);
      expect(batch.results[0]).toBe(r1);
    });
  });
});
