import { ReputationTier, TIER_THRESHOLDS } from "./types";

export class ScoreCalculator {
  clamp(score: number): number {
    return Math.max(0, Math.min(100, score));
  }

  tierFromScore(score: number): ReputationTier {
    const clamped = this.clamp(score);
    if (clamped >= TIER_THRESHOLDS.exemplary) return "exemplary";
    if (clamped >= TIER_THRESHOLDS.trusted) return "trusted";
    if (clamped >= TIER_THRESHOLDS.reliable) return "reliable";
    if (clamped >= TIER_THRESHOLDS.newcomer) return "newcomer";
    return "untrusted";
  }

  successRate(successes: number, total: number): number {
    if (total === 0) return 0;
    return successes / total;
  }

  trend(recentDeltas: number[]): "improving" | "stable" | "declining" {
    if (recentDeltas.length < 2) return "stable";
    const recent = recentDeltas.slice(-5);
    const avg = recent.reduce((s, d) => s + d, 0) / recent.length;
    if (avg > 1) return "improving";
    if (avg < -1) return "declining";
    return "stable";
  }

  decay(score: number, daysSinceLastActivity: number, rate: number = 0.5): number {
    if (daysSinceLastActivity <= 7) return score;
    const weeks = Math.floor((daysSinceLastActivity - 7) / 7);
    return this.clamp(score - weeks * rate);
  }
}
