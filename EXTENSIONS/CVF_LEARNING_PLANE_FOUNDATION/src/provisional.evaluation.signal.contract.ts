import type { CanonicalCVFPhase } from "../../CVF_GUARD_CONTRACT/src/types";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

export type ProvisionalSignalCategory =
  | "epistemic"
  | "execution"
  | "output_quality"
  | "security"
  | "planner_quality"
  | "asset_quality";

export type ProvisionalSignalEvidenceType =
  | "guard_event"
  | "trace_event"
  | "validation_report"
  | "review_signal"
  | "planner_analysis";

export type ProvisionalSignalSeverity = "low" | "medium" | "high";

export interface WeakTriggerDefinitionCaptureInput {
  sourceRef: string;
  textSample: string;
  candidateRefs: string[];
  confidence: number;
  missingInputs: string[];
  clarificationNeeded: boolean;
  negativeMatches: string[];
  phase?: CanonicalCVFPhase;
}

export interface ProvisionalEvaluationSignal {
  signalId: string;
  capturedAt: string;
  name: "weak_trigger_definition";
  category: ProvisionalSignalCategory;
  captureSource: string;
  evidenceType: ProvisionalSignalEvidenceType;
  phase: CanonicalCVFPhase[];
  severity: ProvisionalSignalSeverity;
  recommendedRemediation: string;
  summary: string;
  signalHash: string;
}

export interface ProvisionalEvaluationSignalContractDependencies {
  now?: () => string;
}

function clampConfidence(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return Math.round(value * 100) / 100;
}

function deriveSeverity(
  input: WeakTriggerDefinitionCaptureInput,
): ProvisionalSignalSeverity {
  if (input.candidateRefs.length === 0 && input.clarificationNeeded) {
    return "high";
  }

  if (input.missingInputs.length > 0 || input.confidence < 0.55) {
    return "medium";
  }

  return "low";
}

function buildRemediation(input: WeakTriggerDefinitionCaptureInput): string {
  if (input.missingInputs.length > 0) {
    return `Collect or clarify the missing planner inputs before asset selection: ${input.missingInputs.join(", ")}.`;
  }

  if (input.candidateRefs.length === 0) {
    return "Clarify the request intent and strengthen trigger phrases before planner selection.";
  }

  return "Refine trigger wording, add clearer prerequisites, and keep clarification-first routing active.";
}

function buildSummary(input: WeakTriggerDefinitionCaptureInput): string {
  const confidence = clampConfidence(input.confidence);
  const candidateCount = input.candidateRefs.length;
  const missingCount = input.missingInputs.length;

  return (
    `Planner trigger quality looks weak: candidates=${candidateCount}, ` +
    `confidence=${confidence}, missingInputs=${missingCount}, ` +
    `clarificationNeeded=${input.clarificationNeeded}.`
  );
}

export class ProvisionalEvaluationSignalContract {
  private readonly now: () => string;

  constructor(
    dependencies: ProvisionalEvaluationSignalContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  captureWeakTriggerDefinition(
    input: WeakTriggerDefinitionCaptureInput,
  ): ProvisionalEvaluationSignal | null {
    const normalizedConfidence = clampConfidence(input.confidence);
    const shouldCapture =
      input.candidateRefs.length === 0 ||
      input.clarificationNeeded ||
      input.missingInputs.length > 0 ||
      normalizedConfidence < 0.75;

    if (!shouldCapture) {
      return null;
    }

    const capturedAt = this.now();
    const severity = deriveSeverity(input);
    const summary = buildSummary({
      ...input,
      confidence: normalizedConfidence,
    });
    const recommendedRemediation = buildRemediation(input);
    const phase = [input.phase ?? "DESIGN"];

    const signalHash = computeDeterministicHash(
      "w4-stage1-provisional-eval-signal",
      `${capturedAt}:${input.sourceRef}`,
      `signal:weak_trigger_definition:severity:${severity}`,
      `confidence:${normalizedConfidence}:candidates:${input.candidateRefs.length}:missing:${input.missingInputs.length}`,
    );

    const signalId = computeDeterministicHash(
      "w4-stage1-provisional-eval-signal-id",
      signalHash,
      capturedAt,
    );

    return {
      signalId,
      capturedAt,
      name: "weak_trigger_definition",
      category: "planner_quality",
      captureSource: input.sourceRef,
      evidenceType: "planner_analysis",
      phase,
      severity,
      recommendedRemediation,
      summary,
      signalHash,
    };
  }
}

export function createProvisionalEvaluationSignalContract(
  dependencies?: ProvisionalEvaluationSignalContractDependencies,
): ProvisionalEvaluationSignalContract {
  return new ProvisionalEvaluationSignalContract(dependencies);
}
