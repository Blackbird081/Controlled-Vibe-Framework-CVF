import { OpenClawMessage } from "./types/openclaw.types"
import { parseIntent } from "./intent.parser"
import { buildProposal } from "./proposal.builder"
import { formatResponse } from "./response.formatter"
import { CVFPublicAPI } from "./cvf.contract"
import { getProvider } from "./provider.registry"
import { defaultOpenClawConfig } from "./openclaw.config"
import { guardProposal } from "./safety.guard"
import { isSandbox } from "../../simulation/sandbox.mode"

export class OpenClawAdapter {
  constructor(private cvf: CVFPublicAPI) {}

  async handleMessage(input: OpenClawMessage): Promise<string> {
    if (!defaultOpenClawConfig.enabled) {
      throw new Error("OpenClaw layer disabled")
    }

    const cheapProvider = getProvider("cheap-model")
    const strongProvider = getProvider("strong-model")

    let intent = await parseIntent(input.message, cheapProvider)

    if (isSandbox()) {
      intent.simulateOnly = true
    }

    if (intent.confidence < 0.5) {
      intent = await parseIntent(input.message, strongProvider)
    }

    const proposal = buildProposal(intent)

    const guard = guardProposal(proposal)

    if (!guard.allowed) {
      return `Blocked: ${guard.reason}`
    }

    const result = await this.cvf.submitProposal(proposal)

    return formatResponse(result)
  }
  async handleStructuredInput(
    action: string,
    parameters: Record<string, any>
  ): Promise<string> {
    const proposal = {
      id: crypto.randomUUID(),
      source: "openclaw" as const,
      action,
      payload: parameters,
      createdAt: Date.now(),
      confidence: 1,
      riskLevel: "low" as const,
    }

    const guard = guardProposal(proposal)

    if (!guard.allowed) {
      return `Blocked: ${guard.reason}`
    }

    const result = await this.cvf.submitProposal(proposal)

    return formatResponse(result)
  }
}
