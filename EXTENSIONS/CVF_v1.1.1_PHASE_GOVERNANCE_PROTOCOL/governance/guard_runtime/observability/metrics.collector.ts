/**
 * Metrics Collector -- Track IV Phase D
 *
 * Collects runtime metrics from the guard engine, pipeline orchestrator,
 * and conformance runner. Provides aggregated data for dashboards and alerts.
 *
 * Metrics categories:
 *   - Guard execution (evaluations, decisions, latency)
 *   - Pipeline lifecycle (transitions, completions, rollbacks)
 *   - Conformance health (pass rate, critical failures)
 *   - System health (uptime, guard count, error rate)
 */

import type { GuardPipelineResult, GuardDecision, GuardAuditEntry } from '../guard.runtime.types.js';

// --- Metric Types ---

export interface GuardMetrics {
  totalEvaluations: number;
  decisions: Record<GuardDecision, number>;
  averageLatencyMs: number;
  maxLatencyMs: number;
  guardHitCount: Map<string, number>;
  blockRate: number;
  escalationRate: number;
}

export interface PipelineMetrics {
  totalPipelines: number;
  completed: number;
  failed: number;
  rolledBack: number;
  averagePhaseCount: number;
}

export interface ConformanceMetrics {
  lastRunTimestamp: string | null;
  passRate: number;
  criticalFailureCount: number;
  totalScenarios: number;
}

export interface SystemHealthMetrics {
  startedAt: string;
  uptimeMs: number;
  registeredGuards: number;
  totalErrors: number;
  errorRate: number;
}

export interface DashboardSnapshot {
  timestamp: string;
  guard: GuardMetrics;
  pipeline: PipelineMetrics;
  conformance: ConformanceMetrics;
  system: SystemHealthMetrics;
}

// --- Alert ---

export type AlertLevel = 'INFO' | 'WARNING' | 'CRITICAL';

export interface Alert {
  id: string;
  level: AlertLevel;
  message: string;
  timestamp: string;
  metric: string;
  value: number;
  threshold: number;
}

export interface AlertRule {
  id: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq';
  threshold: number;
  level: AlertLevel;
  message: string;
}

// --- Collector ---

export class MetricsCollector {
  private evaluations: Array<{ result: GuardPipelineResult; timestamp: string }> = [];
  private pipelineEvents: Array<{ type: string; timestamp: string }> = [];
  private conformanceRuns: Array<{ passRate: number; criticalFailures: number; total: number; timestamp: string }> = [];
  private errors: Array<{ error: string; timestamp: string }> = [];
  private startedAt: string;
  private alertRules: AlertRule[] = [];
  private alerts: Alert[] = [];
  private registeredGuardCount = 0;

  constructor() {
    this.startedAt = new Date().toISOString();
  }

  // --- Record Events ---

  recordEvaluation(result: GuardPipelineResult): void {
    this.evaluations.push({ result, timestamp: new Date().toISOString() });
    this.checkAlerts();
  }

  recordPipelineEvent(type: string): void {
    this.pipelineEvents.push({ type, timestamp: new Date().toISOString() });
  }

  recordConformanceRun(passRate: number, criticalFailures: number, total: number): void {
    this.conformanceRuns.push({ passRate, criticalFailures, total, timestamp: new Date().toISOString() });
    this.checkAlerts();
  }

  recordError(error: string): void {
    this.errors.push({ error, timestamp: new Date().toISOString() });
  }

  setRegisteredGuardCount(count: number): void {
    this.registeredGuardCount = count;
  }

  // --- Compute Metrics ---

  getGuardMetrics(): GuardMetrics {
    const total = this.evaluations.length;
    const decisions: Record<GuardDecision, number> = { ALLOW: 0, BLOCK: 0, ESCALATE: 0 };
    const guardHitCount = new Map<string, number>();
    let totalLatency = 0;
    let maxLatency = 0;

    for (const e of this.evaluations) {
      decisions[e.result.finalDecision]++;
      totalLatency += e.result.durationMs;
      maxLatency = Math.max(maxLatency, e.result.durationMs);

      for (const r of e.result.results) {
        guardHitCount.set(r.guardId, (guardHitCount.get(r.guardId) || 0) + 1);
      }
    }

    return {
      totalEvaluations: total,
      decisions,
      averageLatencyMs: total > 0 ? totalLatency / total : 0,
      maxLatencyMs: maxLatency,
      guardHitCount,
      blockRate: total > 0 ? decisions.BLOCK / total : 0,
      escalationRate: total > 0 ? decisions.ESCALATE / total : 0,
    };
  }

  getPipelineMetrics(): PipelineMetrics {
    const total = this.pipelineEvents.filter((e) => e.type === 'created').length;
    const completed = this.pipelineEvents.filter((e) => e.type === 'completed').length;
    const failed = this.pipelineEvents.filter((e) => e.type === 'failed').length;
    const rolledBack = this.pipelineEvents.filter((e) => e.type === 'rolled_back').length;
    const phaseEvents = this.pipelineEvents.filter((e) => e.type === 'phase_enter').length;

    return {
      totalPipelines: total,
      completed,
      failed,
      rolledBack,
      averagePhaseCount: total > 0 ? phaseEvents / total : 0,
    };
  }

