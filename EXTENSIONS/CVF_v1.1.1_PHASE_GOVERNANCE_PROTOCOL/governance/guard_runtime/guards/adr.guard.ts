/**
 * ADR Guard — Track IV Phase A.2
 *
 * Runtime enforcement of Architecture Decision Records policy.
 * Blocks commits with architectural scope that lack a corresponding ADR entry.
 *
 * Rules:
 *   - Commits with feat(core-value|governance|domain|arch) patterns require ADR
 *   - Commits with refactor(arch) or docs(policy) require ADR
 *   - Major chore(remove) operations require ADR
 *   - Simple fix/test/chore commits do NOT require ADR
 */

import {
  Guard,
  GuardRequestContext,
  GuardResult,
} from '../guard.runtime.types.js';

const ADR_TRIGGER_PATTERNS = [
  /^feat\((core[_-]?value|governance|domain|skills)\)/i,
  /^refactor\(arch\)/i,
  /^docs\(policy\)/i,
  /^chore\(remove\)/i,
];

const ADR_EXEMPT_PATTERNS = [
  /^fix:/i,
  /^test:/i,
  /^chore:(dep|format|lint|ci)/i,
  /^docs:(comment|typo|readme)/i,
];

export class AdrGuard implements Guard {
  id = 'adr_guard';
  name = 'ADR Guard';
  description = 'Ensures architectural commits have corresponding ADR entries.';
  priority = 70;
  enabled = true;

  private adrEntries: Set<string> = new Set();

  registerAdrEntry(adrId: string): void {
    this.adrEntries.add(adrId.toUpperCase());
  }

  hasAdrEntry(adrId: string): boolean {
    return this.adrEntries.has(adrId.toUpperCase());
  }

  getAdrCount(): number {
    return this.adrEntries.size;
  }

  evaluate(context: GuardRequestContext): GuardResult {
    const timestamp = new Date().toISOString();
    const action = context.action;

    const isExempt = ADR_EXEMPT_PATTERNS.some((p) => p.test(action));
    if (isExempt) {
      return {
        guardId: this.id,
        decision: 'ALLOW',
        severity: 'INFO',
        reason: `Action "${action}" is exempt from ADR requirement.`,
        timestamp,
      };
    }

    const requiresAdr = ADR_TRIGGER_PATTERNS.some((p) => p.test(action));
    if (!requiresAdr) {
      return {
        guardId: this.id,
        decision: 'ALLOW',
        severity: 'INFO',
        reason: `Action "${action}" does not trigger ADR requirement.`,
        timestamp,
      };
    }

    const adrRef = context.metadata?.['adrId'] as string | undefined;
    if (!adrRef) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: `Action "${action}" requires an ADR entry. Provide metadata.adrId (e.g., "ADR-001").`,
        timestamp,
        metadata: { action, triggerPattern: 'architectural_commit' },
      };
    }

    if (this.adrEntries.size > 0 && !this.hasAdrEntry(adrRef)) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: `ADR "${adrRef}" not found in registry. Register it before committing.`,
        timestamp,
        metadata: { adrId: adrRef, registeredCount: this.adrEntries.size },
      };
    }

    return {
      guardId: this.id,
      decision: 'ALLOW',
      severity: 'INFO',
      reason: `ADR requirement satisfied with "${adrRef}".`,
      timestamp,
    };
  }
}

export { ADR_TRIGGER_PATTERNS, ADR_EXEMPT_PATTERNS };
