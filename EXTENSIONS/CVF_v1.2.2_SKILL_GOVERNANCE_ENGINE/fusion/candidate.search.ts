import { SkillRegistry, RegisteredSkill } from "../internal_ledger/skill.registry";

export interface CandidateQuery {
  domain?: string;
  keywords?: string[];
}

export class CandidateSearch {
  constructor(private registry: SkillRegistry) {}

  search(query: CandidateQuery): RegisteredSkill[] {
    const all = this.registry.list();

    return all.filter(skill => {
      if (skill.revoked) return false;

      if (query.domain && skill.domain !== query.domain) {
        return false;
      }

      if (query.keywords && query.keywords.length > 0) {
        const name = skill.name.toLowerCase();
        const matched = query.keywords.some(k =>
          name.includes(k.toLowerCase())
        );
        if (!matched) return false;
      }

      return true;
    });
  }
}