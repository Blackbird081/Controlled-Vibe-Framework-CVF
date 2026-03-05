export class SemanticRank {

  static score(intent: string, skillDescription: string): number {
    const intentTokens = intent.toLowerCase().split(" ");
    const descTokens = skillDescription.toLowerCase();

    let score = 0;

    for (const token of intentTokens) {
      if (descTokens.includes(token)) {
        score += 10;
      }
    }

    return score;
  }

  static rank(intent: string, candidates: any[]): any[] {
    return candidates
      .map(c => ({
        ...c,
        semanticScore: this.score(intent, c.metadata.description || "")
      }))
      .sort((a, b) => b.semanticScore - a.semanticScore);
  }
}