import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { TruthScore, TruthScoreClass } from "./truth.score.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TruthScoreLog {
  logId: string;
  createdAt: string;
  totalScores: number;
  averageComposite: number;  // rounded to 2 dp; 0 for empty
  minComposite: number;
  maxComposite: number;
  dominantClass: TruthScoreClass;
  strongCount: number;
  adequateCount: number;
  weakCount: number;
  insufficientCount: number;
  summary: string;
  logHash: string;
}

export interface TruthScoreLogContractDependencies {
  now?: () => string;
}

// ─── Dominant class logic ─────────────────────────────────────────────────────
// Severity-first: INSUFFICIENT > WEAK > ADEQUATE > STRONG
// (worst class present dominates — a single INSUFFICIENT drags the log down)

const CLASS_PRIORITY: TruthScoreClass[] = [
  "INSUFFICIENT",
  "WEAK",
  "ADEQUATE",
  "STRONG",
];

function computeDominantClass(scores: TruthScore[]): TruthScoreClass {
  if (scores.length === 0) return "INSUFFICIENT";
  const classSet = new Set(scores.map((s) => s.scoreClass));
  for (const cls of CLASS_PRIORITY) {
    if (classSet.has(cls)) return cls;
  }
  return "INSUFFICIENT";
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * TruthScoreLogContract (W6-T8)
 * ------------------------------
 * Aggregates a batch of TruthScore records into a single log entry.
 * Dominant class uses severity-first ordering: INSUFFICIENT > WEAK > ADEQUATE > STRONG.
 */
export class TruthScoreLogContract {
  private readonly now: () => string;

  constructor(dependencies: TruthScoreLogContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  log(scores: TruthScore[]): TruthScoreLog {
    const createdAt = this.now();
    const totalScores = scores.length;

    const strongCount      = scores.filter((s) => s.scoreClass === "STRONG").length;
    const adequateCount    = scores.filter((s) => s.scoreClass === "ADEQUATE").length;
    const weakCount        = scores.filter((s) => s.scoreClass === "WEAK").length;
    const insufficientCount = scores.filter((s) => s.scoreClass === "INSUFFICIENT").length;

    const composites = scores.map((s) => s.compositeScore);
    const averageComposite =
      totalScores === 0
        ? 0
        : Math.round((composites.reduce((a, b) => a + b, 0) / totalScores) * 100) / 100;
    const minComposite = totalScores === 0 ? 0 : Math.min(...composites);
    const maxComposite = totalScores === 0 ? 0 : Math.max(...composites);

    const dominantClass = computeDominantClass(scores);

    const summary =
      totalScores === 0
        ? "No truth scores recorded."
        : `${totalScores} score(s): strong=${strongCount}, adequate=${adequateCount}, ` +
          `weak=${weakCount}, insufficient=${insufficientCount}. ` +
          `avg=${averageComposite}, min=${minComposite}, max=${maxComposite}. ` +
          `DominantClass=${dominantClass}.`;

    const logHash = computeDeterministicHash(
      "w6-t8-cp2-truth-score-log",
      `${createdAt}:total=${totalScores}`,
      `avg=${averageComposite}:min=${minComposite}:max=${maxComposite}`,
      `dominant=${dominantClass}`,
    );

    const logId = computeDeterministicHash(
      "w6-t8-cp2-log-id",
      logHash,
      createdAt,
    );

    return {
      logId,
      createdAt,
      totalScores,
      averageComposite,
      minComposite,
      maxComposite,
      dominantClass,
      strongCount,
      adequateCount,
      weakCount,
      insufficientCount,
      summary,
      logHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createTruthScoreLogContract(
  dependencies?: TruthScoreLogContractDependencies,
): TruthScoreLogContract {
  return new TruthScoreLogContract(dependencies);
}
