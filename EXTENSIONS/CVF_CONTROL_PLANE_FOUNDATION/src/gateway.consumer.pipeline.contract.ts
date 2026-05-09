import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import { AIGatewayContract, createAIGatewayContract } from "./ai.gateway.contract";
import type {
  GatewaySignalRequest,
  GatewayProcessedRequest,
  AIGatewayContractDependencies,
} from "./ai.gateway.contract";
import {
  ControlPlaneConsumerPipelineContract,
  createControlPlaneConsumerPipelineContract,
} from "./consumer.pipeline.contract";
import type {
  ControlPlaneConsumerPackage,
  ControlPlaneConsumerPipelineContractDependencies,
} from "./consumer.pipeline.contract";
import type { ScoringWeights, RankableKnowledgeItem } from "./knowledge.ranking.contract";
import type { SegmentTypeConstraints } from "./context.packager.contract";

// --- Types ---

export interface GatewayConsumerPipelineRequest {
  rawSignal: string;
  signalType?: GatewaySignalRequest["signalType"];
  envContext?: GatewaySignalRequest["envContext"];
  privacyConfig?: GatewaySignalRequest["privacyConfig"];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  candidateItems?: RankableKnowledgeItem[];
  consumerId?: string;
  sessionId?: string;
}

export interface GatewayConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  consumerId?: string;
  sessionId?: string;
  gatewayRequest: GatewayProcessedRequest;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineGatewayHash: string;
  warnings: string[];
}

export interface GatewayConsumerPipelineContractDependencies {
  gateway?: AIGatewayContract;
  gatewayDependencies?: AIGatewayContractDependencies;
  consumerPipeline?: ControlPlaneConsumerPipelineContract;
  consumerPipelineDependencies?: ControlPlaneConsumerPipelineContractDependencies;
  now?: () => string;
}

// --- Contract ---

export class GatewayConsumerPipelineContract {
  private readonly gateway: AIGatewayContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;
  private readonly now: () => string;

  constructor(
    dependencies: GatewayConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.gateway =
      dependencies.gateway ??
      createAIGatewayContract({
        ...dependencies.gatewayDependencies,
        now: dependencies.gatewayDependencies?.now ?? this.now,
      });
    this.consumerPipeline =
      dependencies.consumerPipeline ??
      createControlPlaneConsumerPipelineContract({
        ...dependencies.consumerPipelineDependencies,
        now: dependencies.consumerPipelineDependencies?.now ?? this.now,
      });
  }

  execute(request: GatewayConsumerPipelineRequest): GatewayConsumerPipelineResult {
    const createdAt = this.now();

    // Stage 1: Process through AI Gateway (privacy, normalization, env metadata)
    const gatewaySignal: GatewaySignalRequest = {
      rawSignal: request.rawSignal,
      signalType: request.signalType,
      envContext: request.envContext,
      privacyConfig: request.privacyConfig,
      consumerId: request.consumerId,
      sessionId: request.sessionId,
    };
    const gatewayRequest = this.gateway.process(gatewaySignal);

    // Stage 2: Drive consumer pipeline with normalized signal as query
    const query =
      gatewayRequest.normalizedSignal ||
      gatewayRequest.rawSignal ||
      "(empty signal)";

    const consumerPackage = this.consumerPipeline.execute({
      rankingRequest: {
        query,
        contextId: gatewayRequest.gatewayId,
        candidateItems: request.candidateItems ?? [],
        scoringWeights: request.scoringWeights,
      },
      segmentTypeConstraints: request.segmentTypeConstraints,
    });

    // Aggregate warnings (TypedContextPackage has no warnings surface; gateway warnings cover signal-level issues)
    const warnings = gatewayRequest.warnings.map((w) => `[gateway] ${w}`);

    // Build deterministic hash
    const pipelineGatewayHash = computeDeterministicHash(
      "w1-t14-cp1-gateway-consumer-pipeline",
      gatewayRequest.gatewayHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w1-t14-cp1-result-id",
      pipelineGatewayHash,
    );

    return {
      resultId,
      createdAt,
      consumerId: request.consumerId,
      sessionId: request.sessionId,
      gatewayRequest,
      consumerPackage,
      pipelineGatewayHash,
      warnings,
    };
  }
}

export function createGatewayConsumerPipelineContract(
  dependencies?: GatewayConsumerPipelineContractDependencies,
): GatewayConsumerPipelineContract {
  return new GatewayConsumerPipelineContract(dependencies);
}
