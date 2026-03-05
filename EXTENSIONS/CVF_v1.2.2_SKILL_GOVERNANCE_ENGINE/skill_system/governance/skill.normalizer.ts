export class SkillNormalizer {

  static normalize(skill: any): any {
    return {
      ...skill,
      id: skill.id.toLowerCase(),
      domain: skill.domain.toLowerCase(),
      type: skill.type.toUpperCase(),
      maturity: skill.maturity.toUpperCase()
    };
  }
}