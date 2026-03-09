/**
 * Risk Gate Guard — Enforces CVF R0-R3 risk model with NL guidance
 * @module guards/risk-gate.guard
 */

import type { Guard, GuardRequestContext, GuardResult, CVFRiskLevel } from './types.js';
import { RISK_NUMERIC } from './types.js';

export const RISK_DESCRIPTIONS: Record<CVFRiskLevel, string> = {
  R0: 'Safe — no risk, free to proceed',
  R1: 'Low — minor attention needed, proceed with logging',
  R2: 'Elevated — requires careful review, AI agents need human approval',
  R3: 'Critical — high-risk action, blocked for AI agents, requires explicit human sign-off',
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
        agentGuidance: `Risk level "${context.riskLevel}" is not recognized. CVF uses R0 (Safe), R1 (Low), R2 (Elevated), R3 (Critical). Please classify your action correctly.`,
        suggestedAction: 'specify_valid_risk_level',
        timestamp,
      };
    }

    if (context.riskLevel === 'R3') {
      if (context.role === 'AI_AGENT') {
        return {
          guardId: this.id,
          decision: 'BLOCK',
          severity: 'CRITICAL',
          reason: 'R3 (Critical) actions are blocked for AI agents. Requires human-in-the-loop approval.',
          agentGuidance: `This action is classified as R3 (Critical): ${RISK_DESCRIPTIONS.R3}. As an AI agent, you cannot perform this action autonomously. Please request human approval before proceeding. Present the action plan to the user and wait for explicit confirmation.`,
          suggestedAction: 'request_human_approval',
          timestamp,
          metadata: { riskLevel: context.riskLevel, role: context.role },
        };
      }
      return {
        guardId: this.id,
        decision: 'ESCALATE',
        severity: 'ERROR',
        reason: 'R3 (Critical) action requires explicit human approval and audit trail.',
        agentGuidance: `This is an R3 (Critical) action. A full audit trail will be maintained. Please confirm you understand the risks before proceeding.`,
        suggestedAction: 'confirm_with_audit',
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
          reason: 'R2 (Elevated) action by AI agent requires approval. Escalating to human review.',
          agentGuidance: `This action is R2 (Elevated): ${RISK_DESCRIPTIONS.R2}. You should present a summary of what you plan to do and ask the user to approve before executing. Do not proceed autonomously.`,
          suggestedAction: 'present_plan_for_approval',
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
      reason: `Risk level "${context.riskLevel}" (${RISK_DESCRIPTIONS[context.riskLevel]}) is within safe bounds for role "${context.role}".`,
      timestamp,
    };
  }
}
