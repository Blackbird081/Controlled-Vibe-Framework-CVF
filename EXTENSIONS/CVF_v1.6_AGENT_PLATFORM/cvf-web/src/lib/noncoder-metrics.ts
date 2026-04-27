/**
 * CVF Noncoder Adoption Metrics
 * ==============================
 * W127-T1 CP1+CP3 — Metric computation and report generation.
 *
 * Metrics are computed from the browser-local analytics event store.
 * Definitions are locked in docs/reviews/CVF_W127_NONCODER_METRIC_CONTRACT.md.
 * Do not change metric formulas without updating the contract.
 *
 * W127-T1 CP1+CP3
 *
 * @module lib/noncoder-metrics
 */

import type { AnalyticsEvent } from '@/lib/analytics';

export interface NoncoderMetrics {
  timeToFirstValueMs: number | null;
  routeRecoveryRate: number | null;
  weakFallbackRate: number | null;
  followupContinuationRate: number | null;
  evidenceExportRate: number | null;
  deliverablePackExportRate: number | null;
}

export interface MetricReport {
  computedAt: string;
  windowDays: number;
  metrics: NoncoderMetrics;
  summary: string;
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function countByType(events: AnalyticsEvent[], type: string): number {
  return events.filter((e) => e.type === type).length;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function safeRate(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null;
  return Math.min(1, numerator / denominator);
}

// ─── Metric: time_to_first_value ─────────────────────────────────────────────

function computeTimeToFirstValue(events: AnalyticsEvent[]): number | null {
  const created = events.filter((e) => e.type === 'execution_created');
  const accepted = events.filter((e) => e.type === 'execution_accepted');

  const acceptedIds = new Set(
    accepted.map((e) => (e.data as Record<string, unknown>)?.id as string).filter(Boolean)
  );

  const elapsedValues: number[] = [];
  for (const c of created) {
    const id = (c.data as Record<string, unknown>)?.id as string | undefined;
    if (id && acceptedIds.has(id)) {
      const a = accepted.find(
        (e) => (e.data as Record<string, unknown>)?.id === id
      );
      if (a && a.timestamp > c.timestamp) {
        elapsedValues.push(a.timestamp - c.timestamp);
      }
    }
  }

  if (elapsedValues.length === 0) {
    // Fall back: match created/accepted by order if no id pairing available
    const sortedCreated = [...created].sort((a, b) => a.timestamp - b.timestamp);
    const sortedAccepted = [...accepted].sort((a, b) => a.timestamp - b.timestamp);
    for (let i = 0; i < Math.min(sortedCreated.length, sortedAccepted.length); i++) {
      const elapsed = sortedAccepted[i].timestamp - sortedCreated[i].timestamp;
      if (elapsed > 0) elapsedValues.push(elapsed);
    }
  }

  return median(elapsedValues);
}

// ─── Metric: route_recovery_rate ─────────────────────────────────────────────

function computeRouteRecoveryRate(events: AnalyticsEvent[]): number | null {
  const weak = countByType(events, 'clarification_weak_confidence_detected');
  const recovered = countByType(events, 'clarification_route_recovered');
  return safeRate(recovered, weak);
}

// ─── Metric: weak_fallback_rate ──────────────────────────────────────────────

function computeWeakFallbackRate(events: AnalyticsEvent[]): number | null {
  const strongRoutes = countByType(events, 'intent_routed');
  const weakRoutes = countByType(events, 'clarification_weak_confidence_detected');
  const total = strongRoutes + weakRoutes;
  if (total === 0) return null;
  const fallbacks = countByType(events, 'clarification_browse_fallback');
  return safeRate(fallbacks, total);
}

// ─── Metric: followup_continuation_rate ──────────────────────────────────────

function computeFollowupContinuationRate(events: AnalyticsEvent[]): number | null {
  const created = countByType(events, 'execution_created');
  const followups = countByType(events, 'followup_started');
  return safeRate(followups, created);
}

// ─── Metric: evidence_export_rate ────────────────────────────────────────────

function computeEvidenceExportRate(events: AnalyticsEvent[]): number | null {
  const accepted = countByType(events, 'execution_accepted');
  const exported = countByType(events, 'evidence_exported');
  return safeRate(exported, accepted);
}

// ─── Metric: deliverable_pack_export_rate ────────────────────────────────────

function computeDeliverablePackExportRate(events: AnalyticsEvent[]): number | null {
  const accepted = countByType(events, 'execution_accepted');
  const packed = countByType(events, 'deliverable_pack_exported');
  return safeRate(packed, accepted);
}

// ─── Main computation ─────────────────────────────────────────────────────────

/**
 * Compute all 6 W127 noncoder adoption metrics from an analytics event array.
 * Pass a filtered window (e.g., last 30 days) for bounded comparisons.
 */
export function computeNoncoderMetrics(events: AnalyticsEvent[]): NoncoderMetrics {
  return {
    timeToFirstValueMs: computeTimeToFirstValue(events),
    routeRecoveryRate: computeRouteRecoveryRate(events),
    weakFallbackRate: computeWeakFallbackRate(events),
    followupContinuationRate: computeFollowupContinuationRate(events),
    evidenceExportRate: computeEvidenceExportRate(events),
    deliverablePackExportRate: computeDeliverablePackExportRate(events),
  };
}

// ─── Report generation (CP3) ──────────────────────────────────────────────────

function formatMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60_000);
  const s = Math.round((ms % 60_000) / 1000);
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function formatRate(rate: number | null): string {
  if (rate === null) return 'N/A (no data)';
  return `${(rate * 100).toFixed(1)}%`;
}

function summarizeFriction(metrics: NoncoderMetrics): string {
  const issues: string[] = [];
  const wins: string[] = [];

  if (metrics.timeToFirstValueMs !== null && metrics.timeToFirstValueMs > 300_000) {
    issues.push('time-to-first-value exceeds 5 minutes — onboarding friction is high');
  } else if (metrics.timeToFirstValueMs !== null) {
    wins.push('time-to-first-value is under 5 minutes');
  }

  if (metrics.routeRecoveryRate !== null && metrics.routeRecoveryRate < 0.5) {
    issues.push('route recovery rate below 50% — clarification loop is not effective enough');
  } else if (metrics.routeRecoveryRate !== null) {
    wins.push('clarification loop recovers more than half of weak routing attempts');
  }

  if (metrics.weakFallbackRate !== null && metrics.weakFallbackRate > 0.3) {
    issues.push('weak fallback rate above 30% — too many users end up in browse/fallback');
  } else if (metrics.weakFallbackRate !== null) {
    wins.push('weak fallback rate is acceptably low');
  }

  if (metrics.followupContinuationRate !== null && metrics.followupContinuationRate < 0.1) {
    issues.push('followup continuation rate below 10% — continuity surfaces not engaging users');
  } else if (metrics.followupContinuationRate !== null) {
    wins.push('followup continuation rate shows repeat engagement');
  }

  if (metrics.evidenceExportRate !== null && metrics.evidenceExportRate < 0.1) {
    issues.push('evidence export rate below 10% — governance outputs are not being carried out');
  }

  if (metrics.deliverablePackExportRate !== null && metrics.deliverablePackExportRate > 0.2) {
    wins.push('deliverable pack export rate is healthy — users find packs valuable');
  }

  if (issues.length === 0 && wins.length === 0) return 'No data available to assess friction.';
  const parts: string[] = [];
  if (wins.length > 0) parts.push(`Wins: ${wins.join('; ')}.`);
  if (issues.length > 0) parts.push(`Issues: ${issues.join('; ')}.`);
  return parts.join(' ');
}

/**
 * Generate a markdown-formatted noncoder adoption metric report.
 * Suitable for operator review, docs artifacts, or analytics surface display.
 */
export function generateMetricReport(
  events: AnalyticsEvent[],
  windowDays = 30
): MetricReport {
  const metrics = computeNoncoderMetrics(events);
  const summary = summarizeFriction(metrics);

  const lines = [
    `# CVF Noncoder Adoption Metrics Report`,
    ``,
    `**Computed:** ${new Date().toISOString()}`,
    `**Window:** Last ${windowDays} days`,
    `**Events analyzed:** ${events.length}`,
    ``,
    `## Metrics`,
    ``,
    `| Metric | Value |`,
    `| --- | --- |`,
    `| Time to first value (median) | ${metrics.timeToFirstValueMs !== null ? formatMs(metrics.timeToFirstValueMs) : 'N/A'} |`,
    `| Route recovery rate | ${formatRate(metrics.routeRecoveryRate)} |`,
    `| Weak fallback rate | ${formatRate(metrics.weakFallbackRate)} |`,
    `| Followup continuation rate | ${formatRate(metrics.followupContinuationRate)} |`,
    `| Evidence export rate | ${formatRate(metrics.evidenceExportRate)} |`,
    `| Deliverable pack export rate | ${formatRate(metrics.deliverablePackExportRate)} |`,
    ``,
    `## Friction Assessment`,
    ``,
    summary,
    ``,
    `> _Metric definitions locked in CVF_W127_NONCODER_METRIC_CONTRACT.md_`,
  ];

  return {
    computedAt: new Date().toISOString(),
    windowDays,
    metrics,
    summary: lines.join('\n'),
  };
}
