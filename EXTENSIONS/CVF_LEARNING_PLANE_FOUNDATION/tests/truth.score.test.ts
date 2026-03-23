/**
 * TruthScoreContract + TruthScoreLogContract — Tests (W6-T8)
 * ============================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   TruthScoreContract.score:
 *     - perfect model → composite 100, STRONG
 *     - zero-data model → composite 0, INSUFFICIENT
 *     - each health signal maps correctly (HEALTHY/DEGRADED/CRITICAL)
 *     - each trajectory maps correctly (IMPROVING/STABLE/DEGRADING/UNKNOWN)
 *     - each pattern maps correctly (PROCEED/MONITOR/RETRY/ESCALATE/REJECT)
 *     - confidence at boundaries (0.0, 1.0, 0.5)
 *     - scoreClass thresholds (≥80 STRONG, ≥55 ADEQUATE, ≥30 WEAK, <30 INSUFFICIENT)
 *     - sourceTruthModelId and version propagated
 *     - scoreHash and scoreId are deterministic
 *     - rationale is non-empty and contains composite
 *
 *   TruthScoreLogContract.log:
 *     - empty → dominantClass INSUFFICIENT, zeros
 *     - counts by class correct
 *     - average/min/max computed correctly
 *     - dominantClass severity-first (INSUFFICIENT > WEAK > ADEQUATE > STRONG)
 *     - summary non-empty
 *
 *   Factory: createTruthScoreContract / createTruthScoreLogContract
 */

import { describe, it, expect } from "vitest";
import {
  TruthScoreContract,
  createTruthScoreContract,
} from "../src/truth.score.contract";
import {
  TruthScoreLogContract,
  createTruthScoreLogContract,
} from "../src/truth.score.log.contract";
import type { TruthModel } from "../src/truth.model.contract";
import type { TruthScore, TruthScoreClass } from "../src/truth.score.contract";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-23T12:00:00.000Z";
const fixedNow = () => FIXED_NOW;

function makeModel(overrides: Partial<TruthModel> & { modelId: string }): TruthModel {
  return {
    modelId: overrides.modelId,
    createdAt: FIXED_NOW,
    version: overrides.version ?? 1,
    totalInsightsProcessed: overrides.totalInsightsProcessed ?? 5,
    dominantPattern: overrides.dominantPattern ?? "PROCEED",
    currentHealthSignal: overrides.currentHealthSignal ?? "HEALTHY",
    healthTrajectory: overrides.healthTrajectory ?? "STABLE",
    confidenceLevel: overrides.confidenceLevel ?? 1.0,
    patternHistory: overrides.patternHistory ?? [],
    modelHash: overrides.modelHash ?? `hash-${overrides.modelId}`,
  };
}

function makeScore(overrides: Partial<TruthScore> & { scoreId: string }): TruthScore {
  const composite = overrides.compositeScore ?? 75;
  let cls: TruthScoreClass;
  if (composite >= 80) cls = "STRONG";
  else if (composite >= 55) cls = "ADEQUATE";
  else if (composite >= 30) cls = "WEAK";
  else cls = "INSUFFICIENT";
  return {
    scoreId: overrides.scoreId,
    scoredAt: FIXED_NOW,
    sourceTruthModelId: overrides.sourceTruthModelId ?? "model-1",
    sourceTruthModelVersion: overrides.sourceTruthModelVersion ?? 1,
    compositeScore: composite,
    scoreClass: overrides.scoreClass ?? cls,
    dimensions: overrides.dimensions ?? {
      confidenceScore: 25,
      healthScore: 25,
      trajectoryScore: 18,
      patternScore: 7,
    },
    rationale: overrides.rationale ?? "test rationale",
    scoreHash: overrides.scoreHash ?? `hash-${overrides.scoreId}`,
  };
}

function makeContract() {
  return new TruthScoreContract({ now: fixedNow });
}

// ─── TruthScoreContract.score ─────────────────────────────────────────────────

