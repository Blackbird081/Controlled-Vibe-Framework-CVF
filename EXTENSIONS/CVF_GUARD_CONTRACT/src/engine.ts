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
} from './types';
import { DEFAULT_GUARD_RUNTIME_CONFIG, MANDATORY_GUARD_IDS } from './types';

/**
 * Engine-owned defensive record of a registered guard. Identity, priority,
 * and evaluation behavior are captured once at registration time and never
 * shared by reference with the caller's original object or with any value
 * returned by a public accessor.
 */
interface RegisteredGuardHandle {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly priority: number;
  enabled: boolean;
  readonly evaluate: (context: GuardRequestContext) => ReturnType<Guard['evaluate']>;
}

function snapshotGuard(guard: Guard): RegisteredGuardHandle {
  // Capture the unbound evaluation function and a frozen `this` snapshot
  // separately. A guard implementation's `evaluate` typically reads `this.id`
  // and other own fields; binding to the caller's live `guard` object would
  // let a later mutation of that object leak into every future evaluation
  // through `this`, even though the call site never touches it again.
  const rawEvaluate = guard.evaluate;
  const thisSnapshot = Object.freeze({
    id: guard.id,
    name: guard.name,
    description: guard.description,
    priority: guard.priority,
    enabled: guard.enabled,
  }) as Guard;

  return {
    id: guard.id,
    name: guard.name,
    description: guard.description,
    priority: guard.priority,
    enabled: guard.enabled,
    evaluate: (context: GuardRequestContext) => rawEvaluate.call(thisSnapshot, context),
  };
}

/**
 * Builds a frozen, engine-owned clone safe to return from a public accessor.
 * Mutating the returned object (or its `evaluate` function reference) can
 * never affect engine identity, priority, ordering, or evaluation behavior.
 */
function freezeGuardView(handle: RegisteredGuardHandle): Guard {
  return Object.freeze({
    id: handle.id,
    name: handle.name,
    description: handle.description,
    priority: handle.priority,
    enabled: handle.enabled,
    evaluate: (context: GuardRequestContext) => handle.evaluate(context),
  });
}

export class GuardRuntimeEngine {
  private guards: Map<string, RegisteredGuardHandle> = new Map();
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
    this.guards.set(guard.id, snapshotGuard(guard));
  }

  /**
   * Prevents unregistering mandatory guards (ai_commit, authority_gate, phase_gate).
   * These guards form the non-bypassable governance core.
   */
  unregisterGuard(guardId: string): boolean {
    if ((MANDATORY_GUARD_IDS as readonly string[]).includes(guardId)) {
      throw new Error(
        `Cannot unregister mandatory guard "${guardId}". ` +
        `Mandatory guards: [${MANDATORY_GUARD_IDS.join(', ')}].`
      );
    }
    return this.guards.delete(guardId);
  }

  /**
   * Disables a guard by ID. Mandatory guards cannot be disabled.
   */
  disableGuard(guardId: string): void {
    if ((MANDATORY_GUARD_IDS as readonly string[]).includes(guardId)) {
      throw new Error(
        `Cannot disable mandatory guard "${guardId}". ` +
        `Mandatory guards: [${MANDATORY_GUARD_IDS.join(', ')}].`
      );
    }
    const guard = this.guards.get(guardId);
    if (guard) {
      guard.enabled = false;
    }
  }

  getGuard(guardId: string): Guard | undefined {
    const handle = this.guards.get(guardId);
    return handle ? freezeGuardView(handle) : undefined;
  }

  getRegisteredGuards(): Guard[] {
    return Array.from(this.guards.values()).map(freezeGuardView);
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

  private getSortedEnabledGuards(): RegisteredGuardHandle[] {
    return Array.from(this.guards.values())
      .filter((g) => g.enabled)
      .sort((a, b) => a.priority - b.priority);
  }
}
