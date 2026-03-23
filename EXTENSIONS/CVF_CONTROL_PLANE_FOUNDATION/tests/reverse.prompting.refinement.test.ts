/**
 * CPF Reverse Prompting & Clarification Refinement — Dedicated Tests (W6-T36)
 * ============================================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   ReversePromptingContract.generate:
 *     - all signals clear → no questions generated (totalQuestions=0)
 *     - !intentValid → intent_clarity question (high priority)
 *     - domain="general" → domain_specificity question (high priority)
 *     - domain="unknown" → domain_specificity question
 *     - domain="unspecified" → domain_specificity question
 *     - retrievalEmpty=true → context_gap question (high priority)
 *     - contextTruncated=true → scope_boundary question (medium priority)
 *     - hasWarnings=true → risk_acknowledgement question (medium priority, includes warningCount)
 *     - multiple triggers → multiple questions generated
 *     - highPriorityCount = count of questions with priority="high"
 *     - totalQuestions = questions.length
 *     - sourceRequestId = intakeResult.requestId
 *     - createdAt = injected now()
 *     - packetId truthy
 *     - custom analyzeSignals override respected
 *     - factory createReversePromptingContract returns working instance
 *   ClarificationRefinementContract.refine:
 *     - no answers → all enrichments skipped (answeredCount=0)
 *     - answer for all questions → all applied (answeredCount=totalQuestions)
 *     - empty string answer → not applied (applied=false), answer=""
 *     - whitespace-only answer → not applied
 *     - valid non-empty answer → applied=true, answer=trimmed value
 *     - answeredCount + skippedCount = enrichments.length
 *     - enrichments.length = packet.questions.length
 *     - confidenceBoost = answered/total when all answered → 1.0
 *     - confidenceBoost = 0/total when none answered → 0.0
 *     - confidenceBoost = partial (0.5 when half answered)
 *     - confidenceBoost = 0 when no questions (total=0)
 *     - sourcePacketId = packet.packetId
 *     - originalRequestId = packet.sourceRequestId
 *     - createdAt = injected now()
 *     - refinedId truthy
 *     - custom scoreConfidence override respected
 *     - factory createClarificationRefinementContract returns working instance
 */

import { describe, it, expect } from "vitest";

import {
  ReversePromptingContract,
  createReversePromptingContract,
} from "../src/reverse.prompting.contract";
import type {
  SignalAnalysis,
  ReversePromptPacket,
} from "../src/reverse.prompting.contract";
import type { ControlPlaneIntakeResult } from "../src/intake.contract";

import {
  ClarificationRefinementContract,
  createClarificationRefinementContract,
} from "../src/clarification.refinement.contract";
import type { ClarificationAnswer } from "../src/clarification.refinement.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T11:00:00.000Z";
const fixedNow = () => FIXED_NOW;

/** Minimal fake intake result — only requestId is used by generate() when analyzeSignals is injected */
function makeFakeIntakeResult(requestId = "req-001"): ControlPlaneIntakeResult {
  return { requestId } as unknown as ControlPlaneIntakeResult;
}

function makeAnalysis(overrides: Partial<SignalAnalysis> = {}): SignalAnalysis {
  return {
    intentValid: true,
    domainDetected: "governance",
    retrievalEmpty: false,
    contextTruncated: false,
    hasWarnings: false,
    warningCount: 0,
    ...overrides,
  };
}

/** Build a packet by injecting a controlled SignalAnalysis */
function buildPacket(
  analysis: Partial<SignalAnalysis> = {},
  requestId = "req-001",
): ReversePromptPacket {
  const contract = new ReversePromptingContract({
    now: fixedNow,
    analyzeSignals: () => makeAnalysis(analysis),
  });
  return contract.generate(makeFakeIntakeResult(requestId));
}

// ─── ReversePromptingContract.generate ───────────────────────────────────────

