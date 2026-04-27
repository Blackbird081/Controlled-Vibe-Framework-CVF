/**
 * noncoder-metrics.test.ts
 * W127-T1 — Metric computation verification
 *
 * Tests:
 *   1.  computeNoncoderMetrics returns all 6 null on empty events
 *   2.  timeToFirstValueMs — matched pair returns correct elapsed
 *   3.  timeToFirstValueMs — multiple pairs returns median
 *   4.  timeToFirstValueMs — unmatched created (no accepted) returns null
 *   5.  routeRecoveryRate — recovered/weak returns correct ratio
 *   6.  routeRecoveryRate — zero weak returns null
 *   7.  routeRecoveryRate — capped at 1.0 when recovered > weak
 *   8.  weakFallbackRate — fallback/total returns correct ratio
 *   9.  weakFallbackRate — no routing events returns null
 *   10. followupContinuationRate — followup/created returns correct ratio
 *   11. followupContinuationRate — zero created returns null
 *   12. evidenceExportRate — exported/accepted returns correct ratio
 *   13. evidenceExportRate — zero accepted returns null
 *   14. deliverablePackExportRate — packed/accepted returns correct ratio
 *   15. deliverablePackExportRate — zero accepted returns null
 *   16. generateMetricReport returns MetricReport with summary string
 *   17. generateMetricReport summary includes table rows for all 6 metrics
 *   18. generateMetricReport marks N/A when data missing
 *   19. summarizeFriction flags high time_to_first_value
 *   20. summarizeFriction flags low route_recovery_rate
 */

import { describe, it, expect } from 'vitest';
import { computeNoncoderMetrics, generateMetricReport } from './noncoder-metrics';
import type { AnalyticsEvent } from './analytics';

let idCounter = 0;
function makeEvent(
  type: string,
  timestamp: number,
  data?: Record<string, unknown>
): AnalyticsEvent {
  return {
    id: `evt_${++idCounter}`,
    type: type as AnalyticsEvent['type'],
    timestamp,
    data,
  };
}

const T0 = 1_000_000;

