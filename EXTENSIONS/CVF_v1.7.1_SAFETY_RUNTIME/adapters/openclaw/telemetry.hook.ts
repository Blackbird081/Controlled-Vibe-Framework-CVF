import { CVFProposalEnvelope, CVFExecutionResult } from "./types/contract.types"

interface AIInteractionLog {
  input: any
  proposal?: CVFProposalEnvelope
  result?: CVFExecutionResult
  timestamp: number
}

const memoryLogs: AIInteractionLog[] = []

export function logAIInteraction(entry: Partial<AIInteractionLog>) {

  memoryLogs.push({
    ...entry,
    timestamp: Date.now()
  } as AIInteractionLog)

  // Simple console logging (can plug into ELK, Datadog later)
  console.log("[AI LOG]", JSON.stringify(entry))
}

export function getAILogs() {
  return memoryLogs
}