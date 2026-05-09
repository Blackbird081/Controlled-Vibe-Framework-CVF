export class FinalSelector {

  static select(candidates: any[]): any | null {

    if (!candidates || candidates.length === 0) return null;

    const scored = candidates.map(c => {
      const total =
        (c.semanticScore || 0) * 0.4 +
        (c.historicalScore || 0) * 0.3 +
        (c.costScore || 0) * 0.3;

      return { ...c, totalScore: total };
    });

    scored.sort((a, b) => b.totalScore - a.totalScore);

    return scored[0];
  }
}