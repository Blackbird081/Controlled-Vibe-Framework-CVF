/**
 * CVF VS Code / External Agent Governance Adapter
 *
 * Implements CVFGuardContract for non-Web-UI channels.
 * Replaces manual prompt injection with programmatic enforcement.
 *
 * Usage:
 *   const adapter = new VSCodeGovernanceAdapter({ phase: 'BUILD', role: 'BUILDER', riskLevel: 'R2' });
 *   const result = adapter.evaluate(request);
 *   const prompt = adapter.generateSystemPrompt();
 *
 * @module governance/contracts/adapters/vscode-governance-adapter
 * @version 1.0.0
 */

import {
  type CVFCanonicalPhase,
  type CVFCanonicalRisk,
  type CVFCanonicalRole,
  type CVFCanonicalDecision,
  type CVFGuardRequest,
  type CVFGuardResult,
  type CVFGuardPipelineResult,
  type CVFGuardAuditEntry,
  type CVFGuardContract,
  type CVFHealthStatus,
  type CVFChannel,
  type CVFPhaseAdvanceRequest,
  type CVFPhaseAdvanceResult,
  normalizePhase,
  normalizeRisk,
  CANONICAL_PHASE_ORDER,
  CANONICAL_RISK_NUMERIC,
  riskExceeds,
  comparePhase,
} from '../cross-channel-guard-contract.js';

// ─── Phase-Role Authority Matrix ─────────────────────────────────────

export const PHASE_ROLE_ALLOWED_ACTIONS: Record<CVFCanonicalPhase, Partial<Record<CVFCanonicalRole, string[]>>> = {
  INTAKE: {
    OBSERVER: ['read context', 'ask clarification'],
    ANALYST: ['read context', 'ask clarification', 'analyze inputs', 'summarize scope'],
    BUILDER: ['read context'],
    REVIEWER: ['read context', 'ask clarification'],
    GOVERNOR: ['read context', 'set constraints', 'define scope'],
    HUMAN: ['read context', 'ask clarification', 'analyze inputs', 'summarize scope'],
    AI_AGENT: ['read context', 'ask clarification', 'analyze inputs'],
    OPERATOR: ['read context', 'set constraints'],
  },
  DESIGN: {
    OBSERVER: ['read context'],
    ANALYST: ['propose solutions', 'compare trade-offs', 'create diagrams'],
    BUILDER: ['propose solutions', 'estimate effort'],
    REVIEWER: ['read context', 'propose solutions'],
    GOVERNOR: ['approve design', 'set constraints'],
    HUMAN: ['propose solutions', 'compare trade-offs', 'create diagrams', 'approve design'],
    AI_AGENT: ['propose solutions', 'compare trade-offs', 'estimate effort'],
    OPERATOR: ['approve design', 'set constraints'],
  },
  BUILD: {
    OBSERVER: ['read code'],
    ANALYST: ['read code', 'analyze patterns'],
    BUILDER: ['write code', 'create files', 'modify files', 'run tests', 'fix bugs'],
    REVIEWER: ['read code'],
    GOVERNOR: ['read code', 'pause execution'],
    HUMAN: ['write code', 'create files', 'modify files', 'run tests', 'fix bugs', 'approve'],
    AI_AGENT: ['write code', 'create files', 'modify files', 'run tests', 'fix bugs'],
    OPERATOR: ['read code', 'pause execution'],
  },
  REVIEW: {
    OBSERVER: ['read code'],
    ANALYST: ['read code', 'analyze patterns'],
    BUILDER: ['fix issues from review'],
    REVIEWER: ['critique code', 'run tests', 'approve', 'reject', 'request changes'],
    GOVERNOR: ['approve', 'reject', 'override'],
    HUMAN: ['critique code', 'run tests', 'approve', 'reject', 'request changes'],
    AI_AGENT: ['critique code', 'run tests'],
    OPERATOR: ['approve', 'reject', 'override'],
  },
  FREEZE: {
    OBSERVER: ['read only'],
    ANALYST: ['read only'],
    BUILDER: ['read only'],
    REVIEWER: ['read only'],
    GOVERNOR: ['unlock if needed', 'emergency changes only'],
    HUMAN: ['read only', 'unlock if needed'],
    AI_AGENT: ['read only'],
    OPERATOR: ['unlock if needed', 'emergency changes only'],
  },
};

