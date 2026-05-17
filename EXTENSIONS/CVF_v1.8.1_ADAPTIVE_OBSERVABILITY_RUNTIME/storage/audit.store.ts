// storage/audit.store.ts

export interface AuditRecord {
  id: string
  skillId?: string
  timestamp: number
  type: "pii" | "secret" | "injection"
  detail: string
}

const auditDB: AuditRecord[] = []

export function saveAudit(record: AuditRecord) {
  auditDB.push(record)
}

export function getAuditLogs(skillId?: string): AuditRecord[] {
  if (!skillId) return auditDB
  return auditDB.filter(r => r.skillId === skillId)
}
