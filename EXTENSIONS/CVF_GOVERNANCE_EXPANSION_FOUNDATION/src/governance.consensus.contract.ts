import type { GovernanceAuditSignal } from "./governance.audit.signal.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type ConsensusVerdict = "PROCEED" | "PAUSE" | "ESCALATE";

export interface ConsensusDecision {
  decisionId: string;
  issuedAt: string;
  verdict: ConsensusVerdict;
  criticalCount: number;
  alertActiveCount: number;
  totalSignals: number;
  consensusScore: number; // (criticalCount / totalSignals) * 100, rounded 2dp; 0 for empty
  decisionHash: string;
}

export interface GovernanceConsensusContractDependencies {
  now?: () => string;
}

// --- Verdict Derivation ---
// ESCALATE if criticalCount > 0
// PAUSE if alertActiveCount > 0 (no critical)
// PROCEED otherwise (only ROUTINE or NO_ACTION)

function deriveVerdict(criticalCount: number, alertActiveCount: number): ConsensusVerdict {
  if (criticalCount > 0) return "ESCALATE";
  if (alertActiveCount > 0) return "PAUSE";
  return "PROCEED";
}

// --- Contract ---

export class GovernanceConsensusContract {
  private readonly now: () => string;

  constructor(dependencies: GovernanceConsensusContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  decide(signals: GovernanceAuditSignal[]): ConsensusDecision {
    const issuedAt = this.now();
    const totalSignals = signals.length;

    let criticalCount = 0;
    let alertActiveCount = 0;

    for (const signal of signals) {
      if (signal.auditTrigger === "CRITICAL_THRESHOLD") criticalCount++;
      else if (signal.auditTrigger === "ALERT_ACTIVE") alertActiveCount++;
    }

    const verdict = deriveVerdict(criticalCount, alertActiveCount);
    const consensusScore =
      totalSignals === 0
        ? 0
        : Math.round((criticalCount / totalSignals) * 100 * 100) / 100;

    const decisionHash = computeDeterministicHash(
      "w3-t4-cp1-consensus-decision",
      `${issuedAt}:${verdict}`,
      `signals:${totalSignals}:critical:${criticalCount}:score:${consensusScore}`,
    );

    const decisionId = computeDeterministicHash(
      "w3-t4-cp1-decision-id",
      decisionHash,
      issuedAt,
    );

    return {
      decisionId,
      issuedAt,
      verdict,
      criticalCount,
      alertActiveCount,
      totalSignals,
      consensusScore,
      decisionHash,
    };
  }
}

export function createGovernanceConsensusContract(
  dependencies?: GovernanceConsensusContractDependencies,
): GovernanceConsensusContract {
  return new GovernanceConsensusContract(dependencies);
}