describe("ReversePromptingContract.generate", () => {
  describe("all signals clear → no questions", () => {
    it("all clear → totalQuestions=0", () => {
      const packet = buildPacket();
      expect(packet.totalQuestions).toBe(0);
    });

    it("all clear → questions=[]", () => {
      const packet = buildPacket();
      expect(packet.questions).toHaveLength(0);
    });

    it("all clear → highPriorityCount=0", () => {
      const packet = buildPacket();
      expect(packet.highPriorityCount).toBe(0);
    });
  });

  describe("question triggers — intent_clarity", () => {
    it("!intentValid → generates intent_clarity question", () => {
      const packet = buildPacket({ intentValid: false });
      expect(packet.questions.some((q) => q.category === "intent_clarity")).toBe(true);
    });

    it("intent_clarity question has priority=high", () => {
      const packet = buildPacket({ intentValid: false });
      const q = packet.questions.find((q) => q.category === "intent_clarity");
      expect(q?.priority).toBe("high");
    });
  });

  describe("question triggers — domain_specificity", () => {
    it("domain='general' → generates domain_specificity question", () => {
      const packet = buildPacket({ domainDetected: "general" });
      expect(packet.questions.some((q) => q.category === "domain_specificity")).toBe(true);
    });

    it("domain='unknown' → generates domain_specificity question", () => {
      const packet = buildPacket({ domainDetected: "unknown" });
      expect(packet.questions.some((q) => q.category === "domain_specificity")).toBe(true);
    });

    it("domain='unspecified' → generates domain_specificity question", () => {
      const packet = buildPacket({ domainDetected: "unspecified" });
      expect(packet.questions.some((q) => q.category === "domain_specificity")).toBe(true);
    });

    it("domain_specificity question has priority=high", () => {
      const packet = buildPacket({ domainDetected: "general" });
      const q = packet.questions.find((q) => q.category === "domain_specificity");
      expect(q?.priority).toBe("high");
    });

    it("specific domain → no domain_specificity question", () => {
      const packet = buildPacket({ domainDetected: "finance" });
      expect(packet.questions.some((q) => q.category === "domain_specificity")).toBe(false);
    });
  });

  describe("question triggers — context_gap", () => {
    it("retrievalEmpty=true → generates context_gap question", () => {
      const packet = buildPacket({ retrievalEmpty: true });
      expect(packet.questions.some((q) => q.category === "context_gap")).toBe(true);
    });

    it("context_gap question has priority=high", () => {
      const packet = buildPacket({ retrievalEmpty: true });
      const q = packet.questions.find((q) => q.category === "context_gap");
      expect(q?.priority).toBe("high");
    });
  });

  describe("question triggers — scope_boundary", () => {
    it("contextTruncated=true → generates scope_boundary question", () => {
      const packet = buildPacket({ contextTruncated: true });
      expect(packet.questions.some((q) => q.category === "scope_boundary")).toBe(true);
    });

    it("scope_boundary question has priority=medium", () => {
      const packet = buildPacket({ contextTruncated: true });
      const q = packet.questions.find((q) => q.category === "scope_boundary");
      expect(q?.priority).toBe("medium");
    });
  });

  describe("question triggers — risk_acknowledgement", () => {
    it("hasWarnings=true → generates risk_acknowledgement question", () => {
      const packet = buildPacket({ hasWarnings: true, warningCount: 2 });
      expect(packet.questions.some((q) => q.category === "risk_acknowledgement")).toBe(true);
    });

    it("risk_acknowledgement question has priority=medium", () => {
      const packet = buildPacket({ hasWarnings: true, warningCount: 1 });
      const q = packet.questions.find((q) => q.category === "risk_acknowledgement");
      expect(q?.priority).toBe("medium");
    });

    it("risk_acknowledgement question mentions warningCount", () => {
      const packet = buildPacket({ hasWarnings: true, warningCount: 3 });
      const q = packet.questions.find((q) => q.category === "risk_acknowledgement");
      expect(q?.question).toContain("3");
    });
  });

  describe("multiple triggers", () => {
    it("2 triggers → 2 questions", () => {
      const packet = buildPacket({ intentValid: false, retrievalEmpty: true });
      expect(packet.questions).toHaveLength(2);
      expect(packet.totalQuestions).toBe(2);
    });

    it("all 5 triggers → 5 questions", () => {
      const packet = buildPacket({
        intentValid: false,
        domainDetected: "general",
        retrievalEmpty: true,
        contextTruncated: true,
        hasWarnings: true,
        warningCount: 1,
      });
      expect(packet.questions).toHaveLength(5);
    });

    it("highPriorityCount accurate (3 high, 2 medium triggers)", () => {
      const packet = buildPacket({
        intentValid: false,
        domainDetected: "general",
        retrievalEmpty: true,
        contextTruncated: true,
        hasWarnings: true,
        warningCount: 1,
      });
      expect(packet.highPriorityCount).toBe(3);
    });
  });

  describe("output fields", () => {
    it("sourceRequestId = intakeResult.requestId", () => {
      const packet = buildPacket({}, "req-custom-99");
      expect(packet.sourceRequestId).toBe("req-custom-99");
    });

    it("createdAt = injected now()", () => {
      expect(buildPacket().createdAt).toBe(FIXED_NOW);
    });

    it("packetId is truthy", () => {
      expect(buildPacket().packetId.length).toBeGreaterThan(0);
    });
  });

  it("custom analyzeSignals override respected", () => {
    const contract = new ReversePromptingContract({
      now: fixedNow,
      analyzeSignals: () => makeAnalysis({ intentValid: false }),
    });
    const packet = contract.generate(makeFakeIntakeResult());
    expect(packet.questions.some((q) => q.category === "intent_clarity")).toBe(true);
  });

  it("factory createReversePromptingContract returns working instance", () => {
    const c = createReversePromptingContract({ now: fixedNow, analyzeSignals: () => makeAnalysis() });
    const packet = c.generate(makeFakeIntakeResult());
    expect(packet.createdAt).toBe(FIXED_NOW);
    expect(packet.totalQuestions).toBe(0);
  });
});

