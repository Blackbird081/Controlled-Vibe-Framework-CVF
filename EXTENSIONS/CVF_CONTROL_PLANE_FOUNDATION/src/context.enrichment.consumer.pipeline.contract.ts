import type {
  ContextValidationResult,
  ContextValidationStatus,
} from "./context.enrichment.contract";
import {
  ControlPlaneConsumerPipelineContract,
  createControlPlaneConsumerPipelineContract,
} from "./consumer.pipeline.contract";
import type {
  ControlPlaneConsumerPackage,
  ControlPlaneConsumerPipelineContractDependencies,
} from "./consumer.pipeline.contract";
import type { RankableKnowledgeItem, ScoringWeights } from "./knowledge.ranking.contract";
import type { SegmentTypeConstraints } from "./context.packager.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export interface ContextEnrichmentConsumerPipelineRequest {
  validationResult: ContextValidationResult;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface ContextEnrichmentConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  validationResult: ContextValidationResult;
  consumerPackage: ControlPlaneConsumerPackage;
  query: string;
  contextId: string;
  warnings: string[];
  consumerId: string | undefined;
  pipelineHash: string;
}

export interface ContextEnrichmentConsumerPipelineContractDependencies {
  now?: () => string;
}

// --- Contract ---

export class ContextEnrichmentConsumerPipelineContract {
  private readonly consumerPipelineContract: ControlPlaneConsumerPipelineContract;
  private readonly now: () => string;

  constructor(dependencies: ContextEnrichmentConsumerPipelineContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    const consumerDeps: ControlPlaneConsumerPipelineContractDependencies = {
      now: this.now,
    };
    this.consumerPipelineContract = createControlPlaneConsumerPipelineContract(consumerDeps);
  }

  execute(
    request: ContextEnrichmentConsumerPipelineRequest,
  ): ContextEnrichmentConsumerPipelineResult {
    const createdAt = this.now();
    const { validationResult } = request;

    // Derive query
    const query =
      `ContextEnrichment: status=${validationResult.status}, ` +
      `violations=${validationResult.violations.length}, ` +
      `packageId=${validationResult.packageId}`;

    // Extract contextId
    const contextId = validationResult.packageId;

    // Build warnings (severity-ordered)
    const warnings: string[] = [];
    if (validationResult.status === "INVALID") {
      warnings.push("WARNING_VALIDATION_INVALID");
    }
    if (validationResult.violations.length > 0) {
      warnings.push("WARNING_VIOLATIONS_PRESENT");
    }

    // Build consumer package
    const consumerPackage = this.consumerPipelineContract.execute({
      rankingRequest: {
        query,
        contextId,
        candidateItems: request.candidateItems ?? [],
        scoringWeights: request.scoringWeights,
      },
      segmentTypeConstraints: request.segmentTypeConstraints,
    });

    // Compute hashes
    const pipelineHash = computeDeterministicHash(
      "w2-t34-cp1-context-enrichment-consumer-pipeline",
      validationResult.packageId,
      validationResult.status,
      `violations=${validationResult.violations.length}`,
      consumerPackage.pipelineHash,
      `warnings=${warnings.length}`,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w2-t34-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      validationResult,
      consumerPackage,
      query,
      contextId,
      warnings,
      consumerId: request.consumerId,
      pipelineHash,
    };
  }
}

export function createContextEnrichmentConsumerPipelineContract(
  dependencies?: ContextEnrichmentConsumerPipelineContractDependencies,
): ContextEnrichmentConsumerPipelineContract {
  return new ContextEnrichmentConsumerPipelineContract(dependencies);
}
