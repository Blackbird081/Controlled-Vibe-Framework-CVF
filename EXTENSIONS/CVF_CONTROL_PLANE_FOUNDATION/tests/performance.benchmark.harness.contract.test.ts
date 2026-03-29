/**
 * CPF Performance Benchmark Harness Contract — Dedicated Tests (W8-T2 CP1)
 * =========================================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 * GC-024: partition entry added to CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json.
 *
 * Coverage:
 *   PerformanceBenchmarkHarnessContract.initRun:
 *     - returns run in PENDING status
 *     - runId and runHash are truthy
 *     - startedAt set to injected now()
 *     - completedAt is null
 *     - evidenceClass is PROPOSAL_ONLY
 *     - measurements is empty array
 *     - different targets produce different runHash values
 *
 *   PerformanceBenchmarkHarnessContract.startRun:
 *     - transitions PENDING → RUNNING
 *     - throws if run not found
 *     - throws if already RUNNING
 *     - throws if already COMPLETE
 *
 *   PerformanceBenchmarkHarnessContract.recordMeasurement:
 *     - returns measurement with measurementId, traceId, timestamp
 *     - measurement appended to run
 *     - throws if run not found
 *     - throws if run not RUNNING
 *     - multiple measurements accumulate
 *     - deterministic traceId for same inputs and timestamp
 *
 *   PerformanceBenchmarkHarnessContract.completeRun:
 *     - transitions RUNNING → COMPLETE
 *     - completedAt set to injected now()
 *     - measurements preserved on completion
 *     - throws if run not found
 *     - throws if run is PENDING
 *
 *   PerformanceBenchmarkHarnessContract.failRun:
 *     - transitions PENDING → FAILED
 *     - transitions RUNNING → FAILED
 *     - throws if already COMPLETE
 *     - throws if already FAILED
 *     - throws if run not found
 *
 *   PerformanceBenchmarkHarnessContract.generateReport:
 *     - report has evidenceClass PROPOSAL_ONLY
 *     - report has governanceNote
 *     - reportId and reportHash are truthy
 *     - totalMeasurements correct
 *     - runs array matches input run IDs
 *     - generatedAt set to injected now()
 *     - throws if run not found
 *     - throws if run is not COMPLETE
 *     - empty runIds produces report with 0 runs and 0 measurements
 *
 *   PerformanceBenchmarkHarnessContract.getRun:
 *     - returns run if exists
 *     - returns null if not found
 *
 *   PerformanceBenchmarkHarnessContract.listRuns:
 *     - returns empty array initially
 *     - includes all initialized runs
 *
 *   createPerformanceBenchmarkHarnessContract:
 *     - factory returns instance
 */

import { describe, it, expect } from "vitest";
import {
  PerformanceBenchmarkHarnessContract,
  createPerformanceBenchmarkHarnessContract,
  BenchmarkTarget,
  PerformanceClass,
} from "../src/performance.benchmark.harness.contract";

const FIXED_TS = "2026-03-29T12:00:00.000Z";
const fixed = () => FIXED_TS;

function makeHarness() {
  return new PerformanceBenchmarkHarnessContract({ now: fixed });
}

// ---------------------------------------------------------------------------
// initRun
// ---------------------------------------------------------------------------

describe("PerformanceBenchmarkHarnessContract.initRun", () => {
  it("returns run in PENDING status", () => {
    const h = makeHarness();
    const run = h.initRun("CPF_PIPELINE");
    expect(run.status).toBe("PENDING");
  });

  it("runId and runHash are truthy", () => {
    const h = makeHarness();
    const run = h.initRun("EPF_PIPELINE");
    expect(run.runId).toBeTruthy();
    expect(run.runHash).toBeTruthy();
  });

  it("startedAt set to injected now()", () => {
    const h = makeHarness();
    const run = h.initRun("GEF_PIPELINE");
    expect(run.startedAt).toBe(FIXED_TS);
  });

  it("completedAt is null", () => {
    const h = makeHarness();
    const run = h.initRun("LPF_PIPELINE");
    expect(run.completedAt).toBeNull();
  });

  it("evidenceClass is PROPOSAL_ONLY", () => {
    const h = makeHarness();
    const run = h.initRun("CROSS_PLANE");
    expect(run.evidenceClass).toBe("PROPOSAL_ONLY");
  });

  it("measurements is empty array", () => {
    const h = makeHarness();
    const run = h.initRun("CPF_PIPELINE");
    expect(run.measurements).toEqual([]);
  });

  it("different targets produce different runHash values", () => {
    const h = makeHarness();
    const r1 = h.initRun("CPF_PIPELINE");
    const r2 = h.initRun("EPF_PIPELINE");
    expect(r1.runHash).not.toBe(r2.runHash);
  });
});

