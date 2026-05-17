// risk.threshold.policy.ts

export type RiskLevel =
  | "low"
  | "medium"
  | "high"
  | "critical";

export interface RiskThresholdRule {

  allow_auto_validation: boolean;

  allow_auto_certification: boolean;

  require_manual_review: boolean;

  force_sandbox: boolean;

  reject_immediately: boolean;

}

export type RiskThresholdPolicy = Record<RiskLevel, RiskThresholdRule>;

export const riskThresholdPolicy: RiskThresholdPolicy = {

  low: {
    allow_auto_validation: true,
    allow_auto_certification: true,
    require_manual_review: false,
    force_sandbox: false,
    reject_immediately: false
  },

  medium: {
    allow_auto_validation: true,
    allow_auto_certification: false,
    require_manual_review: true,
    force_sandbox: true,
    reject_immediately: false
  },

  high: {
    allow_auto_validation: false,
    allow_auto_certification: false,
    require_manual_review: true,
    force_sandbox: true,
    reject_immediately: false
  },

  critical: {
    allow_auto_validation: false,
    allow_auto_certification: false,
    require_manual_review: false,
    force_sandbox: true,
    reject_immediately: true
  }

};

// ─── Canonical R0–R3 Mapping (CVF Standard) ──────────────────────────────────
// Bridges internal risk labels with CVF governance risk model
// Ref: governance/compat/risk_level_mapping.md

export type CVFRiskLevel = 'R0' | 'R1' | 'R2' | 'R3';

export const RISK_TO_CVF: Record<RiskLevel, CVFRiskLevel> = {
  low: 'R0',
  medium: 'R1',
  high: 'R2',
  critical: 'R3',
};

export const CVF_TO_RISK: Record<CVFRiskLevel, RiskLevel> = {
  R0: 'low',
  R1: 'medium',
  R2: 'high',
  R3: 'critical',
};

export function toCVFRiskLevel(risk: RiskLevel): CVFRiskLevel {
  return RISK_TO_CVF[risk];
}

export function fromCVFRiskLevel(cvfRisk: CVFRiskLevel): RiskLevel {
  return CVF_TO_RISK[cvfRisk];
}