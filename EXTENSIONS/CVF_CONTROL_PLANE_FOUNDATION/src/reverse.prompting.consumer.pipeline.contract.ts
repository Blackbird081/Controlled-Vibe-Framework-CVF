import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  ReversePromptingContract,
  createReversePromptingContract,
} from "./reverse.prompting.contract";
import type {
  ReversePromptPacket,
  ReversePromptingContractDependencies,
} from "./reverse.prompting.contract";
import type { ControlPlaneIntakeResult } from "./intake.contract";
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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReversePromptingConsumerPipelineRequest {
  intakeResult: ControlPlaneIntakeResult;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface ReversePromptingConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  consumerId?: string;
  reversePromptPacket: ReversePromptPacket;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
}

export interface ReversePromptingConsumerPipelineContractDependencies {
  now?: () => string;
  reversePromptingContractDeps?: ReversePromptingContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Query Derivation ─────────────────────────────────────────────────────────

function deriveReversePromptingQuery(packet: ReversePromptPacket): string {
  const raw = `reverse-prompting: ${packet.totalQuestions} question(s), ${packet.highPriorityCount} high-priority — domain: ${packet.signalAnalysis.domainDetected}`;
  return raw.slice(0, 120);
}

// ─── Warning Builder ──────────────────────────────────────────────────────────

function buildReversePromptingWarnings(packet: ReversePromptPacket): string[] {
  if (packet.highPriorityCount > 0) {
    return [
      "[reverse-prompting] high-priority clarification questions require response",
    ];
  }
  return [];
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * ReversePromptingConsumerPipelineContract (W1-T17)
 * -------------------------------------------------
 * CPF-internal consumer bridge.
 *
 * Internal chain (single execute call):
 *   ReversePromptingContract.generate(intakeResult)   → ReversePromptPacket
 *   ControlPlaneConsumerPipelineContract.execute(...)  → ControlPlaneConsumerPackage
 *   → ReversePromptingConsumerPipelineResult
 *
 * Determinism: all sub-contracts share the same injected now().
 * Warnings: highPriorityCount > 0 → high-priority clarification questions require response.
 */
export class ReversePromptingConsumerPipelineContract {
  private readonly now: () => string;
  private readonly reversePromptingContract: ReversePromptingContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: ReversePromptingConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.reversePromptingContract = createReversePromptingContract({
      ...dependencies.reversePromptingContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: ReversePromptingConsumerPipelineRequest,
  ): ReversePromptingConsumerPipelineResult {
    const createdAt = this.now();

    // Step 1: generate reverse prompting packet from intake result
    const reversePromptPacket: ReversePromptPacket =
      this.reversePromptingContract.generate(request.intakeResult);

    // Step 2: derive query and build consumer package
    const query = deriveReversePromptingQuery(reversePromptPacket);
    const consumerPackage: ControlPlaneConsumerPackage =
      this.consumerPipeline.execute({
        rankingRequest: {
          query,
          contextId: reversePromptPacket.packetId,
          candidateItems: request.candidateItems ?? [],
          scoringWeights: request.scoringWeights,
        },
        segmentTypeConstraints: request.segmentTypeConstraints,
      });

    // Step 3: build warnings based on high-priority count
    const warnings = buildReversePromptingWarnings(reversePromptPacket);

    // Step 4: deterministic hash + resultId
    const pipelineHash = computeDeterministicHash(
      "w1-t17-cp1-reverse-prompting-consumer-pipeline",
      reversePromptPacket.packetId,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w1-t17-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      consumerId: request.consumerId,
      reversePromptPacket,
      consumerPackage,
      pipelineHash,
      warnings,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createReversePromptingConsumerPipelineContract(
  dependencies?: ReversePromptingConsumerPipelineContractDependencies,
): ReversePromptingConsumerPipelineContract {
  return new ReversePromptingConsumerPipelineContract(dependencies);
}
