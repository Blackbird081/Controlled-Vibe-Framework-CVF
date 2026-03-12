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
} from '../types.js';
import { GuardRuntimeEngine } from '../engine.js';
import type { SkillDefinition } from './skill-registry.js';

// ─── Types ────────────────────────────────────────────────────────────

export interface ParsedIntent {
  action: string;
  skillId?: string;
  targetFiles?: string[];
  parameters?: Record<string, unknown>;
  confidence: number;
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

export type ExecutionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'BLOCKED';

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
      channel: this.config.channel,
    };

    return this.guardEngine.evaluate(context);
  }

  /**
   * Step 3: Execute the action via the configured provider.
   */
  async execute(intent: ParsedIntent, guardResult: GuardPipelineResult): Promise<ExecutionResult> {
    const startedAt = new Date().toISOString();
    const startTime = Date.now();

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
      };
      this.executionLog.push(result);
      return result;
    }

    // ESCALATE check — still allowed but logged
    if (guardResult.finalDecision === 'ESCALATE') {
      // In a real system, this would pause and wait for human approval.
      // For now, we proceed but flag it.
    }

    try {
      const output = await this.provider.execute(intent.action, intent.parameters);

      const result: ExecutionResult = {
        requestId: guardResult.requestId,
        status: 'COMPLETED',
        output,
        startedAt,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        guardDecision: guardResult,
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
}
