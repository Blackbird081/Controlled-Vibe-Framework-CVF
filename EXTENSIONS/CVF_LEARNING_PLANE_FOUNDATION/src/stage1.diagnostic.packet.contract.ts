import type { ExternalAssetIntakeValidationResult } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/external.asset.intake.profile.contract";
import type { PlannerTriggerHeuristicsResult } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/planner.trigger.heuristics.contract";
import type { ProvisionalEvaluationSignal } from "./provisional.evaluation.signal.contract";
import {
  Stage1DiagnosticInterpretationContract,
  createStage1DiagnosticInterpretationContract,
} from "./stage1.diagnostic.interpretation.contract";
import type {
  Stage1DiagnosticInterpretation,
  Stage1DiagnosticInterpretationContractDependencies,
  Stage1RuntimeIndicator,
  Stage1PrimaryAttribution,
} from "./stage1.diagnostic.interpretation.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

export type Stage1RecommendedNextMove =
  | "CLARIFY_INPUT"
  | "TIGHTEN_TRIGGER"
  | "FIX_ASSET_PROFILE"
  | "REVIEW_RUNTIME_PROVIDER"
  | "COLLECT_MORE_EVIDENCE"
  | "NO_ACTION";

export interface Stage1DiagnosticExecutionEnvironmentSummary {
  declared: boolean;
  requiredForCase: boolean;
  os?: string;
  shell?: string;
  compatibility?: string;
  issueFields: string[];
}

export interface Stage1DiagnosticPacketInput {
  taskId?: string;
  runId?: string;
  laneId?: string;
  provider?: string;
  model?: string;
  runtimeIndicator?: Stage1RuntimeIndicator;
  runtimeNotes?: string;
  intakeValidation: ExternalAssetIntakeValidationResult;
  plannerTrigger: PlannerTriggerHeuristicsResult;
  provisionalSignal: ProvisionalEvaluationSignal | null;
}

export interface Stage1DiagnosticPacket {
  packetId: string;
  createdAt: string;
  taskId?: string;
  runId?: string;
  laneId?: string;
  provider?: string;
  model?: string;
  executionEnvironmentSummary: Stage1DiagnosticExecutionEnvironmentSummary;
  primaryAttribution: Stage1PrimaryAttribution;
  recommendedNextMove: Stage1RecommendedNextMove;
  stage1ReducedAmbiguity: boolean;
  interpretation: Stage1DiagnosticInterpretation;
  noSpinConclusion: string;
  packetHash: string;
}

export interface Stage1DiagnosticPacketContractDependencies {
  now?: () => string;
  interpretationDeps?: Stage1DiagnosticInterpretationContractDependencies;
}

function deriveRecommendedNextMove(
  attribution: Stage1PrimaryAttribution,
): Stage1RecommendedNextMove {
  switch (attribution) {
    case "INTAKE_SHAPE":
      return "FIX_ASSET_PROFILE";
    case "PLANNER_TRIGGER_QUALITY":
      return "TIGHTEN_TRIGGER";
    case "MISSING_CLARIFICATION":
      return "CLARIFY_INPUT";
    case "RUNTIME_OR_PROVIDER_BEHAVIOR":
      return "REVIEW_RUNTIME_PROVIDER";
    case "MIXED":
    case "UNRESOLVED":
      return "COLLECT_MORE_EVIDENCE";
  }
}

