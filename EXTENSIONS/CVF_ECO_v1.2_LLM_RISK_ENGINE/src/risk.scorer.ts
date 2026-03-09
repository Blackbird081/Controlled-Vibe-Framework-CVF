import {
  ActionContext,
  BaseRiskScore,
  RiskLevel,
  RiskDomain,
} from "./types";

const DOMAIN_BASE_RISK: Record<RiskDomain, number> = {
  infrastructure: 0.8,
  code_security: 0.75,
  finance: 0.6,
  privacy: 0.6,
  data: 0.5,
  communication: 0.3,
  general: 0.1,
};

const HIGH_RISK_ACTIONS: Record<string, number> = {
  execute: 0.3,
  delete: 0.3,
  drop: 0.3,
  terminate: 0.3,
  withdraw: 0.25,
  transfer: 0.2,
  deploy: 0.2,
  install: 0.2,
  export: 0.15,
  share: 0.15,
  send: 0.1,
  modify: 0.1,
  write: 0.1,
  create: 0.05,
  read: 0.0,
  analyze: 0.0,
  summarize: 0.0,
};

const SCOPE_MULTIPLIER: Record<string, number> = {
  external: 1.3,
  unknown: 1.1,
  internal: 1.0,
};

const DATA_CLASS_BONUS: Record<string, number> = {
  restricted: 0.3,
  confidential: 0.2,
  internal: 0.1,
  public: 0.0,
};

function scoreToLevel(score: number): RiskLevel {
  if (score >= 0.75) return "R3";
  if (score >= 0.5) return "R2";
  if (score >= 0.25) return "R1";
  return "R0";
}

export class RiskScorer {
  score(context: ActionContext): BaseRiskScore {
    const factors: string[] = [];
    let numericScore = 0;

    const domainBase = DOMAIN_BASE_RISK[context.domain] ?? 0.1;
    numericScore += domainBase * 0.7;
    factors.push(`domain:${context.domain}(${(domainBase * 0.7).toFixed(2)})`);

    const actionBonus = this.getActionRisk(context.action);
    numericScore += actionBonus;
    if (actionBonus > 0) {
      factors.push(`action:${context.action}(+${actionBonus.toFixed(2)})`);
    }

    const scopeMult = SCOPE_MULTIPLIER[context.targetScope] ?? 1.0;
    if (scopeMult > 1.0) {
      numericScore *= scopeMult;
      factors.push(`scope:${context.targetScope}(x${scopeMult})`);
    }

    if (context.dataClassification) {
      const dataBonus = DATA_CLASS_BONUS[context.dataClassification] ?? 0;
      if (dataBonus > 0) {
        numericScore += dataBonus;
        factors.push(`data:${context.dataClassification}(+${dataBonus.toFixed(2)})`);
      }
    }

    if (context.amount !== undefined) {
      const amountBonus = this.getAmountRisk(context.amount);
      if (amountBonus > 0) {
        numericScore += amountBonus;
        factors.push(`amount:${context.amount}(+${amountBonus.toFixed(2)})`);
      }
    }

    numericScore = Math.min(numericScore, 1.0);

    return {
      level: scoreToLevel(numericScore),
      numericScore,
      domain: context.domain,
      action: context.action,
      factors,
    };
  }

  private getActionRisk(action: string): number {
    const lower = action.toLowerCase();
    for (const [key, value] of Object.entries(HIGH_RISK_ACTIONS)) {
      if (lower.includes(key)) return value;
    }
    return 0.05;
  }

  private getAmountRisk(amount: number): number {
    if (amount >= 10000) return 0.2;
    if (amount >= 1000) return 0.1;
    if (amount >= 100) return 0.05;
    return 0;
  }
}

export { scoreToLevel };
