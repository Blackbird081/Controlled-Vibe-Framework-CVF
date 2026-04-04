import type { TruthModel } from "./truth.model.contract";
import type { HealthSignal } from "./pattern.detection.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type DriftClass = "STABLE" | "DRIFTING" | "CRITICAL_DRIFT";

export interface PatternDriftSignal {
  driftId: string;
  detectedAt: string;
  baselineModelId: string;
  currentModelId: string;
  driftClass: DriftClass;
  driftRationale: string;
  patternChanged: boolean;
  healthSignalChanged: boolean;
  confidenceDelta: number;
  driftHash: string;
}

export interface PatternDriftContractDependencies {
  now?: () => string;
  classifyDrift?: (baseline: TruthModel, current: TruthModel) => DriftClass;
}

// --- Drift Classification ---
// CRITICAL_DRIFT: health reached CRITICAL (from non-critical), OR confidenceDelta < -0.3,
//                 OR trajectory turned DEGRADING (from non-DEGRADING)
// DRIFTING:       dominantPattern changed, OR healthSignal changed, OR |confidenceDelta| > 0.1
// STABLE:         no significant change

function healthSeverityIncreased(
  baseline: HealthSignal,
  current: HealthSignal,
): boolean {
  if (current === "CRITICAL" && baseline !== "CRITICAL") return true;
  if (current === "DEGRADED" && baseline === "HEALTHY") return true;
  return false;
}

function defaultClassifyDrift(baseline: TruthModel, current: TruthModel): DriftClass {
  const confidenceDelta = current.confidenceLevel - baseline.confidenceLevel;
  const trajectoryTurnedDegrading =
    current.healthTrajectory === "DEGRADING" && baseline.healthTrajectory !== "DEGRADING";
  const healthTurnedCritical =
    current.currentHealthSignal === "CRITICAL" && baseline.currentHealthSignal !== "CRITICAL";

  if (healthTurnedCritical || confidenceDelta < -0.3 || trajectoryTurnedDegrading) {
    return "CRITICAL_DRIFT";
  }

  const patternChanged = baseline.dominantPattern !== current.dominantPattern;
  const healthSignalChanged = baseline.currentHealthSignal !== current.currentHealthSignal;

  if (patternChanged || healthSignalChanged || Math.abs(confidenceDelta) > 0.1) {
    return "DRIFTING";
  }

  return "STABLE";
}

function buildRationale(
  driftClass: DriftClass,
  baseline: TruthModel,
  current: TruthModel,
  confidenceDelta: number,
): string {
  switch (driftClass) {
    case "CRITICAL_DRIFT":
      return `DriftClass=${driftClass}. Significant model degradation detected: healthSignal=${baseline.currentHealthSignal}→${current.currentHealthSignal}, trajectory=${baseline.healthTrajectory}→${current.healthTrajectory}, confidenceDelta=${confidenceDelta.toFixed(3)}. Immediate re-evaluation required.`;
    case "DRIFTING":
      return `DriftClass=${driftClass}. Model change detected: pattern=${baseline.dominantPattern}→${current.dominantPattern}, healthSignal=${baseline.currentHealthSignal}→${current.currentHealthSignal}, confidenceDelta=${confidenceDelta.toFixed(3)}. Monitoring recommended.`;
    case "STABLE":
      return `DriftClass=${driftClass}. No significant model change: pattern=${current.dominantPattern}, healthSignal=${current.currentHealthSignal}, confidenceDelta=${confidenceDelta.toFixed(3)}. No action required.`;
  }
}

// --- Contract ---

export class PatternDriftContract {
  private readonly now: () => string;
  private readonly classifyDrift: (baseline: TruthModel, current: TruthModel) => DriftClass;

  constructor(dependencies: PatternDriftContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.classifyDrift = dependencies.classifyDrift ?? defaultClassifyDrift;
  }

  detect(baseline: TruthModel, current: TruthModel): PatternDriftSignal {
    const detectedAt = this.now();
    const driftClass = this.classifyDrift(baseline, current);
    const confidenceDelta = current.confidenceLevel - baseline.confidenceLevel;
    const patternChanged = baseline.dominantPattern !== current.dominantPattern;
    const healthSignalChanged = baseline.currentHealthSignal !== current.currentHealthSignal;
    const driftRationale = buildRationale(driftClass, baseline, current, confidenceDelta);

    const driftHash = computeDeterministicHash(
      "w6-t6-cp1-pattern-drift",
      `${detectedAt}:${baseline.modelId}:${current.modelId}`,
      `class:${driftClass}:pattern:${patternChanged}:health:${healthSignalChanged}:delta:${confidenceDelta.toFixed(3)}`,
    );

    const driftId = computeDeterministicHash(
      "w6-t6-cp1-drift-id",
      driftHash,
      detectedAt,
    );

    return {
      driftId,
      detectedAt,
      baselineModelId: baseline.modelId,
      currentModelId: current.modelId,
      driftClass,
      driftRationale,
      patternChanged,
      healthSignalChanged,
      confidenceDelta,
      driftHash,
    };
  }
}

export function createPatternDriftContract(
  dependencies?: PatternDriftContractDependencies,
): PatternDriftContract {
  return new PatternDriftContract(dependencies);
}