export const PHASE_MAX_RISK: Record<CVFCanonicalPhase, CVFCanonicalRisk> = {
  INTAKE: 'R1',
  DESIGN: 'R2',
  BUILD: 'R3',
  REVIEW: 'R3',
  FREEZE: 'R4',
};

// ─── Adapter Configuration ───────────────────────────────────────────

export interface VSCodeAdapterConfig {
  phase: CVFCanonicalPhase | string;
  role: CVFCanonicalRole | string;
  riskLevel: CVFCanonicalRisk | string;
  channel?: CVFChannel;
  strictMode?: boolean;
  maxAuditEntries?: number;
}

// ─── VS Code Governance Adapter ──────────────────────────────────────

export class VSCodeGovernanceAdapter implements CVFGuardContract {
  readonly channel: CVFChannel;
  private _phase: CVFCanonicalPhase;
  private _role: CVFCanonicalRole;
  private _riskLevel: CVFCanonicalRisk;
  private _strictMode: boolean;
  private _auditLog: CVFGuardAuditEntry[] = [];
  private _maxAuditEntries: number;

  constructor(config: VSCodeAdapterConfig) {
    this.channel = config.channel ?? 'vscode';
    this._phase = normalizePhase(typeof config.phase === 'string' ? config.phase : config.phase);
    this._riskLevel = normalizeRisk(typeof config.riskLevel === 'string' ? config.riskLevel : config.riskLevel);
    this._role = (config.role as CVFCanonicalRole) ?? 'AI_AGENT';
    this._strictMode = config.strictMode ?? true;
    this._maxAuditEntries = config.maxAuditEntries ?? 1000;
  }

  // ─── State Access ────────────────────────────────────────────────

  get phase(): CVFCanonicalPhase { return this._phase; }
  get role(): CVFCanonicalRole { return this._role; }
  get riskLevel(): CVFCanonicalRisk { return this._riskLevel; }

  setPhase(phase: string): void { this._phase = normalizePhase(phase); }
  setRole(role: CVFCanonicalRole): void { this._role = role; }
  setRiskLevel(risk: string): void { this._riskLevel = normalizeRisk(risk); }

  // ─── Guard Contract Implementation ───────────────────────────────

  evaluate(request: CVFGuardRequest): CVFGuardPipelineResult {
    const start = Date.now();
    const results: CVFGuardResult[] = [];

    // Guard 1: Phase gate
    results.push(this._checkPhaseGateInternal(request));

    // Guard 2: Risk gate
    results.push(this._checkRiskGateInternal(request));

    // Guard 3: Authority gate
    results.push(this._checkAuthorityGate(request));

    // Determine final decision (most restrictive wins)
    const finalDecision = this._resolveFinalDecision(results);
    const blockedResult = results.find(r => r.decision === 'BLOCK');
    const escalatedResult = results.find(r => r.decision === 'ESCALATE');

    const pipelineResult: CVFGuardPipelineResult = {
      requestId: request.requestId,
      channel: this.channel,
      finalDecision,
      results,
      executedAt: new Date().toISOString(),
      durationMs: Date.now() - start,
      blockedBy: blockedResult?.guardId,
      escalatedBy: escalatedResult?.guardId,
      agentGuidance: this._buildGuidance(finalDecision, results),
    };

    // Audit
    this._addAuditEntry(request, pipelineResult);

    return pipelineResult;
  }

  checkPhaseGate(request: CVFGuardRequest): CVFGuardResult {
    return this._checkPhaseGateInternal(request);
  }

