/**
 * Skill Loader
 * Loads skills into registry after validation.
 */

import { Skill } from "./skill.interface";
import { SkillRegistry } from "./skill.registry";
import { SkillValidator } from "./skill.validator";

export class SkillLoader {

  static load(skill: Skill): boolean {

    const valid = SkillValidator.validate(skill);

    if (!valid) {
      return false;
    }

    SkillRegistry.register(skill);
    return true;
  }
}