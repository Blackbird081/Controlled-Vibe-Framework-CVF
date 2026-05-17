/**
 * CVF Governance Facade
 * =====================
 * Single entry point for ALL governance operations.
 * Delegates to CVF_GUARD_CONTRACT and CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL.
 *
 * This facade does NOT replace underlying modules — it provides a stable
 * plane-level API that consumers should prefer over direct imports.
 *
 * @module cvf-plane-facades/governance
 */

import type {
  GuardRequestContext,
  GuardPipelineResult,
  GuardAuditEntry,
  GuardRuntimeConfig,
  CanonicalCVFPhase,
  CVFRiskLevel,
  CVFRole,
  Guard,
} from 'cvf-guard-contract';

import {
  createGuardEngine,
  GuardRuntimeEngine,
  PHASE_ORDER,
  RISK_NUMERIC,
  MANDATORY_GUARD_IDS,
} from 'cvf-guard-contract';

// ─── Facade Types ─────────────────────────────────────────────────────

export interface GovernanceCheckRequest {
  action: string;
  phase?: CanonicalCVFPhase;
  riskLevel?: CVFRiskLevel;
  role?: CVFRole;
  agentId?: string;
  targetFiles?: string[];
  fileScope?: string[];
  channel?: 'web' | 'ide' | 'cli' | 'mcp' | 'api';
  metadata?: Record<string, unknown>;
}

export interface GovernanceCheckResult {
  allowed: boolean;
  decision: 'ALLOW' | 'BLOCK' | 'ESCALATE';
  reason: string;
  requestId: string;
  pipelineResult: GuardPipelineResult;
  blockedBy?: string;
  escalatedBy?: string;
}

export interface PhaseValidationResult {
  valid: boolean;
  currentPhase: CanonicalCVFPhase;
  targetPhase: CanonicalCVFPhase;
  reason: string;
}

// ─── Governance Facade ────────────────────────────────────────────────

export class GovernanceFacade {
  private engine: GuardRuntimeEngine;
  private auditLog: GovernanceCheckResult[] = [];

  constructor(config?: Partial<GuardRuntimeConfig>) {
    this.engine = createGuardEngine(config);
  }

  /**
   * Evaluate guards for a given request context.
   * This is the CANONICAL way to run guard evaluation from any plane.
   */
  evaluateGuards(context: GuardRequestContext): GuardPipelineResult {
    return this.engine.evaluate(context);
  }

  /**
   * High-level check: is this action allowed?
   * Builds GuardRequestContext internally from simplified input.
   */
  checkAction(request: GovernanceCheckRequest): GovernanceCheckResult {
    const context: GuardRequestContext = {
      requestId: `gf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      phase: request.phase || 'BUILD',
      riskLevel: request.riskLevel || 'R1',
      role: request.role || 'AI_AGENT',
      agentId: request.agentId,
      action: request.action,
      targetFiles: request.targetFiles,
      fileScope: request.fileScope,
      channel: request.channel || 'api',
      metadata: request.metadata,
    };

    const pipelineResult = this.engine.evaluate(context);

    const result: GovernanceCheckResult = {
      allowed: pipelineResult.finalDecision === 'ALLOW',
      decision: pipelineResult.finalDecision,
      reason: pipelineResult.agentGuidance || `Guard decision: ${pipelineResult.finalDecision}`,
      requestId: pipelineResult.requestId,
      pipelineResult,
      blockedBy: pipelineResult.blockedBy,
      escalatedBy: pipelineResult.escalatedBy,
    };

    this.auditLog.push(result);
    return result;
  }

  /**
   * Assert that an action is allowed. Throws if blocked or escalated.
   */
  assertAllowed(request: GovernanceCheckRequest): void {
    const result = this.checkAction(request);
    if (!result.allowed) {
      throw new Error(
        `[CVF Governance ${result.decision}] ${result.reason}` +
        (result.blockedBy ? ` (blocked by: ${result.blockedBy})` : '')
      );
    }
  }

  /**
   * Validate a phase transition.
   * Phases must follow: INTAKE → DESIGN → BUILD → REVIEW → FREEZE
   */
  validatePhaseTransition(
    currentPhase: CanonicalCVFPhase,
    targetPhase: CanonicalCVFPhase,
  ): PhaseValidationResult {
    const currentIdx = PHASE_ORDER.indexOf(currentPhase);
    const targetIdx = PHASE_ORDER.indexOf(targetPhase);

    if (currentIdx === -1 || targetIdx === -1) {
      return {
        valid: false,
        currentPhase,
        targetPhase,
        reason: `Unknown phase: ${currentIdx === -1 ? currentPhase : targetPhase}`,
      };
    }

    // Only forward transitions allowed (no skipping)
    const valid = targetIdx === currentIdx + 1;

    return {
      valid,
      currentPhase,
      targetPhase,
      reason: valid
        ? `Valid transition: ${currentPhase} → ${targetPhase}`
        : `Invalid: cannot transition from ${currentPhase} to ${targetPhase}. Next allowed: ${PHASE_ORDER[currentIdx + 1] || 'NONE (already FROZEN)'}`,
    };
  }

  /**
   * Register an additional guard into the engine.
   * Per GR-07: GUARD_CONTRACT allows ADDING guards, not removing existing ones.
   */
  registerAdditionalGuard(guard: Guard): void {
    this.engine.registerGuard(guard);
  }

  /**
   * Get facade audit log (governance-level decisions).
   */
  getAuditLog(): readonly GovernanceCheckResult[] {
    return this.auditLog;
  }

  /**
   * Get the underlying engine's audit log (raw guard-level entries).
   */
  getRawAuditLog(): readonly GuardAuditEntry[] {
    return this.engine.getAuditLog();
  }

  /**
   * Get risk numeric value for comparison.
   */
  getRiskNumeric(level: CVFRiskLevel): number {
    return RISK_NUMERIC[level];
  }

  /**
   * Check if a guard ID is in the mandatory set.
   */
  isMandatoryGuard(guardId: string): boolean {
    return (MANDATORY_GUARD_IDS as readonly string[]).includes(guardId);
  }
}

// ─── Factory ──────────────────────────────────────────────────────────

/**
 * Create a GovernanceFacade with the canonical 8-guard engine.
 * This is the RECOMMENDED entry point for governance operations.
 */
export function createGovernanceFacade(
  config?: Partial<GuardRuntimeConfig>,
): GovernanceFacade {
  return new GovernanceFacade(config);
}
