// external_skill.audit.log.ts

import crypto from "crypto";

export type ExternalSkillAuditEventType =
  | "raw_ingested"
  | "integrity_verified"
  | "risk_scored"
  | "domain_bound"
  | "phase_bound"
  | "policy_evaluated"
  | "certified"
  | "revoked"
  | "execution_blocked"
  | "execution_allowed";

export interface ExternalSkillAuditEvent {

  skill_id: string;

  timestamp: string;

  event_type: ExternalSkillAuditEventType;

  actor: string;

  metadata?: Record<string, any>;

  previous_hash: string;

  hash: string;

}

export class ExternalSkillAuditLog {

  private static chain: ExternalSkillAuditEvent[] = [];

  private static computeHash(payload: Omit<ExternalSkillAuditEvent, "hash">): string {

    const serialized = JSON.stringify(payload);

    return crypto
      .createHash("sha256")
      .update(serialized)
      .digest("hex");
  }

  static append(
    eventData: Omit<ExternalSkillAuditEvent, "previous_hash" | "hash">
  ): ExternalSkillAuditEvent {

    const previous_hash =
      this.chain.length === 0
        ? "GENESIS"
        : this.chain[this.chain.length - 1].hash;

    const payload = {
      ...eventData,
      previous_hash
    };

    const hash = this.computeHash(payload);

    const fullEvent: ExternalSkillAuditEvent = {
      ...payload,
      hash
    };

    this.chain.push(fullEvent);

    return fullEvent;
  }

  static getChain(): ExternalSkillAuditEvent[] {
    return this.chain;
  }

  static verifyIntegrity(): boolean {

    for (let i = 0; i < this.chain.length; i++) {

      const current = this.chain[i];

      const recalculatedHash = this.computeHash({
        skill_id: current.skill_id,
        timestamp: current.timestamp,
        event_type: current.event_type,
        actor: current.actor,
        metadata: current.metadata,
        previous_hash: current.previous_hash
      });

      if (recalculatedHash !== current.hash) {
        return false;
      }

      if (i > 0 && current.previous_hash !== this.chain[i - 1].hash) {
        return false;
      }
    }

    return true;
  }

}