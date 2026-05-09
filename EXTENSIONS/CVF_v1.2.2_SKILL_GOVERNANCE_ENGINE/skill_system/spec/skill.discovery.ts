/**
 * Skill Discovery Engine
 * Finds suitable skills based on domain and intent.
 */

import { Skill } from "./skill.interface";
import { SkillRegistry } from "./skill.registry";

export class SkillDiscovery {

  static findByDomain(domain: string): Skill[] {
    return SkillRegistry
      .list()
      .filter(skill => skill.metadata.domain === domain);
  }

  static findLowestRisk(domain: string): Skill | null {
    const skills = this.findByDomain(domain);
    if (skills.length === 0) return null;

    return skills.reduce((prev, current) =>
      prev.metadata.riskLevel < current.metadata.riskLevel ? prev : current
    );
  }
}