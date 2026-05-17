import { CVFSkillDraft } from "./models/cvf-skill.draft";
import { CVFDomain } from "./policies/domain.binding.policy";
import { RiskLevel } from "./policies/risk.threshold.policy";
import { RiskScoringHook } from "./governance_hooks/risk.scoring.hook";

function inferDomain(steps: string): CVFDomain {
  const normalized = steps.toLowerCase();
  if (normalized.includes("security")) return "security";
  if (normalized.includes("finance")) return "finance";
  if (normalized.includes("deploy") || normalized.includes("infra")) return "operations";
  if (normalized.includes("data")) return "data";
  return "engineering";
}

function inferPhase(steps: string): "Discovery" | "Design" | "Build" | "Review" {
  const normalized = steps.toLowerCase();
  if (normalized.includes("review") || normalized.includes("audit")) return "Review";
  if (normalized.includes("design")) return "Design";
  if (normalized.includes("discover") || normalized.includes("research")) return "Discovery";
  return "Build";
}

export class SkillValidator {
  static async validate(draft: CVFSkillDraft): Promise<CVFSkillDraft> {
    const procedural = draft.logic.procedural_steps ?? "";
    const score = RiskScoringHook.evaluate({
      scope_size: Math.max(1, procedural.length / 200),
      external_dependencies: (procedural.match(/https?:\/\//g) ?? []).length,
      accesses_filesystem: /file|filesystem|write|delete|mkdir/i.test(procedural),
      accesses_network: /http|api|fetch|post|get|upload/i.test(procedural),
      domain_sensitivity_score: inferDomain(procedural) === "security" ? 5 : 2,
    });

    draft.governance = {
      ...draft.governance,
      inferred_domain: inferDomain(procedural),
      inferred_phase: inferPhase(procedural),
      inferred_risk_score: score.risk_score,
      inferred_risk_level: score.risk_level as RiskLevel,
      manual_review_required: score.risk_level !== "low",
    };

    if (draft.governance.inferred_risk_level === "critical") {
      throw new Error("External skill rejected: Critical risk");
    }

    draft.status = "validated";
    draft.updated_at = new Date().toISOString();
    return draft;
  }
}
