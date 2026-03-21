/**
 * CVF Learning Facade
 * ===================
 * Single entry point for ALL learning/feedback operations.
 * Delegates to CVF_ECO_v3.1_REPUTATION and CVF_ECO_v3.0_TASK_MARKETPLACE.
 *
 * Per GR-09: Learning Plane is ALWAYS activated LAST.
 * Per Phase 6 P6-R2: Learning is NOT real-time. Async, Post-FREEZE, Batch.
 * Per Phase 6 P6-R4: Learning OFF → system MUST run normally.
 *
 * @module cvf-plane-facades/learning
 */

// ─── Types ────────────────────────────────────────────────────────────

export interface ReputationScore {
  agentId: string;
  score: number; // 0.0 → 1.0
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  lastUpdated: string;
  taskCount: number;
  successRate: number;
}

export interface TaskOutcome {
  taskId: string;
  agentId: string;
  executionId: string;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  phase: string;
  durationMs: number;
  qualityScore?: number;
  metadata?: Record<string, unknown>;
}

export interface MetricEntry {
  name: string;
  value: number;
  tags: Record<string, string>;
  timestamp: string;
}

export interface LearningConfig {
  /** If false, learning is disabled but system runs normally (graceful degradation) */
  enabled: boolean;
  /** Max reputation change per cycle (anti-gaming, default 10%) */
  maxReputationDeltaPerCycle: number;
  /** Batch processing interval in ms */
  batchIntervalMs: number;
}

// ─── Learning Facade ──────────────────────────────────────────────────

export class LearningFacade {
  private config: LearningConfig;
  private reputationStore: Map<string, ReputationScore> = new Map();
  private taskLedger: TaskOutcome[] = [];
  private metricsBuffer: MetricEntry[] = [];

  constructor(config?: Partial<LearningConfig>) {
    this.config = {
      enabled: false, // OFF by default — per P6-R4
      maxReputationDeltaPerCycle: 0.10, // 10% — per P6-R3
      batchIntervalMs: 60_000, // 1 minute batch
      ...config,
    };
  }

  /**
   * Get agent reputation score.
   * Returns default score if agent not found or learning disabled.
   */
  getAgentReputation(agentId: string): ReputationScore {
    if (!this.config.enabled) {
      return this.defaultReputation(agentId);
    }

    return this.reputationStore.get(agentId) || this.defaultReputation(agentId);
  }

  /**
   * Record a task outcome into the immutable ledger.
   * Per P6-R2: not processed in real-time, queued for batch.
   */
  recordTaskOutcome(outcome: TaskOutcome): void {
    if (!this.config.enabled) {
      return; // Graceful degradation — silently ignore
    }

    this.taskLedger.push(outcome);
  }

  /**
   * Emit a metric for observability.
   * Delegates to CVF_v1.8.1_ADAPTIVE_OBSERVABILITY_RUNTIME.
   */
  emitMetric(name: string, value: number, tags?: Record<string, string>): void {
    this.metricsBuffer.push({
      name,
      value,
      tags: tags || {},
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Process batch: update reputation scores from task ledger.
   * Per P6-R3: reputation change ≤ maxReputationDeltaPerCycle.
   */
  processBatch(): { processed: number; updated: number } {
    if (!this.config.enabled) {
      return { processed: 0, updated: 0 };
    }

    let updated = 0;
    const agentOutcomes = new Map<string, TaskOutcome[]>();

    // Group by agent
    for (const outcome of this.taskLedger) {
      const existing = agentOutcomes.get(outcome.agentId) || [];
      existing.push(outcome);
      agentOutcomes.set(outcome.agentId, existing);
    }

    // Update reputations with delta cap
    for (const [agentId, outcomes] of agentOutcomes) {
      const current = this.reputationStore.get(agentId) || this.defaultReputation(agentId);
      const successCount = outcomes.filter(o => o.status === 'SUCCESS').length;
      const newSuccessRate = successCount / outcomes.length;

      // Calculate delta with cap
      let rawDelta = newSuccessRate - current.successRate;
      const cappedDelta = Math.max(
        -this.config.maxReputationDeltaPerCycle,
        Math.min(this.config.maxReputationDeltaPerCycle, rawDelta),
      );

      const newScore = Math.max(0, Math.min(1, current.score + cappedDelta));

      this.reputationStore.set(agentId, {
        agentId,
        score: newScore,
        trend: cappedDelta > 0.01 ? 'IMPROVING' : cappedDelta < -0.01 ? 'DECLINING' : 'STABLE',
        lastUpdated: new Date().toISOString(),
        taskCount: current.taskCount + outcomes.length,
        successRate: newSuccessRate,
      });

      updated++;
    }

    // Clear processed ledger
    const processed = this.taskLedger.length;
    this.taskLedger = [];

    return { processed, updated };
  }

  /**
   * Check if learning is enabled.
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Enable/disable learning at runtime.
   * Per P6-R4: disabling must not break the system.
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Get metrics buffer for observability export.
   */
  getMetricsBuffer(): readonly MetricEntry[] {
    return this.metricsBuffer;
  }

  /**
   * Flush metrics buffer (after export).
   */
  flushMetrics(): MetricEntry[] {
    const flushed = [...this.metricsBuffer];
    this.metricsBuffer = [];
    return flushed;
  }

  private defaultReputation(agentId: string): ReputationScore {
    return {
      agentId,
      score: 0.5, // Neutral starting point
      trend: 'STABLE',
      lastUpdated: new Date().toISOString(),
      taskCount: 0,
      successRate: 0,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────

/**
 * Create a LearningFacade.
 * NOTE: Learning is disabled by default per P6-R4.
 * Set enabled: true only after Phase 0-5 are FROZEN.
 */
export function createLearningFacade(
  config?: Partial<LearningConfig>,
): LearningFacade {
  return new LearningFacade(config);
}
