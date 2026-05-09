export interface DistilledPattern {
  intentCluster: string;
  recommendedSkill: string;
}

export class PatternDistiller {

  static distill(insights: any[]): DistilledPattern[] {

    return insights
      .filter(i => i.successRate > 0.85)
      .map(i => ({
        intentCluster: `cluster_${i.skillId}`,
        recommendedSkill: i.skillId
      }));
  }

}