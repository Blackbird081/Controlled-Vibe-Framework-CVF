/**
 * Central Skill Registry
 * Stores all approved skills.
 */

import { Skill } from "./skill.interface";

export class SkillRegistry {
  private static skills: Map<string, Skill> = new Map();

  static register(skill: Skill): void {
    this.skills.set(skill.metadata.id, skill);
  }

  static get(skillId: string): Skill | undefined {
    return this.skills.get(skillId);
  }

  static list(): Skill[] {
    return Array.from(this.skills.values());
  }

  static exists(skillId: string): boolean {
    return this.skills.has(skillId);
  }
}