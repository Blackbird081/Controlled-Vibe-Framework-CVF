/**
 * Skill Validator
 * Ensures skill meets CVF requirements before execution.
 */

import { Skill } from "./skill.interface";

export class SkillValidator {

  static verifyStructure(skill: Skill): boolean {
    return (
      !!skill.metadata.id &&
      !!skill.metadata.name &&
      typeof skill.execute === "function"
    );
  }

  static verifyRisk(skill: Skill): boolean {
    return skill.metadata.riskLevel <= 70;
  }

  static validate(skill: Skill): boolean {
    return this.verifyStructure(skill) && this.verifyRisk(skill);
  }
}