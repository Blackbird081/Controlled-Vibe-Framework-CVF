import { describe, expect, it } from "vitest";
import {
  PatternDriftContract,
  createPatternDriftContract,
  PatternDriftLogContract,
  createPatternDriftLogContract,
} from "../src/index";
import type { PatternDriftSignal } from "../src/index";
import type { TruthModel } from "../src/index";

// --- Shared helper ---

function makeTruthModel(
  overrides: Partial<TruthModel> = {},
): TruthModel {
  const base: TruthModel = {
    modelId: "model-001",
    createdAt: "2026-03-23T10:00:00.000Z",
    version: 1,
    totalInsightsProcessed: 10,
    dominantPattern: "ACCEPT",
    currentHealthSignal: "HEALTHY",
    healthTrajectory: "STABLE",
    confidenceLevel: 0.8,
    patternHistory: [],
    modelHash: "hash-001",
  };
  return { ...base, ...overrides };
}

function makePatternDriftSignal(
  driftClass: "STABLE" | "DRIFTING" | "CRITICAL_DRIFT",
  id: string,
): PatternDriftSignal {
  return {
    driftId: `drift-${id}`,
    detectedAt: "2026-03-23T10:00:00.000Z",
    baselineModelId: `baseline-${id}`,
    currentModelId: `current-${id}`,
    driftClass,
    driftRationale: `rationale-${id}`,
    patternChanged: driftClass !== "STABLE",
    healthSignalChanged: false,
    confidenceDelta: 0,
    driftHash: `hash-${id}`,
  };
}

// ---------------------------------------------------------------------------
// W6-T6 CP1 — PatternDriftContract
// ---------------------------------------------------------------------------

describe("W6-T6 CP1 — PatternDriftContract", () => {
  it("identical models → STABLE", () => {
    const contract = createPatternDriftContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const baseline = makeTruthModel();
    const current = makeTruthModel({ modelId: "model-002" });
    const signal = contract.detect(baseline, current);

    expect(signal.driftClass).toBe("STABLE");
  });

  it("health turned CRITICAL → CRITICAL_DRIFT", () => {
    const contract = createPatternDriftContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const baseline = makeTruthModel({ currentHealthSignal: "HEALTHY" });
    const current = makeTruthModel({ modelId: "model-002", currentHealthSignal: "CRITICAL" });
    const signal = contract.detect(baseline, current);

    expect(signal.driftClass).toBe("CRITICAL_DRIFT");
  });

  it("confidence dropped > 0.3 → CRITICAL_DRIFT", () => {
    const contract = createPatternDriftContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const baseline = makeTruthModel({ confidenceLevel: 0.9 });
    const current = makeTruthModel({ modelId: "model-002", confidenceLevel: 0.5 });
    const signal = contract.detect(baseline, current);

    expect(signal.driftClass).toBe("CRITICAL_DRIFT");
    expect(signal.confidenceDelta).toBeCloseTo(-0.4);
  });

  it("trajectory turned DEGRADING → CRITICAL_DRIFT", () => {
    const contract = createPatternDriftContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const baseline = makeTruthModel({ healthTrajectory: "STABLE" });
    const current = makeTruthModel({ modelId: "model-002", healthTrajectory: "DEGRADING" });
    const signal = contract.detect(baseline, current);

    expect(signal.driftClass).toBe("CRITICAL_DRIFT");
  });

  it("dominant pattern changed → DRIFTING", () => {
    const contract = createPatternDriftContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const baseline = makeTruthModel({ dominantPattern: "ACCEPT" });
    const current = makeTruthModel({ modelId: "model-002", dominantPattern: "ESCALATE" });
    const signal = contract.detect(baseline, current);

    expect(signal.driftClass).toBe("DRIFTING");
    expect(signal.patternChanged).toBe(true);
  });

  it("health changed (non-critical) → DRIFTING", () => {
    const contract = createPatternDriftContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const baseline = makeTruthModel({ currentHealthSignal: "HEALTHY" });
    const current = makeTruthModel({ modelId: "model-002", currentHealthSignal: "DEGRADED" });
    const signal = contract.detect(baseline, current);

    expect(signal.driftClass).toBe("DRIFTING");
    expect(signal.healthSignalChanged).toBe(true);
  });

  it("carries baselineModelId and currentModelId", () => {
    const contract = createPatternDriftContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const baseline = makeTruthModel({ modelId: "base-xyz" });
    const current = makeTruthModel({ modelId: "curr-xyz", dominantPattern: "ESCALATE" });
    const signal = contract.detect(baseline, current);

    expect(signal.baselineModelId).toBe("base-xyz");
    expect(signal.currentModelId).toBe("curr-xyz");
  });

  it("produces a non-empty deterministic driftHash for identical inputs", () => {
    const contract = createPatternDriftContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const baseline = makeTruthModel();
    const current = makeTruthModel({ modelId: "model-002" });
    const s1 = contract.detect(baseline, current);
    const s2 = contract.detect(baseline, current);

    expect(s1.driftHash).toBeTruthy();
    expect(s1.driftHash).toBe(s2.driftHash);
  });
});

