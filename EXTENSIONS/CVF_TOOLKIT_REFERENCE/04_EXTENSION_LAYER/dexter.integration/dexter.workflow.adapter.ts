// dexter.workflow.adapter.ts
// Connects Dexter workflow execution into CVF lifecycle control

import { cvfSkillAdapter } from "../../03_ADAPTER_LAYER/cvf.skill.adapter"
import { cvfGovernanceAdapter } from "../../03_ADAPTER_LAYER/cvf.governance.adapter"
import { OperatorContext } from "../../02_TOOLKIT_CORE/operator.policy"

export interface DexterWorkflowRequest {
  skillId: string
  operator: OperatorContext
  phase: number
  payload: any
}

export class DexterWorkflowAdapter {

  async execute(request: DexterWorkflowRequest) {

    // Resolve skill from CVF registry
    const skill = cvfSkillAdapter.resolveSkill(request.skillId)

    // Enforce governance before execution
    cvfGovernanceAdapter.validate({
      operator: request.operator,
      skill,
      phase: request.phase
    })

    // Log invocation
    cvfSkillAdapter.logInvocation(
      request.skillId,
      request.operator.id
    )

    // Return validated execution context to Dexter engine
    return {
      skill,
      payload: request.payload
    }
  }
}

export const dexterWorkflowAdapter = new DexterWorkflowAdapter()
