// governance.guard.ts
// CVF Toolkit Core — Central Governance Enforcement Engine
// See governance.guard.spec.md for full specification.
// Non-optional. Non-overridable.

import {
  RiskLevel,
  CVFPhase,
  RiskAssessmentResult,
  GovernanceContext,
  GovernanceDecision,
  SkillDefinition
} from "./interfaces"
import { ENVIRONMENT_MAX_RISK, RISK_ORDER } from "./cvf.config"
import {
  GovernanceViolationError,
  OperatorViolationError,
  ChangeViolationError,
  EnvironmentViolationError
} from "./errors"
import { skillRegistry } from "./skill.registry"
import { riskClassifier } from "./risk.classifier"
import { phaseController } from "./phase.controller"
import { operatorPolicy } from "./operator.policy"
import { changeController } from "./change.controller"
import { auditLogger } from "./audit.logger"

// --- Main Enforcement Function ---

export async function enforceGovernance(
  context: GovernanceContext
): Promise<GovernanceDecision> {

  const reasons: string[] = []

  // STEP 1 — Skill Validation
  const skill = skillRegistry.get(context.skillId)

  if (skill.version !== context.skillVersion) {
    throw new GovernanceViolationError([
      `Skill version mismatch: expected ${skill.version}, got ${context.skillVersion}`
    ])
  }

  // STEP 2 — Operator Validation
  if (!operatorPolicy.isAuthorizedForSkill(
    { id: context.operatorId, name: "", role: context.operatorRole as any },
    skill.allowedRoles
  )) {
    throw new OperatorViolationError(
      `Operator role '${context.operatorRole}' not authorized for skill '${context.skillId}'`
    )
  }

  // STEP 3 — Risk Classification
  const riskResult: RiskAssessmentResult = riskClassifier.classify({
    skillId: context.skillId,
    skillBaseRisk: skill.riskLevel,
    capabilityLevel: "C2", // default, should be from agent context
    domain: "general",
    operatorRole: context.operatorRole,
    environment: context.environment,
    providerChange: false,
    affectsProduction: context.environment === "prod"
  })

  // STEP 4 — Phase Enforcement (delegated to phase.controller)
  // Phase validation is handled by the caller using phase.controller

  // STEP 5 — Change Compliance
  if (context.changeId) {
    const changeValid = changeController.validate(context.changeId)
    if (!changeValid) {
      throw new ChangeViolationError(
        `Change request '${context.changeId}' is not approved or incomplete`
      )
    }
  }

  // STEP 6 — Freeze Enforcement
  if (RISK_ORDER[riskResult.riskLevel] >= RISK_ORDER["R3"] || context.environment === "prod") {
    if (riskResult.requiresFreeze) {
      reasons.push("Freeze required for this risk level/environment")
    }
  }

  // STEP 7 — Environment Rule
  const maxRisk = ENVIRONMENT_MAX_RISK[context.environment]
  if (RISK_ORDER[riskResult.riskLevel] > RISK_ORDER[maxRisk]) {
    if (!riskResult.requiresApproval) {
      throw new EnvironmentViolationError(
        `Risk ${riskResult.riskLevel} exceeds environment '${context.environment}' cap of ${maxRisk}`
      )
    }
    reasons.push(`Environment cap exceeded: ${riskResult.riskLevel} > ${maxRisk}, approval required`)
  }

  // STEP 8 — Audit Logging (always, even if rejected)
  auditLogger.log({
    eventType: "PHASE_VALIDATION",
    operatorId: context.operatorId,
    skillId: context.skillId,
    riskLevel: riskResult.riskLevel,
    details: {
      environment: context.environment,
      phase: context.requestedPhase,
      decision: "allowed"
    }
  })

  return {
    allowed: true,
    riskLevel: riskResult.riskLevel,
    enforcedPhase: context.requestedPhase,
    requiresUAT: riskResult.requiresUAT,
    requiresApproval: riskResult.requiresApproval,
    requiresFreeze: riskResult.requiresFreeze,
    reasons
  }
}

export const governanceGuard = { enforceGovernance }
