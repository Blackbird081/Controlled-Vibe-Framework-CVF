import type { ConsensusDecision, ConsensusVerdict } from "./governance.consensus.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export interface GovernanceConsensusSummary {
  summaryId: string;
  createdAt: string;
  totalDecisions: number;
  proceedCount: number;
  pauseCount: number;
  escalateCount: number;
  dominantVerdict: ConsensusVerdict;
  summaryHash: string;
}

export interface GovernanceConsensusSummaryContractDependencies {
  now?: () => string;
}

// --- Dominant Verdict ---
// frequency-first; ties: ESCALATE > PAUSE > PROCEED

function deriveDominantVerdict(
  escalateCount: number,
  pauseCount: number,
  proceedCount: number,
): ConsensusVerdict {
  if (escalateCount >= pauseCount && escalateCount >= proceedCount) return "ESCALATE";
  if (pauseCount >= proceedCount) return "PAUSE";
  return "PROCEED";
}

// --- Contract ---

export class GovernanceConsensusSummaryContract {
  private readonly now: () => string;

  constructor(dependencies: GovernanceConsensusSummaryContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  summarize(decisions: ConsensusDecision[]): GovernanceConsensusSummary {
    const createdAt = this.now();
    const totalDecisions = decisions.length;

    let proceedCount = 0;
    let pauseCount = 0;
    let escalateCount = 0;

    for (const decision of decisions) {
      if (decision.verdict === "PROCEED") proceedCount++;
      else if (decision.verdict === "PAUSE") pauseCount++;
      else if (decision.verdict === "ESCALATE") escalateCount++;
    }

    const dominantVerdict = deriveDominantVerdict(escalateCount, pauseCount, proceedCount);

    const summaryHash = computeDeterministicHash(
      "w3-t4-cp2-consensus-summary",
      `${createdAt}:decisions:${totalDecisions}`,
      `proceed:${proceedCount}:pause:${pauseCount}:escalate:${escalateCount}`,
    );

    const summaryId = computeDeterministicHash(
      "w3-t4-cp2-summary-id",
      summaryHash,
      createdAt,
    );

    return {
      summaryId,
      createdAt,
      totalDecisions,
      proceedCount,
      pauseCount,
      escalateCount,
      dominantVerdict,
      summaryHash,
    };
  }
}

export function createGovernanceConsensusSummaryContract(
  dependencies?: GovernanceConsensusSummaryContractDependencies,
): GovernanceConsensusSummaryContract {
  return new GovernanceConsensusSummaryContract(dependencies);
}
