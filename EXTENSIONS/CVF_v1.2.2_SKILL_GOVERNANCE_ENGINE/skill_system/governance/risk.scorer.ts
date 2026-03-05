export class RiskScorer {

  static compute(skill: any): number {

    const base = skill.risk_profile?.base_score ?? 0;

    let factorWeight = 0;

    if (skill.risk_profile?.factors?.includes("data_access"))
      factorWeight += 20;

    if (skill.risk_profile?.factors?.includes("external_dependency"))
      factorWeight += 15;

    if (skill.risk_profile?.factors?.includes("code_execution"))
      factorWeight += 25;

    if (skill.risk_profile?.factors?.includes("cost_impact"))
      factorWeight += 10;

    const total = base + factorWeight;

    return total > 100 ? 100 : total;
  }
}