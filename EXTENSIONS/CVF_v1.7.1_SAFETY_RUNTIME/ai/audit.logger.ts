import type {
  AIGenerationRequest,
  AIGenerationResponse,
  AIAuditEntry,
} from "../types/index"

const auditLog: AIAuditEntry[] = []

export function logAIGeneration(
  request: AIGenerationRequest,
  response: AIGenerationResponse
) {
  auditLog.push({
    timestamp: Date.now(),
    request,
    responseMeta: {
      model: response.model,
      totalTokens: response.usage?.totalTokens,
    },
  })
}

export function getAuditLog(): readonly AIAuditEntry[] {
  return auditLog
}
