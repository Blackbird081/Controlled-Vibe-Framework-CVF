// phase.binding.policy.ts

import { RiskLevel } from "./risk.threshold.policy";
import { SourceTrustLevel } from "./source.trust.policy";

export type CVFPhase =
  | "Discovery"
  | "Design"
  | "Build"
  | "Review"
  | "Production";

export interface PhaseBindingRule {

  allow_external_skill: boolean;

  allowed_risk_levels: RiskLevel[];

  allowed_source_trust_levels: SourceTrustLevel[];

  require_manual_review: boolean;

  require_sandbox: boolean;

  immutable_after_certification: boolean;

}

export type PhaseBindingPolicy = Record<CVFPhase, PhaseBindingRule>;

export const phaseBindingPolicy: PhaseBindingPolicy = {

  Discovery: {
    allow_external_skill: true,
    allowed_risk_levels: ["low", "medium", "high"],
    allowed_source_trust_levels: ["untrusted", "restricted", "trusted", "internal"],
    require_manual_review: false,
    require_sandbox: true,
    immutable_after_certification: false
  },

  Design: {
    allow_external_skill: true,
    allowed_risk_levels: ["low", "medium"],
    allowed_source_trust_levels: ["restricted", "trusted", "internal"],
    require_manual_review: true,
    require_sandbox: true,
    immutable_after_certification: false
  },

  Build: {
    allow_external_skill: true,
    allowed_risk_levels: ["low"],
    allowed_source_trust_levels: ["trusted", "internal"],
    require_manual_review: true,
    require_sandbox: true,
    immutable_after_certification: true
  },

  Review: {
    allow_external_skill: false,
    allowed_risk_levels: ["low"],
    allowed_source_trust_levels: ["internal"],
    require_manual_review: true,
    require_sandbox: false,
    immutable_after_certification: true
  },

  Production: {
    allow_external_skill: false,
    allowed_risk_levels: ["low"],
    allowed_source_trust_levels: ["internal"],
    require_manual_review: false,
    require_sandbox: false,
    immutable_after_certification: true
  }

};