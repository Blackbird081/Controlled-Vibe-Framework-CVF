/**
 * CVF W8-T2 — Performance Benchmark Harness Contract
 *
 * Instrumentation-only cross-plane benchmark harness. Defines representative
 * execution targets, measurement types, and run lifecycle. All produced reports
 * carry evidenceClass "PROPOSAL_ONLY" — no path to baseline truth within this
 * contract. Promotion requires an explicit GC-026 tracker sync.
 *
 * Governance: W8-T2 CP1 Full Lane
 * Authorization: docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W8_T2_PERFORMANCE_BENCHMARK_HARNESS_2026-03-29.md
 */

import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BenchmarkTarget =
  | "CPF_PIPELINE"
  | "EPF_PIPELINE"
  | "GEF_PIPELINE"
  | "LPF_PIPELINE"
  | "CROSS_PLANE";

export type PerformanceClass =
  | "LATENCY_MS"
  | "THROUGHPUT_OPS_PER_SEC"
  | "MEMORY_MB";

export type BenchmarkStatus = "PENDING" | "RUNNING" | "COMPLETE" | "FAILED";

/**
 * evidenceClass is always PROPOSAL_ONLY until an explicit GC-026 tracker sync
 * with trace-backed evidence is committed in a future wave.
 */
export type EvidenceClass = "PROPOSAL_ONLY";

export interface BenchmarkMeasurement {
  measurementId: string;
  runId: string;
  target: BenchmarkTarget;
  performanceClass: PerformanceClass;
  value: number;
  unit: string;
  timestamp: string;
  traceId: string;
}

export interface BenchmarkRun {
  runId: string;
  runHash: string;
  target: BenchmarkTarget;
  status: BenchmarkStatus;
  measurements: BenchmarkMeasurement[];
  startedAt: string;
  completedAt: string | null;
  evidenceClass: EvidenceClass;
}

export interface BenchmarkReport {
  reportId: string;
  reportHash: string;
  runs: BenchmarkRun[];
  totalMeasurements: number;
  evidenceClass: EvidenceClass;
  governanceNote: string;
  generatedAt: string;
}

export interface BenchmarkRunInit {
  runId: string;
  runHash: string;
  target: BenchmarkTarget;
  status: "PENDING";
  measurements: [];
  startedAt: string;
  completedAt: null;
  evidenceClass: EvidenceClass;
}

// ---------------------------------------------------------------------------
// Dependencies
// ---------------------------------------------------------------------------

export interface PerformanceBenchmarkHarnessContractDependencies {
  now?: () => string;
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

const GOVERNANCE_NOTE =
  "All measurements produced by this harness are PROPOSAL ONLY. " +
  "No performance numbers may be promoted to baseline truth without an explicit " +
  "GC-026 tracker sync with trace-backed evidence attached (future wave).";

export class PerformanceBenchmarkHarnessContract {
  private readonly now: () => string;
  private readonly runs: Map<string, BenchmarkRun> = new Map();

  constructor(deps: PerformanceBenchmarkHarnessContractDependencies = {}) {
    this.now = deps.now ?? (() => new Date().toISOString());
  }

  /**
   * Initialize a new benchmark run for the given target.
   * Returns a run in PENDING state.
   */
  initRun(target: BenchmarkTarget): BenchmarkRun {
    const startedAt = this.now();
    const runHash = computeDeterministicHash(
      `benchmark-run:${target}:${startedAt}`
    );
    const runId = computeDeterministicHash(`benchmark-run-id:${runHash}`);

    const run: BenchmarkRun = {
      runId,
      runHash,
      target,
      status: "PENDING",
      measurements: [],
      startedAt,
      completedAt: null,
      evidenceClass: "PROPOSAL_ONLY",
    };

    this.runs.set(runId, run);
    return { ...run, measurements: [] };
  }

  /**
   * Start an initialized run (transition PENDING → RUNNING).
   */
  startRun(runId: string): BenchmarkRun {
    const run = this.runs.get(runId);
    if (!run) {
      throw new Error(`BenchmarkRun not found: ${runId}`);
    }
    if (run.status !== "PENDING") {
      throw new Error(
        `BenchmarkRun ${runId} cannot be started from status ${run.status}`
      );
    }
    const updated: BenchmarkRun = { ...run, status: "RUNNING" };
    this.runs.set(runId, updated);
    return { ...updated, measurements: [...updated.measurements] };
  }

