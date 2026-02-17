// audit.logger.ts
// Centralized audit logging for CVF compliance and traceability

import { AuditEventType, AuditRecord } from "./interfaces"


class AuditLogger {

  private records: AuditRecord[] = []

  log(record: AuditRecord): void {
    this.records.push({
      ...record,
      timestamp: new Date().toISOString()
    })
  }

  getAll(): AuditRecord[] {
    return this.records
  }

  filterBySkill(skillId: string): AuditRecord[] {
    return this.records.filter(r => r.skillId === skillId)
  }

  filterByOperator(operatorId: string): AuditRecord[] {
    return this.records.filter(r => r.operatorId === operatorId)
  }

  export(): string {
    return JSON.stringify(this.records, null, 2)
  }
}

export const auditLogger = new AuditLogger()
