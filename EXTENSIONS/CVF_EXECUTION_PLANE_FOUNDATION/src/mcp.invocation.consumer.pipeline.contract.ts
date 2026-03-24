import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  MCPInvocationContract,
  createMCPInvocationContract,
} from "./mcp.invocation.contract";
import type {
  MCPInvocationRequest,
  MCPInvocationResult,
  MCPInvocationStatus,
  MCPInvocationContractDependencies,
} from "./mcp.invocation.contract";
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

export interface MCPInvocationConsumerPipelineRequest {
  invocationRequest: MCPInvocationRequest;
  invocationStatus: MCPInvocationStatus;
  responsePayload: unknown;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface MCPInvocationConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  consumerId?: string;
  invocationResult: MCPInvocationResult;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
}

export interface MCPInvocationConsumerPipelineContractDependencies {
  now?: () => string;
  invocationContractDeps?: MCPInvocationContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Warning Builder ──────────────────────────────────────────────────────────

function buildInvocationWarnings(status: MCPInvocationStatus): string[] {
  if (status === "FAILURE") {
    return ["[mcp] invocation failed — tool may be unavailable or returned an error"];
  }
  if (status === "TIMEOUT") {
    return ["[mcp] invocation timed out — tool did not respond within the expected window"];
  }
  if (status === "REJECTED") {
    return ["[mcp] invocation rejected — authorization or policy gate prevented execution"];
  }
  return [];
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * MCPInvocationConsumerPipelineContract (W2-T13)
 * -----------------------------------------------
 * Cross-plane consumer bridge: EPF → CPF.
 *
 * Internal chain (single execute call):
 *   MCPInvocationContract.invoke(request, status, payload)  → MCPInvocationResult
 *   query = `${result.toolName}:${result.invocationStatus}`.slice(0, 120)
 *   contextId = result.resultId
 *   ControlPlaneConsumerPipelineContract.execute({rankingRequest: {query, contextId, ...}})
 *   → ControlPlaneConsumerPackage
 *   → MCPInvocationConsumerPipelineResult
 *
 * Determinism: all sub-contracts share the same injected now().
 * Warnings: FAILURE → tool unavailable; TIMEOUT → timed out; REJECTED → policy gate.
 */
export class MCPInvocationConsumerPipelineContract {
  private readonly now: () => string;
  private readonly invocationContract: MCPInvocationContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: MCPInvocationConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.invocationContract = createMCPInvocationContract({
      ...dependencies.invocationContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: MCPInvocationConsumerPipelineRequest,
  ): MCPInvocationConsumerPipelineResult {
    const createdAt = this.now();

    // Step 1: invoke MCP tool → MCPInvocationResult
    const invocationResult: MCPInvocationResult = this.invocationContract.invoke(
      request.invocationRequest,
      request.invocationStatus,
      request.responsePayload,
    );

    // Step 2: derive query from toolName + status, contextId = resultId
    const query = `${invocationResult.toolName}:${invocationResult.invocationStatus}`.slice(0, 120);
    const consumerPackage: ControlPlaneConsumerPackage =
      this.consumerPipeline.execute({
        rankingRequest: {
          query,
          contextId: invocationResult.resultId,
          candidateItems: request.candidateItems ?? [],
          scoringWeights: request.scoringWeights,
        },
        segmentTypeConstraints: request.segmentTypeConstraints,
      });

    // Step 3: build warnings based on invocation status
    const warnings = buildInvocationWarnings(request.invocationStatus);

    // Step 4: deterministic hash + resultId
    const pipelineHash = computeDeterministicHash(
      "w2-t13-cp1-mcp-invocation-consumer-pipeline",
      invocationResult.invocationHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w2-t13-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      consumerId: request.consumerId,
      invocationResult,
      consumerPackage,
      pipelineHash,
      warnings,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createMCPInvocationConsumerPipelineContract(
  dependencies?: MCPInvocationConsumerPipelineContractDependencies,
): MCPInvocationConsumerPipelineContract {
  return new MCPInvocationConsumerPipelineContract(dependencies);
}
