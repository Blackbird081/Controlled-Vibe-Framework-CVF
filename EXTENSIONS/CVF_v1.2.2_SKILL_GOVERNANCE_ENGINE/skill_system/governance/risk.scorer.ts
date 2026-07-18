export const SKILL_RISK_SCORER_ADAPTER_VERSION = 'phase2b-skill-risk-scorer-adapter-1'

export interface SkillRiskProfileLike {
  risk_profile?: {
    base_score?: number
    factors?: string[]
  }
}

export interface SkillRiskScorerAdapterSnapshot {
  version: typeof SKILL_RISK_SCORER_ADAPTER_VERSION
  source: 'skill-governance-engine:risk-scorer'
  baseScore: number
  factors: string[]
  score: number
}

export class RiskScorer {

  static compute(skill: SkillRiskProfileLike): number {

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

  static computeWithAdapter(skill: SkillRiskProfileLike): SkillRiskScorerAdapterSnapshot {
    const factors = skill.risk_profile?.factors ?? []

    return {
      version: SKILL_RISK_SCORER_ADAPTER_VERSION,
      source: 'skill-governance-engine:risk-scorer',
      baseScore: skill.risk_profile?.base_score ?? 0,
      factors,
      score: this.compute(skill),
    }
  }
}
