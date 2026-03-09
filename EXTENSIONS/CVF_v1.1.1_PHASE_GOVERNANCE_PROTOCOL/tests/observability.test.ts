/**
 * Observability & Feedback Loop Tests -- Track IV Phase D
 *
 * Tests MetricsCollector: guard metrics, pipeline metrics, conformance metrics,
 * system health, alerts, dashboard snapshots, and feedback reports.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MetricsCollector } from '../governance/guard_runtime/observability/metrics.collector.js';
import type { GuardPipelineResult } from '../governance/guard_runtime/guard.runtime.types.js';

function mockResult(decision: 'ALLOW' | 'BLOCK' | 'ESCALATE', durationMs = 1, guardIds: string[] = ['g1']): GuardPipelineResult {
  return {
    requestId: `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    finalDecision: decision,
    results: guardIds.map((id) => ({
      guardId: id, decision, severity: 'INFO' as const, reason: 'test', timestamp: new Date().toISOString(),
    })),
    executedAt: new Date().toISOString(),
    durationMs,
    blockedBy: decision === 'BLOCK' ? guardIds[0] : undefined,
    escalatedBy: decision === 'ESCALATE' ? guardIds[0] : undefined,
  };
}

describe('MetricsCollector', () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    collector = new MetricsCollector();
  });

  // --- Guard Metrics ---

  describe('guard metrics', () => {
    it('starts with zero evaluations', () => {
      const m = collector.getGuardMetrics();
      expect(m.totalEvaluations).toBe(0);
      expect(m.blockRate).toBe(0);
      expect(m.escalationRate).toBe(0);
    });

    it('tracks evaluation counts', () => {
      collector.recordEvaluation(mockResult('ALLOW'));
      collector.recordEvaluation(mockResult('BLOCK'));
      collector.recordEvaluation(mockResult('ESCALATE'));
      const m = collector.getGuardMetrics();
      expect(m.totalEvaluations).toBe(3);
      expect(m.decisions.ALLOW).toBe(1);
      expect(m.decisions.BLOCK).toBe(1);
      expect(m.decisions.ESCALATE).toBe(1);
    });

    it('calculates block rate', () => {
      collector.recordEvaluation(mockResult('ALLOW'));
      collector.recordEvaluation(mockResult('BLOCK'));
      const m = collector.getGuardMetrics();
      expect(m.blockRate).toBe(0.5);
    });

    it('calculates escalation rate', () => {
      collector.recordEvaluation(mockResult('ALLOW'));
      collector.recordEvaluation(mockResult('ESCALATE'));
      collector.recordEvaluation(mockResult('ESCALATE'));
      const m = collector.getGuardMetrics();
      expect(m.escalationRate).toBeCloseTo(0.667, 2);
    });

    it('tracks guard hit counts', () => {
      collector.recordEvaluation(mockResult('ALLOW', 1, ['phase_gate', 'risk_gate']));
      collector.recordEvaluation(mockResult('ALLOW', 1, ['phase_gate']));
      const m = collector.getGuardMetrics();
      expect(m.guardHitCount.get('phase_gate')).toBe(2);
      expect(m.guardHitCount.get('risk_gate')).toBe(1);
    });

    it('tracks latency', () => {
      collector.recordEvaluation(mockResult('ALLOW', 5));
      collector.recordEvaluation(mockResult('ALLOW', 15));
      const m = collector.getGuardMetrics();
      expect(m.averageLatencyMs).toBe(10);
      expect(m.maxLatencyMs).toBe(15);
    });
  });

  // --- Pipeline Metrics ---

  describe('pipeline metrics', () => {
    it('starts with zero pipelines', () => {
      const m = collector.getPipelineMetrics();
      expect(m.totalPipelines).toBe(0);
    });

    it('tracks pipeline events', () => {
      collector.recordPipelineEvent('created');
      collector.recordPipelineEvent('phase_enter');
      collector.recordPipelineEvent('phase_enter');
      collector.recordPipelineEvent('completed');
      const m = collector.getPipelineMetrics();
      expect(m.totalPipelines).toBe(1);
      expect(m.completed).toBe(1);
      expect(m.averagePhaseCount).toBe(2);
    });

    it('tracks failures and rollbacks', () => {
      collector.recordPipelineEvent('created');
      collector.recordPipelineEvent('failed');
      collector.recordPipelineEvent('created');
      collector.recordPipelineEvent('rolled_back');
      const m = collector.getPipelineMetrics();
      expect(m.totalPipelines).toBe(2);
      expect(m.failed).toBe(1);
      expect(m.rolledBack).toBe(1);
    });
  });

  // --- Conformance Metrics ---

  describe('conformance metrics', () => {
    it('starts with no runs', () => {
      const m = collector.getConformanceMetrics();
      expect(m.lastRunTimestamp).toBeNull();
      expect(m.passRate).toBe(0);
    });

    it('records conformance run', () => {
      collector.recordConformanceRun(0.95, 1, 20);
      const m = collector.getConformanceMetrics();
      expect(m.passRate).toBe(0.95);
      expect(m.criticalFailureCount).toBe(1);
      expect(m.totalScenarios).toBe(20);
      expect(m.lastRunTimestamp).toBeDefined();
    });

    it('uses latest run data', () => {
      collector.recordConformanceRun(0.8, 3, 20);
      collector.recordConformanceRun(1.0, 0, 25);
      const m = collector.getConformanceMetrics();
      expect(m.passRate).toBe(1.0);
      expect(m.criticalFailureCount).toBe(0);
      expect(m.totalScenarios).toBe(25);
    });
  });

  // --- System Health ---

  describe('system health metrics', () => {
    it('tracks uptime', () => {
      const m = collector.getSystemHealthMetrics();
      expect(m.uptimeMs).toBeGreaterThanOrEqual(0);
      expect(m.startedAt).toBeDefined();
    });

    it('tracks guard count', () => {
      collector.setRegisteredGuardCount(13);
      const m = collector.getSystemHealthMetrics();
      expect(m.registeredGuards).toBe(13);
    });

    it('tracks errors', () => {
      collector.recordError('test error 1');
      collector.recordError('test error 2');
      collector.recordEvaluation(mockResult('ALLOW'));
      const m = collector.getSystemHealthMetrics();
      expect(m.totalErrors).toBe(2);
      expect(m.errorRate).toBe(2);
    });
  });

  // --- Dashboard Snapshot ---

  describe('dashboard snapshot', () => {
    it('returns complete snapshot', () => {
      collector.recordEvaluation(mockResult('ALLOW'));
      collector.recordPipelineEvent('created');
      collector.recordConformanceRun(1.0, 0, 20);
      collector.setRegisteredGuardCount(13);

      const snap = collector.getDashboardSnapshot();
      expect(snap.timestamp).toBeDefined();
      expect(snap.guard.totalEvaluations).toBe(1);
      expect(snap.pipeline.totalPipelines).toBe(1);
      expect(snap.conformance.passRate).toBe(1.0);
      expect(snap.system.registeredGuards).toBe(13);
    });
  });

  // --- Alerts ---

  describe('alerts', () => {
    it('starts with no alerts', () => {
      expect(collector.getAlerts()).toHaveLength(0);
    });

    it('triggers alert when rule condition met', () => {
      collector.addAlertRule({
        id: 'high-block', metric: 'guard.blockRate', condition: 'gt',
        threshold: 0.3, level: 'WARNING', message: 'High block rate',
      });

      collector.recordEvaluation(mockResult('BLOCK'));
      const alerts = collector.getAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0]!.level).toBe('WARNING');
      expect(alerts[0]!.message).toBe('High block rate');
    });

    it('triggers lt condition alert', () => {
      collector.addAlertRule({
        id: 'low-conformance', metric: 'conformance.passRate', condition: 'lt',
        threshold: 0.9, level: 'CRITICAL', message: 'Low conformance',
      });

      collector.recordConformanceRun(0.7, 2, 20);
      expect(collector.getAlerts().some((a) => a.message === 'Low conformance')).toBe(true);
    });

    it('does not trigger when condition not met', () => {
      collector.addAlertRule({
        id: 'high-block', metric: 'guard.blockRate', condition: 'gt',
        threshold: 0.9, level: 'WARNING', message: 'Very high block rate',
      });

      collector.recordEvaluation(mockResult('ALLOW'));
      expect(collector.getAlerts()).toHaveLength(0);
    });

    it('clears alerts', () => {
      collector.addAlertRule({
        id: 'r1', metric: 'guard.blockRate', condition: 'gt',
        threshold: 0, level: 'INFO', message: 'test',
      });
      collector.recordEvaluation(mockResult('BLOCK'));
      expect(collector.getAlerts().length).toBeGreaterThan(0);
      collector.clearAlerts();
      expect(collector.getAlerts()).toHaveLength(0);
    });
  });

  // --- Feedback Report ---

  describe('feedback report', () => {
    it('generates healthy report when all metrics normal', () => {
      collector.recordEvaluation(mockResult('ALLOW'));
      collector.recordConformanceRun(1.0, 0, 20);
      const report = collector.generateFeedbackReport();
      expect(report.healthScore).toBe(1.0);
      expect(report.recommendations).toContain('All metrics within normal range. System is healthy.');
    });

    it('flags high block rate', () => {
      for (let i = 0; i < 6; i++) collector.recordEvaluation(mockResult('BLOCK'));
      for (let i = 0; i < 4; i++) collector.recordEvaluation(mockResult('ALLOW'));
      const report = collector.generateFeedbackReport();
      expect(report.healthScore).toBeLessThan(1.0);
      expect(report.recommendations.some((r) => r.includes('block rate'))).toBe(true);
    });

    it('flags high escalation rate', () => {
      for (let i = 0; i < 4; i++) collector.recordEvaluation(mockResult('ESCALATE'));
      for (let i = 0; i < 6; i++) collector.recordEvaluation(mockResult('ALLOW'));
      const report = collector.generateFeedbackReport();
      expect(report.recommendations.some((r) => r.includes('escalation rate'))).toBe(true);
    });

    it('flags low conformance', () => {
      collector.recordConformanceRun(0.8, 0, 20);
      const report = collector.generateFeedbackReport();
      expect(report.recommendations.some((r) => r.includes('Conformance pass rate'))).toBe(true);
    });

    it('flags critical conformance failures', () => {
      collector.recordConformanceRun(0.9, 2, 20);
      const report = collector.generateFeedbackReport();
      expect(report.recommendations.some((r) => r.includes('critical conformance'))).toBe(true);
    });

    it('includes summary string', () => {
      collector.recordEvaluation(mockResult('ALLOW'));
      const report = collector.generateFeedbackReport();
      expect(report.summary).toContain('Guard evaluations:');
      expect(report.summary).toContain('Block rate:');
    });

    it('healthScore never below 0', () => {
      for (let i = 0; i < 10; i++) collector.recordEvaluation(mockResult('BLOCK'));
      collector.recordConformanceRun(0.5, 5, 20);
      for (let i = 0; i < 5; i++) collector.recordError('err');
      const report = collector.generateFeedbackReport();
      expect(report.healthScore).toBeGreaterThanOrEqual(0);
    });
  });

  // --- Reset ---

  describe('reset', () => {
    it('clears all data', () => {
      collector.recordEvaluation(mockResult('ALLOW'));
      collector.recordPipelineEvent('created');
      collector.recordConformanceRun(1.0, 0, 20);
      collector.recordError('err');
      collector.reset();

      expect(collector.getGuardMetrics().totalEvaluations).toBe(0);
      expect(collector.getPipelineMetrics().totalPipelines).toBe(0);
      expect(collector.getConformanceMetrics().lastRunTimestamp).toBeNull();
      expect(collector.getSystemHealthMetrics().totalErrors).toBe(0);
      expect(collector.getAlerts()).toHaveLength(0);
    });
  });
});
