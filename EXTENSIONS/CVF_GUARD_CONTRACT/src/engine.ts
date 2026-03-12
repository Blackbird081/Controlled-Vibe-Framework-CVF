/**
 * CVF Guard Runtime Engine — Canonical Implementation
 * ====================================================
 * Deterministic pipeline that evaluates guards in priority order.
 * Aggregates agentGuidance for NL explanations to AI agents.
 *
 * @module cvf-guard-contract/engine
 */

import type {
  Guard,
  GuardRequestContext,
  GuardPipelineResult,
  GuardAuditEntry,
  GuardRuntimeConfig,
} from './types.js';
import { DEFAULT_GUARD_RUNTIME_CONFIG } from './types.js';

export class GuardRuntimeEngine {
  private guards: Map<string, Guard> = new Map();
  private auditLog: GuardAuditEntry[] = [];
  private config: GuardRuntimeConfig;

  constructor(config?: Partial<GuardRuntimeConfig>) {
    this.config = { ...DEFAULT_GUARD_RUNTIME_CONFIG, ...config };
  }

  registerGuard(guard: Guard): void {
    if (this.guards.size >= this.config.maxGuardsPerPipeline) {
      throw new Error(
        `Guard pipeline limit reached: ${this.config.maxGuardsPerPipeline}. Cannot register guard "${guard.id}".`
      );
    }
    if (this.guards.has(guard.id)) {
      throw new Error(`Guard "${guard.id}" is already registered.`);
    }
    this.guards.set(guard.id, guard);
  }

  unregisterGuard(guardId: string): boolean {
    return this.guards.delete(guardId);
  }

  getGuard(guardId: string): Guard | undefined {
    return this.guards.get(guardId);
  }

  getRegisteredGuards(): Guard[] {
    return Array.from(this.guards.values());
  }

  getGuardCount(): number {
    return this.guards.size;
  }

  evaluate(context: GuardRequestContext): GuardPipelineResult {
    const startTime = Date.now();
    const results = [];

    const sortedGuards = this.getSortedEnabledGuards();

    let finalDecision = this.config.defaultDecision;
    let blockedBy: string | undefined;
    let escalatedBy: string | undefined;

    for (const guard of sortedGuards) {
      const result = guard.evaluate(context);
      results.push(result);

      if (result.decision === 'BLOCK') {
        finalDecision = 'BLOCK';
        blockedBy = guard.id;
        if (this.config.strictMode) {
          break;
        }
      }

      if (result.decision === 'ESCALATE' && finalDecision !== 'BLOCK') {
        finalDecision = 'ESCALATE';
        if (!escalatedBy) {
          escalatedBy = guard.id;
        }
      }
    }

    // Aggregate agent guidance from all guards
    const guidanceParts: string[] = [];
    for (const r of results) {
      if (r.agentGuidance) {
        guidanceParts.push(r.agentGuidance);
      }
    }

    const pipelineResult: GuardPipelineResult = {
      requestId: context.requestId,
      finalDecision,
      results,
      executedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      blockedBy,
      escalatedBy,
      agentGuidance: guidanceParts.length > 0 ? guidanceParts.join(' ') : undefined,
    };

    if (this.config.enableAuditLog) {
      this.auditLog.push({
        requestId: context.requestId,
        timestamp: pipelineResult.executedAt,
        context,
        pipelineResult,
      });
    }

    return pipelineResult;
  }

  getAuditLog(): readonly GuardAuditEntry[] {
    return this.auditLog;
  }

  getAuditEntry(requestId: string): GuardAuditEntry | undefined {
    return this.auditLog.find((e) => e.requestId === requestId);
  }

  clearAuditLog(): void {
    this.auditLog = [];
  }

  getAuditLogSize(): number {
    return this.auditLog.length;
  }

  getConfig(): Readonly<GuardRuntimeConfig> {
    return { ...this.config };
  }

  updateConfig(updates: Partial<GuardRuntimeConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  private getSortedEnabledGuards(): Guard[] {
    return Array.from(this.guards.values())
      .filter((g) => g.enabled)
      .sort((a, b) => a.priority - b.priority);
  }
}
