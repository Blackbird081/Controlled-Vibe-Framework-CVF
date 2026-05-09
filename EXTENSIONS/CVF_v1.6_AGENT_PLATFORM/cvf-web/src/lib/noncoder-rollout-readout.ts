/**
 * noncoder-rollout-readout.ts
 * W128-T1 — Lane readout model + rollout recommendations
 *
 * Turns W127 metrics into 6 operator-readable lane readouts with
 * flag-aware recommendations. Threshold contract: CVF_W128_ROLLOUT_DECISION_CONTRACT.md
 */

import { computeNoncoderMetrics } from './noncoder-metrics';
import type { AnalyticsEvent } from './analytics';

export type LaneStatus = 'healthy' | 'watch' | 'action_required' | 'no_data';

export interface NoncoderFlags {
  intentFirstEnabled: boolean;
  iterationMemoryEnabled: boolean;
  clarificationLoopEnabled: boolean;
}

export interface NoncoderLaneReadout {
  laneId: string;
  laneName: string;
  status: LaneStatus;
  metricValue: number | null;
  metricLabel: string;
  flagActive: boolean;
  explanation: string;
  recommendation: string;
}

export interface RolloutRecommendation {
  priority: number;
  laneId: string;
  action: string;
  rationale: string;
}

const STATUS_PRIORITY: Record<LaneStatus, number> = {
  action_required: 3,
  watch: 2,
  no_data: 1,
  healthy: 0,
};

function statusLower(value: number | null, watchAt: number, actAt: number): LaneStatus {
  if (value === null) return 'no_data';
  if (value <= watchAt) return 'healthy';
  if (value <= actAt) return 'watch';
  return 'action_required';
}

function statusHigher(value: number | null, watchAt: number, actAt: number): LaneStatus {
  if (value === null) return 'no_data';
  if (value >= watchAt) return 'healthy';
  if (value >= actAt) return 'watch';
  return 'action_required';
}

function worstOf(a: LaneStatus, b: LaneStatus): LaneStatus {
  if (a === 'no_data' && b === 'no_data') return 'no_data';
  if (a === 'no_data') return b;
  if (b === 'no_data') return a;
  return STATUS_PRIORITY[a] >= STATUS_PRIORITY[b] ? a : b;
}

export function readNoncoderFlags(): NoncoderFlags {
  return {
    intentFirstEnabled: process.env.NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR === 'true',
    iterationMemoryEnabled: process.env.NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY === 'true',
    clarificationLoopEnabled: process.env.NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP === 'true',
  };
}

type RecommendationFn = (flags: NoncoderFlags) => string;
type LaneRecs = Record<LaneStatus, RecommendationFn>;

const RECOMMENDATIONS: Record<string, LaneRecs> = {
  entry_routing: {
    healthy: () => 'Entry routing is performing well. Consider widening the intent-first rollout.',
    watch: () => 'Fallback rate is elevated. Review routing corpus for gaps or ambiguous patterns.',
    action_required: () => 'High fallback rate needs intervention. Expand routing patterns or improve front-door copy.',
    no_data: (f) => f.intentFirstEnabled
      ? 'Intent-first is active but no routing events yet. Verify trackEvent instrumentation is wired.'
      : 'Enable NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR and collect 1–2 weeks of traffic.',
  },
  clarification_recovery: {
    healthy: () => 'Clarification loop is recovering weak routes effectively.',
    watch: (f) => f.clarificationLoopEnabled
      ? 'Recovery rate is below 50%. Review clarification question quality and option coverage.'
      : 'Clarification loop is off. Enable NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP to test recovery.',
    action_required: (f) => f.clarificationLoopEnabled
      ? 'Low recovery rate. Rewrite clarification questions or expand option sets.'
      : 'Enable NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP — no recovery data possible while loop is off.',
    no_data: () => 'No weak-confidence routes recorded. Routing may be strong or volume is too low.',
  },
  trusted_form: {
    healthy: () => 'Browse fallback is low — trusted form routing is absorbing weak wizard routes.',
    watch: () => 'Fallback rate suggests some routes still miss wizard and form targets. Review form activation patterns.',
    action_required: (f) => f.intentFirstEnabled
      ? 'High fallback despite trusted forms active. Expand TRUSTED_FORM_MAP patterns to cover uncaptured intents.'
      : 'Intent-first is off. Enable NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR to activate the form routing path.',
    no_data: () => 'No routing events recorded yet.',
  },
  followup_continuity: {
    healthy: () => 'Follow-up continuation rate is healthy. Thread memory is delivering value.',
    watch: (f) => f.iterationMemoryEnabled
      ? 'Low follow-up rate. Review history/continuity UX surfaces for discoverability.'
      : 'Iteration memory is off. Enable NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY to test continuity impact.',
    action_required: (f) => f.iterationMemoryEnabled
      ? 'Very low follow-up rate. Improve continue-work CTA visibility or add in-result prompting.'
      : 'Enable NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY — no continuation data possible while memory is off.',
    no_data: () => 'Insufficient execution data to compute follow-up rate.',
  },
  evidence_export: {
    healthy: () => 'Evidence export rate is healthy. Users are capturing governed outputs.',
    watch: () => 'Export rate is below target. Improve evidence panel visibility or add copy-to-clipboard CTA.',
    action_required: () => 'Very low export rate. Add a prominent export CTA to the result view.',
    no_data: () => 'No accepted executions recorded yet.',
  },
  deliverable_pack: {
    healthy: () => 'Pack export rate is healthy. Users are using deliverable packs for handoffs.',
    watch: () => 'Pack export rate is below target. Surface the Pack tab more prominently in the result view.',
    action_required: () => 'Very low pack export rate. Improve pack discoverability or add an in-result prompt.',
    no_data: () => 'No accepted executions recorded yet.',
  },
};

