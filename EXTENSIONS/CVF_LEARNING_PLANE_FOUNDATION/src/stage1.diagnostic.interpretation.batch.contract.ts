import type { Stage1DiagnosticInterpretation } from "./stage1.diagnostic.interpretation.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

export interface Stage1DiagnosticInterpretationBatchResult {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalResults: number;
  reducedAmbiguityCount: number;
  intakeShapeCount: number;
  plannerQualityCount: number;
  missingClarificationCount: number;
  runtimeBehaviorCount: number;
  mixedCount: number;
  unresolvedCount: number;
  results: Stage1DiagnosticInterpretation[];
}

export interface Stage1DiagnosticInterpretationBatchContractDependencies {
  now?: () => string;
}

export class Stage1DiagnosticInterpretationBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: Stage1DiagnosticInterpretationBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: Stage1DiagnosticInterpretation[],
  ): Stage1DiagnosticInterpretationBatchResult {
    const createdAt = this.now();

    const countByAttribution = (kind: Stage1DiagnosticInterpretation["primaryAttribution"]) =>
      results.filter((result) => result.primaryAttribution === kind).length;

    const batchHash = computeDeterministicHash(
      "stage1-diagnostic-interpretation-batch",
      ...results.map((result) => result.interpretationHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "stage1-diagnostic-interpretation-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalResults: results.length,
      reducedAmbiguityCount: results.filter((result) => result.stage1ReducedAmbiguity).length,
      intakeShapeCount: countByAttribution("INTAKE_SHAPE"),
      plannerQualityCount: countByAttribution("PLANNER_TRIGGER_QUALITY"),
      missingClarificationCount: countByAttribution("MISSING_CLARIFICATION"),
      runtimeBehaviorCount: countByAttribution("RUNTIME_OR_PROVIDER_BEHAVIOR"),
      mixedCount: countByAttribution("MIXED"),
      unresolvedCount: countByAttribution("UNRESOLVED"),
      results,
    };
  }
}

export function createStage1DiagnosticInterpretationBatchContract(
  dependencies?: Stage1DiagnosticInterpretationBatchContractDependencies,
): Stage1DiagnosticInterpretationBatchContract {
  return new Stage1DiagnosticInterpretationBatchContract(dependencies);
}
