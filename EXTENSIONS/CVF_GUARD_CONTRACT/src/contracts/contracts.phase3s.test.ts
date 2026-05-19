/**
 * CVF Phase 3.S — Operational Metrics Schema Conformance Test Stubs
 * ==================================================================
 * Conformance stubs verifying the 10 operational metric schema entries.
 * No live metric emission claimed — all metrics are planned-but-not-emitted
 * except deterministic-consistency (emitted by EA Track E benchmark).
 *
 * Authorized by: docs/baselines/CVF_GC018_PHASE_3S_OPERATIONAL_METRICS_SCHEMA_2026-05-18.md
 */

import { describe, it, expect } from 'vitest';

import {
  OPERATIONAL_METRICS_SCHEMA,
  getMetricById,
  getMetricsByEmissionStatus,
  getMetricsByEmissionPhase,
} from './index';

import type {
  OperationalMetricSchema,
  MetricEmissionStatus,
} from './index';

// ─── Schema Coverage ──────────────────────────────────────────────────────────

describe('OPERATIONAL_METRICS_SCHEMA', () => {
  it('defines exactly 10 candidate metrics', () => {
    expect(OPERATIONAL_METRICS_SCHEMA).toHaveLength(10);
  });

  it('every metric has required fields', () => {
    for (const metric of OPERATIONAL_METRICS_SCHEMA) {
      expect(metric.metricId).toBeTruthy();
      expect(metric.name).toBeTruthy();
      expect(metric.description).toBeTruthy();
      expect(metric.unit).toBeTruthy();
      expect(['planned-but-not-emitted', 'emitted-by-benchmark', 'emitted-at-runtime'])
        .toContain(metric.emissionStatus);
      expect(['EA-Track-E', 'Phase-2B', 'Phase-2C', 'Phase-3E'])
        .toContain(metric.emissionPhase);
    }
  });

  it('metric IDs are unique', () => {
    const ids = OPERATIONAL_METRICS_SCHEMA.map((m) => m.metricId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers all 10 candidate metric IDs from the roadmap', () => {
    const ids = OPERATIONAL_METRICS_SCHEMA.map((m) => m.metricId);
    expect(ids).toContain('task-completion-rate');
    expect(ids).toContain('retry-count');
    expect(ids).toContain('hallucination-recovery');
    expect(ids).toContain('policy-violation-rate');
    expect(ids).toContain('human-correction-count');
    expect(ids).toContain('cross-session-continuity');
    expect(ids).toContain('long-horizon-stability');
    expect(ids).toContain('receipt-integrity');
    expect(ids).toContain('deterministic-consistency');
    expect(ids).toContain('rollback-success');
  });
});

// ─── Emission Status ──────────────────────────────────────────────────────────

describe('Metric emission status', () => {
  it('most metrics are planned-but-not-emitted', () => {
    const notEmitted = getMetricsByEmissionStatus('planned-but-not-emitted');
    expect(notEmitted.length).toBeGreaterThanOrEqual(8);
  });

  it('deterministic-consistency is emitted-by-benchmark (EA Track E)', () => {
    const metric = getMetricById('deterministic-consistency');
    expect(metric).toBeDefined();
    expect(metric!.emissionStatus).toBe('emitted-by-benchmark');
    expect(metric!.emissionPhase).toBe('EA-Track-E');
    expect(metric!.runtimeSource).toContain('EA Track E');
  });

  it('no metric claims emitted-at-runtime (no live runtime source exists)', () => {
    const live = getMetricsByEmissionStatus('emitted-at-runtime');
    expect(live).toHaveLength(0);
  });

  it('planned-but-not-emitted metrics have null runtimeSource', () => {
    const notEmitted = getMetricsByEmissionStatus('planned-but-not-emitted');
    for (const metric of notEmitted) {
      expect(metric.runtimeSource).toBeNull();
    }
  });
});

// ─── Emission Phase Distribution ─────────────────────────────────────────────

describe('Metric emission phase distribution', () => {
  it('Phase-2B is the most common emission phase', () => {
    const phase2b = getMetricsByEmissionPhase('Phase-2B');
    expect(phase2b.length).toBeGreaterThanOrEqual(4);
  });

  it('Phase-3E contains long-horizon-stability (requires multi-phase data)', () => {
    const phase3e = getMetricsByEmissionPhase('Phase-3E');
    const ids = phase3e.map((m) => m.metricId);
    expect(ids).toContain('long-horizon-stability');
  });

  it('receipt-integrity is gated on Phase-2B (requires receipt producer wire-up)', () => {
    const metric = getMetricById('receipt-integrity');
    expect(metric!.emissionPhase).toBe('Phase-2B');
  });

  it('policy-violation-rate is gated on Phase-2B (requires PolicyEngine emit)', () => {
    const metric = getMetricById('policy-violation-rate');
    expect(metric!.emissionPhase).toBe('Phase-2B');
  });
});

// ─── Registry Helpers ─────────────────────────────────────────────────────────

describe('getMetricById()', () => {
  it('returns the correct metric for a known ID', () => {
    const metric = getMetricById('task-completion-rate');
    expect(metric).toBeDefined();
    expect(metric!.name).toBe('Task Completion Rate');
  });

  it('returns undefined for an unknown ID', () => {
    expect(getMetricById('not-a-real-metric')).toBeUndefined();
  });
});

describe('getMetricsByEmissionStatus()', () => {
  it('returns a non-empty array for planned-but-not-emitted', () => {
    const result = getMetricsByEmissionStatus('planned-but-not-emitted');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns empty array for emitted-at-runtime (no live sources)', () => {
    const result = getMetricsByEmissionStatus('emitted-at-runtime');
    expect(result).toHaveLength(0);
  });
});

// ─── No Live Claim Invariant ──────────────────────────────────────────────────

describe('No live operational intelligence claimed', () => {
  it('no metric schema declares emitted-at-runtime', () => {
    const live = OPERATIONAL_METRICS_SCHEMA.filter((m) => m.emissionStatus === 'emitted-at-runtime');
    expect(live).toHaveLength(0);
  });

  it('emitted-by-benchmark metrics reference EA Track E — not runtime', () => {
    const benchmarkMetrics = OPERATIONAL_METRICS_SCHEMA.filter(
      (m) => m.emissionStatus === 'emitted-by-benchmark',
    );
    for (const metric of benchmarkMetrics) {
      expect(metric.runtimeSource).toContain('EA Track E');
    }
  });
});
