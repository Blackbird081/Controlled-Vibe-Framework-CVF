import { SemanticScore } from "./semantic.rank";

export interface HistoricalScore extends SemanticScore {
  historical_score: number;
}

export class HistoricalWeight {
  apply(scores: SemanticScore[]): HistoricalScore[] {
    return scores.map(entry => {
      let maturityBonus = 0;

      switch (entry.skill.maturity) {
        case "production":
          maturityBonus = 30;
          break;
        case "validated":
          maturityBonus = 15;
          break;
      }

      const usageBonus = entry.skill.usage_count;

      return {
        ...entry,
        historical_score:
          entry.semantic_score + maturityBonus + usageBonus
      };
    }).sort((a, b) => b.historical_score - a.historical_score);
  }
}