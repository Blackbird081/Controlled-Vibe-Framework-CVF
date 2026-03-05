// storage/audit.store.ts

export interface AuditRecord {
  id: string
  timestamp: number
  type: "pii" | "secret" | "injection"
  detail: string
}

const auditDB: AuditRecord[] = []

export function saveAudit(record: AuditRecord) {
  auditDB.push(record)
}

export function getAuditLogs(): AuditRecord[] {
  return auditDB
}