// risk.classifier.ts
// CVF Toolkit Core — Centralized Risk Computation Engine
// See risk.classifier.spec.md for full specification.
// Must execute BEFORE any AI invocation. Non-bypassable.

import { RiskLevel, RiskAssessmentResult, RiskClassificationInput } from "./interfaces"
import {
  RISK_ORDER,
  ORDER_TO_RISK,
  CAPABILITY_MAX_RISK,
  ENVIRONMENT_MAX_RISK
} from "./cvf.config"

// --- Helper ---

function maxRisk(a: RiskLevel, b: RiskLevel): RiskLevel {
  return RISK_ORDER[a] >= RISK_ORDER[b] ? a : b
}

// --- Core Classifier ---

class RiskClassifier {

  classify(input: RiskClassificationInput): RiskAssessmentResult {
    const reasons: string[] = []

    // STEP 1 — Start with Skill Base Risk
    let risk: RiskLevel = input.skillBaseRisk

    // STEP 2 — Capability Alignment
    const capMax = CAPABILITY_MAX_RISK[input.capabilityLevel]
    if (RISK_ORDER[input.skillBaseRisk] > RISK_ORDER[capMax]) {
      throw new Error(
        `RiskViolationError: Skill base risk ${input.skillBaseRisk} exceeds capability ${input.capabilityLevel} max of ${capMax}`
      )
    }

    // STEP 3 — Financial Override
    if (input.domain === "financial") {
      // Apply minimum financial risk based on context
      // Default to R2 for financial domain
      risk = maxRisk(risk, "R2")
      reasons.push("Financial domain override applied")
    }

    // STEP 4 — Change Escalation
    if (input.providerChange) {
      risk = maxRisk(risk, "R3")
      reasons.push("Provider change escalation applied")
    }
    if (input.changeType === "financial") {
      risk = maxRisk(risk, "R3")
      reasons.push("Financial change escalation applied")
    }
    if (input.affectsProduction) {
      risk = maxRisk(risk, "R3")
      reasons.push("Production impact escalation applied")
    }

    // STEP 5 — Environment Cap Validation
    const envMax = ENVIRONMENT_MAX_RISK[input.environment]
    let environmentCapExceeded = false
    if (RISK_ORDER[risk] > RISK_ORDER[envMax]) {
      environmentCapExceeded = true
      reasons.push(`Environment cap exceeded: ${risk} > ${envMax}`)
    }

    // STEP 6 — Approval Requirement
    const requiresApproval =
      environmentCapExceeded ||
      RISK_ORDER[risk] >= RISK_ORDER["R3"]

    // STEP 7 — UAT Requirement
    const requiresUAT = RISK_ORDER[risk] >= RISK_ORDER["R2"]

    // STEP 8 — Freeze Requirement
    const requiresFreeze =
      RISK_ORDER[risk] >= RISK_ORDER["R3"] ||
      input.environment === "prod" ||
      input.affectsProduction === true

    return {
      riskLevel: risk,
      requiresApproval,
      requiresUAT,
      requiresFreeze,
      environmentCapExceeded,
      reasons
    }
  }
}

export const riskClassifier = new RiskClassifier()
