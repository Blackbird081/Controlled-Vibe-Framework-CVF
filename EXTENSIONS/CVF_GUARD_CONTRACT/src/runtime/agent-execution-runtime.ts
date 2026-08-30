/**
 * CVF Agent Execution Runtime
 * ============================
 * Replaces the ExtensionBridge stub with a real execution pipeline.
 * Flow: parseIntent → planActions → preCheck (Guard) → execute → postCheck → audit
 *
 * @module cvf-guard-contract/runtime/agent-execution-runtime
 */

import type {
  GuardRequestContext,
  GuardPipelineResult,
  CVFPhase,
  CVFRiskLevel,
  CVFRole,
  HandoffCheckpoint,
  BuildAuthorityEvidence,
} from '../types';
import { GuardRuntimeEngine } from '../engine';
import type { SkillDefinition } from './skill-registry';
import { createHandoffCheckpoint } from './agent-handoff';
import {
  type ApprovalExecutionBinding,
  ApprovalExecutionBridge,
} from './approval-execution-bridge';

// ─── Types ────────────────────────────────────────────────────────────

export interface ParsedIntent {
  action: string;
  skillId?: string;
  targetFiles?: string[];
  parameters?: Record<string, unknown>;
  confidence: number;
}

export type RuntimeControlMode = 'standard' | 'governed';

export type ExecutionArtifactType = 'INTENT' | 'EXECUTION' | 'REVIEW' | 'FREEZE';

export interface ExecutionArtifact {
  id: string;
  type: ExecutionArtifactType;
  recordedAt: string;
  source: 'agent_execution_runtime';
  details?: Record<string, unknown>;
}

export interface ExecutionApprovalCheckpoint {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requiredBy: string;
  reason: string;
  createdAt: string;
  bindingHash?: string;
  expiresAt?: string;
}

export interface ExecutionGovernanceState {
  controlMode: RuntimeControlMode;
  artifacts: ExecutionArtifact[];
  approvalCheckpoint?: ExecutionApprovalCheckpoint;
  handoffCheckpoint?: HandoffCheckpoint;
  lineageStatus: 'INCOMPLETE' | 'READY_FOR_REVIEW' | 'READY_FOR_FREEZE';
  acceptanceStatus: 'NOT_EVALUATED' | 'PENDING_APPROVAL' | 'ACCEPTED' | 'REJECTED';
}

export interface ActionPlan {
  requestId: string;
  intent: ParsedIntent;
  steps: PlannedStep[];
  estimatedRisk: CVFRiskLevel;
}

export interface PlannedStep {
  id: string;
  skillId: string;
  action: string;
  parameters?: Record<string, unknown>;
}

export type ExecutionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'BLOCKED' | 'NEEDS_APPROVAL';

export interface ExecutionResult {
  requestId: string;
  status: ExecutionStatus;
  output?: string;
  error?: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  guardDecision?: GuardPipelineResult;
  metadata?: Record<string, unknown>;
}

export interface RuntimeConfig {
  /** Current CVF phase for this session */
  phase: CVFPhase;
  /** Current risk level */
  riskLevel: CVFRiskLevel;
  /** Role of the entity executing */
  role: CVFRole;
  /** Agent identifier */
  agentId: string;
  /** Channel (web, ide, cli, mcp) */
  channel: 'web' | 'ide' | 'cli' | 'mcp' | 'api';
  /** If true, real AI provider is called. If false, dry-run mode. */
  liveExecution: boolean;
  /** Control posture for this execution session. */
  controlMode?: RuntimeControlMode;
  /** Optional default file scope for the session. */
  fileScope?: string[];
  /** Optional default metadata passed to guard evaluation. */
  metadata?: Record<string, unknown>;
  /** Explicit authority evidence required for mutating BUILD evaluation. */
  buildAuthority?: BuildAuthorityEvidence;
  /** Stable execution identity used to bind approvals to the exact session. */
  sessionId?: string;
  /** Execution working directory included in the approval binding. */
  cwd?: string;
  /** Explicit non-secret environment identity included in the approval binding. */
  environment?: Record<string, string>;
  /** Optional exactly-once settlement bridge used by runAwaitingApproval. */
  approvalBridge?: ApprovalExecutionBridge;
  approvalTimeoutMs?: number;
}

