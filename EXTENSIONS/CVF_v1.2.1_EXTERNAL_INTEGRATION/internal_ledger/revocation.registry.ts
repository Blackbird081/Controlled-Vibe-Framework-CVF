// revocation.registry.ts

import crypto from "crypto";
import { CertificationState } from "../certification/certification.state.machine";

export type RevocationReason =
  | "policy_violation"
  | "risk_reclassification"
  | "integrity_failure"
  | "security_incident"
  | "manual_admin_action"
  | "compliance_requirement";

export interface RevocationEntry {

  skill_id: string;

  revoked_at: string;

  reason: RevocationReason;

  previous_state: CertificationState;

  actor: string;

  notes?: string;

  hash: string;

}

export class RevocationRegistry {

  private static revokedSkills: Map<string, RevocationEntry> = new Map();

  private static computeHash(entry: Omit<RevocationEntry, "hash">): string {

    const serialized = JSON.stringify(entry);

    return crypto
      .createHash("sha256")
      .update(serialized)
      .digest("hex");
  }

  static revoke(entryData: Omit<RevocationEntry, "hash">): RevocationEntry {

    if (this.revokedSkills.has(entryData.skill_id)) {
      throw new Error("Skill already revoked");
    }

    const hash = this.computeHash(entryData);

    const fullEntry: RevocationEntry = {
      ...entryData,
      hash
    };

    this.revokedSkills.set(entryData.skill_id, fullEntry);

    return fullEntry;
  }

  static isRevoked(skill_id: string): boolean {
    return this.revokedSkills.has(skill_id);
  }

  static getRevocation(skill_id: string): RevocationEntry | undefined {
    return this.revokedSkills.get(skill_id);
  }

  static listRevoked(): RevocationEntry[] {
    return Array.from(this.revokedSkills.values());
  }

}