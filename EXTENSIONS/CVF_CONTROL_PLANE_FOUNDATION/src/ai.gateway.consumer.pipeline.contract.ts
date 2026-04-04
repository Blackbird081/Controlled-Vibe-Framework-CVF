import type { GatewayProcessedRequest } from "./ai.gateway.contract";
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

export interface AIGatewayConsumerPipelineRequest {
  gatewayProcessedRequest: GatewayProcessedRequest;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface AIGatewayConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  gatewayProcessedRequest: GatewayProcessedRequest;
  consumerPackage: ControlPlaneConsumerPackage;
  query: string;
  contextId: string;
  warnings: string[];
  consumerId: string | undefined;
  pipelineHash: string;
}

export interface AIGatewayConsumerPipelineContractDependencies {
  now?: () => string;
}

// --- Contract ---

export class AIGatewayConsumerPipelineContract {
  private readonly consumerPipelineContract: ControlPlaneConsumerPipelineContract;
  private readonly now: () => string;

  constructor(
    dependencies: AIGatewayConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    const consumerDeps: ControlPlaneConsumerPipelineContractDependencies = {
      now: this.now,
    };
    this.consumerPipelineContract = createControlPlaneConsumerPipelineContract(consumerDeps);
  }

  execute(
    request: AIGatewayConsumerPipelineRequest,
  ): AIGatewayConsumerPipelineResult {
    const createdAt = this.now();
    const { gatewayProcessedRequest } = request;

    // Derive query from gateway processed request
    const signalType = gatewayProcessedRequest.signalType;
    const piiDetected = gatewayProcessedRequest.privacyReport.filtered ? "yes" : "no";
    const envType = gatewayProcessedRequest.envMetadata.platform;
    const query = `AIGateway: signal=${signalType}, privacy=${piiDetected}, env=${envType}`;

    // Extract contextId
    const contextId = gatewayProcessedRequest.gatewayId;

    // Build warnings
    const warnings: string[] = [];
    if (gatewayProcessedRequest.privacyReport.filtered) {
      warnings.push("WARNING_PII_DETECTED");
    }
    if (!signalType || signalType.trim().length === 0) {
      warnings.push("WARNING_NO_SIGNAL");
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

    // Compute pipeline hash
    const pipelineHash = computeDeterministicHash(
      "w1-t28-cp1-ai-gateway-consumer-pipeline",
      gatewayProcessedRequest.gatewayHash,
      consumerPackage.pipelineHash,
      `warnings=${warnings.length}`,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w1-t28-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      gatewayProcessedRequest,
      consumerPackage,
      query,
      contextId,
      warnings,
      consumerId: request.consumerId,
      pipelineHash,
    };
  }
}

export function createAIGatewayConsumerPipelineContract(
  dependencies?: AIGatewayConsumerPipelineContractDependencies,
): AIGatewayConsumerPipelineContract {
  return new AIGatewayConsumerPipelineContract(dependencies);
}
