import type { ExternalAssetIntakeValidationResult } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/external.asset.intake.profile.contract";
import type { PlannerTriggerHeuristicsResult } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/planner.trigger.heuristics.contract";
import type { ProvisionalEvaluationSignal } from "./provisional.evaluation.signal.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

export type Stage1RuntimeIndicator =
  | "STRONG"
  | "WEAK"
  | "AMBIGUOUS"
  | "NOT_PROVIDED";

export type Stage1PrimaryAttribution =
  | "INTAKE_SHAPE"
  | "PLANNER_TRIGGER_QUALITY"
  | "MISSING_CLARIFICATION"
  | "RUNTIME_OR_PROVIDER_BEHAVIOR"
  | "MIXED"
  | "UNRESOLVED";

export interface Stage1DiagnosticInterpretationInput {
  intakeValidation: ExternalAssetIntakeValidationResult;
  plannerTrigger: PlannerTriggerHeuristicsResult;
  provisionalSignal: ProvisionalEvaluationSignal | null;
  runtimeIndicator?: Stage1RuntimeIndicator;
  runtimeNotes?: string;
}

export interface Stage1DiagnosticInterpretation {
  interpretationId: string;
  interpretedAt: string;
  primaryAttribution: Stage1PrimaryAttribution;
  stage1ReducedAmbiguity: boolean;
  likelyPreRuntimeStructure: boolean;
  likelyPlannerQuality: boolean;
  likelyMissingClarification: boolean;
  likelyRuntimeOrProviderBehavior: boolean;
  rationale: string;
  interpretationHash: string;
}

export interface Stage1DiagnosticInterpretationContractDependencies {
  now?: () => string;
}

function hasPlannerQualityConcern(
  plannerTrigger: PlannerTriggerHeuristicsResult,
  provisionalSignal: ProvisionalEvaluationSignal | null,
): boolean {
  return (
    plannerTrigger.candidate_refs.length === 0 ||
    plannerTrigger.negative_matches.length > 0 ||
    provisionalSignal?.name === "weak_trigger_definition"
  );
}

function hasMissingClarificationConcern(
  plannerTrigger: PlannerTriggerHeuristicsResult,
): boolean {
  return (
    plannerTrigger.clarification_needed ||
    plannerTrigger.missing_inputs.length > 0
  );
}

function derivePrimaryAttribution(
  input: Stage1DiagnosticInterpretationInput,
): Stage1PrimaryAttribution {
  const runtimeIndicator = input.runtimeIndicator ?? "NOT_PROVIDED";
  const intakeConcern = !input.intakeValidation.valid;
  const plannerConcern = hasPlannerQualityConcern(
    input.plannerTrigger,
    input.provisionalSignal,
  );
  const clarificationConcern = hasMissingClarificationConcern(
    input.plannerTrigger,
  );
  const runtimeConcern =
    runtimeIndicator === "WEAK" || runtimeIndicator === "AMBIGUOUS";

  if (intakeConcern) {
    return "INTAKE_SHAPE";
  }

  const plannerSideConcern = plannerConcern || clarificationConcern;
  if (plannerSideConcern && runtimeConcern) {
    return "MIXED";
  }

  if (plannerConcern) {
    return "PLANNER_TRIGGER_QUALITY";
  }

  if (clarificationConcern) {
    return "MISSING_CLARIFICATION";
  }

  if (
    runtimeIndicator === "WEAK" &&
    input.intakeValidation.valid &&
    !plannerConcern &&
    !clarificationConcern
  ) {
    return "RUNTIME_OR_PROVIDER_BEHAVIOR";
  }

  return "UNRESOLVED";
}

function buildRationale(
  input: Stage1DiagnosticInterpretationInput,
  primaryAttribution: Stage1PrimaryAttribution,
): string {
  const runtimeIndicator = input.runtimeIndicator ?? "NOT_PROVIDED";

  switch (primaryAttribution) {
    case "INTAKE_SHAPE":
      return (
        `External asset intake was invalid before execution. ` +
        `Validation issues should be addressed before blaming runtime behavior.`
      );
    case "PLANNER_TRIGGER_QUALITY":
      return (
        `Planner-trigger quality is the strongest visible weakness. ` +
        `Candidate routing is weak, over-blocked, or preserved by provisional trigger diagnostics.`
      );
    case "MISSING_CLARIFICATION":
      return (
        `Required inputs were missing or clarification was still needed. ` +
        `The case likely entered execution under-specified.`
      );
    case "RUNTIME_OR_PROVIDER_BEHAVIOR":
      return (
        `Pre-runtime diagnostics are clean enough that the remaining weakness is more likely runtime/provider-side. ` +
        `Runtime indicator = ${runtimeIndicator}.`
      );
    case "MIXED":
      return (
        `The case shows both pre-runtime and runtime-side signals. ` +
        `Do not collapse this into a single-cause conclusion.`
      );
    case "UNRESOLVED":
      return (
        `Stage 1 diagnostics did not isolate one dominant cause. ` +
        `More evidence is required before making a stronger attribution.`
      );
  }
}

export class Stage1DiagnosticInterpretationContract {
  private readonly now: () => string;

  constructor(
    dependencies: Stage1DiagnosticInterpretationContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  interpret(
    input: Stage1DiagnosticInterpretationInput,
  ): Stage1DiagnosticInterpretation {
    const interpretedAt = this.now();
    const primaryAttribution = derivePrimaryAttribution(input);
    const likelyPreRuntimeStructure = !input.intakeValidation.valid;
    const likelyPlannerQuality = hasPlannerQualityConcern(
      input.plannerTrigger,
      input.provisionalSignal,
    );
    const likelyMissingClarification = hasMissingClarificationConcern(
      input.plannerTrigger,
    );
    const runtimeIndicator = input.runtimeIndicator ?? "NOT_PROVIDED";
    const likelyRuntimeOrProviderBehavior =
      runtimeIndicator === "WEAK" &&
      input.intakeValidation.valid &&
      !likelyPlannerQuality &&
      !likelyMissingClarification;
    const stage1ReducedAmbiguity = primaryAttribution !== "UNRESOLVED";
    const rationale = buildRationale(input, primaryAttribution);

    const interpretationHash = computeDeterministicHash(
      "stage1-diagnostic-interpretation",
      `intake=${input.intakeValidation.valid}`,
      `candidates=${input.plannerTrigger.candidate_refs.length}:clarify=${input.plannerTrigger.clarification_needed}`,
      `signal=${input.provisionalSignal?.name ?? "none"}:runtime=${runtimeIndicator}`,
      interpretedAt,
    );

    const interpretationId = computeDeterministicHash(
      "stage1-diagnostic-interpretation-id",
      interpretationHash,
      interpretedAt,
    );

    return {
      interpretationId,
      interpretedAt,
      primaryAttribution,
      stage1ReducedAmbiguity,
      likelyPreRuntimeStructure,
      likelyPlannerQuality,
      likelyMissingClarification,
      likelyRuntimeOrProviderBehavior,
      rationale,
      interpretationHash,
    };
  }
}

export function createStage1DiagnosticInterpretationContract(
  dependencies?: Stage1DiagnosticInterpretationContractDependencies,
): Stage1DiagnosticInterpretationContract {
  return new Stage1DiagnosticInterpretationContract(dependencies);
}
