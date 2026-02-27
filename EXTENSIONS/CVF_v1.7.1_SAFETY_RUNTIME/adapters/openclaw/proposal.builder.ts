import { ParsedIntent } from "./types/intent.types"
import { CVFProposalEnvelope } from "./types/contract.types"

export function buildProposal(intent: ParsedIntent): CVFProposalEnvelope {
  const riskLevel =
    intent.confidence > 0.8 ? "low" : intent.confidence > 0.5 ? "medium" : "high"

  return {
    id: crypto.randomUUID(),
    source: "openclaw",
    action: intent.action,
    payload: intent.parameters,
    createdAt: Date.now(),
    confidence: intent.confidence,
    riskLevel,
  }
}
