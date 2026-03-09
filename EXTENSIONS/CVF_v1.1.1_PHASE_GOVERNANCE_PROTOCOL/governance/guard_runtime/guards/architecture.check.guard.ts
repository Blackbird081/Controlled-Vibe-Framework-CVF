/**
 * Architecture Check Guard — Track IV Phase A.2
 *
 * Runtime enforcement of the CVF Architecture Check policy.
 * Blocks proposals for new features/versions/layers that haven't completed
 * the mandatory 9-question checklist from CVF_CORE_KNOWLEDGE_BASE.md Section XII.
 *
 * Rules:
 *   - New version/layer/extension/module proposals must provide checklist answers
 *   - Must specify: layer placement, principle compliance, overlap check, backward compat
 *   - Bug fixes, tests, and doc updates are exempt
 */

import {
  Guard,
  GuardRequestContext,
  GuardResult,
} from '../guard.runtime.types.js';

export interface ArchitectureChecklist {
  layerPlacement: number;
  principleCompliance: boolean;
  overlapCheck: boolean;
  backwardCompat: boolean;
  kbRead: boolean;
}

const ARCHITECTURE_TRIGGER_PATTERNS = [
  /^feat\(.*version\)/i,
  /^feat\(.*layer\)/i,
  /^feat\(.*extension\)/i,
  /^feat\(.*module\)/i,
  /new[_-]?extension/i,
  /new[_-]?version/i,
  /new[_-]?layer/i,
  /add[_-]?extension/i,
  /refactor\(arch\)/i,
];

const ARCHITECTURE_EXEMPT_PATTERNS = [
  /^fix:/i,
  /^test:/i,
  /^docs:(comment|typo)/i,
  /^chore:(dep|format|lint)/i,
];

export class ArchitectureCheckGuard implements Guard {
  id = 'architecture_check';
  name = 'Architecture Check Guard';
  description = 'Ensures new proposals complete the mandatory 9-question architecture checklist.';
  priority = 72;
  enabled = true;

  evaluate(context: GuardRequestContext): GuardResult {
    const timestamp = new Date().toISOString();
    const action = context.action;

    const isExempt = ARCHITECTURE_EXEMPT_PATTERNS.some((p) => p.test(action));
    if (isExempt) {
      return {
        guardId: this.id,
        decision: 'ALLOW',
        severity: 'INFO',
        reason: `Action "${action}" is exempt from architecture check.`,
        timestamp,
      };
    }

    const requiresCheck = ARCHITECTURE_TRIGGER_PATTERNS.some((p) => p.test(action));
    if (!requiresCheck) {
      return {
        guardId: this.id,
        decision: 'ALLOW',
        severity: 'INFO',
        reason: `Action "${action}" does not trigger architecture check.`,
        timestamp,
      };
    }

    const checklist = context.metadata?.['architectureChecklist'] as ArchitectureChecklist | undefined;
    if (!checklist) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: `Action "${action}" requires architecture checklist. Provide metadata.architectureChecklist.`,
        timestamp,
        metadata: { action, required: 'architectureChecklist' },
      };
    }

    const failures: string[] = [];
    if (!checklist.kbRead) failures.push('kbRead (must read CVF_CORE_KNOWLEDGE_BASE.md)');
    if (checklist.layerPlacement < 1 || checklist.layerPlacement > 5) failures.push('layerPlacement (must be 1-5)');
    if (!checklist.principleCompliance) failures.push('principleCompliance (must confirm no principle violations)');
    if (!checklist.overlapCheck) failures.push('overlapCheck (must confirm no overlap with existing)');
    if (!checklist.backwardCompat) failures.push('backwardCompat (must confirm backward compatibility)');

    if (failures.length > 0) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: `Architecture checklist incomplete: ${failures.join('; ')}.`,
        timestamp,
        metadata: { checklist, failures },
      };
    }

    return {
      guardId: this.id,
      decision: 'ALLOW',
      severity: 'INFO',
      reason: `Architecture checklist complete. Layer ${checklist.layerPlacement}, all checks passed.`,
      timestamp,
      metadata: { checklist },
    };
  }
}

export { ARCHITECTURE_TRIGGER_PATTERNS, ARCHITECTURE_EXEMPT_PATTERNS };