function buildNoSpinConclusion(
  interpretation: Stage1DiagnosticInterpretation,
  packet: Stage1DiagnosticPacketInput,
): string {
  const runtimeLabel = packet.runtimeIndicator ?? "NOT_PROVIDED";
  const executionEnvironmentMissing =
    packet.intakeValidation.issues.some(
      (issue) => issue.field === "execution_environment",
    ) &&
    packet.intakeValidation.normalizedProfile.candidate_asset_type ===
      "W7SkillAsset";

  switch (interpretation.primaryAttribution) {
    case "INTAKE_SHAPE":
      if (executionEnvironmentMissing) {
        return `The strongest visible problem is malformed pre-runtime intake shape, including missing execution-environment declaration for a shell-dependent skill candidate. Runtime indicator=${runtimeLabel}, but runtime should not be blamed first.`;
      }
      return `The strongest visible problem is malformed pre-runtime intake shape. Runtime indicator=${runtimeLabel}, but runtime should not be blamed first.`;
    case "PLANNER_TRIGGER_QUALITY":
      return `The strongest visible problem is planner-trigger quality. This case needs tighter trigger framing before stronger runtime claims are made.`;
    case "MISSING_CLARIFICATION":
      return `The case appears under-specified. Missing clarification is a more defensible explanation than provider weakness.`;
    case "RUNTIME_OR_PROVIDER_BEHAVIOR":
      return `Pre-runtime diagnostics look clean enough that runtime/provider behavior is the leading explanation for the observed weakness.`;
    case "MIXED":
      return `The case shows both pre-runtime and runtime-side concerns. Any single-cause conclusion would overstate the evidence.`;
    case "UNRESOLVED":
      return `Stage 1 diagnostics did not isolate a dominant cause. More evidence is required before drawing a stronger conclusion.`;
  }
}

function deriveExecutionEnvironmentSummary(
  packet: Stage1DiagnosticPacketInput,
): Stage1DiagnosticExecutionEnvironmentSummary {
  const profile = packet.intakeValidation.normalizedProfile;
  const issueFields = Array.from(
    new Set(
      packet.intakeValidation.issues
        .map((issue) => issue.field)
        .filter((field) => field === "execution_environment" || field.startsWith("execution_environment.")),
    ),
  );
  const environment = profile.execution_environment;

  return {
    declared: environment !== undefined,
    requiredForCase:
      profile.candidate_asset_type === "W7SkillAsset" &&
      issueFields.includes("execution_environment"),
    os: environment?.os,
    shell: environment?.shell,
    compatibility: environment?.compatibility,
    issueFields,
  };
}

export class Stage1DiagnosticPacketContract {
  private readonly now: () => string;
  private readonly interpretationContract: Stage1DiagnosticInterpretationContract;

  constructor(
    dependencies: Stage1DiagnosticPacketContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.interpretationContract = createStage1DiagnosticInterpretationContract({
      ...dependencies.interpretationDeps,
      now: this.now,
    });
  }

  packet(input: Stage1DiagnosticPacketInput): Stage1DiagnosticPacket {
    const createdAt = this.now();
    const interpretation = this.interpretationContract.interpret({
      intakeValidation: input.intakeValidation,
      plannerTrigger: input.plannerTrigger,
      provisionalSignal: input.provisionalSignal,
      runtimeIndicator: input.runtimeIndicator,
      runtimeNotes: input.runtimeNotes,
    });

    const recommendedNextMove = deriveRecommendedNextMove(
      interpretation.primaryAttribution,
    );
    const executionEnvironmentSummary = deriveExecutionEnvironmentSummary(input);
    const noSpinConclusion = buildNoSpinConclusion(interpretation, input);

    const packetHash = computeDeterministicHash(
      "stage1-diagnostic-packet",
      interpretation.interpretationHash,
      `task=${input.taskId ?? "none"}:run=${input.runId ?? "none"}:lane=${input.laneId ?? "none"}`,
      `next=${recommendedNextMove}`,
      createdAt,
    );

    const packetId = computeDeterministicHash(
      "stage1-diagnostic-packet-id",
      packetHash,
      createdAt,
    );

    return {
      packetId,
      createdAt,
      taskId: input.taskId,
      runId: input.runId,
      laneId: input.laneId,
      provider: input.provider,
      model: input.model,
      executionEnvironmentSummary,
      primaryAttribution: interpretation.primaryAttribution,
      recommendedNextMove,
      stage1ReducedAmbiguity: interpretation.stage1ReducedAmbiguity,
      interpretation,
      noSpinConclusion,
      packetHash,
    };
  }
}

export function createStage1DiagnosticPacketContract(
  dependencies?: Stage1DiagnosticPacketContractDependencies,
): Stage1DiagnosticPacketContract {
  return new Stage1DiagnosticPacketContract(dependencies);
}
