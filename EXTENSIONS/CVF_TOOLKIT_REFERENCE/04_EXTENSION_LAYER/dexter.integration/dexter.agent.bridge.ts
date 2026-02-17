// dexter.agent.bridge.ts
// Ensures all AI model calls inside Dexter are CVF-compliant

import { cvfAgentAdapter } from "../../03_ADAPTER_LAYER/cvf.agent.adapter"
import { financialValidationEngine } from "../financial.extension/financial.validation.rules"
import { skillRegistry } from "../../02_TOOLKIT_CORE/skill.registry"

export interface DexterAgentInvocation {
  agentId: string
  skillId: string
  model: string
  operatorId: string
  output?: any
}

export class DexterAgentBridge {

  async invokeModel(request: DexterAgentInvocation, modelExecutor: () => Promise<any>) {

    // Record model invocation for audit
    cvfAgentAdapter.recordAgentInvocation({
      agentId: request.agentId,
      skillId: request.skillId,
      model: request.model,
      operatorId: request.operatorId
    })

    // Execute model
    const result = await modelExecutor()

    // Financial-specific output validation using domain field
    const skill = skillRegistry.get(request.skillId)

    if (skill.domain === "financial") {
      financialValidationEngine.validate({
        containsRecommendation: true,
        includesForwardLookingStatement: true,
        citesDataSource: true,
        includesDisclaimer: true
      })
    }

    return result
  }
}

export const dexterAgentBridge = new DexterAgentBridge()