describe('computeNoncoderMetrics', () => {
  it('1. all null on empty events', () => {
    const m = computeNoncoderMetrics([]);
    expect(m.timeToFirstValueMs).toBeNull();
    expect(m.routeRecoveryRate).toBeNull();
    expect(m.weakFallbackRate).toBeNull();
    expect(m.followupContinuationRate).toBeNull();
    expect(m.evidenceExportRate).toBeNull();
    expect(m.deliverablePackExportRate).toBeNull();
  });

  it('2. timeToFirstValueMs — matched pair returns elapsed', () => {
    const events = [
      makeEvent('execution_created', T0, { id: 'e1', templateId: 't1' }),
      makeEvent('execution_accepted', T0 + 30_000, { id: 'e1' }),
    ];
    const m = computeNoncoderMetrics(events);
    expect(m.timeToFirstValueMs).toBe(30_000);
  });

  it('3. timeToFirstValueMs — multiple pairs returns median', () => {
    const events = [
      makeEvent('execution_created', T0, { id: 'e1' }),
      makeEvent('execution_accepted', T0 + 10_000, { id: 'e1' }),
      makeEvent('execution_created', T0 + 100_000, { id: 'e2' }),
      makeEvent('execution_accepted', T0 + 160_000, { id: 'e2' }),
    ];
    const m = computeNoncoderMetrics(events);
    // elapsed: [10000, 60000] — median = 35000
    expect(m.timeToFirstValueMs).toBe(35_000);
  });

  it('4. timeToFirstValueMs — no accepted returns null', () => {
    const events = [
      makeEvent('execution_created', T0, { id: 'e1' }),
    ];
    const m = computeNoncoderMetrics(events);
    expect(m.timeToFirstValueMs).toBeNull();
  });

  it('5. routeRecoveryRate — recovered/weak correct ratio', () => {
    const events = [
      makeEvent('clarification_weak_confidence_detected', T0),
      makeEvent('clarification_weak_confidence_detected', T0 + 1),
      makeEvent('clarification_route_recovered', T0 + 2),
    ];
    const m = computeNoncoderMetrics(events);
    expect(m.routeRecoveryRate).toBeCloseTo(0.5);
  });

  it('6. routeRecoveryRate — zero weak returns null', () => {
    const events = [
      makeEvent('clarification_route_recovered', T0),
    ];
    const m = computeNoncoderMetrics(events);
    expect(m.routeRecoveryRate).toBeNull();
  });

  it('7. routeRecoveryRate — capped at 1.0', () => {
    const events = [
      makeEvent('clarification_weak_confidence_detected', T0),
      makeEvent('clarification_route_recovered', T0 + 1),
      makeEvent('clarification_route_recovered', T0 + 2),
    ];
    const m = computeNoncoderMetrics(events);
    expect(m.routeRecoveryRate).toBe(1);
  });

  it('8. weakFallbackRate — correct ratio', () => {
    const events = [
      makeEvent('intent_routed', T0),
      makeEvent('intent_routed', T0 + 1),
      makeEvent('clarification_weak_confidence_detected', T0 + 2),
      makeEvent('clarification_browse_fallback', T0 + 3),
    ];
    // total = 2 strong + 1 weak = 3; fallback = 1; rate = 1/3
    const m = computeNoncoderMetrics(events);
    expect(m.weakFallbackRate).toBeCloseTo(1 / 3);
  });

  it('9. weakFallbackRate — no routing events returns null', () => {
    const events = [
      makeEvent('execution_created', T0),
    ];
    const m = computeNoncoderMetrics(events);
    expect(m.weakFallbackRate).toBeNull();
  });

  it('10. followupContinuationRate — correct ratio', () => {
    const events = [
      makeEvent('execution_created', T0),
      makeEvent('execution_created', T0 + 1),
      makeEvent('execution_created', T0 + 2),
      makeEvent('followup_started', T0 + 3),
    ];
    const m = computeNoncoderMetrics(events);
    expect(m.followupContinuationRate).toBeCloseTo(1 / 3);
  });

  it('11. followupContinuationRate — zero created returns null', () => {
    const events = [makeEvent('followup_started', T0)];
    const m = computeNoncoderMetrics(events);
    expect(m.followupContinuationRate).toBeNull();
  });

  it('12. evidenceExportRate — correct ratio', () => {
    const events = [
      makeEvent('execution_accepted', T0, { id: 'e1' }),
      makeEvent('execution_accepted', T0 + 1, { id: 'e2' }),
      makeEvent('evidence_exported', T0 + 2, { executionId: 'e1', format: 'md' }),
    ];
    const m = computeNoncoderMetrics(events);
    expect(m.evidenceExportRate).toBeCloseTo(0.5);
  });

  it('13. evidenceExportRate — zero accepted returns null', () => {
    const events = [makeEvent('evidence_exported', T0)];
    const m = computeNoncoderMetrics(events);
    expect(m.evidenceExportRate).toBeNull();
  });

  it('14. deliverablePackExportRate — correct ratio', () => {
    const events = [
      makeEvent('execution_accepted', T0, { id: 'e1' }),
      makeEvent('execution_accepted', T0 + 1, { id: 'e2' }),
      makeEvent('execution_accepted', T0 + 2, { id: 'e3' }),
      makeEvent('deliverable_pack_exported', T0 + 3),
      makeEvent('deliverable_pack_exported', T0 + 4),
    ];
    const m = computeNoncoderMetrics(events);
    expect(m.deliverablePackExportRate).toBeCloseTo(2 / 3);
  });

  it('15. deliverablePackExportRate — zero accepted returns null', () => {
    const events = [makeEvent('deliverable_pack_exported', T0)];
    const m = computeNoncoderMetrics(events);
    expect(m.deliverablePackExportRate).toBeNull();
  });
});

describe('generateMetricReport', () => {
  it('16. returns a MetricReport with summary string', () => {
    const report = generateMetricReport([], 30);
    expect(report.summary).toBeTypeOf('string');
    expect(report.summary.length).toBeGreaterThan(0);
    expect(report.windowDays).toBe(30);
    expect(report.computedAt).toBeTypeOf('string');
  });

  it('17. summary contains table rows for all 6 metrics', () => {
    const report = generateMetricReport([], 30);
    expect(report.summary).toContain('Time to first value');
    expect(report.summary).toContain('Route recovery rate');
    expect(report.summary).toContain('Weak fallback rate');
    expect(report.summary).toContain('Followup continuation rate');
    expect(report.summary).toContain('Evidence export rate');
    expect(report.summary).toContain('Deliverable pack export rate');
  });

  it('18. summary marks N/A when no data', () => {
    const report = generateMetricReport([], 30);
    expect(report.summary).toContain('N/A');
  });

  it('19. summarizeFriction flags high time_to_first_value (>5 min)', () => {
    const events = [
      makeEvent('execution_created', T0, { id: 'e1' }),
      makeEvent('execution_accepted', T0 + 400_000, { id: 'e1' }),
    ];
    const report = generateMetricReport(events);
    expect(report.summary).toContain('time-to-first-value exceeds 5 minutes');
  });

  it('20. summarizeFriction flags low route_recovery_rate (<50%)', () => {
    const events = [
      makeEvent('clarification_weak_confidence_detected', T0),
      makeEvent('clarification_weak_confidence_detected', T0 + 1),
      makeEvent('clarification_weak_confidence_detected', T0 + 2),
    ];
    const report = generateMetricReport(events);
    expect(report.summary).toContain('route recovery rate below 50%');
  });
});