  checkRiskGate(request: CVFGuardRequest): CVFGuardResult {
    return this._checkRiskGateInternal(request);
  }

  getAuditLog(limit?: number): CVFGuardAuditEntry[] {
    if (limit) return this._auditLog.slice(-limit);
    return [...this._auditLog];
  }

  healthCheck(): CVFHealthStatus {
    return {
      channel: this.channel,
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      guardsLoaded: 3, // phase, risk, authority
    };
  }

  // ─── Phase Advancement ───────────────────────────────────────────

  advancePhase(request: CVFPhaseAdvanceRequest): CVFPhaseAdvanceResult {
    const currentIdx = CANONICAL_PHASE_ORDER.indexOf(request.currentPhase);
    const targetIdx = CANONICAL_PHASE_ORDER.indexOf(request.targetPhase);

    if (targetIdx <= currentIdx) {
      return {
        allowed: false,
        fromPhase: request.currentPhase,
        toPhase: request.targetPhase,
        reason: `Cannot move backward from ${request.currentPhase} to ${request.targetPhase}`,
        timestamp: new Date().toISOString(),
      };
    }

    if (targetIdx > currentIdx + 1 && this._strictMode) {
      return {
        allowed: false,
        fromPhase: request.currentPhase,
        toPhase: request.targetPhase,
        reason: `Strict mode: can only advance one phase at a time (from ${request.currentPhase})`,
        timestamp: new Date().toISOString(),
      };
    }

    this._phase = request.targetPhase;
    return {
      allowed: true,
      fromPhase: request.currentPhase,
      toPhase: request.targetPhase,
      reason: request.justification,
      timestamp: new Date().toISOString(),
    };
  }

  // ─── System Prompt Generation ────────────────────────────────────

  generateSystemPrompt(): string {
    const allowedActions = PHASE_ROLE_ALLOWED_ACTIONS[this._phase]?.[this._role] ?? ['read only'];
    const maxRisk = PHASE_MAX_RISK[this._phase];

    return `[CVF GOVERNANCE TOOLKIT — ACTIVE]

YOU ARE OPERATING IN A CVF-GOVERNED ENVIRONMENT.

CURRENT DECLARATION:
- Phase: ${this._phase}
- Role: ${this._role}
- Risk Level: ${this._riskLevel}
- Channel: ${this.channel}

ALLOWED ACTIONS FOR ${this._phase} + ${this._role}:
${allowedActions.map(a => `  - ${a}`).join('\n')}

MAX RISK FOR ${this._phase}: ${maxRisk}
CURRENT RISK: ${this._riskLevel}${riskExceeds(this._riskLevel, maxRisk) ? ' ⚠️ EXCEEDS MAX' : ''}

MANDATORY RULES:
1. ONLY perform actions in the ALLOWED list above.
2. REFUSE any request outside scope — explain which rule is violated.
3. DO NOT switch phases — requires user confirmation.
4. If risk exceeds ${maxRisk} → STOP, warn, request confirmation.
5. If uncertain → STOP and ask.
6. Governance takes PRIORITY over speed, creativity, and autonomy.

REFUSAL TEMPLATE:
"I cannot perform this request. Per CVF Authority Matrix,
role ${this._role} in phase ${this._phase} is not authorized to [action].
Please switch phase/role or adjust the request."`;
  }

  // ─── Internal Guards ─────────────────────────────────────────────

  private _checkPhaseGateInternal(request: CVFGuardRequest): CVFGuardResult {
    const requestPhase = request.phase;
    const currentPhase = this._phase;

    if (requestPhase !== currentPhase) {
      return {
        guardId: 'phase-gate',
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: `Action requires phase ${requestPhase} but current phase is ${currentPhase}`,
        timestamp: new Date().toISOString(),
        suggestedAction: `Advance to ${requestPhase} before performing this action`,
      };
    }

    return {
      guardId: 'phase-gate',
      decision: 'ALLOW',
      severity: 'INFO',
      reason: `Action allowed in phase ${currentPhase}`,
      timestamp: new Date().toISOString(),
    };
  }

