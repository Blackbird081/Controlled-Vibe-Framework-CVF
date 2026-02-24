export interface GovernanceEvent {
  eventType: string
  description: string
  timestamp: number
}

const auditLog: GovernanceEvent[] = []

export function logGovernanceEvent(
  eventType: string,
  description: string
): void {

  auditLog.push({
    eventType,
    description,
    timestamp: Date.now()
  })
}

export function getAuditLog(): GovernanceEvent[] {
  return auditLog
}