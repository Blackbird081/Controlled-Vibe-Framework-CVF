import { AgentAction, RiskLevel } from "./types";

const DOMAIN_BASE_RISK: Record<string, number> = {
  infrastructure: 0.8,
  code_security: 0.75,
  finance: 0.6,
  privacy: 0.55,
  communication: 0.3,
  data: 0.4,
  general: 0.1,
};

const ACTION_RISK: Record<string, number> = {
  execute: 0.3, deploy: 0.2, delete: 0.25, withdraw: 0.25,
  transfer: 0.2, send: 0.1, export: 0.15, write: 0.1,
  modify: 0.1, create: 0.05, read: 0.0, list: 0.0, install: 0.15,
};

function scoreToLevel(score: number): RiskLevel {
  if (score >= 0.75) return "R3";
  if (score >= 0.5) return "R2";
  if (score >= 0.25) return "R1";
  return "R0";
}

export interface RiskResult {
  score: number;
  level: RiskLevel;
  factors: string[];
}

export class RiskModule {
  evaluate(action: AgentAction): RiskResult {
    const factors: string[] = [];
    let score = 0;

    const domainBase = DOMAIN_BASE_RISK[action.domain] ?? 0.1;
    score += domainBase * 0.7;
    factors.push(`domain:${action.domain}(${(domainBase * 0.7).toFixed(2)})`);

    const actionBonus = ACTION_RISK[action.action] ?? 0.05;
    score += actionBonus;
    if (actionBonus > 0) {
      factors.push(`action:${action.action}(+${actionBonus.toFixed(2)})`);
    }

    const amount = (action.params.amount as number) ?? 0;
    if (amount > 10000) {
      score += 0.15;
      factors.push("amount:high(+0.15)");
    } else if (amount > 1000) {
      score += 0.08;
      factors.push("amount:medium(+0.08)");
    }

    score = Math.min(score, 1.0);

    return { score, level: scoreToLevel(score), factors };
  }
}
