import { describe, expect, it } from 'vitest';
import { computeEvtFalsePositiveStats, computeEvtTaskRecoveryStats } from './evt-operator-metrics';
import type { AnalyticsEvent } from './analytics';

describe('evt-operator-metrics', () => {
  it('computes false-positive rate from unique reportable decisions', () => {
    const stats = computeEvtFalsePositiveStats([
      { eventType: 'REPORTABLE_DECISION_OBSERVED', receiptId: 'rcpt-1', decision: 'BLOCK' },
      { eventType: 'REPORTABLE_DECISION_OBSERVED', receiptId: 'rcpt-2', decision: 'CLARIFY' },
      { eventType: 'FALSE_POSITIVE_REPORTED', receiptId: 'rcpt-2', decision: 'CLARIFY' },
    ]);

    expect(stats.observedReportableDecisions).toBe(2);
    expect(stats.falsePositiveReports).toBe(1);
    expect(stats.falsePositiveRatePct).toBe(50);
    expect(stats.evidenceMode).toBe('observed_and_reported');
    expect(stats.byDecision.CLARIFY).toEqual({ observed: 1, reported: 1 });
  });

  it('computes governance task recovery and abandonment rates', () => {
    const events: AnalyticsEvent[] = [
      { id: 'p1', type: 'task_recovery_prompted', timestamp: 1 },
      { id: 'p2', type: 'task_recovery_prompted', timestamp: 2 },
      { id: 's1', type: 'task_recovery_started', timestamp: 3 },
    ];

    const stats = computeEvtTaskRecoveryStats(events);
    expect(stats.prompted).toBe(2);
    expect(stats.started).toBe(1);
    expect(stats.recoveryRatePct).toBe(50);
    expect(stats.abandonmentRatePct).toBe(50);
  });
});
