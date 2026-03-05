/**
 * CVF Phase Manager
 * Controls execution lifecycle.
 * No phase transition without governance approval.
 */

import { GovernanceKernel, GovernanceContext } from "../core/governance.kernel";

export type CVFPhase =
  | "INTENT_ANALYSIS"
  | "SKILL_DISCOVERY"
  | "RISK_EVALUATION"
  | "GOVERNANCE_DECISION"
  | "EXECUTION"
  | "LEDGER_RECORD";

export interface PhaseState {
  current: CVFPhase;
  history: CVFPhase[];
}

export class PhaseManager {
  private state: PhaseState = {
    current: "INTENT_ANALYSIS",
    history: []
  };

  getCurrentPhase(): CVFPhase {
    return this.state.current;
  }

  /**
   * Transition to next phase.
   * Requires governance context for phases after RISK_EVALUATION.
   * CVF Rule: No phase transition without governance approval.
   */
  transition(next: CVFPhase, context?: GovernanceContext): void {
    const governanceRequiredPhases: CVFPhase[] = ["GOVERNANCE_DECISION", "EXECUTION", "LEDGER_RECORD"];
    if (governanceRequiredPhases.includes(next)) {
      if (!context) {
        throw new Error(`CVF Governance Gate: Phase '${next}' requires GovernanceContext.`);
      }
      const decision = GovernanceKernel.evaluate(context);
      if (decision !== "APPROVED") {
        throw new Error(`CVF Governance Gate: Transition to '${next}' REJECTED by GovernanceKernel. Decision: ${decision}`);
      }
    }
    this.state.history.push(this.state.current);
    this.state.current = next;
  }

  getHistory(): CVFPhase[] {
    return this.state.history;
  }

  reset(): void {
    this.state = {
      current: "INTENT_ANALYSIS",
      history: []
    };
  }
}
