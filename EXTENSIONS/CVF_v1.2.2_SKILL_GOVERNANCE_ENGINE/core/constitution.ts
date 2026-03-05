/**
 * CVF Constitution
 * Sovereign governance layer of the entire system.
 * No component may override this layer.
 */

export type GovernanceDecision =
  | "APPROVED"
  | "REJECTED"
  | "REVIEW_REQUIRED";

export interface ConstitutionRule {
  id: string;
  description: string;
  enforcementLevel: "STRICT" | "MODERATE" | "ADVISORY";
}

export class Constitution {
  private static rules: ConstitutionRule[] = [
    {
      id: "CVF-001",
      description: "No skill may execute without governance approval.",
      enforcementLevel: "STRICT",
    },
    {
      id: "CVF-002",
      description: "Dynamic skills must pass probation before approval.",
      enforcementLevel: "STRICT",
    },
    {
      id: "CVF-003",
      description: "Risk score must be evaluated before execution.",
      enforcementLevel: "STRICT",
    },
    {
      id: "CVF-004",
      description: "External skills must pass integrity verification.",
      enforcementLevel: "STRICT",
    },
    {
      id: "CVF-005",
      description: "All executions must be logged in Internal Ledger.",
      enforcementLevel: "STRICT",
    }
  ];

  static getRules(): ConstitutionRule[] {
    return this.rules;
  }

  static evaluate(condition: boolean): GovernanceDecision {
    if (condition) return "APPROVED";
    return "REJECTED";
  }
}