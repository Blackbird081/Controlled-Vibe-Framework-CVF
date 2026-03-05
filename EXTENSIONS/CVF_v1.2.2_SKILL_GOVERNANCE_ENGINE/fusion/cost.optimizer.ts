import { HistoricalScore } from "./historical.weight";

export interface CostAdjustedScore extends HistoricalScore {
  final_score: number;
}

export class CostOptimizer {
  optimize(
    scores: HistoricalScore[],
    estimatedCost: number
  ): CostAdjustedScore[] {
    return scores.map(entry => {
      const costPenalty = estimatedCost > 3000 ? 20 : 0;

      return {
        ...entry,
        final_score: entry.historical_score - costPenalty
      };
    }).sort((a, b) => b.final_score - a.final_score);
  }
}