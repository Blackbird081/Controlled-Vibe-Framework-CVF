import type { ReversePromptPacket, QuestionCategory } from "./reverse.prompting.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export interface ClarificationAnswer {
  questionId: string;
  answer: string;
}

export interface RefinementEnrichment {
  category: QuestionCategory;
  questionId: string;
  answer: string;
  applied: boolean;
}

export interface RefinedIntakeRequest {
  refinedId: string;
  createdAt: string;
  sourcePacketId: string;
  originalRequestId: string;
  enrichments: RefinementEnrichment[];
  answeredCount: number;
  skippedCount: number;
  confidenceBoost: number;
}

export interface ClarificationRefinementContractDependencies {
  scoreConfidence?: (
    answered: number,
    total: number,
  ) => number;
  now?: () => string;
}

// --- Confidence Scoring ---

function defaultScoreConfidence(answered: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(1, answered / total);
}

// --- Enrichment Building ---

function buildEnrichments(
  packet: ReversePromptPacket,
  answers: ClarificationAnswer[],
): RefinementEnrichment[] {
  const answerMap = new Map(answers.map((a) => [a.questionId, a.answer]));

  return packet.questions.map((q) => {
    const answer = answerMap.get(q.questionId);
    const applied =
      typeof answer === "string" && answer.trim().length > 0;

    return {
      category: q.category,
      questionId: q.questionId,
      answer: applied ? answer!.trim() : "",
      applied,
    };
  });
}

// --- Contract ---

export class ClarificationRefinementContract {
  private readonly scoreConfidence: (answered: number, total: number) => number;
  private readonly now: () => string;

  constructor(
    dependencies: ClarificationRefinementContractDependencies = {},
  ) {
    this.scoreConfidence =
      dependencies.scoreConfidence ?? defaultScoreConfidence;
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  refine(
    packet: ReversePromptPacket,
    answers: ClarificationAnswer[],
  ): RefinedIntakeRequest {
    const createdAt = this.now();
    const enrichments = buildEnrichments(packet, answers);
    const answeredCount = enrichments.filter((e) => e.applied).length;
    const skippedCount = enrichments.length - answeredCount;
    const confidenceBoost = this.scoreConfidence(
      answeredCount,
      packet.totalQuestions,
    );

    const refinedId = computeDeterministicHash(
      "w1-t5-cp2-refinement",
      `${createdAt}:${packet.packetId}`,
      `answered:${answeredCount}:skipped:${skippedCount}`,
    );

    return {
      refinedId,
      createdAt,
      sourcePacketId: packet.packetId,
      originalRequestId: packet.sourceRequestId,
      enrichments,
      answeredCount,
      skippedCount,
      confidenceBoost,
    };
  }
}

export function createClarificationRefinementContract(
  dependencies?: ClarificationRefinementContractDependencies,
): ClarificationRefinementContract {
  return new ClarificationRefinementContract(dependencies);
}
