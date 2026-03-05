// skill.adapter.ts

import { ExternalSkillRaw } from "./models/external-skill.raw";
import { CVFSkillDraft } from "./models/cvf-skill.draft";

export class SkillAdapter {

  static async transform(raw: ExternalSkillRaw): Promise<CVFSkillDraft> {

    return {
      skill_id: `ext_${Date.now()}`,
      source: raw.source,
      original_format: raw.format,
      title: raw.title,
      description: raw.description,
      procedural_steps: raw.content,
      inferred_domain: null,
      inferred_phase: null,
      inferred_risk: null,
      status: "draft"
    };

  }

}