describe("TruthScoreContract.score", () => {
  it("perfect model (confidence=1, HEALTHY, IMPROVING, PROCEED) → composite=100, STRONG", () => {
    const contract = makeContract();
    const model = makeModel({
      modelId: "m1",
      confidenceLevel: 1.0,
      currentHealthSignal: "HEALTHY",
      healthTrajectory: "IMPROVING",
      dominantPattern: "PROCEED",
    });
    const result = contract.score(model);
    expect(result.compositeScore).toBe(100);
    expect(result.scoreClass).toBe("STRONG");
    expect(result.dimensions.confidenceScore).toBe(25);
    expect(result.dimensions.healthScore).toBe(25);
    expect(result.dimensions.trajectoryScore).toBe(25);
    expect(result.dimensions.patternScore).toBe(25);
  });

  it("zero-data model (confidence=0, CRITICAL, UNKNOWN, REJECT) → composite=0, INSUFFICIENT", () => {
    const contract = makeContract();
    const model = makeModel({
      modelId: "m2",
      confidenceLevel: 0.0,
      currentHealthSignal: "CRITICAL",
      healthTrajectory: "UNKNOWN",
      dominantPattern: "REJECT",
    });
    const result = contract.score(model);
    expect(result.compositeScore).toBe(0);
    expect(result.scoreClass).toBe("INSUFFICIENT");
  });

  describe("health signal mapping", () => {
    it("HEALTHY → healthScore 25", () => {
      const m = makeModel({ modelId: "h1", currentHealthSignal: "HEALTHY", confidenceLevel: 0, healthTrajectory: "UNKNOWN", dominantPattern: "REJECT" });
      expect(makeContract().score(m).dimensions.healthScore).toBe(25);
    });
    it("DEGRADED → healthScore 12", () => {
      const m = makeModel({ modelId: "h2", currentHealthSignal: "DEGRADED", confidenceLevel: 0, healthTrajectory: "UNKNOWN", dominantPattern: "REJECT" });
      expect(makeContract().score(m).dimensions.healthScore).toBe(12);
    });
    it("CRITICAL → healthScore 0", () => {
      const m = makeModel({ modelId: "h3", currentHealthSignal: "CRITICAL", confidenceLevel: 0, healthTrajectory: "UNKNOWN", dominantPattern: "REJECT" });
      expect(makeContract().score(m).dimensions.healthScore).toBe(0);
    });
  });

  describe("trajectory mapping", () => {
    it("IMPROVING → trajectoryScore 25", () => {
      const m = makeModel({ modelId: "t1", healthTrajectory: "IMPROVING", confidenceLevel: 0, currentHealthSignal: "CRITICAL", dominantPattern: "REJECT" });
      expect(makeContract().score(m).dimensions.trajectoryScore).toBe(25);
    });
    it("STABLE → trajectoryScore 18", () => {
      const m = makeModel({ modelId: "t2", healthTrajectory: "STABLE", confidenceLevel: 0, currentHealthSignal: "CRITICAL", dominantPattern: "REJECT" });
      expect(makeContract().score(m).dimensions.trajectoryScore).toBe(18);
    });
    it("DEGRADING → trajectoryScore 5", () => {
      const m = makeModel({ modelId: "t3", healthTrajectory: "DEGRADING", confidenceLevel: 0, currentHealthSignal: "CRITICAL", dominantPattern: "REJECT" });
      expect(makeContract().score(m).dimensions.trajectoryScore).toBe(5);
    });
    it("UNKNOWN → trajectoryScore 0", () => {
      const m = makeModel({ modelId: "t4", healthTrajectory: "UNKNOWN", confidenceLevel: 0, currentHealthSignal: "CRITICAL", dominantPattern: "REJECT" });
      expect(makeContract().score(m).dimensions.trajectoryScore).toBe(0);
    });
  });

  describe("dominant pattern mapping", () => {
    it("PROCEED → patternScore 25", () => {
      const m = makeModel({ modelId: "p1", dominantPattern: "PROCEED", confidenceLevel: 0, currentHealthSignal: "CRITICAL", healthTrajectory: "UNKNOWN" });
      expect(makeContract().score(m).dimensions.patternScore).toBe(25);
    });
    it("MONITOR → patternScore 15", () => {
      const m = makeModel({ modelId: "p2", dominantPattern: "MONITOR", confidenceLevel: 0, currentHealthSignal: "CRITICAL", healthTrajectory: "UNKNOWN" });
      expect(makeContract().score(m).dimensions.patternScore).toBe(15);
    });
    it("RETRY → patternScore 8", () => {
      const m = makeModel({ modelId: "p3", dominantPattern: "RETRY", confidenceLevel: 0, currentHealthSignal: "CRITICAL", healthTrajectory: "UNKNOWN" });
      expect(makeContract().score(m).dimensions.patternScore).toBe(8);
    });
    it("ESCALATE → patternScore 3", () => {
      const m = makeModel({ modelId: "p4", dominantPattern: "ESCALATE", confidenceLevel: 0, currentHealthSignal: "CRITICAL", healthTrajectory: "UNKNOWN" });
      expect(makeContract().score(m).dimensions.patternScore).toBe(3);
    });
    it("REJECT → patternScore 0", () => {
      const m = makeModel({ modelId: "p5", dominantPattern: "REJECT", confidenceLevel: 0, currentHealthSignal: "CRITICAL", healthTrajectory: "UNKNOWN" });
      expect(makeContract().score(m).dimensions.patternScore).toBe(0);
    });
  });

  describe("confidence score boundaries", () => {
    it("confidenceLevel 0.0 → confidenceScore 0", () => {
      const m = makeModel({ modelId: "c1", confidenceLevel: 0.0, currentHealthSignal: "CRITICAL", healthTrajectory: "UNKNOWN", dominantPattern: "REJECT" });
      expect(makeContract().score(m).dimensions.confidenceScore).toBe(0);
    });
    it("confidenceLevel 1.0 → confidenceScore 25", () => {
      const m = makeModel({ modelId: "c2", confidenceLevel: 1.0, currentHealthSignal: "CRITICAL", healthTrajectory: "UNKNOWN", dominantPattern: "REJECT" });
      expect(makeContract().score(m).dimensions.confidenceScore).toBe(25);
    });
    it("confidenceLevel 0.5 → confidenceScore 13 (rounded)", () => {
      const m = makeModel({ modelId: "c3", confidenceLevel: 0.5, currentHealthSignal: "CRITICAL", healthTrajectory: "UNKNOWN", dominantPattern: "REJECT" });
      expect(makeContract().score(m).dimensions.confidenceScore).toBe(13);
    });
  });

  describe("scoreClass thresholds", () => {
    // HEALTHY=25, IMPROVING=25, PROCEED=25, confidence=0.2→5 → composite=80 → STRONG
    it("composite ≥ 80 → STRONG", () => {
      const m = makeModel({ modelId: "cls1", confidenceLevel: 0.2, currentHealthSignal: "HEALTHY", healthTrajectory: "IMPROVING", dominantPattern: "PROCEED" });
      const r = makeContract().score(m);
      expect(r.compositeScore).toBeGreaterThanOrEqual(80);
      expect(r.scoreClass).toBe("STRONG");
    });
    // HEALTHY=25, STABLE=18, MONITOR=15, confidence=0→0 → composite=58 → ADEQUATE
    it("composite ≥ 55 and < 80 → ADEQUATE", () => {
      const m = makeModel({ modelId: "cls2", confidenceLevel: 0.0, currentHealthSignal: "HEALTHY", healthTrajectory: "STABLE", dominantPattern: "MONITOR" });
      const r = makeContract().score(m);
      expect(r.compositeScore).toBeGreaterThanOrEqual(55);
      expect(r.compositeScore).toBeLessThan(80);
      expect(r.scoreClass).toBe("ADEQUATE");
    });
    // DEGRADED=12, STABLE=18, RETRY=8, confidence=0→0 → composite=38 → WEAK
    it("composite ≥ 30 and < 55 → WEAK", () => {
      const m = makeModel({ modelId: "cls3", confidenceLevel: 0.0, currentHealthSignal: "DEGRADED", healthTrajectory: "STABLE", dominantPattern: "RETRY" });
      const r = makeContract().score(m);
      expect(r.compositeScore).toBeGreaterThanOrEqual(30);
      expect(r.compositeScore).toBeLessThan(55);
      expect(r.scoreClass).toBe("WEAK");
    });
    // CRITICAL=0, UNKNOWN=0, REJECT=0, confidence=0→0 → composite=0 → INSUFFICIENT
    it("composite < 30 → INSUFFICIENT", () => {
      const m = makeModel({ modelId: "cls4", confidenceLevel: 0.0, currentHealthSignal: "CRITICAL", healthTrajectory: "UNKNOWN", dominantPattern: "REJECT" });
      const r = makeContract().score(m);
      expect(r.compositeScore).toBeLessThan(30);
      expect(r.scoreClass).toBe("INSUFFICIENT");
    });
  });

  it("propagates sourceTruthModelId and version", () => {
    const m = makeModel({ modelId: "source-id", version: 7, confidenceLevel: 1.0, currentHealthSignal: "HEALTHY", healthTrajectory: "STABLE", dominantPattern: "PROCEED" });
    const r = makeContract().score(m);
    expect(r.sourceTruthModelId).toBe("source-id");
    expect(r.sourceTruthModelVersion).toBe(7);
  });

  it("scoreHash and scoreId are deterministic for same input", () => {
    const m = makeModel({ modelId: "det", confidenceLevel: 0.8, currentHealthSignal: "HEALTHY", healthTrajectory: "STABLE", dominantPattern: "PROCEED" });
    const r1 = makeContract().score(m);
    const r2 = makeContract().score(m);
    expect(r1.scoreHash).toBe(r2.scoreHash);
    expect(r1.scoreId).toBe(r2.scoreId);
  });

  it("rationale is non-empty and contains composite score", () => {
    const m = makeModel({ modelId: "rat", confidenceLevel: 1.0, currentHealthSignal: "HEALTHY", healthTrajectory: "IMPROVING", dominantPattern: "PROCEED" });
    const r = makeContract().score(m);
    expect(r.rationale.length).toBeGreaterThan(0);
    expect(r.rationale).toContain("100");
  });
});

