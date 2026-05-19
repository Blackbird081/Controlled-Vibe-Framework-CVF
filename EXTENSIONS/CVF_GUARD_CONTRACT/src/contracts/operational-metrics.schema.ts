/**
 * CVF Phase 3.S — Operational Metrics Schema
 * ============================================
 * Schema entries for all 10 candidate operational metrics from the converged
 * roadmap. Each metric is classified as planned-but-not-emitted where no
 * runtime source currently exists.
 *
 * Authorized by: docs/baselines/CVF_GC018_PHASE_3S_OPERATIONAL_METRICS_SCHEMA_2026-05-18.md
 *
 * SCOPE: Schema definition only.
 *   No emission infrastructure or runtime metric sources (Phase 3.E).
 *   No dashboard integration.
 *   No live operational intelligence claimed.
 *   EA Track E benchmark work is the existing foundation — not modified here.
 *
 * Emission status vocabulary:
 *   planned-but-not-emitted — schema defined; no runtime source exists yet
 *   emitted-by-benchmark    — EA Track E benchmark produces this metric
 *   emitted-at-runtime      — live runtime source exists (none as of Phase 3.S)
 */

// ─── Emission Status ──────────────────────────────────────────────────────────

export type MetricEmissionStatus =
  | 'planned-but-not-emitted'
  | 'emitted-by-benchmark'
  | 'emitted-at-runtime';

// ─── Metric Schema Entry ──────────────────────────────────────────────────────

export interface OperationalMetricSchema {
  readonly metricId: string;
  readonly name: string;
  readonly description: string;
  readonly unit: string;
  readonly emissionStatus: MetricEmissionStatus;
  /** The Phase that unlocks runtime emission of this metric. */
  readonly emissionPhase: 'EA-Track-E' | 'Phase-2B' | 'Phase-2C' | 'Phase-3E';
  /** Runtime source when emitted; null when planned-but-not-emitted. */
  readonly runtimeSource: string | null;
}

// ─── 10 Candidate Metrics ─────────────────────────────────────────────────────

export const OPERATIONAL_METRICS_SCHEMA: ReadonlyArray<OperationalMetricSchema> = [
  {
    metricId: 'task-completion-rate',
    name: 'Task Completion Rate',
    description: 'Fraction of governed tasks that reach a terminal success state without operator rollback.',
    unit: 'ratio (0.0–1.0)',
    emissionStatus: 'planned-but-not-emitted',
    emissionPhase: 'Phase-2B',
    runtimeSource: null,
    // Phase 2.B: execution.pipeline.contract emits task outcome → receipt → metric
  },
  {
    metricId: 'retry-count',
    name: 'Retry Count',
    description: 'Number of retries per governed task execution before terminal outcome.',
    unit: 'count (integer ≥ 0)',
    emissionStatus: 'planned-but-not-emitted',
    emissionPhase: 'Phase-2B',
    runtimeSource: null,
  },
  {
    metricId: 'hallucination-recovery',
    name: 'Hallucination Recovery Rate',
    description: 'Fraction of detected hallucination events that are caught by a CVF guard and corrected before delivery.',
    unit: 'ratio (0.0–1.0)',
    emissionStatus: 'planned-but-not-emitted',
    emissionPhase: 'Phase-2C',
    runtimeSource: null,
    // Phase 2.C: requires contamination_guard + refusal_router risk signals
  },
  {
    metricId: 'policy-violation-rate',
    name: 'Policy Violation Rate',
    description: 'Fraction of governed actions that trigger a policy deny or escalate decision.',
    unit: 'ratio (0.0–1.0)',
    emissionStatus: 'planned-but-not-emitted',
    emissionPhase: 'Phase-2B',
    runtimeSource: null,
    // Phase 2.B: PolicyEngine.evaluate() decision emitted to audit memory
  },
  {
    metricId: 'human-correction-count',
    name: 'Human Correction Count',
    description: 'Number of operator-initiated rollbacks or corrections per session.',
    unit: 'count (integer ≥ 0)',
    emissionStatus: 'planned-but-not-emitted',
    emissionPhase: 'Phase-2B',
    runtimeSource: null,
  },
  {
    metricId: 'cross-session-continuity',
    name: 'Cross-Session Continuity Score',
    description: 'Measure of how consistently task context is preserved across session handoffs.',
    unit: 'score (0.0–1.0)',
    emissionStatus: 'planned-but-not-emitted',
    emissionPhase: 'Phase-2C',
    runtimeSource: null,
    // Phase 2.C: requires agent handoff receipt chain + memory tier skill/working comparison
  },
  {
    metricId: 'long-horizon-stability',
    name: 'Long-Horizon Stability',
    description: 'Fraction of multi-phase governed workflows that complete without drift from initial plan.',
    unit: 'ratio (0.0–1.0)',
    emissionStatus: 'planned-but-not-emitted',
    emissionPhase: 'Phase-3E',
    runtimeSource: null,
    // Phase 3.E: requires multi-phase execution data from 2.B + 2.C
  },
  {
    metricId: 'receipt-integrity',
    name: 'Receipt Integrity Rate',
    description: 'Fraction of issued receipts whose integrityHash validates against payload on re-read.',
    unit: 'ratio (0.0–1.0)',
    emissionStatus: 'planned-but-not-emitted',
    emissionPhase: 'Phase-2B',
    runtimeSource: null,
    // Phase 2.B: receipt-envelope.contract producers emit receipts; Phase 2.B adds integrity check
  },
  {
    metricId: 'deterministic-consistency',
    name: 'Deterministic Consistency Score',
    description: 'Fraction of identical inputs that produce identical governed outputs across runs (EA Track E foundation).',
    unit: 'ratio (0.0–1.0)',
    emissionStatus: 'emitted-by-benchmark',
    emissionPhase: 'EA-Track-E',
    runtimeSource: 'EA Track E benchmark suite (scripts/run_cvf_protected_live_release_gate.py)',
    // EA Track E established the deterministic reproducibility benchmark foundation
  },
  {
    metricId: 'rollback-success',
    name: 'Rollback Success Rate',
    description: 'Fraction of operator-initiated rollbacks that return the system to the last stable governed state.',
    unit: 'ratio (0.0–1.0)',
    emissionStatus: 'planned-but-not-emitted',
    emissionPhase: 'Phase-2B',
    runtimeSource: null,
  },
] as const;

// ─── Metric Registry Helpers ──────────────────────────────────────────────────

export function getMetricById(metricId: string): OperationalMetricSchema | undefined {
  return OPERATIONAL_METRICS_SCHEMA.find((m) => m.metricId === metricId);
}

export function getMetricsByEmissionStatus(
  status: MetricEmissionStatus,
): ReadonlyArray<OperationalMetricSchema> {
  return OPERATIONAL_METRICS_SCHEMA.filter((m) => m.emissionStatus === status);
}

export function getMetricsByEmissionPhase(
  phase: OperationalMetricSchema['emissionPhase'],
): ReadonlyArray<OperationalMetricSchema> {
  return OPERATIONAL_METRICS_SCHEMA.filter((m) => m.emissionPhase === phase);
}