  /**
   * Record a single measurement against a running benchmark run.
   * Appends the measurement and returns it.
   */
  recordMeasurement(
    runId: string,
    input: {
      target: BenchmarkTarget;
      performanceClass: PerformanceClass;
      value: number;
      unit: string;
    }
  ): BenchmarkMeasurement {
    const run = this.runs.get(runId);
    if (!run) {
      throw new Error(`BenchmarkRun not found: ${runId}`);
    }
    if (run.status !== "RUNNING") {
      throw new Error(
        `BenchmarkRun ${runId} is not RUNNING (status: ${run.status})`
      );
    }

    const timestamp = this.now();
    const traceId = computeDeterministicHash(
      `trace:${runId}:${input.target}:${input.performanceClass}:${timestamp}`
    );
    const measurementId = computeDeterministicHash(
      `measurement:${traceId}:${input.value}`
    );

    const measurement: BenchmarkMeasurement = {
      measurementId,
      runId,
      target: input.target,
      performanceClass: input.performanceClass,
      value: input.value,
      unit: input.unit,
      timestamp,
      traceId,
    };

    const updatedRun: BenchmarkRun = {
      ...run,
      measurements: [...run.measurements, measurement],
    };
    this.runs.set(runId, updatedRun);
    return measurement;
  }

  /**
   * Complete a running benchmark run (transition RUNNING → COMPLETE).
   */
  completeRun(runId: string): BenchmarkRun {
    const run = this.runs.get(runId);
    if (!run) {
      throw new Error(`BenchmarkRun not found: ${runId}`);
    }
    if (run.status !== "RUNNING") {
      throw new Error(
        `BenchmarkRun ${runId} cannot be completed from status ${run.status}`
      );
    }
    const completedAt = this.now();
    const updated: BenchmarkRun = {
      ...run,
      status: "COMPLETE",
      completedAt,
    };
    this.runs.set(runId, updated);
    return { ...updated, measurements: [...updated.measurements] };
  }

  /**
   * Mark a run as failed.
   */
  failRun(runId: string): BenchmarkRun {
    const run = this.runs.get(runId);
    if (!run) {
      throw new Error(`BenchmarkRun not found: ${runId}`);
    }
    if (run.status === "COMPLETE" || run.status === "FAILED") {
      throw new Error(
        `BenchmarkRun ${runId} is already in terminal status ${run.status}`
      );
    }
    const updated: BenchmarkRun = { ...run, status: "FAILED" };
    this.runs.set(runId, updated);
    return { ...updated, measurements: [...updated.measurements] };
  }

  /**
   * Generate a benchmark report from one or more completed run IDs.
   * The report always carries evidenceClass "PROPOSAL_ONLY".
   */
  generateReport(runIds: string[]): BenchmarkReport {
    const runs: BenchmarkRun[] = [];
    for (const runId of runIds) {
      const run = this.runs.get(runId);
      if (!run) {
        throw new Error(`BenchmarkRun not found: ${runId}`);
      }
      if (run.status !== "COMPLETE") {
        throw new Error(
          `BenchmarkRun ${runId} is not COMPLETE (status: ${run.status})`
        );
      }
      runs.push({ ...run, measurements: [...run.measurements] });
    }

    const totalMeasurements = runs.reduce(
      (acc, r) => acc + r.measurements.length,
      0
    );
    const generatedAt = this.now();
    const reportHash = computeDeterministicHash(
      `benchmark-report:${runIds.join(",")}:${generatedAt}`
    );
    const reportId = computeDeterministicHash(
      `benchmark-report-id:${reportHash}`
    );

    return {
      reportId,
      reportHash,
      runs,
      totalMeasurements,
      evidenceClass: "PROPOSAL_ONLY",
      governanceNote: GOVERNANCE_NOTE,
      generatedAt,
    };
  }

  /**
   * Get a run by ID (returns null if not found).
   */
  getRun(runId: string): BenchmarkRun | null {
    const run = this.runs.get(runId);
    if (!run) return null;
    return { ...run, measurements: [...run.measurements] };
  }

  /**
   * List all runs currently tracked by this harness instance.
   */
  listRuns(): BenchmarkRun[] {
    return Array.from(this.runs.values()).map((r) => ({
      ...r,
      measurements: [...r.measurements],
    }));
  }
}

export function createPerformanceBenchmarkHarnessContract(
  deps?: PerformanceBenchmarkHarnessContractDependencies
): PerformanceBenchmarkHarnessContract {
  return new PerformanceBenchmarkHarnessContract(deps);
}
