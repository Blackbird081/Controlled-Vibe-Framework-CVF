import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  EvaluationEngineContract,
  createEvaluationEngineContract,
} from "./evaluation.engine.contract";
import type {
  EvaluationResult,
  EvaluationEngineContractDependencies,
} from "./evaluation.engine.contract";
import type { TruthModel } from "./truth.model.contract";
import {
  ControlPlaneConsumerPipelineContract,
  createControlPlaneConsumerPipelineContract,
} from "../../CVF_CONTROL_PLANE_FOUNDATION/src/consumer.pipeline.contract";
import type {
  ControlPlaneConsumerPackage,
  ControlPlaneConsumerPipelineContractDependencies,
} from "../../CVF_CONTROL_PLANE_FOUNDATION/src/consumer.pipeline.contract";
import type { RankableKnowledgeItem, ScoringWeights } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.ranking.contract";
import type { SegmentTypeConstraints } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/context.packager.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EvaluationEngineConsumerPipelineRequest {
  model: TruthModel;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface EvaluationEngineConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  evaluationResult: EvaluationResult;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
  consumerId: string | undefined;
}

export interface EvaluationEngineConsumerPipelineContractDependencies {
  now?: () => string;
  evaluationEngineOverrides?: EvaluationEngineContractDependencies;
  consumerPipelineOverrides?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Warning Messages ─────────────────────────────────────────────────────────

const WARNING_FAIL =
  "[evaluation-engine] evaluation failed — governed intervention required";

const WARNING_INCONCLUSIVE =
  "[evaluation-engine] evaluation inconclusive — insufficient learning data";

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * EvaluationEngineConsumerPipelineContract (W4-T8 CP1 — Full Lane GC-019)
 * -----------------------------------------------------------------------
 * Bridges EvaluationEngineContract (LPF, W4-T3 CP1) into the CPF consumer
 * pipeline, surfacing verdict and severity as governed consumer-visible output.
 *
 * Chain:
 *   TruthModel
 *     → EvaluationEngineContract.evaluate()
 *     → EvaluationResult { verdict, severity, confidenceLevel, rationale }
 *     → ControlPlaneConsumerPipelineContract.execute()
 *     → ControlPlaneConsumerPackage
 *     → EvaluationEngineConsumerPipelineResult
 *
 * query = "evaluation-engine:verdict:{V}:severity:{S}:confidence:{C.CC}" (<=120)
 * contextId = evaluationResult.sourceTruthModelId
 *
 * Warnings:
 *   verdict === "FAIL"        → WARNING_FAIL
 *   verdict === "INCONCLUSIVE" → WARNING_INCONCLUSIVE
 *   verdict === "PASS" | "WARN" → no warning
 */
export class EvaluationEngineConsumerPipelineContract {
  private readonly now: () => string;
  private readonly evaluationEngine: EvaluationEngineContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: EvaluationEngineConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());

    this.evaluationEngine = createEvaluationEngineContract({
      ...dependencies.evaluationEngineOverrides,
      now: this.now,
    });

    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineOverrides,
      now: this.now,
    });
  }

  execute(
    request: EvaluationEngineConsumerPipelineRequest,
  ): EvaluationEngineConsumerPipelineResult {
    const createdAt = this.now();

    const evaluationResult = this.evaluationEngine.evaluate(request.model);

    const query = `evaluation-engine:verdict:${evaluationResult.verdict}:severity:${evaluationResult.severity}:confidence:${evaluationResult.confidenceLevel.toFixed(2)}`.slice(
      0,
      120,
    );

    const contextId = evaluationResult.sourceTruthModelId;

    const consumerPackage = this.consumerPipeline.execute({
      rankingRequest: {
        query,
        contextId,
        candidateItems: request.candidateItems ?? [],
        scoringWeights: request.scoringWeights,
      },
      segmentTypeConstraints: request.segmentTypeConstraints,
    });

    const warnings: string[] = [];
    if (evaluationResult.verdict === "FAIL") {
      warnings.push(WARNING_FAIL);
    }
    if (evaluationResult.verdict === "INCONCLUSIVE") {
      warnings.push(WARNING_INCONCLUSIVE);
    }

    const pipelineHash = computeDeterministicHash(
      "w4-t8-cp1-evaluation-engine-consumer-pipeline",
      evaluationResult.evaluationHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w4-t8-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      evaluationResult,
      consumerPackage,
      pipelineHash,
      warnings,
      consumerId: request.consumerId,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createEvaluationEngineConsumerPipelineContract(
  dependencies?: EvaluationEngineConsumerPipelineContractDependencies,
): EvaluationEngineConsumerPipelineContract {
  return new EvaluationEngineConsumerPipelineContract(dependencies);
}
