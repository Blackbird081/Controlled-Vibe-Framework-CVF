import { CostAdjustedScore } from "./cost.optimizer";

export class FinalSelector {
  select(
    scores: CostAdjustedScore[],
    riskThreshold: number,
    currentRiskScore: number
  ) {
    if (currentRiskScore > riskThreshold) {
      throw new Error("Risk threshold exceeded");
    }

    if (scores.length === 0) {
      throw new Error("No suitable skill found");
    }

    return scores[0].skill;
  }
}