// ─── Execution Provider Interface ─────────────────────────────────────

export interface ExecutionProvider {
  name: string;
  execute(action: string, parameters?: Record<string, unknown>): Promise<string>;
}

/**
 * Dry-run provider — returns a description of what would happen.
 * Used for testing and validation without calling real AI.
 */
export class DryRunProvider implements ExecutionProvider {
  name = 'dry-run';
  async execute(action: string, parameters?: Record<string, unknown>): Promise<string> {
    return `[DRY-RUN] Would execute: "${action}" with params: ${JSON.stringify(parameters ?? {})}`;
  }
}

// ─── Agent Execution Runtime ──────────────────────────────────────────

export class AgentExecutionRuntime {
  private guardEngine: GuardRuntimeEngine;
  private provider: ExecutionProvider;
  private config: RuntimeConfig;
  private executionLog: ExecutionResult[] = [];

  constructor(
    guardEngine: GuardRuntimeEngine,
    provider: ExecutionProvider,
    config: RuntimeConfig,
  ) {
    this.guardEngine = guardEngine;
    this.provider = provider;
    this.config = config;
  }

  /**
   * Step 1: Parse user input into a structured intent.
   */
  parseIntent(userInput: string): ParsedIntent {
    const normalized = userInput.trim().toLowerCase();

    // Extract action keywords
    const actionMatch = normalized.match(/^(create|build|write|fix|test|deploy|review|analyze|generate|delete|update|refactor)\b/);
    const action = actionMatch ? actionMatch[1] : 'execute';

    // Extract file targets
    const fileMatches = userInput.match(/[\w/\\.-]+\.\w{1,10}/g) ?? [];

    return {
      action: `${action}: ${userInput.slice(0, 100)}`,
      targetFiles: fileMatches.length > 0 ? fileMatches : undefined,
      confidence: actionMatch ? 0.9 : 0.5,
    };
  }