  getConformanceMetrics(): ConformanceMetrics {
    const last = this.conformanceRuns[this.conformanceRuns.length - 1];
    return {
      lastRunTimestamp: last?.timestamp ?? null,
      passRate: last?.passRate ?? 0,
      criticalFailureCount: last?.criticalFailures ?? 0,
      totalScenarios: last?.total ?? 0,
    };
  }

  getSystemHealthMetrics(): SystemHealthMetrics {
    const total = this.evaluations.length;
    const errorCount = this.errors.length;

    return {
      startedAt: this.startedAt,
      uptimeMs: Date.now() - new Date(this.startedAt).getTime(),
      registeredGuards: this.registeredGuardCount,
      totalErrors: errorCount,
      errorRate: total > 0 ? errorCount / total : 0,
    };
  }

  getDashboardSnapshot(): DashboardSnapshot {
    return {
      timestamp: new Date().toISOString(),
      guard: this.getGuardMetrics(),
      pipeline: this.getPipelineMetrics(),
      conformance: this.getConformanceMetrics(),
      system: this.getSystemHealthMetrics(),
    };
  }

  // --- Alerts ---

  addAlertRule(rule: AlertRule): void {
    this.alertRules.push(rule);
  }

  getAlerts(): readonly Alert[] {
    return this.alerts;
  }

  clearAlerts(): void {
    this.alerts = [];
  }

  private checkAlerts(): void {
    const snapshot = this.getDashboardSnapshot();
    const metricValues: Record<string, number> = {
      'guard.blockRate': snapshot.guard.blockRate,
      'guard.escalationRate': snapshot.guard.escalationRate,
      'guard.totalEvaluations': snapshot.guard.totalEvaluations,
      'guard.averageLatencyMs': snapshot.guard.averageLatencyMs,
      'conformance.passRate': snapshot.conformance.passRate,
      'conformance.criticalFailures': snapshot.conformance.criticalFailureCount,
      'system.errorRate': snapshot.system.errorRate,
    };

    for (const rule of this.alertRules) {
      const value = metricValues[rule.metric];
      if (value === undefined) continue;

      let triggered = false;
      if (rule.condition === 'gt' && value > rule.threshold) triggered = true;
      if (rule.condition === 'lt' && value < rule.threshold) triggered = true;
      if (rule.condition === 'eq' && value === rule.threshold) triggered = true;

      if (triggered) {
        this.alerts.push({
          id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          level: rule.level,
          message: rule.message,
          timestamp: new Date().toISOString(),
          metric: rule.metric,
          value,
          threshold: rule.threshold,
        });
      }
    }
  }

  // --- Feedback Loop ---

  generateFeedbackReport(): {
    summary: string;
    recommendations: string[];
    healthScore: number;
  } {
    const guard = this.getGuardMetrics();
    const conf = this.getConformanceMetrics();
    const sys = this.getSystemHealthMetrics();

    const recommendations: string[] = [];
    let healthScore = 1.0;

    if (guard.blockRate > 0.5) {
      recommendations.push('High block rate detected. Review agent configuration and guard rules.');
      healthScore -= 0.2;
    }

    if (guard.escalationRate > 0.3) {
      recommendations.push('High escalation rate. Consider adjusting risk thresholds or adding pre-checks.');
      healthScore -= 0.1;
    }

    if (conf.passRate < 1.0 && conf.totalScenarios > 0) {
      recommendations.push(`Conformance pass rate is ${(conf.passRate * 100).toFixed(1)}%. Investigate failing scenarios.`);
      healthScore -= 0.2;
    }

    if (conf.criticalFailureCount > 0) {
      recommendations.push(`${conf.criticalFailureCount} critical conformance failures. Immediate action required.`);
      healthScore -= 0.3;
    }

    if (sys.errorRate > 0.1) {
      recommendations.push('Error rate exceeds 10%. Check system logs and guard implementations.');
      healthScore -= 0.2;
    }

    if (recommendations.length === 0) {
      recommendations.push('All metrics within normal range. System is healthy.');
    }

    healthScore = Math.max(0, Math.min(1, healthScore));

    const summary = [
      `Guard evaluations: ${guard.totalEvaluations}`,
      `Block rate: ${(guard.blockRate * 100).toFixed(1)}%`,
      `Conformance: ${(conf.passRate * 100).toFixed(1)}%`,
      `Health score: ${(healthScore * 100).toFixed(0)}%`,
    ].join(' | ');

    return { summary, recommendations, healthScore };
  }

  // --- Reset ---

  reset(): void {
    this.evaluations = [];
    this.pipelineEvents = [];
    this.conformanceRuns = [];
    this.errors = [];
    this.alerts = [];
    this.startedAt = new Date().toISOString();
  }
}
