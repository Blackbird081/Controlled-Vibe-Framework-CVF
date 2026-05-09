import type { AIGatewayConsumerPipelineResult } from "./ai.gateway.consumer.pipeline.contract";
import type { GatewaySignalType } from "./ai.gateway.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export interface AIGatewayConsumerPipelineBatchResult {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalRequests: number;
  overallDominantSignal: GatewaySignalType;
  totalPIIDetections: number;
  dominantEnvType: string;
  dominantTokenBudget: number;
  results: AIGatewayConsumerPipelineResult[];
}

export interface AIGatewayConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// --- Dominant Signal Logic ---

// Frequency-based: most common signal wins; ties broken by vibe > command > query > event
const SIGNAL_ORDER: GatewaySignalType[] = ["vibe", "command", "query", "event"];

function computeDominantSignal(results: AIGatewayConsumerPipelineResult[]): GatewaySignalType {
  if (results.length === 0) return "vibe";

  const signalCounts: Record<string, number> = {};

  for (const result of results) {
    const signal = result.gatewayProcessedRequest.signalType;
    signalCounts[signal] = (signalCounts[signal] ?? 0) + 1;
  }

  let maxCount = 0;
  let dominantSignal: GatewaySignalType = "vibe";

  for (const signal of SIGNAL_ORDER) {
    const count = signalCounts[signal] ?? 0;
    if (count > maxCount) {
      maxCount = count;
      dominantSignal = signal;
    }
  }

  return dominantSignal;
}

// --- Dominant Env Type Logic ---

function computeDominantEnvType(results: AIGatewayConsumerPipelineResult[]): string {
  if (results.length === 0) return "cvf";

  const envCounts: Record<string, number> = {};

  for (const result of results) {
    const envType = result.gatewayProcessedRequest.envMetadata.platform;
    envCounts[envType] = (envCounts[envType] ?? 0) + 1;
  }

  let maxCount = 0;
  let dominantEnv = "cvf";

  for (const [envType, count] of Object.entries(envCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantEnv = envType;
    }
  }

  return dominantEnv;
}

// --- Contract ---

export class AIGatewayConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: AIGatewayConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: AIGatewayConsumerPipelineResult[],
  ): AIGatewayConsumerPipelineBatchResult {
    const createdAt = this.now();

    const totalRequests = results.length;
    const overallDominantSignal = computeDominantSignal(results);
    const totalPIIDetections = results.filter(
      (r) => r.gatewayProcessedRequest.privacyReport.filtered,
    ).length;
    const dominantEnvType = computeDominantEnvType(results);

    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const batchHash = computeDeterministicHash(
      "w1-t28-cp2-ai-gateway-consumer-batch",
      `totalRequests=${totalRequests}`,
      `dominantSignal=${overallDominantSignal}`,
      `piiDetections=${totalPIIDetections}`,
      `dominantEnv=${dominantEnvType}`,
      `dominantTokenBudget=${dominantTokenBudget}`,
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w1-t28-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalRequests,
      overallDominantSignal,
      totalPIIDetections,
      dominantEnvType,
      dominantTokenBudget,
      results,
    };
  }
}

export function createAIGatewayConsumerPipelineBatchContract(
  dependencies?: AIGatewayConsumerPipelineBatchContractDependencies,
): AIGatewayConsumerPipelineBatchContract {
  return new AIGatewayConsumerPipelineBatchContract(dependencies);
}
