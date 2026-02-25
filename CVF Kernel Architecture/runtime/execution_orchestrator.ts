import { DomainGuard } from "../kernel/01_domain_lock/domain.guard"
import { ContractEnforcer } from "../kernel/02_contract_runtime/contract.enforcer"
import { RiskScorer } from "../kernel/03_contamination_guard/risk_scorer"
import { RefusalRouter } from "../kernel/04_refusal_router/refusal.router"
import { CreativeController } from "../kernel/05_creative_control/creative.controller"

import { LLMAdapter } from "./llm_adapter"
import { SessionState } from "./session_state"

export class ExecutionOrchestrator {

  private domain = new DomainGuard()
  private contract = new ContractEnforcer()
  private risk = new RiskScorer()
  private refusal = new RefusalRouter()
  private creative = new CreativeController()

  private llm = new LLMAdapter()
  private session = new SessionState()

  async execute(input: any) {

    // 1️⃣ Domain
    this.domain.validate(input)

    // 2️⃣ Contract
    this.contract.validateInput(input)

    // 3️⃣ LLM call
    const rawOutput = await this.llm.generate(input)

    // 4️⃣ Risk scoring
    const riskAssessment = this.risk.scoreText(rawOutput)

    // 5️⃣ Refusal decision
    const refusalDecision = this.refusal.evaluate(riskAssessment)

    if (refusalDecision.blocked)
      return refusalDecision.response

    // 6️⃣ Creative control
    const finalOutput = this.creative.adjust(rawOutput)

    // 7️⃣ Contract output validation
    this.contract.validateOutput(finalOutput)

    return finalOutput
  }
}