// ---------------------------------------------------------------------------
// W6-T6 CP2 — PatternDriftLogContract
// ---------------------------------------------------------------------------

describe("W6-T6 CP2 — PatternDriftLogContract", () => {
  it("single STABLE signal → dominantDriftClass STABLE", () => {
    const contract = createPatternDriftLogContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const log = contract.log([makePatternDriftSignal("STABLE", "a")]);

    expect(log.dominantDriftClass).toBe("STABLE");
  });

  it("single DRIFTING signal → dominantDriftClass DRIFTING", () => {
    const contract = createPatternDriftLogContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const log = contract.log([makePatternDriftSignal("DRIFTING", "b")]);

    expect(log.dominantDriftClass).toBe("DRIFTING");
  });

  it("single CRITICAL_DRIFT signal → dominantDriftClass CRITICAL_DRIFT", () => {
    const contract = createPatternDriftLogContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const log = contract.log([makePatternDriftSignal("CRITICAL_DRIFT", "c")]);

    expect(log.dominantDriftClass).toBe("CRITICAL_DRIFT");
  });

  it("CRITICAL_DRIFT dominates over DRIFTING in mixed batch", () => {
    const contract = createPatternDriftLogContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const log = contract.log([
      makePatternDriftSignal("STABLE", "d1"),
      makePatternDriftSignal("DRIFTING", "d2"),
      makePatternDriftSignal("CRITICAL_DRIFT", "d3"),
    ]);

    expect(log.dominantDriftClass).toBe("CRITICAL_DRIFT");
  });

  it("DRIFTING dominates over STABLE in mixed batch (no CRITICAL_DRIFT)", () => {
    const contract = createPatternDriftLogContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const log = contract.log([
      makePatternDriftSignal("STABLE", "e1"),
      makePatternDriftSignal("DRIFTING", "e2"),
    ]);

    expect(log.dominantDriftClass).toBe("DRIFTING");
  });

  it("counts per drift class are correct in a mixed batch", () => {
    const contract = createPatternDriftLogContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const log = contract.log([
      makePatternDriftSignal("STABLE", "f1"),
      makePatternDriftSignal("DRIFTING", "f2"),
      makePatternDriftSignal("DRIFTING", "f3"),
      makePatternDriftSignal("CRITICAL_DRIFT", "f4"),
    ]);

    expect(log.totalSignals).toBe(4);
    expect(log.stableCount).toBe(1);
    expect(log.driftingCount).toBe(2);
    expect(log.criticalDriftCount).toBe(1);
  });

  it("log includes a non-empty deterministic logHash", () => {
    const contract = createPatternDriftLogContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const signals = [makePatternDriftSignal("STABLE", "g")];
    const l1 = contract.log(signals);
    const l2 = contract.log(signals);

    expect(l1.logHash).toBeTruthy();
    expect(l1.logHash).toBe(l2.logHash);
  });

  it("empty signal list → dominantDriftClass STABLE with zero counts", () => {
    const contract = createPatternDriftLogContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const log = contract.log([]);

    expect(log.totalSignals).toBe(0);
    expect(log.stableCount).toBe(0);
    expect(log.driftingCount).toBe(0);
    expect(log.criticalDriftCount).toBe(0);
    expect(log.dominantDriftClass).toBe("STABLE");
  });
});
