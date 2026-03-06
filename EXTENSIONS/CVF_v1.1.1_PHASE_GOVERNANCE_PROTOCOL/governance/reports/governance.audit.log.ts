/**
 * Governance Audit Log — v1.1.2 Hardening
 *
 * Records governance phase reports and Hash Ledger snapshots.
 *
 * v1.1.2 changes (De_xuat_06 — Hash Ledger audit integration):
 *   - recordHashLedger(): stores artifact hash snapshot alongside phase report.
 *   - HashLedgerSnapshot: tamper-evident record per governance run.
 *   - getHashLedgerHistory(): returns all ledger snapshots for audit trail.
 */

import { PhaseReport } from "./phase.report.generator";
import { ArtifactHashEntry } from "../phase_protocol/artifact.registry";

export interface HashLedgerSnapshot {
  phase: string;
  timestamp: number;
  entries: ArtifactHashEntry[];
}

export class GovernanceAuditLog {

  private logs: PhaseReport[] = [];
  private hashLedgerHistory: HashLedgerSnapshot[] = [];

  record(report: PhaseReport): void {
    this.logs.push(report);
  }

  getAll(): PhaseReport[] {
    return this.logs;
  }

  getByPhase(phase: string): PhaseReport[] {
    return this.logs.filter((r) => r.phase === phase);
  }

  // ─── Hash Ledger Audit (De_xuat_06) ─────────────────────────────────────

  /**
   * recordHashLedger()
   *
   * Stores a tamper-evident snapshot of artifact hashes at a given phase.
   * Called automatically by GovernanceExecutor after artifact_integrity check.
   */
  recordHashLedger(phase: string, entries: ArtifactHashEntry[]): void {
    this.hashLedgerHistory.push({
      phase,
      timestamp: Date.now(),
      entries,
    });
  }

  /**
   * getHashLedgerHistory()
   *
   * Returns all hash ledger snapshots — full audit trail of artifact integrity.
   * Can be used to detect post-governance tampering if hashes diverge.
   */
  getHashLedgerHistory(): HashLedgerSnapshot[] {
    return this.hashLedgerHistory;
  }

}