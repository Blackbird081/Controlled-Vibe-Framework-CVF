import { readFileSync } from "fs";
import * as path from "path";

export interface SkillCandidate {
  id: string;
  domain: string;
  maturity: string;
  metadata: any;
}

export class CandidateSearch {

  static fromRegistry(registryPath: string, domain: string): SkillCandidate[] {
    const raw = JSON.parse(readFileSync(registryPath, "utf8"));
    const skills: SkillCandidate[] = raw.skills || [];

    return skills.filter(s => s.domain === domain);
  }

  static merge(...lists: SkillCandidate[][]): SkillCandidate[] {
    const map = new Map<string, SkillCandidate>();

    for (const list of lists) {
      for (const skill of list) {
        map.set(skill.id, skill);
      }
    }

    return Array.from(map.values());
  }
}