// skill.intake.ts

import { ExternalSkillRaw } from "./models/external-skill.raw";
import { SkillAdapter } from "./skill.adapter";
import { ExternalSkillAudit } from "./internal_ledger/external_skill.audit.log";

export class SkillIntake {

  static async ingest(raw: ExternalSkillRaw) {

    ExternalSkillAudit.log("INGEST_RECEIVED", raw.meta);

    const draft = await SkillAdapter.transform(raw);

    return draft;
  }

}