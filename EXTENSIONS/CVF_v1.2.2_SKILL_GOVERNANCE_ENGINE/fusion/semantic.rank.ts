import { RegisteredSkill } from "../internal_ledger/skill.registry";

export interface SemanticScore {
  skill: RegisteredSkill;
  semantic_score: number;
}

export class SemanticRank {
  rank(
    skills: RegisteredSkill[],
    queryText: string
  ): SemanticScore[] {
    const lowerQuery = queryText.toLowerCase();

    return skills.map(skill => {
      const name = skill.name.toLowerCase();
      let score = 0;

      if (lowerQuery.includes(name)) score += 50;

      const tokens = lowerQuery.split(" ");
      tokens.forEach(token => {
        if (name.includes(token)) score += 10;
      });

      return {
        skill,
        semantic_score: score
      };
    }).sort((a, b) => b.semantic_score - a.semantic_score);
  }
}