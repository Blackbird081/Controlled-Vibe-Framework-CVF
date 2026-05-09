export enum VerificationRuleType {
  TEST_PASS = "TEST_PASS",
  DIFF_SCOPE = "DIFF_SCOPE",
  RISK_VALIDATION = "RISK_VALIDATION",
  LOG_CLEAN = "LOG_CLEAN",
  ELEGANCE_CHECK = "ELEGANCE_CHECK",
  PROOF_ATTACHED = "PROOF_ATTACHED"
}

export interface VerificationRule {
  id: string
  type: VerificationRuleType
  required: boolean
  description: string
}

export const DefaultVerificationRules: VerificationRule[] = [
  {
    id: "VR-001",
    type: VerificationRuleType.TEST_PASS,
    required: true,
    description: "All required tests must pass before phase exit."
  },
  {
    id: "VR-002",
    type: VerificationRuleType.DIFF_SCOPE,
    required: true,
    description: "Code diff must remain within approved scope."
  },
  {
    id: "VR-003",
    type: VerificationRuleType.RISK_VALIDATION,
    required: true,
    description: "Risk tier validation must match declared classification."
  },
  {
    id: "VR-004",
    type: VerificationRuleType.LOG_CLEAN,
    required: true,
    description: "Execution logs must contain no critical errors."
  },
  {
    id: "VR-005",
    type: VerificationRuleType.ELEGANCE_CHECK,
    required: true,
    description: "Elegance scoring must be evaluated."
  },
  {
    id: "VR-006",
    type: VerificationRuleType.PROOF_ATTACHED,
    required: true,
    description: "Proof of correctness artifact must be attached."
  }
]