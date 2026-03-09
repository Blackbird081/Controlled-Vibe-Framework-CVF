import {
  IntentResult,
  GovernanceRule,
  EnforcementLevel,
  RiskLevel,
  Domain,
} from "./types";
import { DOMAIN_REGISTRY } from "./domain.registry";

let ruleCounter = 0;

function nextRuleId(): string {
  ruleCounter++;
  return `GR-${String(ruleCounter).padStart(4, "0")}`;
}

export function resetRuleCounter(): void {
  ruleCounter = 0;
}

const RISK_ESCALATION: Record<string, RiskLevel> = {
  hard_limit: "R3",
  max_per_day: "R2",
  max_per_hour: "R2",
  max_per_minute: "R3",
  max_amount: "R2",
  max_count: "R1",
};

const ENFORCEMENT_MAP: Record<RiskLevel, EnforcementLevel> = {
  R0: "LOG_ONLY",
  R1: "LOG_ONLY",
  R2: "HUMAN_IN_THE_LOOP",
  R3: "HARD_BLOCK",
};

export class SchemaMapper {
  mapToRules(intent: IntentResult): GovernanceRule[] {
    const rules: GovernanceRule[] = [];

    const domainDef = DOMAIN_REGISTRY.find((d) => d.domain === intent.domain);
    const baseRisk = domainDef?.defaultRisk ?? "R1";

    if (Object.keys(intent.limits).length > 0) {
      rules.push(...this.createLimitRules(intent, baseRisk));
    }

    if (intent.requireApproval) {
      rules.push(this.createApprovalRule(intent, baseRisk));
    }

    if (rules.length === 0) {
      rules.push(this.createBaselineRule(intent, baseRisk));
    }

    return rules;
  }

  private createLimitRules(
    intent: IntentResult,
    baseRisk: RiskLevel
  ): GovernanceRule[] {
    const rules: GovernanceRule[] = [];

    for (const [key, value] of Object.entries(intent.limits)) {
      if (key === "hard_limit") continue;

      const escalatedRisk = this.escalateRisk(
        baseRisk,
        RISK_ESCALATION[key] ?? baseRisk
      );

      const isHardLimit = intent.limits["hard_limit"] === true;
      const enforcement: EnforcementLevel = isHardLimit
        ? "HARD_BLOCK"
        : ENFORCEMENT_MAP[escalatedRisk];

      rules.push({
        id: nextRuleId(),
        domain: intent.domain,
        enforcement,
        condition: `${intent.action}.${key} <= ${value}`,
        parameters: { [key]: value, action: intent.action, object: intent.object },
        riskLevel: escalatedRisk,
      });
    }

    return rules;
  }

  private createApprovalRule(
    intent: IntentResult,
    baseRisk: RiskLevel
  ): GovernanceRule {
    const riskLevel = this.escalateRisk(baseRisk, "R2");

    return {
      id: nextRuleId(),
      domain: intent.domain,
      enforcement: "HUMAN_IN_THE_LOOP",
      condition: `${intent.action}.requires_approval == true`,
      parameters: {
        action: intent.action,
        object: intent.object,
        approval_type: "human_confirmation",
      },
      riskLevel,
    };
  }

  private createBaselineRule(
    intent: IntentResult,
    baseRisk: RiskLevel
  ): GovernanceRule {
    return {
      id: nextRuleId(),
      domain: intent.domain,
      enforcement: ENFORCEMENT_MAP[baseRisk],
      condition: `${intent.action}.governed == true`,
      parameters: { action: intent.action, object: intent.object },
      riskLevel: baseRisk,
    };
  }

  private escalateRisk(current: RiskLevel, candidate: RiskLevel): RiskLevel {
    const order: RiskLevel[] = ["R0", "R1", "R2", "R3"];
    const ci = order.indexOf(current);
    const ca = order.indexOf(candidate);
    return order[Math.max(ci, ca)];
  }
}
