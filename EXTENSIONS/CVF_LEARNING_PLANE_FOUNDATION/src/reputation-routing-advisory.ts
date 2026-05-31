import type { ReputationSignal, ReputationClass } from "./reputation.signal.contract.js";

export const REPUTATION_ROUTING_ADVISORY_VERSION =
  "cvf.reputationRoutingAdvisory.rm1.v1";

/**
 * Routing disposition derived from ReputationClass.
 *
 *   PROCEED — agent is TRUSTED or RELIABLE; routing proceeds normally
 *   CAUTION — agent is PROVISIONAL; routing proceeds with monitoring advisory
 *   DEFER   — agent is UNTRUSTED; routing should defer to alternative or escalate
 *
 * DEFER is advisory only — it does not block execution. Per LHW17 T3, reputation
 * score feeds as advisory signal, not a hard gate, until calibration is stable.
 */
export type RoutingDisposition = "PROCEED" | "CAUTION" | "DEFER";

export interface RoutingAdvisoryResult {
  contractVersion: typeof REPUTATION_ROUTING_ADVISORY_VERSION;
  agentId: string;
  reputationClass: ReputationClass;
  compositeReputationScore: number;
  disposition: RoutingDisposition;
  /** True if R2 governance review is recommended (degradation detected) */
  r2ReviewRecommended: boolean;
  advisoryNote: string;
  /** Always false — advisory signal only, not a hard routing gate */
  runtimeRoutingAuthorized: false;
}

function deriveDisposition(reputationClass: ReputationClass): RoutingDisposition {
  switch (reputationClass) {
    case "TRUSTED":
    case "RELIABLE":
      return "PROCEED";
    case "PROVISIONAL":
      return "CAUTION";
    case "UNTRUSTED":
      return "DEFER";
  }
}

/**
 * Returns a routing advisory based on the agent's ReputationSignal.
 *
 * Per LHW17 T3 advisory:
 * - TRUSTED/RELIABLE → PROCEED (full task allocation eligible)
 * - PROVISIONAL → CAUTION (limited allocation, monitoring recommended)
 * - UNTRUSTED → DEFER (prefer alternative provider; trigger R2 review)
 *
 * Reputation degradation (score drop below RELIABLE threshold) recommends
 * an R2-level governance review — not automatic capability reduction.
 */
export function computeRoutingAdvisory(
  signal: ReputationSignal,
): RoutingAdvisoryResult {
  const disposition = deriveDisposition(signal.reputationClass);
  const r2ReviewRecommended =
    signal.reputationClass === "PROVISIONAL" ||
    signal.reputationClass === "UNTRUSTED";

  const advisoryNote = buildAdvisoryNote(signal, disposition, r2ReviewRecommended);

  return {
    contractVersion: REPUTATION_ROUTING_ADVISORY_VERSION,
    agentId: signal.agentId,
    reputationClass: signal.reputationClass,
    compositeReputationScore: signal.compositeReputationScore,
    disposition,
    r2ReviewRecommended,
    advisoryNote,
    runtimeRoutingAuthorized: false,
  };
}

function buildAdvisoryNote(
  signal: ReputationSignal,
  disposition: RoutingDisposition,
  r2: boolean,
): string {
  const base =
    `Agent ${signal.agentId}: ReputationScore=${signal.compositeReputationScore}/100` +
    ` (${signal.reputationClass}) → ${disposition}.`;
  const review = r2
    ? " R2 governance review recommended before next task allocation."
    : "";
  const guard =
    disposition === "DEFER"
      ? " Prefer alternative provider or escalate to operator. Advisory only — does not block execution."
      : disposition === "CAUTION"
      ? " Proceed with monitoring. Limited task scope recommended."
      : " Full task allocation eligible.";
  return base + guard + review;
}
