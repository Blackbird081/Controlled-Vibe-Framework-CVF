/**
 * Runtime Orchestrator
 * Coordinates entire CVF flow.
 * Enforces phase progression strictly.
 */

import { PhaseManager } from "./phase.manager";
import { GovernanceKernel, GovernanceContext } from "./governance.kernel";
import { GovernanceDecision } from "./constitution";

export class RuntimeOrchestrator {
  private phaseManager = new PhaseManager();

  async execute(context: GovernanceContext): Promise<GovernanceDecision> {

    // Phase 1: Skill Discovery
    this.phaseManager.transition("SKILL_DISCOVERY");

    // Phase 2: Risk Evaluation
    this.phaseManager.transition("RISK_EVALUATION");

    // Phase 3: Governance Decision
    this.phaseManager.transition("GOVERNANCE_DECISION");
    const decision = GovernanceKernel.evaluate(context);

    if (decision !== "APPROVED") {
      return decision;
    }

    // Phase 4: Execution
    this.phaseManager.transition("EXECUTION");

    // Phase 5: Ledger Record
    this.phaseManager.transition("LEDGER_RECORD");

    return decision;
  }

  getCurrentPhase() {
    return this.phaseManager.getCurrentPhase();
  }

  getHistory() {
    return this.phaseManager.getHistory();
  }
}