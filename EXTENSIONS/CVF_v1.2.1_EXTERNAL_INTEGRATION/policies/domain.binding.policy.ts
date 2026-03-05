// domain.binding.policy.ts

import { RiskLevel } from "./risk.threshold.policy";
import { SourceTrustLevel } from "./source.trust.policy";

export type CVFDomain =
  | "engineering"
  | "marketing"
  | "data"
  | "security"
  | "finance"
  | "operations"
  | "compliance"
  | "experimental"
  | "unknown";

export interface DomainBindingRule {

  allow_domain: boolean;

  allowed_risk_levels: RiskLevel[];

  allowed_source_trust_levels: SourceTrustLevel[];

  require_dual_approval: boolean;

  force_sandbox: boolean;

  auto_certification_allowed: boolean;

}

export type DomainBindingPolicy = Record<CVFDomain, DomainBindingRule>;

export const domainBindingPolicy: DomainBindingPolicy = {

  engineering: {
    allow_domain: true,
    allowed_risk_levels: ["low", "medium"],
    allowed_source_trust_levels: ["restricted", "trusted", "internal"],
    require_dual_approval: false,
    force_sandbox: true,
    auto_certification_allowed: true
  },

  marketing: {
    allow_domain: true,
    allowed_risk_levels: ["low", "medium"],
    allowed_source_trust_levels: ["untrusted", "restricted", "trusted", "internal"],
    require_dual_approval: false,
    force_sandbox: true,
    auto_certification_allowed: true
  },

  data: {
    allow_domain: true,
    allowed_risk_levels: ["low"],
    allowed_source_trust_levels: ["trusted", "internal"],
    require_dual_approval: true,
    force_sandbox: true,
    auto_certification_allowed: false
  },

  security: {
    allow_domain: true,
    allowed_risk_levels: ["low"],
    allowed_source_trust_levels: ["internal"],
    require_dual_approval: true,
    force_sandbox: true,
    auto_certification_allowed: false
  },

  finance: {
    allow_domain: true,
    allowed_risk_levels: ["low"],
    allowed_source_trust_levels: ["internal"],
    require_dual_approval: true,
    force_sandbox: true,
    auto_certification_allowed: false
  },

  operations: {
    allow_domain: true,
    allowed_risk_levels: ["low", "medium"],
    allowed_source_trust_levels: ["trusted", "internal"],
    require_dual_approval: false,
    force_sandbox: true,
    auto_certification_allowed: false
  },

  compliance: {
    allow_domain: true,
    allowed_risk_levels: ["low"],
    allowed_source_trust_levels: ["internal"],
    require_dual_approval: true,
    force_sandbox: false,
    auto_certification_allowed: false
  },

  experimental: {
    allow_domain: true,
    allowed_risk_levels: ["low", "medium", "high"],
    allowed_source_trust_levels: ["untrusted", "restricted", "trusted", "internal"],
    require_dual_approval: false,
    force_sandbox: true,
    auto_certification_allowed: false
  },

  unknown: {
    allow_domain: false,
    allowed_risk_levels: [],
    allowed_source_trust_levels: [],
    require_dual_approval: false,
    force_sandbox: true,
    auto_certification_allowed: false
  }

};