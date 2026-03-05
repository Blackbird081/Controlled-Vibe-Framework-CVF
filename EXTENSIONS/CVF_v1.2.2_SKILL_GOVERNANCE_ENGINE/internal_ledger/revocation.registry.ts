export interface RevocationEntry {
  skill_id: string;
  reason: string;
  revoked_at: number;
}

export class RevocationRegistry {
  private revoked: Map<string, RevocationEntry> = new Map();

  revoke(skill_id: string, reason: string) {
    this.revoked.set(skill_id, {
      skill_id,
      reason,
      revoked_at: Date.now()
    });
  }

  isRevoked(skill_id: string): boolean {
    return this.revoked.has(skill_id);
  }

  get(skill_id: string): RevocationEntry | undefined {
    return this.revoked.get(skill_id);
  }
}