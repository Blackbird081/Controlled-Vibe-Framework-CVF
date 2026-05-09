import { GovernanceRule, RuntimeConstraint, EnforcementLevel } from "./types";

let constraintCounter = 0;

function nextConstraintId(): string {
  constraintCounter++;
  return `RC-${String(constraintCounter).padStart(4, "0")}`;
}

export function resetConstraintCounter(): void {
  constraintCounter = 0;
}

type ConstraintType = RuntimeConstraint["type"];

const PARAMETER_TO_CONSTRAINT_TYPE: Record<string, ConstraintType> = {
  max_per_day: "threshold",
  max_per_hour: "threshold",
  max_per_minute: "threshold",
  max_per_week: "threshold",
  max_per_month: "threshold",
  max_per_year: "threshold",
  max_amount: "threshold",
  max_count: "rate_limit",
  approval_type: "approval_gate",
  allowed_domains: "whitelist",
  blocked_domains: "blacklist",
};

export class ConstraintGenerator {
  generate(rules: GovernanceRule[]): RuntimeConstraint[] {
    const constraints: RuntimeConstraint[] = [];

    for (const rule of rules) {
      constraints.push(...this.ruleToConstraints(rule));
    }

    return constraints;
  }

  private ruleToConstraints(rule: GovernanceRule): RuntimeConstraint[] {
    const constraints: RuntimeConstraint[] = [];

    for (const [key, value] of Object.entries(rule.parameters)) {
      if (key === "action" || key === "object") continue;

      const type = PARAMETER_TO_CONSTRAINT_TYPE[key] ?? this.inferType(key, value);

      constraints.push({
        constraintId: nextConstraintId(),
        ruleId: rule.id,
        type,
        field: key,
        value,
        enforcement: rule.enforcement,
        injectable: this.isInjectable(type, rule.enforcement),
      });
    }

    if (constraints.length === 0) {
      constraints.push({
        constraintId: nextConstraintId(),
        ruleId: rule.id,
        type: "approval_gate",
        field: "governance_check",
        value: true,
        enforcement: rule.enforcement,
        injectable: true,
      });
    }

    return constraints;
  }

  private inferType(key: string, value: unknown): ConstraintType {
    if (typeof value === "number") return "threshold";
    if (Array.isArray(value)) {
      return key.includes("block") ? "blacklist" : "whitelist";
    }
    if (typeof value === "boolean") return "approval_gate";
    return "threshold";
  }

  private isInjectable(type: ConstraintType, enforcement: EnforcementLevel): boolean {
    if (enforcement === "HARD_BLOCK") return true;
    if (type === "threshold" || type === "rate_limit") return true;
    if (type === "whitelist" || type === "blacklist") return true;
    return false;
  }
}