// ---------------------------------------------------------------------------
// startRun
// ---------------------------------------------------------------------------

describe("PerformanceBenchmarkHarnessContract.startRun", () => {
  it("transitions PENDING to RUNNING", () => {
    const h = makeHarness();
    const { runId } = h.initRun("CPF_PIPELINE");
    const started = h.startRun(runId);
    expect(started.status).toBe("RUNNING");
  });

  it("throws if run not found", () => {
    const h = makeHarness();
    expect(() => h.startRun("nonexistent-id")).toThrow("not found");
  });

  it("throws if already RUNNING", () => {
    const h = makeHarness();
    const { runId } = h.initRun("EPF_PIPELINE");
    h.startRun(runId);
    expect(() => h.startRun(runId)).toThrow("RUNNING");
  });

  it("throws if already COMPLETE", () => {
    const h = makeHarness();
    const { runId } = h.initRun("GEF_PIPELINE");
    h.startRun(runId);
    h.completeRun(runId);
    expect(() => h.startRun(runId)).toThrow("COMPLETE");
  });
});

// ---------------------------------------------------------------------------
// recordMeasurement
// ---------------------------------------------------------------------------

describe("PerformanceBenchmarkHarnessContract.recordMeasurement", () => {
  function runningHarness() {
    const h = makeHarness();
    const { runId } = h.initRun("CPF_PIPELINE");
    h.startRun(runId);
    return { h, runId };
  }

  it("returns measurement with measurementId, traceId, timestamp", () => {
    const { h, runId } = runningHarness();
    const m = h.recordMeasurement(runId, {
      target: "CPF_PIPELINE",
      performanceClass: "LATENCY_MS",
      value: 12.5,
      unit: "ms",
    });
    expect(m.measurementId).toBeTruthy();
    expect(m.traceId).toBeTruthy();
    expect(m.timestamp).toBe(FIXED_TS);
  });

  it("measurement appended to run", () => {
    const { h, runId } = runningHarness();
    h.recordMeasurement(runId, {
      target: "CPF_PIPELINE",
      performanceClass: "LATENCY_MS",
      value: 10,
      unit: "ms",
    });
    const run = h.getRun(runId)!;
    expect(run.measurements).toHaveLength(1);
  });

  it("throws if run not found", () => {
    const h = makeHarness();
    expect(() =>
      h.recordMeasurement("bad-id", {
        target: "CPF_PIPELINE",
        performanceClass: "LATENCY_MS",
        value: 1,
        unit: "ms",
      })
    ).toThrow("not found");
  });

  it("throws if run not RUNNING", () => {
    const h = makeHarness();
    const { runId } = h.initRun("CPF_PIPELINE");
    expect(() =>
      h.recordMeasurement(runId, {
        target: "CPF_PIPELINE",
        performanceClass: "LATENCY_MS",
        value: 1,
        unit: "ms",
      })
    ).toThrow("not RUNNING");
  });

  it("multiple measurements accumulate", () => {
    const { h, runId } = runningHarness();
    h.recordMeasurement(runId, {
      target: "CPF_PIPELINE",
      performanceClass: "LATENCY_MS",
      value: 10,
      unit: "ms",
    });
    h.recordMeasurement(runId, {
      target: "CPF_PIPELINE",
      performanceClass: "THROUGHPUT_OPS_PER_SEC",
      value: 500,
      unit: "ops/s",
    });
    const run = h.getRun(runId)!;
    expect(run.measurements).toHaveLength(2);
  });

  it("deterministic traceId for same inputs and timestamp", () => {
    const h1 = makeHarness();
    const { runId: r1 } = h1.initRun("CPF_PIPELINE");
    h1.startRun(r1);
    const m1 = h1.recordMeasurement(r1, {
      target: "CPF_PIPELINE",
      performanceClass: "LATENCY_MS",
      value: 42,
      unit: "ms",
    });

    const h2 = makeHarness();
    const { runId: r2 } = h2.initRun("CPF_PIPELINE");
    h2.startRun(r2);
    const m2 = h2.recordMeasurement(r2, {
      target: "CPF_PIPELINE",
      performanceClass: "LATENCY_MS",
      value: 42,
      unit: "ms",
    });

    // Same inputs + same timestamp → same traceId
    expect(m1.traceId).toBe(m2.traceId);
  });
});

