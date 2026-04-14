import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  KnowledgeRankingContract,
  createKnowledgeRankingContract,
} from "./knowledge.ranking.contract";
import type {
  KnowledgeRankingRequest,
  RankedKnowledgeResult,
  KnowledgeRankingContractDependencies,
} from "./knowledge.ranking.contract";
import {
  KnowledgeContextAssemblyContract,
  createKnowledgeContextAssemblyContract,
} from "./knowledge.context.assembly.contract";
import type {
  KnowledgeContextPacket,
  KnowledgeContextAssemblyContractDependencies,
} from "./knowledge.context.assembly.contract";
import {
  ControlPlaneConsumerPipelineContract,
  createControlPlaneConsumerPipelineContract,
} from "./consumer.pipeline.contract";
import type {
  ControlPlaneConsumerPackage,
  ControlPlaneConsumerPipelineContractDependencies,
} from "./consumer.pipeline.contract";
import type { SegmentTypeConstraints } from "./context.packager.contract";
import type { StructuralNeighbor } from "./knowledge.structural.index.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * W76-T1 — KnowledgeContextAssemblyConsumerPipelineContract
 * CPF consumer pipeline bridge: Ranking → ContextAssembly → ConsumerPackage.
 * Authorization: CVF_GC018_W76_T1_KNOWLEDGE_CONTEXT_ASSEMBLY_CONSUMER_PIPELINE_AUTHORIZATION_2026-04-14.md
 *
 * Internal chain (single execute call):
 *   KnowledgeRankingContract.rank(rankingRequest)          → RankedKnowledgeResult
 *   KnowledgeContextAssemblyContract.assemble(...)         → KnowledgeContextPacket
 *   ControlPlaneConsumerPipelineContract.execute(...)      → ControlPlaneConsumerPackage
 *   → KnowledgeContextAssemblyConsumerPipelineResult
 */
export interface KnowledgeContextAssemblyConsumerPipelineRequest {
  rankingRequest: KnowledgeRankingRequest;
  structuralEnrichment?: Record<string, StructuralNeighbor[]>;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface KnowledgeContextAssemblyConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  consumerId?: string;
  rankedResult: RankedKnowledgeResult;
  contextPacket: KnowledgeContextPacket;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
}

export interface KnowledgeContextAssemblyConsumerPipelineContractDependencies {
  now?: () => string;
  rankingContractDeps?: KnowledgeRankingContractDependencies;
  assemblyContractDeps?: KnowledgeContextAssemblyContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Warning Builder ──────────────────────────────────────────────────────────

function buildWarnings(contextPacket: KnowledgeContextPacket): string[] {
  if (contextPacket.totalEntries === 0) {
    return ["[knowledge-assembly] no items assembled — pipeline produced empty context"];
  }
  return [];
}

// ─── Contract ─────────────────────────────────────────────────────────────────

export class KnowledgeContextAssemblyConsumerPipelineContract {
  private readonly now: () => string;
  private readonly rankingContract: KnowledgeRankingContract;
  private readonly assemblyContract: KnowledgeContextAssemblyContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: KnowledgeContextAssemblyConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.rankingContract = createKnowledgeRankingContract({
      ...dependencies.rankingContractDeps,
      now: this.now,
    });
    this.assemblyContract = createKnowledgeContextAssemblyContract({
      ...dependencies.assemblyContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: KnowledgeContextAssemblyConsumerPipelineRequest,
  ): KnowledgeContextAssemblyConsumerPipelineResult {
    const createdAt = this.now();

    // Step 1: rank candidate items
    const rankedResult: RankedKnowledgeResult =
      this.rankingContract.rank(request.rankingRequest);

    // Step 2: assemble knowledge context with optional structural enrichment
    const contextPacket: KnowledgeContextPacket =
      this.assemblyContract.assemble({
        rankedItems: rankedResult.items,
        structuralEnrichment: request.structuralEnrichment,
      });

    // Step 3: wrap in CPF consumer package
    const query = `${request.rankingRequest.query}:assembled:${contextPacket.totalEntries}`.slice(0, 120);
    const consumerPackage: ControlPlaneConsumerPackage =
      this.consumerPipeline.execute({
        rankingRequest: {
          query,
          contextId: contextPacket.packetId,
          candidateItems: rankedResult.items,
          scoringWeights: request.rankingRequest.scoringWeights,
        },
        segmentTypeConstraints: request.segmentTypeConstraints,
      });

    // Step 4: build warnings
    const warnings = buildWarnings(contextPacket);

    // Step 5: deterministic hash + resultId
    const pipelineHash = computeDeterministicHash(
      "w76-t1-knowledge-context-assembly-consumer-pipeline",
      rankedResult.rankingHash,
      contextPacket.packetHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w76-t1-knowledge-context-assembly-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      consumerId: request.consumerId,
      rankedResult,
      contextPacket,
      consumerPackage,
      pipelineHash,
      warnings,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createKnowledgeContextAssemblyConsumerPipelineContract(
  dependencies?: KnowledgeContextAssemblyConsumerPipelineContractDependencies,
): KnowledgeContextAssemblyConsumerPipelineContract {
  return new KnowledgeContextAssemblyConsumerPipelineContract(dependencies);
}
