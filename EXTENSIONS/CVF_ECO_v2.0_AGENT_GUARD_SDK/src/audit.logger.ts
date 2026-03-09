import { AuditEntry, GovernanceDecision } from "./types";

let auditCounter = 0;

function nextAuditId(): string {
  auditCounter++;
  return `AUD-${String(auditCounter).padStart(6, "0")}`;
}

export function resetAuditCounter(): void {
  auditCounter = 0;
}

export class AuditLogger {
  private entries: AuditEntry[] = [];

  log(sessionId: string, decision: GovernanceDecision): AuditEntry {
    const entry: AuditEntry = {
      id: nextAuditId(),
      sessionId,
      decision,
      timestamp: Date.now(),
    };
    this.entries.push(entry);
    return entry;
  }

  getAll(): AuditEntry[] {
    return [...this.entries];
  }

  getBySession(sessionId: string): AuditEntry[] {
    return this.entries.filter((e) => e.sessionId === sessionId);
  }

  getByVerdict(verdict: string): AuditEntry[] {
    return this.entries.filter((e) => e.decision.verdict === verdict);
  }

  getByRiskLevel(level: string): AuditEntry[] {
    return this.entries.filter((e) => e.decision.riskLevel === level);
  }

  count(): number {
    return this.entries.length;
  }

  clear(): void {
    this.entries = [];
  }

  exportJSON(): string {
    return JSON.stringify(this.entries, null, 2);
  }
}
