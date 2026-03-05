// governance.audit.ledger.ts

import crypto from "crypto";
import { CertificationState } from "./certification/certification.state.machine";
import { DecisionOutcome } from "./policies/policy.decision.engine";

export type GovernanceEventType =
  | "state_transition"
  | "policy_decision"
  | "manual_override"
  | "production_promotion"
  | "rejection";

export interface GovernanceLedgerEntry {

  index: number;

  timestamp: string;

  skill_id: string;

  event_type: GovernanceEventType;

  from_state?: CertificationState;

  to_state?: CertificationState;

  decision?: DecisionOutcome;

  actor: string;

  metadata?: Record<string, any>;

  previous_hash: string;

  hash: string;

}

export class GovernanceAuditLedger {

  private static ledger: GovernanceLedgerEntry[] = [];

  private static computeHash(entry: Omit<GovernanceLedgerEntry, "hash">): string {

    const serialized = JSON.stringify(entry);

    return crypto
      .createHash("sha256")
      .update(serialized)
      .digest("hex");
  }

  static append(entryData: Omit<GovernanceLedgerEntry, "index" | "hash" | "previous_hash">): GovernanceLedgerEntry {

    const previousEntry = this.ledger[this.ledger.length - 1];

    const previous_hash = previousEntry ? previousEntry.hash : "GENESIS";

    const index = this.ledger.length;

    const baseEntry: Omit<GovernanceLedgerEntry, "hash"> = {
      index,
      previous_hash,
      ...entryData
    };

    const hash = this.computeHash(baseEntry);

    const fullEntry: GovernanceLedgerEntry = {
      ...baseEntry,
      hash
    };

    this.ledger.push(fullEntry);

    return fullEntry;
  }

  static verifyIntegrity(): boolean {

    for (let i = 0; i < this.ledger.length; i++) {

      const current = this.ledger[i];
      if (!current) continue;

      const recalculatedHash = this.computeHash({
        index: current.index,
        timestamp: current.timestamp,
        skill_id: current.skill_id,
        event_type: current.event_type,
        from_state: current.from_state,
        to_state: current.to_state,
        decision: current.decision,
        actor: current.actor,
        metadata: current.metadata,
        previous_hash: current.previous_hash
      });

      if (recalculatedHash !== current.hash) {
        return false;
      }

      const prevEntry = i > 0 ? this.ledger[i - 1] : undefined;
      if (i > 0 && prevEntry && current.previous_hash !== prevEntry.hash) {
        return false;
      }
    }

    return true;
  }

  static getLedger(): GovernanceLedgerEntry[] {
    return [...this.ledger];
  }

  /** @internal Test-only: reset ledger for isolation */
  static reset(): void {
    this.ledger = [];
  }

}