import type { AnalyticsEvent } from '@/lib/analytics';

export type EvtFalsePositiveEvidenceMode = 'observed_and_reported' | 'reported_only';

export interface EvtFalsePositiveEventLike {
  eventType: 'REPORTABLE_DECISION_OBSERVED' | 'FALSE_POSITIVE_REPORTED';
  receiptId?: string;
  decision?: string;
}

export interface EvtFalsePositiveStats {
  observedReportableDecisions: number;
  falsePositiveReports: number;
  falsePositiveRate: number;
  falsePositiveRatePct: number;
  evidenceMode: EvtFalsePositiveEvidenceMode;
  lowNCaveat: boolean;
  byDecision: Record<string, { observed: number; reported: number }>;
}

export interface EvtTaskRecoveryStats {
  prompted: number;
  started: number;
  recoveryRate: number | null;
  abandonmentRate: number | null;
  recoveryRatePct: number | null;
  abandonmentRatePct: number | null;
}

function roundPct(value: number): number {
  return Math.round(value * 10000) / 100;
}

function safeRate(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : Math.min(1, numerator / denominator);
}

export function computeEvtFalsePositiveStats(events: EvtFalsePositiveEventLike[]): EvtFalsePositiveStats {
  const observed = new Map<string, EvtFalsePositiveEventLike>();
  const reported = new Map<string, EvtFalsePositiveEventLike>();

  for (const event of events) {
    const receiptId = String(event.receiptId || '').trim();
    if (!receiptId || (event.decision !== 'BLOCK' && event.decision !== 'CLARIFY')) continue;

    if (event.eventType === 'REPORTABLE_DECISION_OBSERVED') {
      observed.set(receiptId, event);
    } else if (event.eventType === 'FALSE_POSITIVE_REPORTED') {
      reported.set(receiptId, event);
    }
  }

  const denominatorIds = new Set([...observed.keys(), ...reported.keys()]);
  const numeratorIds = new Set(reported.keys());
  const observedReportableDecisions = denominatorIds.size;
  const falsePositiveReports = numeratorIds.size;
  const falsePositiveRate = safeRate(falsePositiveReports, observedReportableDecisions) ?? 0;
  const byDecision: EvtFalsePositiveStats['byDecision'] = {};

  for (const receiptId of denominatorIds) {
    const event = observed.get(receiptId) ?? reported.get(receiptId);
    const decision = String(event?.decision || 'unknown');
    const bucket = byDecision[decision] ?? { observed: 0, reported: 0 };
    bucket.observed += 1;
    if (reported.has(receiptId)) bucket.reported += 1;
    byDecision[decision] = bucket;
  }

  return {
    observedReportableDecisions,
    falsePositiveReports,
    falsePositiveRate,
    falsePositiveRatePct: roundPct(falsePositiveRate),
    evidenceMode: observed.size > 0 ? 'observed_and_reported' : 'reported_only',
    lowNCaveat: observedReportableDecisions < 20,
    byDecision,
  };
}

export function computeEvtTaskRecoveryStats(events: AnalyticsEvent[]): EvtTaskRecoveryStats {
  const prompted = events.filter(event => event.type === 'task_recovery_prompted').length;
  const started = events.filter(event => event.type === 'task_recovery_started').length;
  const recoveryRate = safeRate(started, prompted);
  const abandonmentRate = recoveryRate === null ? null : 1 - recoveryRate;

  return {
    prompted,
    started,
    recoveryRate,
    abandonmentRate,
    recoveryRatePct: recoveryRate === null ? null : roundPct(recoveryRate),
    abandonmentRatePct: abandonmentRate === null ? null : roundPct(abandonmentRate),
  };
}
