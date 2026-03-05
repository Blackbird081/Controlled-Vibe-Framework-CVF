// risk.scoring.hook.ts

import { RiskLevel } from "../policy/risk.threshold.policy";

export interface RiskScoringContext {

  scope_size: number;

  external_dependencies: number;

  accesses_filesystem: boolean;

  accesses_network: boolean;

  domain_sensitivity_score: number; // 1-5

}

export interface RiskScoringResult {

  risk_score: number;

  risk_level: RiskLevel;

}

export class RiskScoringHook {

  static evaluate(ctx: RiskScoringContext): RiskScoringResult {

    let score = 0;

    score += ctx.scope_size * 0.5;
    score += ctx.external_dependencies * 1.5;

    if (ctx.accesses_filesystem) score += 3;
    if (ctx.accesses_network) score += 3;

    score += ctx.domain_sensitivity_score * 2;

    let level: RiskLevel;

    if (score < 5) level = "low";
    else if (score < 10) level = "medium";
    else if (score < 18) level = "high";
    else level = "critical";

    return {
      risk_score: score,
      risk_level: level
    };
  }

}