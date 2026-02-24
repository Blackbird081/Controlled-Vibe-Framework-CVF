// controlled.reasoning.ts

import {
  ReasoningInput,
  ReasoningDecision,
  ReasoningResult
} from "./reasoning.types"

import { resolveReasoningMode } from "../determinism_control/reasoning.mode"
import { resolveTemperature } from "../determinism_control/temperature.policy"
import { assessEntropy } from "../determinism_control/entropy.guard"
import { createSnapshot } from "../determinism_control/reproducibility.snapshot"

// P0-2: Gọi policy.engine trực tiếp, không tin policyCompliant từ caller
import { bindPolicy } from "../../core/governance/policy.binding"

// P0-3: Import constant thay vì hardcode
import {
  GOVERNANCE_HARD_RISK_THRESHOLD,
  GOVERNANCE_ESCALATION_THRESHOLD
} from "../../core/governance/governance.constants"

import { logGovernanceEvent } from "../../telemetry/governance_audit_log"

/**
 * Central reasoning gate of CVF.
 * Governance check được thực hiện nội bộ — không trust caller.
 */
export function controlledReasoning(
  input: ReasoningInput
): ReasoningResult {

  const {
    sessionId,
    role,
    basePrompt,
    context,
    riskScore,
    entropyScore = 0
  } = input

  // 1️⃣ Governance check (absolute priority) — gọi policy.engine trực tiếp
  const policyResult = bindPolicy({ sessionId, role, riskScore })

  if (!policyResult.allowed) {
    logGovernanceEvent(
      policyResult.escalate ? "REASONING_ESCALATED" : "REASONING_BLOCKED",
      `[${sessionId}] ${policyResult.result.reason ?? "Policy denied"}`
    )

    return {
      decision: {
        allowed: false,
        reason: policyResult.result.reason ?? "Policy denied",
        temperature: 0,
        mode: resolveReasoningMode(role)
      }
    }
  }

  // 2️⃣ Determine reasoning mode + temperature
  const mode = resolveReasoningMode(role)
  const temperature = resolveTemperature(mode)

  // 3️⃣ Entropy control — block nếu unstable + risk elevated
  const entropyAssessment = assessEntropy(entropyScore)

  if (entropyAssessment.unstable) {
    logGovernanceEvent(
      "ENTROPY_ALERT",
      entropyAssessment.reason || "High entropy detected"
    )

    // P1-4: Block nếu entropy unstable kết hợp với risk >= escalation threshold
    if (riskScore >= GOVERNANCE_ESCALATION_THRESHOLD) {
      logGovernanceEvent(
        "ENTROPY_BLOCK",
        `[${sessionId}] Entropy unstable (${entropyScore}) + elevated risk (${riskScore}) → blocked`
      )
      return {
        decision: {
          allowed: false,
          reason: `Entropy unstable (${entropyScore}) combined with elevated risk (${riskScore})`,
          temperature: 0,
          mode
        }
      }
    }
  }

  // 4️⃣ Compose final prompt
  const finalPrompt = `
ROLE: ${role}
MODE: ${mode}

${context}

TASK:
${basePrompt}
`

  // 5️⃣ Snapshot for reproducibility
  const snapshot = createSnapshot(
    sessionId,
    role,
    temperature,
    entropyScore
  )

  return {
    decision: {
      allowed: true,
      finalPrompt,
      temperature,
      mode
    },
    snapshot
  }
}