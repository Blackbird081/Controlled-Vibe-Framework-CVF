/**
 * Risk Gate Guard — v1.1.3 Governance Runtime Hardening
 *
 * Enforces CVF R0-R3 Risk Model.
 * Escalates or blocks actions based on risk level and role authorization.
 *
 * v1.1.3 changes:
 *   - Updated role references from AI_AGENT to BUILDER
 *   - BUILDER and ANALYST are escalated at R2, blocked at R3
 *   - OBSERVER is blocked at R1+
 *   - GOVERNOR allows up to R3
 *   - REVIEWER allows up to R2
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

    // R3: Critical — only GOVERNOR allowed, others blocked or escalated
    if (context.riskLevel === 'R3') {
      if (context.role === 'GOVERNOR' || context.role === 'HUMAN' || context.role === 'OPERATOR') {
        return {
          guardId: this.id,
          decision: 'ESCALATE',
          severity: 'ERROR',
          reason: `R3 (Critical) action by ${context.role} requires explicit audit trail.`,
          timestamp,
          metadata: { riskLevel: context.riskLevel, role: context.role },
        };
      }
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'CRITICAL',
        reason: `R3 (Critical) actions are blocked for role "${context.role}". Requires Governor or human-in-the-loop approval.`,
        timestamp,
        metadata: { riskLevel: context.riskLevel, role: context.role },
      };
    }

    // R2: Elevated — BUILDER/ANALYST escalated, OBSERVER blocked
    if (context.riskLevel === 'R2') {
      if (context.role === 'OBSERVER') {
        return {
          guardId: this.id,
          decision: 'BLOCK',
          severity: 'ERROR',
          reason: `R2 (Elevated) actions are blocked for Observer role.`,
          timestamp,
          metadata: { riskLevel: context.riskLevel, role: context.role },
        };
      }
      if (context.role === 'BUILDER' || context.role === 'ANALYST' || context.role === 'AI_AGENT') {
        return {
          guardId: this.id,
          decision: 'ESCALATE',
          severity: 'WARN',
          reason: `R2 (Elevated) action by "${context.role}" requires approval. Escalating to review.`,
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

    // R1: Controlled — OBSERVER blocked
    if (context.riskLevel === 'R1') {
      if (context.role === 'OBSERVER') {
        return {
          guardId: this.id,
          decision: 'BLOCK',
          severity: 'WARN',
          reason: `R1 (Controlled) actions are blocked for Observer role. Max risk: R0.`,
          timestamp,
          metadata: { riskLevel: context.riskLevel, role: context.role },
        };
      }
    }

    // R0/R1 for non-Observer: Allow
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
