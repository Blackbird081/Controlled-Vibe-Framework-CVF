import {
  BaseRiskScore,
  ContextModifiers,
  RiskAssessment,
  RiskLevel,
  EnforcementRecommendation,
} from "./types";
import { scoreToLevel } from "./risk.scorer";

const ENFORCEMENT_MAP: Record<RiskLevel, EnforcementRecommendation> = {
  R0: "ALLOW",
  R1: "LOG_ONLY",
  R2: "HUMAN_IN_THE_LOOP",
  R3: "HARD_BLOCK",
};

export class ContextAnalyzer {
  analyze(base: BaseRiskScore, modifiers: ContextModifiers = {}): RiskAssessment {
    let adjustedScore = base.numericScore;
    const contextMods: string[] = [];
    const reasoning: string[] = [`Base risk: ${base.level} (${base.numericScore.toFixed(2)})`];

    if (modifiers.timeOfDay === "after_hours") {
      adjustedScore *= 1.2;
      contextMods.push("after_hours(x1.2)");
      reasoning.push("After-hours activity increases risk by 20%");
    } else if (modifiers.timeOfDay === "weekend") {
      adjustedScore *= 1.15;
      contextMods.push("weekend(x1.15)");
      reasoning.push("Weekend activity increases risk by 15%");
    }

    if (modifiers.frequency !== undefined && modifiers.frequency > 10) {
      const freqBonus = Math.min((modifiers.frequency - 10) * 0.01, 0.2);
      adjustedScore += freqBonus;
      contextMods.push(`high_frequency:${modifiers.frequency}(+${freqBonus.toFixed(2)})`);
      reasoning.push(`High frequency (${modifiers.frequency}) adds ${(freqBonus * 100).toFixed(0)}% risk`);
    }

    if (modifiers.isFirstOccurrence) {
      adjustedScore *= 1.1;
      contextMods.push("first_occurrence(x1.1)");
      reasoning.push("First occurrence of this action increases caution by 10%");
    }

    if (modifiers.hasApproval) {
      adjustedScore *= 0.7;
      contextMods.push("has_approval(x0.7)");
      reasoning.push("Pre-approved action reduces risk by 30%");
    }

    if (modifiers.sessionActionCount !== undefined && modifiers.sessionActionCount > 20) {
      const sessionBonus = Math.min((modifiers.sessionActionCount - 20) * 0.005, 0.15);
      adjustedScore += sessionBonus;
      contextMods.push(`session_load:${modifiers.sessionActionCount}(+${sessionBonus.toFixed(2)})`);
      reasoning.push(`High session activity (${modifiers.sessionActionCount} actions) adds risk`);
    }

    adjustedScore = Math.min(adjustedScore, 1.0);
    const finalLevel = scoreToLevel(adjustedScore);
    const enforcement = this.determineEnforcement(finalLevel, modifiers);

    reasoning.push(`Final: ${finalLevel} (${adjustedScore.toFixed(2)}) → ${enforcement}`);

    return {
      baseScore: base,
      contextModifiers: contextMods,
      finalLevel,
      finalScore: adjustedScore,
      enforcement,
      timestamp: Date.now(),
      reasoning,
    };
  }

  private determineEnforcement(
    level: RiskLevel,
    modifiers: ContextModifiers
  ): EnforcementRecommendation {
    if (modifiers.hasApproval && level !== "R3") {
      return level === "R2" ? "LOG_ONLY" : "ALLOW";
    }
    return ENFORCEMENT_MAP[level];
  }
}
