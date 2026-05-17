import { PolicyDocument, PolicyConflict, PolicyRule } from "./types";

export class PolicyStore {
  private policies: Map<string, PolicyDocument> = new Map();
  private history: Map<string, PolicyDocument[]> = new Map();

  add(policy: PolicyDocument): void {
    const existing = this.policies.get(policy.id);
    if (existing) {
      this.archiveVersion(existing);
    }
    this.policies.set(policy.id, policy);
  }

  get(id: string): PolicyDocument | undefined {
    return this.policies.get(id);
  }

  list(): PolicyDocument[] {
    return [...this.policies.values()];
  }

  listActive(): PolicyDocument[] {
    return this.list().filter((p) => p.status === "active");
  }

  update(id: string, updates: Partial<Pick<PolicyDocument, "name" | "status" | "rules">>): PolicyDocument | undefined {
    const policy = this.policies.get(id);
    if (!policy) return undefined;

    this.archiveVersion(policy);

    const updated: PolicyDocument = {
      ...policy,
      ...updates,
      version: policy.version + 1,
      updatedAt: Date.now(),
    };

    this.policies.set(id, updated);
    return updated;
  }

  remove(id: string): boolean {
    return this.policies.delete(id);
  }

  getHistory(id: string): PolicyDocument[] {
    return this.history.get(id) ?? [];
  }

  detectConflicts(policy?: PolicyDocument): PolicyConflict[] {
    const conflicts: PolicyConflict[] = [];
    const targetPolicies = policy ? [policy] : this.list();
    const allPolicies = this.list();

    for (const target of targetPolicies) {
      for (const other of allPolicies) {
        if (target.id === other.id) continue;

        for (const ruleA of target.rules) {
          for (const ruleB of other.rules) {
            const conflict = this.checkRuleConflict(ruleA, ruleB);
            if (conflict) conflicts.push(conflict);
          }
        }
      }
    }

    return this.deduplicateConflicts(conflicts);
  }

  clear(): void {
    this.policies.clear();
    this.history.clear();
  }

  private archiveVersion(policy: PolicyDocument): void {
    const versions = this.history.get(policy.id) ?? [];
    versions.push({ ...policy });
    this.history.set(policy.id, versions);
  }

  private checkRuleConflict(ruleA: PolicyRule, ruleB: PolicyRule): PolicyConflict | null {
    if (ruleA.intentDomain !== ruleB.intentDomain) return null;
    if (ruleA.actionTrigger !== ruleB.actionTrigger) return null;

    if (this.isContradiction(ruleA, ruleB)) {
      return {
        ruleA,
        ruleB,
        conflictType: "contradiction",
        description: `Rules "${ruleA.id}" and "${ruleB.id}" have contradicting enforcement for ${ruleA.actionTrigger}: ${ruleA.enforcement} vs ${ruleB.enforcement}`,
      };
    }

    if (this.isSubsumption(ruleA, ruleB)) {
      return {
        ruleA,
        ruleB,
        conflictType: "subsumption",
        description: `Rule "${ruleA.id}" subsumes "${ruleB.id}" for ${ruleA.actionTrigger}`,
      };
    }

    if (this.isOverlap(ruleA, ruleB)) {
      return {
        ruleA,
        ruleB,
        conflictType: "overlap",
        description: `Rules "${ruleA.id}" and "${ruleB.id}" overlap on ${ruleA.actionTrigger}`,
      };
    }

    return null;
  }

  private isContradiction(a: PolicyRule, b: PolicyRule): boolean {
    const blocking = ["HARD_BLOCK", "REJECT_AND_RETRY"];
    const permissive = ["LOG_ONLY"];
    return (
      (blocking.includes(a.enforcement) && permissive.includes(b.enforcement)) ||
      (permissive.includes(a.enforcement) && blocking.includes(b.enforcement))
    );
  }

  private isSubsumption(a: PolicyRule, b: PolicyRule): boolean {
    const aKeys = Object.keys(a.constraints);
    const bKeys = Object.keys(b.constraints);
    if (aKeys.length === 0 || bKeys.length === 0) return false;
    return bKeys.every((k) => aKeys.includes(k)) && aKeys.length > bKeys.length;
  }

  private isOverlap(a: PolicyRule, b: PolicyRule): boolean {
    const aKeys = Object.keys(a.constraints);
    const bKeys = Object.keys(b.constraints);
    return aKeys.some((k) => bKeys.includes(k));
  }

  private deduplicateConflicts(conflicts: PolicyConflict[]): PolicyConflict[] {
    const seen = new Set<string>();
    return conflicts.filter((c) => {
      const key = [c.ruleA.id, c.ruleB.id].sort().join("|");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