// ─── ClarificationRefinementContract.refine ──────────────────────────────────

describe("ClarificationRefinementContract.refine", () => {
  const contract = new ClarificationRefinementContract({ now: fixedNow });

  /** Build a packet with specific analysis triggers */
  function buildTestPacket(analysis: Partial<SignalAnalysis> = {}): ReversePromptPacket {
    return buildPacket(analysis);
  }

  describe("no answers", () => {
    it("no answers → answeredCount=0", () => {
      const packet = buildTestPacket({ intentValid: false, retrievalEmpty: true });
      const result = contract.refine(packet, []);
      expect(result.answeredCount).toBe(0);
    });

    it("no answers → skippedCount = packet.questions.length", () => {
      const packet = buildTestPacket({ intentValid: false, retrievalEmpty: true });
      const result = contract.refine(packet, []);
      expect(result.skippedCount).toBe(2);
    });

    it("no answers → confidenceBoost=0", () => {
      const packet = buildTestPacket({ intentValid: false });
      const result = contract.refine(packet, []);
      expect(result.confidenceBoost).toBe(0);
    });
  });

  describe("answers applied", () => {
    it("answer for all questions → answeredCount=totalQuestions, skippedCount=0", () => {
      const packet = buildTestPacket({ intentValid: false, retrievalEmpty: true });
      const answers: ClarificationAnswer[] = packet.questions.map((q) => ({
        questionId: q.questionId,
        answer: "My detailed answer",
      }));
      const result = contract.refine(packet, answers);
      expect(result.answeredCount).toBe(2);
      expect(result.skippedCount).toBe(0);
    });

    it("empty string answer → applied=false", () => {
      const packet = buildTestPacket({ intentValid: false });
      const answers: ClarificationAnswer[] = packet.questions.map((q) => ({
        questionId: q.questionId,
        answer: "",
      }));
      const result = contract.refine(packet, answers);
      expect(result.enrichments[0].applied).toBe(false);
      expect(result.enrichments[0].answer).toBe("");
    });

    it("whitespace-only answer → applied=false", () => {
      const packet = buildTestPacket({ intentValid: false });
      const answers: ClarificationAnswer[] = packet.questions.map((q) => ({
        questionId: q.questionId,
        answer: "   ",
      }));
      const result = contract.refine(packet, answers);
      expect(result.enrichments[0].applied).toBe(false);
    });

    it("non-empty answer → applied=true, answer=trimmed", () => {
      const packet = buildTestPacket({ intentValid: false });
      const answers: ClarificationAnswer[] = packet.questions.map((q) => ({
        questionId: q.questionId,
        answer: "  my answer  ",
      }));
      const result = contract.refine(packet, answers);
      expect(result.enrichments[0].applied).toBe(true);
      expect(result.enrichments[0].answer).toBe("my answer");
    });

    it("partial answers → correct answeredCount + skippedCount", () => {
      const packet = buildTestPacket({ intentValid: false, retrievalEmpty: true, contextTruncated: true });
      // 3 questions; answer only first one
      const answers: ClarificationAnswer[] = [
        { questionId: packet.questions[0].questionId, answer: "My answer" },
      ];
      const result = contract.refine(packet, answers);
      expect(result.answeredCount).toBe(1);
      expect(result.skippedCount).toBe(2);
    });
  });

  describe("enrichments", () => {
    it("enrichments.length = packet.questions.length", () => {
      const packet = buildTestPacket({ intentValid: false, domainDetected: "general" });
      const result = contract.refine(packet, []);
      expect(result.enrichments).toHaveLength(2);
    });

    it("answeredCount + skippedCount = enrichments.length", () => {
      const packet = buildTestPacket({ intentValid: false, retrievalEmpty: true });
      const answers: ClarificationAnswer[] = [
        { questionId: packet.questions[0].questionId, answer: "yes" },
      ];
      const result = contract.refine(packet, answers);
      expect(result.answeredCount + result.skippedCount).toBe(result.enrichments.length);
    });
  });

  describe("confidenceBoost", () => {
    it("all answered → confidenceBoost=1.0", () => {
      const packet = buildTestPacket({ intentValid: false });
      const answers: ClarificationAnswer[] = packet.questions.map((q) => ({
        questionId: q.questionId,
        answer: "yes",
      }));
      const result = contract.refine(packet, answers);
      expect(result.confidenceBoost).toBe(1);
    });

    it("none answered with questions → confidenceBoost=0", () => {
      const packet = buildTestPacket({ intentValid: false });
      const result = contract.refine(packet, []);
      expect(result.confidenceBoost).toBe(0);
    });

    it("half answered → confidenceBoost=0.5", () => {
      const packet = buildTestPacket({ intentValid: false, retrievalEmpty: true });
      const answers: ClarificationAnswer[] = [
        { questionId: packet.questions[0].questionId, answer: "yes" },
      ];
      const result = contract.refine(packet, answers);
      expect(result.confidenceBoost).toBe(0.5);
    });

    it("no questions → confidenceBoost=0", () => {
      const packet = buildTestPacket(); // all clear, 0 questions
      const result = contract.refine(packet, []);
      expect(result.confidenceBoost).toBe(0);
    });
  });

  describe("output fields", () => {
    it("sourcePacketId = packet.packetId", () => {
      const packet = buildTestPacket();
      expect(contract.refine(packet, []).sourcePacketId).toBe(packet.packetId);
    });

    it("originalRequestId = packet.sourceRequestId", () => {
      const packet = buildPacket({}, "req-orig-42");
      expect(contract.refine(packet, []).originalRequestId).toBe("req-orig-42");
    });

    it("createdAt = injected now()", () => {
      const packet = buildTestPacket();
      expect(contract.refine(packet, []).createdAt).toBe(FIXED_NOW);
    });

    it("refinedId is truthy", () => {
      const packet = buildTestPacket();
      expect(contract.refine(packet, []).refinedId.length).toBeGreaterThan(0);
    });
  });

  it("custom scoreConfidence override respected", () => {
    const customContract = new ClarificationRefinementContract({
      now: fixedNow,
      scoreConfidence: () => 0.99,
    });
    const packet = buildTestPacket({ intentValid: false });
    const result = customContract.refine(packet, []);
    expect(result.confidenceBoost).toBe(0.99);
  });

  it("factory createClarificationRefinementContract returns working instance", () => {
    const c = createClarificationRefinementContract({ now: fixedNow });
    const packet = buildTestPacket();
    const result = c.refine(packet, []);
    expect(result.createdAt).toBe(FIXED_NOW);
    expect(result.confidenceBoost).toBe(0);
  });
});