// ---------------------------------------------------------------------------
// completeRun
// ---------------------------------------------------------------------------

describe("PerformanceBenchmarkHarnessContract.completeRun", () => {
  it("transitions RUNNING to COMPLETE", () => {
    const h = makeHarness();
    const { runId } = h.initRun("CPF_PIPELINE");
    h.startRun(runId);
    const completed = h.completeRun(runId);
    expect(completed.status).toBe("COMPLETE");
  });

  it("completedAt set to injected now()", () => {
    const h = makeHarness();
    const { runId } = h.initRun("EPF_PIPELINE");
    h.startRun(runId);
    const completed = h.completeRun(runId);
    expect(completed.completedAt).toBe(FIXED_TS);
  });

  it("measurements preserved on completion", () => {
    const h = makeHarness();
    const { runId } = h.initRun("GEF_PIPELINE");
    h.startRun(runId);
    h.recordMeasurement(runId, {
      target: "GEF_PIPELINE",
      performanceClass: "LATENCY_MS",
      value: 5,
      unit: "ms",
    });
    const completed = h.completeRun(runId);
    expect(completed.measurements).toHaveLength(1);
  });

  it("throws if run not found", () => {
    const h = makeHarness();
    expect(() => h.completeRun("nonexistent")).toThrow("not found");
  });

  it("throws if run is PENDING", () => {
    const h = makeHarness();
    const { runId } = h.initRun("LPF_PIPELINE");
    expect(() => h.completeRun(runId)).toThrow("PENDING");
  });
});

// ---------------------------------------------------------------------------
// failRun
// ---------------------------------------------------------------------------

describe("PerformanceBenchmarkHarnessContract.failRun", () => {
  it("transitions PENDING to FAILED", () => {
    const h = makeHarness();
    const { runId } = h.initRun("CPF_PIPELINE");
    const failed = h.failRun(runId);
    expect(failed.status).toBe("FAILED");
  });

  it("transitions RUNNING to FAILED", () => {
    const h = makeHarness();
    const { runId } = h.initRun("EPF_PIPELINE");
    h.startRun(runId);
    const failed = h.failRun(runId);
    expect(failed.status).toBe("FAILED");
  });

  it("throws if already COMPLETE", () => {
    const h = makeHarness();
    const { runId } = h.initRun("GEF_PIPELINE");
    h.startRun(runId);
    h.completeRun(runId);
    expect(() => h.failRun(runId)).toThrow("terminal");
  });

  it("throws if already FAILED", () => {
    const h = makeHarness();
    const { runId } = h.initRun("LPF_PIPELINE");
    h.failRun(runId);
    expect(() => h.failRun(runId)).toThrow("terminal");
  });

  it("throws if run not found", () => {
    const h = makeHarness();
    expect(() => h.failRun("bad-id")).toThrow("not found");
  });
});

// ---------------------------------------------------------------------------
// generateReport
// ---------------------------------------------------------------------------

