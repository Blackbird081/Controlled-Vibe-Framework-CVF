export class CostOptimizer {

  static apply(candidates: any[]): any[] {

    return candidates.map(c => {
      const cost = c.metadata?.cost_profile?.estimated_tokens || 0;
      const runtime = c.metadata?.cost_profile?.estimated_runtime_ms || 0;

      const costScore = 100 - Math.min(cost / 100, 50) - Math.min(runtime / 100, 50);

      return {
        ...c,
        costScore
      };
    });
  }
}