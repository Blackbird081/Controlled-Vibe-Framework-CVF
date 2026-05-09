import { AuditEntry } from "./api.types"

const auditStore: AuditEntry[] = []

export function recordAudit(entry: AuditEntry) {
  auditStore.push(entry)
}

export function getAudit() {
  return auditStore
}