  private _checkRiskGateInternal(request: CVFGuardRequest): CVFGuardResult {
    const maxRisk = PHASE_MAX_RISK[this._phase];
    const requestRisk = request.riskLevel;

    if (riskExceeds(requestRisk, maxRisk)) {
      if (this._strictMode) {
        return {
          guardId: 'risk-gate',
          decision: 'BLOCK',
          severity: 'CRITICAL',
          reason: `Risk ${requestRisk} exceeds max ${maxRisk} for phase ${this._phase}`,
          timestamp: new Date().toISOString(),
          suggestedAction: `Reduce risk level or advance to a higher phase`,
        };
      }
      return {
        guardId: 'risk-gate',
        decision: 'ESCALATE',
        severity: 'WARN',
        reason: `Risk ${requestRisk} exceeds max ${maxRisk} for phase ${this._phase} — requires approval`,
        timestamp: new Date().toISOString(),
        suggestedAction: `Get human approval before proceeding`,
      };
    }

    return {
      guardId: 'risk-gate',
      decision: 'ALLOW',
      severity: 'INFO',
      reason: `Risk ${requestRisk} within limit ${maxRisk} for phase ${this._phase}`,
      timestamp: new Date().toISOString(),
    };
  }

  private _checkAuthorityGate(request: CVFGuardRequest): CVFGuardResult {
    const allowed = PHASE_ROLE_ALLOWED_ACTIONS[this._phase]?.[request.role];
    if (!allowed) {
      return {
        guardId: 'authority-gate',
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: `Role ${request.role} has no permissions in phase ${this._phase}`,
        timestamp: new Date().toISOString(),
      };
    }

    const actionLower = request.action.toLowerCase();
    const isAllowed = allowed.some(a => actionLower.includes(a.toLowerCase()));

    if (!isAllowed) {
      return {
        guardId: 'authority-gate',
        decision: this._strictMode ? 'BLOCK' : 'ESCALATE',
        severity: 'WARN',
        reason: `Action "${request.action}" not in allowed list for ${request.role} in ${this._phase}`,
        timestamp: new Date().toISOString(),
        agentGuidance: `Allowed actions: ${allowed.join(', ')}`,
      };
    }

    return {
      guardId: 'authority-gate',
      decision: 'ALLOW',
      severity: 'INFO',
      reason: `Role ${request.role} authorized for "${request.action}" in ${this._phase}`,
      timestamp: new Date().toISOString(),
    };
  }

  // ─── Helpers ─────────────────────────────────────────────────────

  private _resolveFinalDecision(results: CVFGuardResult[]): CVFCanonicalDecision {
    if (results.some(r => r.decision === 'BLOCK')) return 'BLOCK';
    if (results.some(r => r.decision === 'ESCALATE')) return 'ESCALATE';
    if (results.some(r => r.decision === 'CLARIFY')) return 'CLARIFY';
    return 'ALLOW';
  }

  private _buildGuidance(decision: CVFCanonicalDecision, results: CVFGuardResult[]): string {
    if (decision === 'ALLOW') return 'All guards passed. Action permitted.';
    const blocking = results.filter(r => r.decision !== 'ALLOW');
    return blocking.map(r => `[${r.guardId}] ${r.reason}`).join('; ');
  }

  private _addAuditEntry(request: CVFGuardRequest, result: CVFGuardPipelineResult): void {
    this._auditLog.push({
      requestId: request.requestId,
      timestamp: new Date().toISOString(),
      channel: this.channel,
      request,
      pipelineResult: result,
    });

    if (this._auditLog.length > this._maxAuditEntries) {
      this._auditLog = this._auditLog.slice(-this._maxAuditEntries);
    }
  }
}
