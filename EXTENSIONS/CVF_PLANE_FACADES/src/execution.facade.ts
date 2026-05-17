/**
 * CVF Execution Facade
 * ====================
 * Single entry point for ALL execution operations.
 * Delegates to underlying execution modules without replacing them.
 *
 * NOTE: Model Gateway routing and MCP Bridge are defined as interfaces
 * here but will be implemented when those modules are merged in Phase 3.
 * For now, this facade primarily wraps guard-checked execution flow.
 *
 * @module cvf-plane-facades/execution
 */

import type {
  GuardRequestContext,
  GuardPipelineResult,
  CVFRiskLevel,
} from 'cvf-guard-contract';

import { GovernanceFacade } from './governance.facade';

// ─── Types ────────────────────────────────────────────────────────────

export interface ExecutionRequest {
  /** Unique execution ID — scopes all resources to this run */
  executionId: string;
  /** Action to execute */
  action: string;
  /** Agent performing the action */
  agentId: string;
  /** Risk level of this execution */
  riskLevel: CVFRiskLevel;
  /** Target files (if applicable) */
  targetFiles?: string[];
  /** Parameters for the execution */
  params?: Record<string, unknown>;
  /** Channel originating this request */
  channel?: 'web' | 'ide' | 'cli' | 'mcp' | 'api';
}

export interface ExecutionResult {
  executionId: string;
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED' | 'TIMEOUT';
  result?: unknown;
  guardResult: GuardPipelineResult;
  durationMs: number;
  error?: string;
}

export interface ModelRoutingRequest {
  prompt: string;
  riskLevel: CVFRiskLevel;
  strategy?: 'SINGLE_SHOT' | 'ITERATIVE';
  maxTokens?: number;
  metadata?: Record<string, unknown>;
}

export interface ModelRoutingResult {
  provider: string;
  tier: 'CHEAP' | 'MID' | 'STRONG' | 'REASONING';
  response: string;
  tokenUsage: { input: number; output: number };
  costEstimate?: number;
  latencyMs: number;
}

// ─── Execution Facade ─────────────────────────────────────────────────

export class ExecutionFacade {
  private governance: GovernanceFacade;
  private executionLog: ExecutionResult[] = [];

  constructor(governance: GovernanceFacade) {
    this.governance = governance;
  }

  /**
   * Execute an action with governance check.
   * ALWAYS checks guards before executing.
   * Per XP-01: Execution → Governance MUST go through GovernanceFacade.
   */
  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const startTime = Date.now();

    // Step 1: Governance check (mandatory)
    const guardContext: GuardRequestContext = {
      requestId: request.executionId,
      phase: 'BUILD', // Execution happens in BUILD phase
      riskLevel: request.riskLevel,
      role: 'AI_AGENT',
      agentId: request.agentId,
      action: request.action,
      targetFiles: request.targetFiles,
      channel: request.channel || 'api',
      metadata: request.params,
    };

    const guardResult = this.governance.evaluateGuards(guardContext);

    // Step 2: If blocked, return immediately
    if (guardResult.finalDecision !== 'ALLOW') {
      const result: ExecutionResult = {
        executionId: request.executionId,
        status: 'BLOCKED',
        guardResult,
        durationMs: Date.now() - startTime,
        error: `Blocked by governance: ${guardResult.blockedBy || guardResult.escalatedBy || 'unknown'}`,
      };
      this.executionLog.push(result);
      return result;
    }

    // Step 3: Execute (delegate to underlying runtime)
    // In federated model, actual execution is still handled by the
    // underlying module (e.g., CVF_v1.6_AGENT_PLATFORM).
    // This facade provides the governance-checked entry point.
    const result: ExecutionResult = {
      executionId: request.executionId,
      status: 'SUCCESS',
      guardResult,
      durationMs: Date.now() - startTime,
    };

    this.executionLog.push(result);
    return result;
  }

  /**
   * Route a model request based on risk level.
   * Per Phase 3 Merge Map: Gateway adapters will be merged here.
   * For now, returns routing decision without actual provider call.
   */
  routeModel(request: ModelRoutingRequest): {
    tier: 'CHEAP' | 'MID' | 'STRONG' | 'REASONING';
    strategy: 'SINGLE_SHOT' | 'ITERATIVE';
  } {
    // Risk-based routing (per Whitepaper Section 4)
    const tierMap: Record<CVFRiskLevel, 'CHEAP' | 'MID' | 'STRONG' | 'REASONING'> = {
      R0: 'CHEAP',
      R1: 'MID',
      R2: 'STRONG',
      R3: 'REASONING',
    };

    return {
      tier: tierMap[request.riskLevel],
      strategy: request.riskLevel === 'R3'
        ? 'ITERATIVE' // R3 requires iterative (multi-step validation)
        : request.strategy || 'SINGLE_SHOT',
    };
  }

  /**
   * Get execution audit log.
   */
  getExecutionLog(): readonly ExecutionResult[] {
    return this.executionLog;
  }
}

// ─── Factory ──────────────────────────────────────────────────────────

/**
 * Create an ExecutionFacade with governance integration.
 * Per XP-01: Execution MUST go through GovernanceFacade.
 */
export function createExecutionFacade(
  governance: GovernanceFacade,
): ExecutionFacade {
  return new ExecutionFacade(governance);
}
