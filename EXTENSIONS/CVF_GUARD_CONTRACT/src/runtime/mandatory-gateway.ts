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
  bypassActions: readonly string[];
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

/**
 * Normalizes a bypass entry (or an incoming action) to the canonical form
 * used for exact whole-value bypass comparison: trimmed and case-folded.
 * A prefix, suffix, delimiter, or substring relationship never matches.
 */
function canonicalizeBypassValue(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : undefined;
}

function buildCanonicalBypassSet(bypassActions: readonly unknown[]): ReadonlySet<string> {
  const canonical = new Set<string>();
  for (const entry of bypassActions) {
    const normalized = canonicalizeBypassValue(entry);
    if (normalized !== undefined) {
      canonical.add(normalized);
    }
  }
  return canonical;
}

/**
 * Authority-changing runtime configuration keys. These fields control
 * whether enforcement, hard blocking, or hard escalation is active, and
 * which actions bypass evaluation entirely. They may only be set once, at
 * construction; no post-bootstrap update may alter them.
 */
const AUTHORITY_CONFIG_KEYS = [
  'enforceAll',
  'hardBlock',
  'hardEscalate',
  'bypassActions',
] as const;

// ─── Mandatory Gateway ───────────────────────────────────────────────

export class MandatoryGateway {
  private engine: GuardRuntimeEngine;
  /** Defensively frozen bootstrap configuration; never mutated after construction. */
  private readonly config: Readonly<GatewayConfig>;
  /** Canonical (trimmed, case-folded) bypass set derived once at bootstrap. */
  private readonly canonicalBypassActions: ReadonlySet<string>;
  private auditLog: GatewayResult[] = [];

  constructor(engine: GuardRuntimeEngine, config: Partial<GatewayConfig> = {}) {
    this.engine = engine;

    const merged: GatewayConfig = { ...DEFAULT_GATEWAY_CONFIG, ...config };
    const bypassActionsSource = Array.isArray(config.bypassActions)
      ? config.bypassActions
      : DEFAULT_GATEWAY_CONFIG.bypassActions;

    // Defensive snapshot: copy the bypass array by value so neither the
    // caller's original array nor any later mutation of it can change
    // bootstrap authority. The frozen config object is the sole source of
    // truth for the lifetime of this gateway instance.
    this.config = Object.freeze({
      ...merged,
      bypassActions: Object.freeze([...bypassActionsSource]),
    });
    this.canonicalBypassActions = buildCanonicalBypassSet(this.config.bypassActions);
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

    if (canonicalizeBypassValue(request.action) === undefined) {
      return this.buildMalformedActionResult(controlMode);
    }

    // Check bypass list: exact canonical whole-value match only.
    if (this.isExactBypassMatch(request.action)) {
      return this.buildBypassResult(request.action, controlMode);
    }

    // If gateway is disabled, allow everything
    if (!this.config.enforceAll) {
      return this.buildDisabledResult(controlMode);
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

    return this.evaluateContext(context, controlMode);
  }

  /**
   * Evaluate an already-built canonical GuardRequestContext exactly once,
   * preserving every field (including requestId) with no normalization,
   * default injection, or rebuild.
   */
  checkContext(context: GuardRequestContext): GatewayResult {
    const controlMode = context.metadata?.controlMode === 'governed'
      ? 'governed'
      : this.config.defaultControlMode;

    if (canonicalizeBypassValue(context.action) === undefined) {
      return this.buildMalformedActionResult(controlMode, context.requestId);
    }

    if (this.isExactBypassMatch(context.action)) {
      return this.buildBypassResult(context.action, controlMode, context.requestId);
    }

    if (!this.config.enforceAll) {
      return this.buildDisabledResult(controlMode, context.requestId);
    }

    return this.evaluateContext(context, controlMode);
  }

  /**
   * Exact canonical whole-value bypass match. A malformed (non-string,
   * empty, or whitespace-only) action never matches and never throws.
   */
  private isExactBypassMatch(action: unknown): boolean {
    const normalizedAction = canonicalizeBypassValue(action);
    if (normalizedAction === undefined) {
      return false;
    }
    return this.canonicalBypassActions.has(normalizedAction);
  }

  /**
   * Malformed or empty actions cannot be authorized or sent into the engine.
   * This keeps the untyped runtime boundary deterministic and fail-closed.
   */
  private buildMalformedActionResult(
    controlMode: 'standard' | 'governed',
    requestId?: string,
  ): GatewayResult {
    const result: GatewayResult = {
      allowed: false,
      decision: 'BLOCK',
      reason: 'Action must be a non-empty string',
      bypassed: false,
      controlMode,
      ...(requestId !== undefined ? { evidence: { requestId } } : {}),
    };
    this.auditLog.push(result);
    return result;
  }

  private buildBypassResult(
    action: string,
    controlMode: 'standard' | 'governed',
    requestId?: string,
  ): GatewayResult {
    const result: GatewayResult = {
      allowed: true,
      decision: 'BYPASS',
      reason: `Action "${action}" is in bypass list`,
      bypassed: true,
      controlMode,
      ...(requestId !== undefined ? { evidence: { requestId } } : {}),
    };
    this.auditLog.push(result);
    return result;
  }

  private buildDisabledResult(
    controlMode: 'standard' | 'governed',
    requestId?: string,
  ): GatewayResult {
    const result: GatewayResult = {
      allowed: true,
      decision: 'ALLOW',
      reason: 'Gateway enforcement is disabled',
      bypassed: false,
      controlMode,
      ...(requestId !== undefined ? { evidence: { requestId } } : {}),
    };
    this.auditLog.push(result);
    return result;
  }

  /**
   * Run guard evaluation exactly once against the exact context object
   * supplied by the caller, then classify the pipeline decision.
   */
  private evaluateContext(
    context: GuardRequestContext,
    controlMode: 'standard' | 'governed',
  ): GatewayResult {
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
   * Get current config. Returns a frozen defensive copy; the nested
   * `bypassActions` array is also frozen, so no caller mutation of the
   * returned value can affect gateway behavior.
   */
  getConfig(): Readonly<GatewayConfig> {
    return Object.freeze({
      ...this.config,
      bypassActions: Object.freeze([...this.config.bypassActions]),
    });
  }

  /**
   * Rejects any post-bootstrap attempt to change authority-bearing
   * configuration (`enforceAll`, `hardBlock`, `hardEscalate`,
   * `bypassActions`). Non-authority defaults (`defaultPhase`, `defaultRisk`,
   * `defaultRole`, `defaultControlMode`) are not authority-bearing and are
   * intentionally out of scope for this deterministic rejection: this
   * gateway exposes no API to change them either, so `updateConfig` always
   * rejects.
   */
  updateConfig(updates: Partial<GatewayConfig>): void {
    const attemptedKeys = Object.keys(updates) as (keyof GatewayConfig)[];
    const authorityKeysAttempted = attemptedKeys.filter((key) =>
      (AUTHORITY_CONFIG_KEYS as readonly string[]).includes(key),
    );

    throw new Error(
      `[CVF Gateway] Runtime configuration is immutable after bootstrap. ` +
      `Rejected update to: [${(authorityKeysAttempted.length > 0 ? authorityKeysAttempted : attemptedKeys).join(', ')}]. ` +
      `Construct a new MandatoryGateway with the desired configuration instead.`
    );
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
