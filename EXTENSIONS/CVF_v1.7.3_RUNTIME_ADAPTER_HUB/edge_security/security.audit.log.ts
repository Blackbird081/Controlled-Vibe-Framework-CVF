export interface SecurityAuditRecord {
  sessionId: string
  timestamp: number
  piiCount: number
  secretCount: number
  injectionScore: number
}

export const securityAuditLog: SecurityAuditRecord[] = []

export function logSecurityEvent(record: SecurityAuditRecord) {
  securityAuditLog.push(record)
}