function rec(laneId: string, status: LaneStatus, flags: NoncoderFlags): string {
  return RECOMMENDATIONS[laneId]?.[status]?.(flags) ?? 'No recommendation available.';
}

function pct(v: number | null): number | null {
  return v !== null ? parseFloat((v * 100).toFixed(1)) : null;
}

export function computeLaneReadout(
  events: AnalyticsEvent[],
  flags?: NoncoderFlags,
): NoncoderLaneReadout[] {
  const m = computeNoncoderMetrics(events);
  const f = flags ?? readNoncoderFlags();

  const fallbackStatus = statusLower(m.weakFallbackRate, 0.15, 0.30);
  const ttfvStatus = statusLower(m.timeToFirstValueMs, 3 * 60_000, 5 * 60_000);
  const entryStatus = worstOf(fallbackStatus, ttfvStatus);
  const clarStatus = statusHigher(m.routeRecoveryRate, 0.50, 0.30);
  const followStatus = statusHigher(m.followupContinuationRate, 0.15, 0.05);
  const evStatus = statusHigher(m.evidenceExportRate, 0.15, 0.05);
  const packStatus = statusHigher(m.deliverablePackExportRate, 0.15, 0.05);

  return [
    {
      laneId: 'entry_routing',
      laneName: 'Entry Routing',
      status: entryStatus,
      metricValue: pct(m.weakFallbackRate),
      metricLabel: 'Weak fallback rate (%)',
      flagActive: f.intentFirstEnabled,
      explanation: m.weakFallbackRate === null
        ? 'No routing events recorded yet.'
        : `${(m.weakFallbackRate * 100).toFixed(0)}% fallback to browse.${m.timeToFirstValueMs !== null ? ` Median TTFV: ${(m.timeToFirstValueMs / 60000).toFixed(1)} min.` : ''}`,
      recommendation: rec('entry_routing', entryStatus, f),
    },
    {
      laneId: 'clarification_recovery',
      laneName: 'Clarification Recovery',
      status: clarStatus,
      metricValue: pct(m.routeRecoveryRate),
      metricLabel: 'Route recovery rate (%)',
      flagActive: f.clarificationLoopEnabled,
      explanation: m.routeRecoveryRate === null
        ? 'No weak-confidence routing events recorded.'
        : `${(m.routeRecoveryRate * 100).toFixed(0)}% of weak routes recovered via clarification.`,
      recommendation: rec('clarification_recovery', clarStatus, f),
    },
    {
      laneId: 'trusted_form',
      laneName: 'Trusted Form Routing',
      status: fallbackStatus,
      metricValue: pct(m.weakFallbackRate),
      metricLabel: 'Weak fallback rate (%) — shared signal',
      flagActive: f.intentFirstEnabled,
      explanation: 'Trusted form routing shares the weak-fallback signal. A decreasing trend confirms form routing is absorbing formerly-weak routes.',
      recommendation: rec('trusted_form', fallbackStatus, f),
    },
    {
      laneId: 'followup_continuity',
      laneName: 'Follow-up Continuity',
      status: followStatus,
      metricValue: pct(m.followupContinuationRate),
      metricLabel: 'Followup continuation rate (%)',
      flagActive: f.iterationMemoryEnabled,
      explanation: m.followupContinuationRate === null
        ? 'No execution events recorded.'
        : `${(m.followupContinuationRate * 100).toFixed(0)}% of sessions included a follow-up iteration.`,
      recommendation: rec('followup_continuity', followStatus, f),
    },
    {
      laneId: 'evidence_export',
      laneName: 'Evidence Export',
      status: evStatus,
      metricValue: pct(m.evidenceExportRate),
      metricLabel: 'Evidence export rate (%)',
      flagActive: true,
      explanation: m.evidenceExportRate === null
        ? 'No accepted executions recorded yet.'
        : `${(m.evidenceExportRate * 100).toFixed(0)}% of accepted executions had an evidence export.`,
      recommendation: rec('evidence_export', evStatus, f),
    },
    {
      laneId: 'deliverable_pack',
      laneName: 'Deliverable Pack Export',
      status: packStatus,
      metricValue: pct(m.deliverablePackExportRate),
      metricLabel: 'Pack export rate (%)',
      flagActive: true,
      explanation: m.deliverablePackExportRate === null
        ? 'No accepted executions recorded yet.'
        : `${(m.deliverablePackExportRate * 100).toFixed(0)}% of accepted executions had a pack exported.`,
      recommendation: rec('deliverable_pack', packStatus, f),
    },
  ];
}

export function buildRolloutRecommendations(
  readout: NoncoderLaneReadout[],
): RolloutRecommendation[] {
  return readout
    .filter((l) => l.status !== 'healthy')
    .sort((a, b) => STATUS_PRIORITY[b.status] - STATUS_PRIORITY[a.status])
    .map((lane, idx) => ({
      priority: idx + 1,
      laneId: lane.laneId,
      action: lane.recommendation,
      rationale: lane.explanation,
    }));
}
