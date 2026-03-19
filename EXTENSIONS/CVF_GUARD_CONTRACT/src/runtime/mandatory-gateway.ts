/**
 * CVF Mandatory Gateway Mode
 * ============================
 * When enabled, ALL execution channels MUST pass through CVF guard evaluation
 * before any action is executed. SDK-level enforcement.
 *
 * Sprint 8 — Task 8.3
 *
 * @module cvf-guard-contract/runtime/mandatory-gateway
 */

import { GuardRuntimeEngine } from '../engine';
import type { GuardRequestContext, GuardPipelineResult, CVFPhase, CVFRiskLevel, CVFRole } from '../types';

// ─── Types ───────────────────────────────────────────────────────────

export interface GatewayConfig {
  /** If true, ALL actions MUST pass guard evaluation. Default: true */
  enforceAll: boolean;
  /** If true, BLOCK stops execution. If false, BLOCK is logged but execution continues. Default: true */
  hardBlock: boolean;
  /** If true, ESCALATE stops execution. If false, ESCALATE is logged but execution continues. Default: true */
  hardEscalate: boolean;
  /** Actions that bypass the gateway (e.g., health checks) */
  bypassActions: string[];
  /** Default phase if not specified */
  defaultPhase: CVFPhase;
  /** Default risk if not specified */
  defaultRisk: CVFRiskLevel;
  /** Default role if not specified */
  defaultRole: CVFRole;
  /** Default execution posture for channels that do not specify one explicitly. */
  defaultControlMode: 'standard' | 'governed';
}

export interface GatewayResult {
  allowed: boolean;
  decision: 'ALLOW' | 'BLOCK' | 'ESCALATE' | 'BYPASS';
  reason: string;
  guardResult?: GuardPipelineResult;
  bypassed: boolean;
  controlMode: 'standard' | 'governed';
  approvalRequired?: boolean;
  evidence?: {
    requestId?: string;
    blockedBy?: string;
    escalatedBy?: string;
  };
}

// ─── Default Config ──────────────────────────────────────────────────

export const DEFAULT_GATEWAY_CONFIG: GatewayConfig = {
  enforceAll: true,
  hardBlock: true,
  hardEscalate: true,
  bypassActions: ['health-check', 'ping', 'version', 'openapi'],
  defaultPhase: 'BUILD',
  defaultRisk: 'R1',
  defaultRole: 'AI_AGENT',
  defaultControlMode: 'standard',
};

// ─── Mandatory Gateway ───────────────────────────────────────────────

export class MandatoryGateway {
  private engine: GuardRuntimeEngine;
  private config: GatewayConfig;
  private auditLog: GatewayResult[] = [];

  constructor(engine: GuardRuntimeEngine, config: Partial<GatewayConfig> = {}) {
    this.engine = engine;
    this.config = { ...DEFAULT_GATEWAY_CONFIG, ...config };
  }

  /**
   * Check if an action is allowed.
   * This is the SINGLE entry point for ALL channels.
   */
  check(request: {
    action: string;
    phase?: CVFPhase;
    riskLevel?: CVFRiskLevel;
    role?: CVFRole;
    agentId?: string;
    targetFiles?: string[];
    fileScope?: string[];
    channel?: string;
    metadata?: Record<string, unknown>;
  }): GatewayResult {
    const controlMode = request.metadata?.controlMode === 'governed'
      ? 'governed'
      : this.config.defaultControlMode;

    // Check bypass list
    const normalizedAction = request.action.toLowerCase().trim();
    if (this.config.bypassActions.some(bp => normalizedAction.includes(bp))) {
      const result: GatewayResult = {
        allowed: true,
        decision: 'BYPASS',
        reason: `Action "${request.action}" is in bypass list`,
        bypassed: true,
        controlMode,
      };
      this.auditLog.push(result);
      return result;
    }

    // If gateway is disabled, allow everything
    if (!this.config.enforceAll) {
      const result: GatewayResult = {
        allowed: true,
        decision: 'ALLOW',
        reason: 'Gateway enforcement is disabled',
        bypassed: false,
        controlMode,
      };
      this.auditLog.push(result);
      return result;
    }

    // Build guard context
    const context: GuardRequestContext = {
      requestId: `gw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      phase: request.phase || this.config.defaultPhase,
      riskLevel: request.riskLevel || this.config.defaultRisk,
      role: request.role || this.config.defaultRole,
      agentId: request.agentId,
      action: request.action,
      targetFiles: request.targetFiles,
      fileScope: request.fileScope,
      channel: (request.channel as 'web' | 'ide' | 'cli' | 'mcp' | 'api') || 'api',
      metadata: {
        ...request.metadata,
        controlMode,
      },
    };

    // Run guard evaluation
    const guardResult = this.engine.evaluate(context);

    let allowed: boolean;
    let decision: 'ALLOW' | 'BLOCK' | 'ESCALATE';

    switch (guardResult.finalDecision) {
      case 'ALLOW':
        allowed = true;
        decision = 'ALLOW';
        break;
      case 'BLOCK':
        allowed = !this.config.hardBlock; // If hardBlock, not allowed
        decision = 'BLOCK';
        break;
      case 'ESCALATE':
        allowed = !this.config.hardEscalate; // If hardEscalate, not allowed
        decision = 'ESCALATE';
        break;
      default:
        allowed = false;
        decision = 'BLOCK';
    }

    const result: GatewayResult = {
      allowed,
      decision,
      reason: guardResult.agentGuidance || `Guard decision: ${guardResult.finalDecision}`,
      guardResult,
      bypassed: false,
      controlMode,
      approvalRequired: guardResult.finalDecision === 'ESCALATE' && controlMode === 'governed',
      evidence: {
        requestId: guardResult.requestId,
        blockedBy: guardResult.blockedBy,
        escalatedBy: guardResult.escalatedBy,
      },
    };

    this.auditLog.push(result);
    return result;
  }

  /**
   * Assert action is allowed — throws if blocked/escalated.
   */
  assertAllowed(request: Parameters<MandatoryGateway['check']>[0]): void {
    const result = this.check(request);
    if (!result.allowed) {
      throw new Error(`[CVF Gateway ${result.decision}] ${result.reason}`);
    }
  }

  /**
   * Get gateway audit log.
   */
  getAuditLog(): readonly GatewayResult[] {
    return this.auditLog;
  }

  /**
   * Get current config.
   */
  getConfig(): Readonly<GatewayConfig> {
    return { ...this.config };
  }

  /**
   * Update config at runtime.
   */
  updateConfig(updates: Partial<GatewayConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

// ─── Factory ─────────────────────────────────────────────────────────

/**
 * Create a mandatory gateway with default or custom config.
 */
export function createMandatoryGateway(
  engine: GuardRuntimeEngine,
  config?: Partial<GatewayConfig>,
): MandatoryGateway {
  return new MandatoryGateway(engine, config);
}
