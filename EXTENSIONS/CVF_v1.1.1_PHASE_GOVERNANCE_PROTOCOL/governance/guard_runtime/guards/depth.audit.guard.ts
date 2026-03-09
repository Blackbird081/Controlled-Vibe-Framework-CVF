/**
 * Depth Audit Guard — Track IV Phase A.2
 *
 * Runtime enforcement of the CVF Depth Audit policy.
 * Prevents uncontrolled semantic deepening without scoring justification.
 *
 * Rules:
 *   - 5 criteria scored 0-2 each (max 10)
 *   - Score 8-10: CONTINUE (ALLOW)
 *   - Score 6-7: REVIEW REQUIRED (ESCALATE)
 *   - Score 0-5: DEFER (BLOCK)
 *   - Hard-stop: if any of risk_reduction, decision_value, machine_enforceability is 0 → BLOCK
 */

import {
  Guard,
  GuardRequestContext,
  GuardResult,
} from '../guard.runtime.types.js';

export interface DepthAuditScores {
  riskReduction: 0 | 1 | 2;
  decisionValue: 0 | 1 | 2;
  machineEnforceability: 0 | 1 | 2;
  operationalEfficiency: 0 | 1 | 2;
  portfolioPriority: 0 | 1 | 2;
}

const DEEPENING_ACTION_PATTERNS = [
  /^feat\(layer\)/i,
  /^feat\(phase\)/i,
  /^feat\(semantic\)/i,
  /^feat\(policy[_-]layer\)/i,
  /deepen/i,
  /new[_-]?layer/i,
  /add[_-]?phase/i,
];

export class DepthAuditGuard implements Guard {
  id = 'depth_audit';
  name = 'Depth Audit Guard';
  description = 'Prevents uncontrolled semantic deepening without scored justification.';
  priority = 75;
  enabled = true;

  evaluate(context: GuardRequestContext): GuardResult {
    const timestamp = new Date().toISOString();
    const action = context.action;

    const requiresAudit = DEEPENING_ACTION_PATTERNS.some((p) => p.test(action));
    if (!requiresAudit) {
      return {
        guardId: this.id,
        decision: 'ALLOW',
        severity: 'INFO',
        reason: `Action "${action}" does not trigger depth audit.`,
        timestamp,
      };
    }

    const scores = context.metadata?.['depthAuditScores'] as DepthAuditScores | undefined;
    if (!scores) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: `Action "${action}" triggers depth audit. Provide metadata.depthAuditScores with 5 criteria (0-2 each).`,
        timestamp,
        metadata: { action, required: 'depthAuditScores' },
      };
    }

    if (scores.riskReduction === 0 || scores.decisionValue === 0 || scores.machineEnforceability === 0) {
      const zeroFields: string[] = [];
      if (scores.riskReduction === 0) zeroFields.push('riskReduction');
      if (scores.decisionValue === 0) zeroFields.push('decisionValue');
      if (scores.machineEnforceability === 0) zeroFields.push('machineEnforceability');

      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'CRITICAL',
        reason: `Hard-stop: critical criteria scored 0: ${zeroFields.join(', ')}. Deepening DEFERRED.`,
        timestamp,
        metadata: { scores, zeroFields },
      };
    }

    const total = scores.riskReduction + scores.decisionValue + scores.machineEnforceability
      + scores.operationalEfficiency + scores.portfolioPriority;

    if (total >= 8) {
      return {
        guardId: this.id,
        decision: 'ALLOW',
        severity: 'INFO',
        reason: `Depth audit passed with score ${total}/10. CONTINUE.`,
        timestamp,
        metadata: { scores, total },
      };
    }

    if (total >= 6) {
      return {
        guardId: this.id,
        decision: 'ESCALATE',
        severity: 'WARN',
        reason: `Depth audit score ${total}/10 requires REVIEW. Escalating for human decision.`,
        timestamp,
        metadata: { scores, total },
      };
    }

    return {
      guardId: this.id,
      decision: 'BLOCK',
      severity: 'ERROR',
      reason: `Depth audit score ${total}/10 is below threshold. Deepening DEFERRED.`,
      timestamp,
      metadata: { scores, total },
    };
  }
}

export { DEEPENING_ACTION_PATTERNS };
