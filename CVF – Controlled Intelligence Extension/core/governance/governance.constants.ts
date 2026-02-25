// governance.constants.ts
// Governance thresholds — aligned with CVF Risk Level mapping (R0-R3).
//
// Boundary alignment (from risk.mapping.ts):
//   R1/R2 boundary: 0.70  → ESCALATION_THRESHOLD
//   R2/R3 boundary: 0.90  → HARD_RISK_THRESHOLD

export const GOVERNANCE_HARD_RISK_THRESHOLD = 0.9   // R3 boundary → BLOCK
export const GOVERNANCE_ESCALATION_THRESHOLD = 0.7  // R2 boundary → ESCALATE
export const GOVERNANCE_VERSION = "1.7.0"