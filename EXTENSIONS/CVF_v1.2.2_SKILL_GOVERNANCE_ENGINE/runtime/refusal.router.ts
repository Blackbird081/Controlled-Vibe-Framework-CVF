export type RefusalReason =
  | "risk_exceeded"
  | "policy_violation"
  | "deprecated_skill"
  | "revoked_skill"
  | "cost_limit";

export class RefusalRouter {
  route(reason: RefusalReason): string {
    switch (reason) {
      case "risk_exceeded":
        return "Execution refused: Risk threshold exceeded.";
      case "policy_violation":
        return "Execution refused: Policy violation.";
      case "deprecated_skill":
        return "Execution refused: Skill deprecated.";
      case "revoked_skill":
        return "Execution refused: Skill revoked.";
      case "cost_limit":
        return "Execution refused: Cost limit exceeded.";
      default:
        return "Execution refused.";
    }
  }
}
