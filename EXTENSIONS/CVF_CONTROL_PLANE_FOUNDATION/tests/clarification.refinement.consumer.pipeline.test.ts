import {
  ClarificationRefinementConsumerPipelineContract,
  createClarificationRefinementConsumerPipelineContract,
} from "../src/clarification.refinement.consumer.pipeline.contract";
import type {
  ClarificationRefinementConsumerPipelineRequest,
} from "../src/clarification.refinement.consumer.pipeline.contract";
import type { ReversePromptPacket, ClarificationQuestion } from "../src/reverse.prompting.contract";
import type { ClarificationAnswer } from "../src/clarification.refinement.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-25T10:00:00.000Z";
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

function buildPacket(questionCount: number, sourceRequestId = "req-test-1"): ReversePromptPacket {
  const questions: ClarificationQuestion[] = Array.from(
    { length: questionCount },
    (_, i) => buildQuestion(`q-${i + 1}`),
  );
  return {
    packetId: `packet-${questionCount}-${sourceRequestId}`,
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

function allAnswers(packet: ReversePromptPacket): ClarificationAnswer[] {
  return packet.questions.map((q) => ({ questionId: q.questionId, answer: "My answer" }));
}

function buildRequest(
  packet: ReversePromptPacket,
  answers: ClarificationAnswer[],
  consumerId?: string,
): ClarificationRefinementConsumerPipelineRequest {
  return { packet, answers, consumerId };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ClarificationRefinementConsumerPipelineContract", () => {
  const contract = new ClarificationRefinementConsumerPipelineContract({ now: fixedNow });

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new ClarificationRefinementConsumerPipelineContract()).not.toThrow();
    });

    it("factory createClarificationRefinementConsumerPipelineContract returns working instance", () => {
      const c = createClarificationRefinementConsumerPipelineContract({ now: fixedNow });
      const packet = buildPacket(0);
      const result = c.execute(buildRequest(packet, []));
      expect(result.createdAt).toBe(FIXED_NOW);
    });
  });

  describe("output shape", () => {
    it("execute returns a result object", () => {
      const packet = buildPacket(2);
      const result = contract.execute(buildRequest(packet, allAnswers(packet)));
      expect(result).toBeDefined();
    });

    it("resultId is a non-empty string", () => {
      const packet = buildPacket(1);
      const result = contract.execute(buildRequest(packet, []));
      expect(typeof result.resultId).toBe("string");
      expect(result.resultId.length).toBeGreaterThan(0);
    });

    it("createdAt equals injected now()", () => {
      const packet = buildPacket(1);
      const result = contract.execute(buildRequest(packet, []));
      expect(result.createdAt).toBe(FIXED_NOW);
    });

    it("refinedRequest is present", () => {
      const packet = buildPacket(2);
      const result = contract.execute(buildRequest(packet, allAnswers(packet)));
      expect(result.refinedRequest).toBeDefined();
    });

    it("consumerPackage is present", () => {
      const packet = buildPacket(1);
      const result = contract.execute(buildRequest(packet, []));
      expect(result.consumerPackage).toBeDefined();
    });

    it("consumerPackage has typedContextPackage", () => {
      const packet = buildPacket(1);
      const result = contract.execute(buildRequest(packet, []));
      expect(result.consumerPackage.typedContextPackage).toBeDefined();
    });

    it("pipelineHash is a non-empty string", () => {
      const packet = buildPacket(1);
      const result = contract.execute(buildRequest(packet, []));
      expect(typeof result.pipelineHash).toBe("string");
      expect(result.pipelineHash.length).toBeGreaterThan(0);
    });

    it("warnings is an array", () => {
      const packet = buildPacket(1);
      const result = contract.execute(buildRequest(packet, []));
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });

  describe("consumerId propagation", () => {
    it("consumerId is set when provided", () => {
      const packet = buildPacket(1);
      const result = contract.execute(buildRequest(packet, [], "consumer-abc"));
      expect(result.consumerId).toBe("consumer-abc");
    });

    it("consumerId is undefined when not provided", () => {
      const packet = buildPacket(1);
      const result = contract.execute(buildRequest(packet, []));
      expect(result.consumerId).toBeUndefined();
    });
  });

  describe("deterministic hashing", () => {
    it("pipelineHash is deterministic for same inputs", () => {
      const packet = buildPacket(2);
      const answers = allAnswers(packet);
      const r1 = contract.execute(buildRequest(packet, answers));
      const r2 = contract.execute(buildRequest(packet, answers));
      expect(r1.pipelineHash).toBe(r2.pipelineHash);
    });

    it("pipelineHash differs when packet differs", () => {
      const p1 = buildPacket(2, "req-a");
      const p2 = buildPacket(2, "req-b");
      const r1 = contract.execute(buildRequest(p1, []));
      const r2 = contract.execute(buildRequest(p2, []));
      expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
    });

    it("resultId is deterministic for same inputs", () => {
      const packet = buildPacket(1);
      const r1 = contract.execute(buildRequest(packet, []));
      const r2 = contract.execute(buildRequest(packet, []));
      expect(r1.resultId).toBe(r2.resultId);
    });

    it("resultId is distinct from pipelineHash", () => {
      const packet = buildPacket(1);
      const result = contract.execute(buildRequest(packet, []));
      expect(result.resultId).not.toBe(result.pipelineHash);
    });
  });

  describe("query derivation", () => {
    it("query includes confidence:0.00 when no answers applied", () => {
      const packet = buildPacket(2);
      const result = contract.execute(buildRequest(packet, []));
      expect(result.consumerPackage.typedContextPackage.query).toContain("confidence:0.00");
    });

    it("query includes confidence:1.00 when all answers applied", () => {
      const packet = buildPacket(2);
      const result = contract.execute(buildRequest(packet, allAnswers(packet)));
      expect(result.consumerPackage.typedContextPackage.query).toContain("confidence:1.00");
    });

    it("query includes answered count", () => {
      const packet = buildPacket(2);
      const result = contract.execute(buildRequest(packet, allAnswers(packet)));
      expect(result.consumerPackage.typedContextPackage.query).toContain("answered:2");
    });

    it("query length is at most 120 characters", () => {
      const packet = buildPacket(4);
      const result = contract.execute(buildRequest(packet, allAnswers(packet)));
      expect(result.consumerPackage.typedContextPackage.query.length).toBeLessThanOrEqual(120);
    });
  });

  describe("warning messages", () => {
    it("zero confidenceBoost → warning about no answers applied", () => {
      const packet = buildPacket(2);
      const result = contract.execute(buildRequest(packet, []));
      expect(result.warnings).toContain(
        "[clarification] no answers applied — refinement yielded no confidence boost",
      );
    });

    it("zero questions packet → confidenceBoost=0 → warning about no answers applied", () => {
      const packet = buildPacket(0);
      const result = contract.execute(buildRequest(packet, []));
      expect(result.warnings).toContain(
        "[clarification] no answers applied — refinement yielded no confidence boost",
      );
    });

    it("confidenceBoost < 0.5 → low confidence warning", () => {
      const packet = buildPacket(4);
      const partialAnswers: ClarificationAnswer[] = [
        { questionId: packet.questions[0].questionId, answer: "yes" },
      ];
      const result = contract.execute(buildRequest(packet, partialAnswers));
      expect(result.warnings).toContain(
        "[clarification] low confidence refinement — insufficient answers applied",
      );
    });

    it("confidenceBoost === 0.5 → no warning", () => {
      const packet = buildPacket(2);
      const halfAnswers: ClarificationAnswer[] = [
        { questionId: packet.questions[0].questionId, answer: "yes" },
      ];
      const result = contract.execute(buildRequest(packet, halfAnswers));
      expect(result.warnings).toHaveLength(0);
    });

    it("confidenceBoost === 1.0 → no warning", () => {
      const packet = buildPacket(2);
      const result = contract.execute(buildRequest(packet, allAnswers(packet)));
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe("refinedRequest propagation", () => {
    it("refinedRequest.answeredCount matches answers provided", () => {
      const packet = buildPacket(3);
      const twoAnswers: ClarificationAnswer[] = [
        { questionId: packet.questions[0].questionId, answer: "yes" },
        { questionId: packet.questions[1].questionId, answer: "no" },
      ];
      const result = contract.execute(buildRequest(packet, twoAnswers));
      expect(result.refinedRequest.answeredCount).toBe(2);
    });

    it("refinedRequest.skippedCount = totalQuestions - answeredCount", () => {
      const packet = buildPacket(3);
      const twoAnswers: ClarificationAnswer[] = [
        { questionId: packet.questions[0].questionId, answer: "yes" },
        { questionId: packet.questions[1].questionId, answer: "yes" },
      ];
      const result = contract.execute(buildRequest(packet, twoAnswers));
      expect(result.refinedRequest.skippedCount).toBe(1);
    });

    it("refinedRequest.enrichments length equals packet question count", () => {
      const packet = buildPacket(3);
      const result = contract.execute(buildRequest(packet, []));
      expect(result.refinedRequest.enrichments).toHaveLength(3);
    });

    it("refinedRequest.sourcePacketId equals packet.packetId", () => {
      const packet = buildPacket(2);
      const result = contract.execute(buildRequest(packet, []));
      expect(result.refinedRequest.sourcePacketId).toBe(packet.packetId);
    });
  });
});