  /**
   * Step 2: Pre-check with Guard Engine.
   * Returns the guard decision. If BLOCK, execution must stop.
   */
  preCheck(intent: ParsedIntent, skill?: SkillDefinition): GuardPipelineResult {
    // If a skill is specified, validate phase/risk compatibility
    let phase = this.config.phase;
    let riskLevel = this.config.riskLevel;

    if (skill) {
      // Skill declares its own requirements — enforce them
      if (skill.requiredPhase && skill.requiredPhase !== phase) {
        // Use the more restrictive phase
        phase = skill.requiredPhase;
      }
      if (skill.riskLevel) {
        // Use the higher risk level
        const riskOrder = ['R0', 'R1', 'R2', 'R3'] as const;
        const currentIdx = riskOrder.indexOf(riskLevel);
        const skillIdx = riskOrder.indexOf(skill.riskLevel);
        if (skillIdx > currentIdx) {
          riskLevel = skill.riskLevel;
        }
      }
    }

    const context: GuardRequestContext = {
      requestId: `exec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      phase,
      riskLevel,
      role: this.config.role,
      agentId: this.config.agentId,
      action: intent.action,
      targetFiles: intent.targetFiles,
      fileScope: this.config.fileScope,
      buildAuthority: this.config.buildAuthority,
      channel: this.config.channel,
      metadata: {
        ...this.config.metadata,
        controlMode: this.getControlMode(),
      },
    };

    return this.guardEngine.evaluate(context);
  }

  /**
   * Step 3: Execute the action via the configured provider.
   */
  async execute(intent: ParsedIntent, guardResult: GuardPipelineResult): Promise<ExecutionResult> {
    const startedAt = new Date().toISOString();
    const startTime = Date.now();
    const intentArtifact = this.createArtifact('INTENT', startedAt, {
      action: intent.action,
      targetFiles: intent.targetFiles,
      confidence: intent.confidence,
    });
    const governance = this.createGovernanceState([intentArtifact]);

    // BLOCK check
    if (guardResult.finalDecision === 'BLOCK') {
      const result: ExecutionResult = {
        requestId: guardResult.requestId,
        status: 'BLOCKED',
        error: `Guard blocked: ${guardResult.blockedBy}. ${guardResult.agentGuidance ?? ''}`,
        startedAt,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        guardDecision: guardResult,
        metadata: {
          governance: {
            ...governance,
            acceptanceStatus: 'REJECTED',
          },
        },
      };
      this.executionLog.push(result);
      return result;
    }

    // Governed ESCALATE check — do not execute until approval is granted.
    if (guardResult.finalDecision === 'ESCALATE' && this.getControlMode() === 'governed') {
      const approvalCheckpoint = this.createApprovalCheckpoint(guardResult, startedAt);
      const handoffCheckpoint = createHandoffCheckpoint({
        transition: 'ESCALATION_HANDOFF',
        reason: guardResult.agentGuidance ?? 'Human approval is required before governed execution can continue.',
        createdAt: startedAt,
        currentOwnerId: this.config.agentId,
        nextOwnerType: 'REVIEWER',
        nextGovernedMove: 'Approve or reject the execution checkpoint before retrying this request.',
        scopeHint: `${this.config.phase}:${intent.action}`,
        metadata: {
          requestId: guardResult.requestId,
          approvalCheckpointId: approvalCheckpoint.id,
          controlMode: this.getControlMode(),
        },
      });
      const result: ExecutionResult = {
        requestId: guardResult.requestId,
        status: 'NEEDS_APPROVAL',
        error: `Approval required before execution: ${guardResult.agentGuidance ?? guardResult.escalatedBy ?? 'Guard escalation triggered.'}`,
        startedAt,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        guardDecision: guardResult,
        metadata: {
          governance: {
            ...governance,
            approvalCheckpoint,
            handoffCheckpoint,
            acceptanceStatus: 'PENDING_APPROVAL',
          },
        },
      };
      this.executionLog.push(result);
      return result;
    }

    try {
      const output = await this.provider.execute(intent.action, intent.parameters);
      const completedAt = new Date().toISOString();
      const executionArtifact = this.createArtifact('EXECUTION', completedAt, {
        provider: this.provider.name,
        status: 'COMPLETED',
      });

      const result: ExecutionResult = {
        requestId: guardResult.requestId,
        status: 'COMPLETED',
        output,
        startedAt,
        completedAt,
        durationMs: Date.now() - startTime,
        guardDecision: guardResult,
        metadata: {
          governance: {
            ...this.createGovernanceState([intentArtifact, executionArtifact]),
            acceptanceStatus: 'ACCEPTED',
          },
        },
      };
      this.executionLog.push(result);
      return result;
    } catch (err) {
      const result: ExecutionResult = {
        requestId: guardResult.requestId,
        status: 'FAILED',
        error: err instanceof Error ? err.message : String(err),
        startedAt,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        guardDecision: guardResult,
        metadata: {
          governance: {
            ...governance,
            acceptanceStatus: 'REJECTED',
          },
        },
      };
      this.executionLog.push(result);
      return result;
    }
  }

  /**
   * Step 4: Post-check — validate execution result.
   */
  postCheck(result: ExecutionResult): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (result.status === 'FAILED') {
      issues.push(`Execution failed: ${result.error}`);
    }

    if (result.status === 'BLOCKED') {
      issues.push(`Execution was blocked by guard: ${result.guardDecision?.blockedBy}`);
    }

    if (result.status === 'NEEDS_APPROVAL') {
      issues.push(`Execution is waiting for approval: ${result.guardDecision?.escalatedBy ?? 'approval required'}`);
    }

    if (!result.requestId) {
      issues.push('Missing requestId — audit trail broken');
    }

    return { valid: issues.length === 0, issues };
  }

  /**
   * Full pipeline: parseIntent → preCheck → execute → postCheck.
   * This is the main entry point for running governed actions.
   */
  async run(userInput: string, skill?: SkillDefinition): Promise<ExecutionResult> {
    // 1. Parse
    const intent = this.parseIntent(userInput);

    // 2. PreCheck (Guard)
    const guardResult = this.preCheck(intent, skill);

    // 3. Execute
    const execResult = await this.execute(intent, guardResult);

    // 4. PostCheck
    this.postCheck(execResult);

    return execResult;
  }

  /**
   * Governed execution entry point that waits for a real approval settlement.
   * Approval is bound to command meaning, cwd, environment, actor, and session;
   * any change while pending fails closed before the provider can run.
   */
  async runAwaitingApproval(
    userInput: string,
    options: { skill?: SkillDefinition; signal?: AbortSignal } = {},
  ): Promise<ExecutionResult> {
    const intent = this.parseIntent(userInput);
    const guardResult = this.preCheck(intent, options.skill);
    if (guardResult.finalDecision !== 'ESCALATE' || this.getControlMode() !== 'governed') {
      return this.execute(intent, guardResult);
    }
    const bridge = this.config.approvalBridge;
    if (!bridge) return this.execute(intent, guardResult);

    const initialBinding = this.buildApprovalBinding(intent);
    const pending = bridge.request(initialBinding, {
      timeoutMs: this.config.approvalTimeoutMs,
      signal: options.signal,
    });
    const settlement = await pending.result;
    const currentBindingHash = bridge.hashBinding(this.buildApprovalBinding(intent));
    if (settlement.decision !== 'approved' || settlement.bindingHash !== currentBindingHash) {
      return this.approvalBlockedResult(
        guardResult,
        settlement.bindingHash !== currentBindingHash ? 'approval_execution_binding_changed' : settlement.reason,
        settlement,
      );
    }

    const result = await this.execute(intent, { ...guardResult, finalDecision: 'ALLOW' });
    result.metadata = {
      ...result.metadata,
      approvalSettlement: settlement,
      approvalBindingHash: currentBindingHash,
    };
    return result;
  }

  // ─── Getters ──────────────────────────────────────────────────────

  getExecutionLog(): readonly ExecutionResult[] {
    return this.executionLog;
  }

  getConfig(): Readonly<RuntimeConfig> {
    return { ...this.config };
  }

  updateConfig(updates: Partial<RuntimeConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  private getControlMode(): RuntimeControlMode {
    if (this.config.controlMode) {
      return this.config.controlMode;
    }
    return this.config.metadata?.controlMode === 'governed' ? 'governed' : 'standard';
  }

  private buildApprovalBinding(intent: ParsedIntent): ApprovalExecutionBinding {
    return {
      command: intent.action,
      parameters: intent.parameters,
      cwd: this.config.cwd ?? '',
      environment: { ...(this.config.environment ?? {}) },
      actorId: this.config.agentId,
      sessionId: this.config.sessionId ?? '',
    };
  }

  private approvalBlockedResult(
    guardResult: GuardPipelineResult,
    reason: string,
    settlement: { requestId: string; decision: string; bindingHash: string },
  ): ExecutionResult {
    const now = new Date().toISOString();
    const result: ExecutionResult = {
      requestId: guardResult.requestId,
      status: 'BLOCKED',
      error: `Approval settlement blocked execution: ${reason}`,
      startedAt: now,
      completedAt: now,
      durationMs: 0,
      guardDecision: guardResult,
      metadata: { approvalSettlement: settlement },
    };
    this.executionLog.push(result);
    return result;
  }

  private createArtifact(
    type: ExecutionArtifactType,
    recordedAt: string,
    details?: Record<string, unknown>,
  ): ExecutionArtifact {
    return {
      id: `runtime-artifact-${type.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      recordedAt,
      source: 'agent_execution_runtime',
      details,
    };
  }

  private createApprovalCheckpoint(
    guardResult: GuardPipelineResult,
    createdAt: string,
  ): ExecutionApprovalCheckpoint {
    return {
      id: `runtime-approval-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      status: 'PENDING',
      requiredBy: guardResult.escalatedBy ?? 'guard_runtime',
      reason: guardResult.agentGuidance ?? 'Human approval required before governed execution can continue.',
      createdAt,
    };
  }

  private createGovernanceState(artifacts: ExecutionArtifact[]): ExecutionGovernanceState {
    return {
      controlMode: this.getControlMode(),
      artifacts,
      lineageStatus: artifacts.some((artifact) => artifact.type === 'EXECUTION')
        ? 'READY_FOR_REVIEW'
        : 'INCOMPLETE',
      acceptanceStatus: 'NOT_EVALUATED',
    };
  }
}
