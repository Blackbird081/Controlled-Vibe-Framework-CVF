// src/database/audit.repository.ts

import { AuditRecord } from "../cvf/audit.service";

export interface AuditRepository {
  save(record: AuditRecord): Promise<void>;
}

export class InMemoryAuditRepository implements AuditRepository {
  private records: AuditRecord[] = [];

  async save(record: AuditRecord): Promise<void> {
    this.records.push(record);
  }

  getAll(): AuditRecord[] {
    return this.records;
  }
}