// ─── TruthScoreLogContract.log ────────────────────────────────────────────────

describe("TruthScoreLogContract.log", () => {
  it("empty input → dominantClass INSUFFICIENT, all zeros", () => {
    const contract = new TruthScoreLogContract({ now: fixedNow });
    const result = contract.log([]);
    expect(result.totalScores).toBe(0);
    expect(result.dominantClass).toBe("INSUFFICIENT");
    expect(result.averageComposite).toBe(0);
    expect(result.minComposite).toBe(0);
    expect(result.maxComposite).toBe(0);
  });

  it("counts by class correct", () => {
    const contract = new TruthScoreLogContract({ now: fixedNow });
    const scores = [
      makeScore({ scoreId: "s1", compositeScore: 85, scoreClass: "STRONG" }),
      makeScore({ scoreId: "s2", compositeScore: 60, scoreClass: "ADEQUATE" }),
      makeScore({ scoreId: "s3", compositeScore: 35, scoreClass: "WEAK" }),
      makeScore({ scoreId: "s4", compositeScore: 10, scoreClass: "INSUFFICIENT" }),
    ];
    const result = contract.log(scores);
    expect(result.strongCount).toBe(1);
    expect(result.adequateCount).toBe(1);
    expect(result.weakCount).toBe(1);
    expect(result.insufficientCount).toBe(1);
    expect(result.totalScores).toBe(4);
  });

  it("average/min/max computed correctly", () => {
    const contract = new TruthScoreLogContract({ now: fixedNow });
    const scores = [
      makeScore({ scoreId: "s1", compositeScore: 80, scoreClass: "STRONG" }),
      makeScore({ scoreId: "s2", compositeScore: 60, scoreClass: "ADEQUATE" }),
      makeScore({ scoreId: "s3", compositeScore: 40, scoreClass: "WEAK" }),
    ];
    const result = contract.log(scores);
    expect(result.averageComposite).toBe(60);
    expect(result.minComposite).toBe(40);
    expect(result.maxComposite).toBe(80);
  });

  it("dominantClass severity-first: INSUFFICIENT > WEAK > ADEQUATE > STRONG", () => {
    const contract = new TruthScoreLogContract({ now: fixedNow });
    // 3 STRONG, 1 INSUFFICIENT — INSUFFICIENT should win
    const scores = [
      makeScore({ scoreId: "s1", compositeScore: 90, scoreClass: "STRONG" }),
      makeScore({ scoreId: "s2", compositeScore: 85, scoreClass: "STRONG" }),
      makeScore({ scoreId: "s3", compositeScore: 88, scoreClass: "STRONG" }),
      makeScore({ scoreId: "s4", compositeScore: 5,  scoreClass: "INSUFFICIENT" }),
    ];
    const result = contract.log(scores);
    expect(result.dominantClass).toBe("INSUFFICIENT");
  });

  it("dominantClass is WEAK when WEAK present but no INSUFFICIENT", () => {
    const contract = new TruthScoreLogContract({ now: fixedNow });
    const scores = [
      makeScore({ scoreId: "s1", compositeScore: 85, scoreClass: "STRONG" }),
      makeScore({ scoreId: "s2", compositeScore: 60, scoreClass: "ADEQUATE" }),
      makeScore({ scoreId: "s3", compositeScore: 35, scoreClass: "WEAK" }),
    ];
    const result = contract.log(scores);
    expect(result.dominantClass).toBe("WEAK");
  });

  it("summary is non-empty", () => {
    const contract = new TruthScoreLogContract({ now: fixedNow });
    expect(contract.log([]).summary.length).toBeGreaterThan(0);
    expect(contract.log([makeScore({ scoreId: "s1", compositeScore: 80, scoreClass: "STRONG" })]).summary).toContain("STRONG");
  });

  it("createdAt is set correctly", () => {
    const contract = new TruthScoreLogContract({ now: fixedNow });
    expect(contract.log([]).createdAt).toBe(FIXED_NOW);
  });
});

// ─── Factories ────────────────────────────────────────────────────────────────

describe("createTruthScoreContract", () => {
  it("returns a working instance", () => {
    const contract = createTruthScoreContract();
    const m = makeModel({ modelId: "f1", confidenceLevel: 1.0, currentHealthSignal: "HEALTHY", healthTrajectory: "STABLE", dominantPattern: "PROCEED" });
    expect(contract.score(m).compositeScore).toBeGreaterThan(0);
  });
});

describe("createTruthScoreLogContract", () => {
  it("returns a working instance", () => {
    const contract = createTruthScoreLogContract();
    expect(contract.log([]).totalScores).toBe(0);
  });
});