describe("PerformanceBenchmarkHarnessContract.generateReport", () => {
  function completedRun(h: PerformanceBenchmarkHarnessContract, target: BenchmarkTarget, perf: PerformanceClass, value: number) {
    const { runId } = h.initRun(target);
    h.startRun(runId);
    h.recordMeasurement(runId, { target, performanceClass: perf, value, unit: "ms" });
    h.completeRun(runId);
    return runId;
  }

  it("report evidenceClass is PROPOSAL_ONLY", () => {
    const h = makeHarness();
    const runId = completedRun(h, "CPF_PIPELINE", "LATENCY_MS", 10);
    const report = h.generateReport([runId]);
    expect(report.evidenceClass).toBe("PROPOSAL_ONLY");
  });

  it("report has governanceNote", () => {
    const h = makeHarness();
    const runId = completedRun(h, "EPF_PIPELINE", "LATENCY_MS", 20);
    const report = h.generateReport([runId]);
    expect(report.governanceNote).toBeTruthy();
    expect(report.governanceNote).toContain("PROPOSAL ONLY");
  });

  it("reportId and reportHash are truthy", () => {
    const h = makeHarness();
    const runId = completedRun(h, "GEF_PIPELINE", "THROUGHPUT_OPS_PER_SEC", 100);
    const report = h.generateReport([runId]);
    expect(report.reportId).toBeTruthy();
    expect(report.reportHash).toBeTruthy();
  });

  it("totalMeasurements correct for single run", () => {
    const h = makeHarness();
    const runId = completedRun(h, "LPF_PIPELINE", "MEMORY_MB", 128);
    const report = h.generateReport([runId]);
    expect(report.totalMeasurements).toBe(1);
  });

  it("totalMeasurements correct for multiple runs", () => {
    const h = makeHarness();
    const r1 = completedRun(h, "CPF_PIPELINE", "LATENCY_MS", 10);
    const r2 = completedRun(h, "EPF_PIPELINE", "LATENCY_MS", 15);
    const report = h.generateReport([r1, r2]);
    expect(report.totalMeasurements).toBe(2);
  });

  it("runs array matches input run IDs", () => {
    const h = makeHarness();
    const r1 = completedRun(h, "CPF_PIPELINE", "LATENCY_MS", 10);
    const r2 = completedRun(h, "GEF_PIPELINE", "LATENCY_MS", 8);
    const report = h.generateReport([r1, r2]);
    expect(report.runs.map((r) => r.runId).sort()).toEqual([r1, r2].sort());
  });

  it("generatedAt set to injected now()", () => {
    const h = makeHarness();
    const runId = completedRun(h, "CROSS_PLANE", "LATENCY_MS", 30);
    const report = h.generateReport([runId]);
    expect(report.generatedAt).toBe(FIXED_TS);
  });

  it("throws if run not found", () => {
    const h = makeHarness();
    expect(() => h.generateReport(["nonexistent"])).toThrow("not found");
  });

  it("throws if run is not COMPLETE", () => {
    const h = makeHarness();
    const { runId } = h.initRun("CPF_PIPELINE");
    h.startRun(runId);
    expect(() => h.generateReport([runId])).toThrow("not COMPLETE");
  });

  it("empty runIds produces report with 0 runs and 0 measurements", () => {
    const h = makeHarness();
    const report = h.generateReport([]);
    expect(report.runs).toHaveLength(0);
    expect(report.totalMeasurements).toBe(0);
    expect(report.evidenceClass).toBe("PROPOSAL_ONLY");
  });
});

// ---------------------------------------------------------------------------
// getRun
// ---------------------------------------------------------------------------

describe("PerformanceBenchmarkHarnessContract.getRun", () => {
  it("returns run if exists", () => {
    const h = makeHarness();
    const { runId } = h.initRun("CPF_PIPELINE");
    const run = h.getRun(runId);
    expect(run).not.toBeNull();
    expect(run!.runId).toBe(runId);
  });

  it("returns null if not found", () => {
    const h = makeHarness();
    expect(h.getRun("does-not-exist")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// listRuns
// ---------------------------------------------------------------------------

describe("PerformanceBenchmarkHarnessContract.listRuns", () => {
  it("returns empty array initially", () => {
    const h = makeHarness();
    expect(h.listRuns()).toHaveLength(0);
  });

  it("includes all initialized runs", () => {
    const h = makeHarness();
    h.initRun("CPF_PIPELINE");
    h.initRun("EPF_PIPELINE");
    h.initRun("GEF_PIPELINE");
    expect(h.listRuns()).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// createPerformanceBenchmarkHarnessContract
// ---------------------------------------------------------------------------

describe("createPerformanceBenchmarkHarnessContract", () => {
  it("factory returns instance", () => {
    const h = createPerformanceBenchmarkHarnessContract({ now: fixed });
    expect(h).toBeInstanceOf(PerformanceBenchmarkHarnessContract);
  });
});
