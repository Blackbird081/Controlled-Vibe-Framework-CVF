// cvf-skill.draft.ts

import { CertificationState } from "./certification-state";

export type RawSource =
  | "skills.sh"
  | "partner_registry"
  | "internal_repo"
  | "manual_upload"
  | "unknown";

export interface InferredGovernance {

  inferred_domain?: string;

  inferred_phase?: "Discovery" | "Design" | "Build" | "Review";

  inferred_risk_score?: number;

  inferred_risk_level?: "low" | "medium" | "high" | "critical";

  risk_flags?: string[];

  manual_review_required?: boolean;

}

export interface NormalizedLogic {

  preconditions?: string[];

  procedural_steps: string;   // normalized markdown

  output_contract?: string;

  scope_boundary?: string;

}

export interface CVFSkillDraft {

  // ---- Identity ----
  skill_id: string;
  slug: string;
  title: string;
  description?: string;

  // ---- Source ----
  source: RawSource;
  original_format: "markdown" | "json" | "yaml" | "repo_url";
  raw_content_hash: string;

  // ---- Normalized Content ----
  logic: NormalizedLogic;

  // ---- Governance (inferred only) ----
  governance: InferredGovernance;

  // ---- State ----
  status: Extract<
    CertificationState,
    "draft" | "validated" | "under_review"
  >;

  created_at: string;
  updated_at: string;

}