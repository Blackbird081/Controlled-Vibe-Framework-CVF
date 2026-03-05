// skill.certifier.ts

import { CVFSkillDraft } from "./models/cvf-skill.draft";
import { CVFSkillCertified } from "./models/cvf-skill.certified";
import { RiskThresholdPolicy } from "./policies/risk.threshold.policy";
import { ExternalSkillAudit } from "./internal_ledger/external_skill.audit.log";

export class SkillCertifier {

  static async certify(draft: CVFSkillDraft): Promise<CVFSkillCertified> {

    if (!RiskThresholdPolicy.allow(draft.inferred_risk)) {
      throw new Error("Certification blocked by policy.");
    }

    const certified: CVFSkillCertified = {
      ...draft,
      certified_at: new Date(),
      status: "certified",
      immutable_hash: this.generateHash(draft)
    };

    ExternalSkillAudit.log("CERTIFIED", certified.skill_id);

    return certified;
  }

  private static generateHash(obj: any): string {
    return require("crypto")
      .createHash("sha256")
      .update(JSON.stringify(obj))
      .digest("hex");
  }

}