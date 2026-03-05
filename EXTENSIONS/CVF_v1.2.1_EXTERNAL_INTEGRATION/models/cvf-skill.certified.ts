// cvf-skill.certified.ts

import { CertificationState } from "./certification-state";

export type RiskLevel =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type SkillDomain =
  | "architecture"
  | "security"
  | "performance"
  | "testing"
  | "documentation"
  | "analysis"
  | "devops"
  | "marketing_analysis"
  | "other";

export type PhaseBinding =
  | "Discovery"
  | "Design"
  | "Build"
  | "Review";

export interface RiskReport {
  risk_score: number;
  risk_level: RiskLevel;
  risk_flags: string[];
  policy_threshold_passed: boolean;
  manual_review_required: boolean;
}

export interface CertificationMetadata {
  certified_at: string;          // ISO timestamp
  certified_by: string;          // system | admin id
  immutable_hash: string;        // sha256 hash of meta + logic
  version: string;               // semantic version
  source: string;                // skills.sh | partner_registry | etc
}

export interface CVFSkillCertified {

  // --- Identity ---
  skill_id: string;
  slug: string;
  title: string;
  description: string;

  // --- Governance Binding ---
  domain: SkillDomain;
  phase_binding: PhaseBinding;
  risk: RiskReport;

  // --- Execution Contract ---
  preconditions: string[];
  procedural_steps: string;      // normalized markdown logic
  output_contract: string;       // structured output description
  scope_boundary: string;        // what it cannot do

  // --- Certification ---
  certification: CertificationMetadata;
  status: Extract<CertificationState, "certified" | "revoked">;

}