import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { ReversePromptPacket, QuestionPriority } from "./reverse.prompting.contract";
import { ReversePromptingContract } from "./reverse.prompting.contract";
import type { ControlPlaneIntakeResult } from "./intake.contract";

// --- Types ---

export type DominantQuestionPriority = QuestionPriority | "NONE";

export interface ReversePromptingBatchResult {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalPackets: number;
  totalQuestions: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  dominantPriority: DominantQuestionPriority;
  results: ReversePromptPacket[];
}

export interface ReversePromptingBatchContractDependencies {
  now?: () => string;
}

// --- Dominant Priority Resolution ---

/*
 * Resolves the dominant QuestionPriority by highest question count across all packets.
 * Tie-breaking precedence: "high" > "medium" > "low"
 * Returns "NONE" when batch is empty (no questions across all packets).
 *
 * Precedence reflects clarification urgency:
 *   "high"   — critical signal gap; must address before proceeding
 *   "medium" — elevated gap; should address before proceeding
 *   "low"    — minor gap; can proceed but improvement recommended
 */
const PRIORITY_ORDER: QuestionPriority[] = ["high", "medium", "low"];

function resolveDominantPriority(
  highCount: number,
  mediumCount: number,
  lowCount: number,
): DominantQuestionPriority {
  const total = highCount + mediumCount + lowCount;
  if (total === 0) return "NONE";

  const counts: Record<QuestionPriority, number> = {
    high: highCount,
    medium: mediumCount,
    low: lowCount,
  };

  let dominant: QuestionPriority = "low";
  let maxCount = -1;
  for (const priority of PRIORITY_ORDER) {
    if (counts[priority] > maxCount) {
      maxCount = counts[priority];
      dominant = priority;
    }
  }

  return dominant;
}

// --- Contract ---

export class ReversePromptingBatchContract {
  private readonly now: () => string;

  constructor(dependencies: ReversePromptingBatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    intakeResults: ControlPlaneIntakeResult[],
    contract: ReversePromptingContract,
  ): ReversePromptingBatchResult {
    const createdAt = this.now();
    const results: ReversePromptPacket[] = [];

    for (const intakeResult of intakeResults) {
      results.push(contract.generate(intakeResult));
    }

    const totalQuestions = results.reduce((sum, r) => sum + r.totalQuestions, 0);
    const highCount = results.reduce(
      (sum, r) => sum + r.questions.filter((q) => q.priority === "high").length,
      0,
    );
    const mediumCount = results.reduce(
      (sum, r) => sum + r.questions.filter((q) => q.priority === "medium").length,
      0,
    );
    const lowCount = results.reduce(
      (sum, r) => sum + r.questions.filter((q) => q.priority === "low").length,
      0,
    );

    const dominantPriority = resolveDominantPriority(highCount, mediumCount, lowCount);

    const batchHash = computeDeterministicHash(
      "w28-t1-cp1-reverse-prompting-batch",
      ...results.map((r) => r.packetId),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w28-t1-cp1-reverse-prompting-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalPackets: results.length,
      totalQuestions,
      highCount,
      mediumCount,
      lowCount,
      dominantPriority,
      results,
    };
  }
}

export function createReversePromptingBatchContract(
  dependencies?: ReversePromptingBatchContractDependencies,
): ReversePromptingBatchContract {
  return new ReversePromptingBatchContract(dependencies);
}
