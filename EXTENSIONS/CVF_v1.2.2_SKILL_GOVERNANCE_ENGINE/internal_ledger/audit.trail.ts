export interface AuditEntry {
  entity: "skill" | "execution" | "policy";
  entity_id: string;
  action: string;
  metadata?: Record<string, any>;
  timestamp: number;
}

export class AuditTrail {
  private entries: AuditEntry[] = [];

  record(entry: AuditEntry) {
    this.entries.push(entry);
  }

  list(): AuditEntry[] {
    return this.entries;
  }

  filter(entity: string): AuditEntry[] {
    return this.entries.filter(e => e.entity === entity);
  }
}