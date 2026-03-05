import { ExternalSkillRaw } from "./models/external-skill.raw";
import { SkillAdapter } from "./skill.adapter";
import { ExternalSkillAuditLog } from "./internal_ledger/external_skill.audit.log";

export class SkillIntake {
  static async ingest(raw: ExternalSkillRaw) {
    ExternalSkillAuditLog.append({
      skill_id: `raw_${Date.now()}`,
      timestamp: new Date().toISOString(),
      event_type: "raw_ingested",
      actor: "system",
      metadata: {
        source: raw.source,
        source_reference: raw.source_reference,
      },
    });

    const draft = await SkillAdapter.transform(raw);
    return draft;
  }
}
