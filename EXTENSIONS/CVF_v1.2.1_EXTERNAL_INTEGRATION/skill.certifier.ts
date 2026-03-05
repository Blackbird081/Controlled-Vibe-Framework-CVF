import crypto from "crypto";
import { CVFSkillDraft } from "./models/cvf-skill.draft";
import { CVFSkillCertified } from "./models/cvf-skill.certified";
import { riskThresholdPolicy } from "./policies/risk.threshold.policy";
import { ExternalSkillAuditLog } from "./internal_ledger/external_skill.audit.log";

export class SkillCertifier {
  static async certify(draft: CVFSkillDraft): Promise<CVFSkillCertified> {
    const riskLevel = draft.governance.inferred_risk_level ?? "medium";
    const riskScore = draft.governance.inferred_risk_score ?? 0;
    const policy = riskThresholdPolicy[riskLevel];

    if (policy.reject_immediately) {
      throw new Error("Certification blocked by policy.");
    }

    const now = new Date().toISOString();
    const immutable_hash = this.generateHash({
      skill_id: draft.skill_id,
      raw_content_hash: draft.raw_content_hash,
      updated_at: draft.updated_at,
      riskLevel,
      riskScore,
    });

    const certified: CVFSkillCertified = {
      skill_id: draft.skill_id,
      slug: draft.slug,
      title: draft.title,
      description: draft.description ?? "",
      domain: (draft.governance.inferred_domain as CVFSkillCertified["domain"]) ?? "other",
      phase_binding:
        (draft.governance.inferred_phase as CVFSkillCertified["phase_binding"]) ?? "Build",
      risk: {
        risk_score: riskScore,
        risk_level: riskLevel,
        risk_flags: draft.governance.risk_flags ?? [],
        policy_threshold_passed: !policy.reject_immediately,
        manual_review_required:
          draft.governance.manual_review_required ?? policy.require_manual_review,
      },
      preconditions: draft.logic.preconditions ?? [],
      procedural_steps: draft.logic.procedural_steps,
      output_contract: draft.logic.output_contract ?? "text",
      scope_boundary: draft.logic.scope_boundary ?? "unspecified",
      certification: {
        certified_at: now,
        certified_by: "system",
        immutable_hash,
        version: "1.0.0",
        source: draft.source,
      },
      status: "certified",
    };

    ExternalSkillAuditLog.append({
      skill_id: certified.skill_id,
      timestamp: now,
      event_type: "certified",
      actor: "system",
      metadata: {
        risk_level: certified.risk.risk_level,
        phase: certified.phase_binding,
      },
    });

    return certified;
  }

  private static generateHash(obj: unknown): string {
    return crypto.createHash("sha256").update(JSON.stringify(obj)).digest("hex");
  }
}
