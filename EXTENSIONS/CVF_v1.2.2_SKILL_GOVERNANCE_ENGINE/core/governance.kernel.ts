/**
 * Governance Kernel
 * Central decision engine of CVF.
 * Integrates Constitution + Risk + Skill Validation.
 */

import { Constitution, GovernanceDecision } from "./constitution";

export interface GovernanceContext {
  riskScore: number;
  skillVerified: boolean;
  integrityPassed: boolean;
}

export class GovernanceKernel {

  static evaluate(context: GovernanceContext): GovernanceDecision {

    // Rule 1: Risk threshold
    if (context.riskScore > 70) {
      return "REJECTED";
    }

    // Rule 2: Skill verification
    if (!context.skillVerified) {
      return "REJECTED";
    }

    // Rule 3: Integrity check
    if (!context.integrityPassed) {
      return "REJECTED";
    }

    return Constitution.evaluate(true);
  }
}