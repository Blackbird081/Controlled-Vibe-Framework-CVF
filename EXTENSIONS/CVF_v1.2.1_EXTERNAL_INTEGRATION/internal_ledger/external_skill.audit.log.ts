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

    const previous = this.chain[this.chain.length - 1];
    const previous_hash = previous ? previous.hash : "GENESIS";

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
    for (const [i, current] of this.chain.entries()) {

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

      const previous = i > 0 ? this.chain[i - 1] : undefined;
      if (i > 0 && previous && current.previous_hash !== previous.hash) {
        return false;
      }
    }

    return true;
  }

}

// Legacy compatibility shim for older pipeline modules.
export class ExternalSkillAudit {
  static log(
    event_type: ExternalSkillAuditEventType | string,
    metadata: Record<string, any> | string
  ) {
    const normalizedType =
      typeof event_type === "string" ? event_type.toLowerCase() : event_type;

    const allowed: ExternalSkillAuditEventType[] = [
      "raw_ingested",
      "integrity_verified",
      "risk_scored",
      "domain_bound",
      "phase_bound",
      "policy_evaluated",
      "certified",
      "revoked",
      "execution_blocked",
      "execution_allowed",
    ];

    const safeType: ExternalSkillAuditEventType = allowed.includes(
      normalizedType as ExternalSkillAuditEventType
    )
      ? (normalizedType as ExternalSkillAuditEventType)
      : "policy_evaluated";

    const skill_id =
      typeof metadata === "string"
        ? metadata
        : (metadata?.skill_id as string | undefined) ?? "unknown-skill";

    ExternalSkillAuditLog.append({
      skill_id,
      timestamp: new Date().toISOString(),
      event_type: safeType,
      actor: "system",
      metadata: typeof metadata === "string" ? { value: metadata } : metadata,
    });
  }
}
