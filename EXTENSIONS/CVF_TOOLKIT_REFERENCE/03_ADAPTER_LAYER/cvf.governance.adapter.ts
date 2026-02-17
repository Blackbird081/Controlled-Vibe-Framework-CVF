// cvf.governance.adapter.ts
// Central bridge enforcing governance before execution

import { enforceGovernance, GovernanceContext, GovernanceDecision } from "../02_TOOLKIT_CORE/governance.guard"
import { OperatorContext } from "../02_TOOLKIT_CORE/operator.policy"
import { SkillDefinition } from "../02_TOOLKIT_CORE/skill.registry"
import { CVFPhase } from "../02_TOOLKIT_CORE/phase.controller"

export interface GovernanceValidationRequest {
  operator: OperatorContext
  skill: SkillDefinition
  phase: CVFPhase
}

export class CVFGovernanceAdapter {

  async validate(request: GovernanceValidationRequest): Promise<GovernanceDecision> {
    const context: GovernanceContext = {
      operatorId: request.operator.id,
      operatorRole: request.operator.role,
      skillId: request.skill.id,
      skillVersion: request.skill.version,
      environment: "dev",
      requestedPhase: request.phase
    }
    return enforceGovernance(context)
  }
}

export const cvfGovernanceAdapter = new CVFGovernanceAdapter()
