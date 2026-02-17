// cvf.skill.adapter.ts
// Bridges external workflow calls into CVF Skill Registry enforcement

import { skillRegistry, SkillDefinition } from "../02_TOOLKIT_CORE/skill.registry"
import { riskClassifier } from "../02_TOOLKIT_CORE/risk.classifier"
import { auditLogger } from "../02_TOOLKIT_CORE/audit.logger"

export interface SkillExecutionRequest {
  skillId: string
  payload: any
}

export interface SkillExecutionContext {
  operatorId: string
}

export class CVFSkillAdapter {

  resolveSkill(skillId: string): SkillDefinition {
    return skillRegistry.get(skillId)
  }

  classifyRisk(skill: SkillDefinition) {
    return riskClassifier.classify({
      skillId: skill.id,
      skillBaseRisk: skill.riskLevel,
      capabilityLevel: "C2",
      domain: "general",
      operatorRole: "ANALYST",
      environment: "dev"
    })
  }

  logInvocation(skillId: string, operatorId: string) {
    auditLogger.log({
      eventType: "SKILL_INVOCATION",
      operatorId,
      skillId
    })
  }
}

export const cvfSkillAdapter = new CVFSkillAdapter()
