/**
 * Risk Gate Guard — Track IV Phase A.1
 *
 * Enforces CVF R0-R3 Risk Model.
 * Escalates or blocks actions based on risk level and role authorization.
 *
 * Rules:
 *   - R0 (Passive): Any role allowed
 *   - R1 (Controlled): Any role, logged
 *   - R2 (Elevated): Requires approval — ESCALATE for AI_AGENT
 *   - R3 (Critical): Hard gate — BLOCK for AI_AGENT, ESCALATE for others
 */

import {
  Guard,
  GuardRequestContext,
  GuardResult,
  CVFRiskLevel,
} from '../guard.runtime.types.js';

const RISK_NUMERIC: Record<CVFRiskLevel, number> = {
  R0: 0,
  R1: 1,
  R2: 2,
  R3: 3,
};

export class RiskGateGuard implements Guard {
  id = 'risk_gate';
  name = 'Risk Gate Guard';
  description = 'Enforces CVF R0-R3 risk model with role-based escalation.';
  priority = 20;
  enabled = true;

  evaluate(context: GuardRequestContext): GuardResult {
    const timestamp = new Date().toISOString();
    const riskNum = RISK_NUMERIC[context.riskLevel];

    if (riskNum === undefined) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'CRITICAL',
        reason: `Unknown risk level: "${context.riskLevel}". Valid levels: R0, R1, R2, R3.`,
        timestamp,
      };
    }

    if (context.riskLevel === 'R3') {
      if (context.role === 'AI_AGENT') {
        return {
          guardId: this.id,
          decision: 'BLOCK',
          severity: 'CRITICAL',
          reason: `R3 (Critical) actions are blocked for AI agents. Requires human-in-the-loop approval.`,
          timestamp,
          metadata: { riskLevel: context.riskLevel, role: context.role },
        };
      }
      return {
        guardId: this.id,
        decision: 'ESCALATE',
        severity: 'ERROR',
        reason: `R3 (Critical) action requires explicit human approval and audit trail.`,
        timestamp,
        metadata: { riskLevel: context.riskLevel, role: context.role },
      };
    }

    if (context.riskLevel === 'R2') {
      if (context.role === 'AI_AGENT') {
        return {
          guardId: this.id,
          decision: 'ESCALATE',
          severity: 'WARN',
          reason: `R2 (Elevated) action by AI agent requires approval. Escalating to human review.`,
          timestamp,
          metadata: { riskLevel: context.riskLevel, role: context.role },
        };
      }
      return {
        guardId: this.id,
        decision: 'ALLOW',
        severity: 'WARN',
        reason: `R2 (Elevated) action allowed for role "${context.role}" with logging.`,
        timestamp,
      };
    }

    return {
      guardId: this.id,
      decision: 'ALLOW',
      severity: 'INFO',
      reason: `Risk level "${context.riskLevel}" is within safe bounds for role "${context.role}".`,
      timestamp,
    };
  }
}

export { RISK_NUMERIC };
