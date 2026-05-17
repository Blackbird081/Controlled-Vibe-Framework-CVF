// source.trust.policy.ts

import { ExternalSkillSource } from "../models/external-skill.raw";

export type SourceTrustLevel =
  | "blocked"
  | "untrusted"
  | "restricted"
  | "trusted"
  | "internal";

export interface SourceTrustRule {

  trust_level: SourceTrustLevel;

  require_sandbox: boolean;

  require_manual_review: boolean;

  max_auto_certification_risk: "low" | "medium" | "none";

}

export type SourceTrustPolicyMap = Record<
  ExternalSkillSource,
  SourceTrustRule
>;

export const sourceTrustPolicy: SourceTrustPolicyMap = {

  "skills.sh": {
    trust_level: "untrusted",
    require_sandbox: true,
    require_manual_review: true,
    max_auto_certification_risk: "low"
  },

  github_repo: {
    trust_level: "restricted",
    require_sandbox: true,
    require_manual_review: true,
    max_auto_certification_risk: "medium"
  },

  partner_registry: {
    trust_level: "trusted",
    require_sandbox: true,
    require_manual_review: false,
    max_auto_certification_risk: "medium"
  },

  manual_upload: {
    trust_level: "restricted",
    require_sandbox: true,
    require_manual_review: true,
    max_auto_certification_risk: "low"
  },

  api_import: {
    trust_level: "restricted",
    require_sandbox: true,
    require_manual_review: true,
    max_auto_certification_risk: "low"
  },

  unknown: {
    trust_level: "blocked",
    require_sandbox: true,
    require_manual_review: true,
    max_auto_certification_risk: "none"
  }

};