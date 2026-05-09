import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import { ContextFreezer } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/context.freezer";
import {
  ControlPlaneIntakeContract,
  type ControlPlaneIntakeResult,
  type ControlPlaneIntakeShell,
  type ControlPlaneIntakeRetrievalOptions,
} from "./intake.contract";

// ─── Types ────────────────────────────────────────────────────────────

export interface ConsumerRequest {
  vibe: string;
  consumerId: string;
  retrievalQuery?: string;
  tokenBudget?: number;
  retrieval?: ControlPlaneIntakeRetrievalOptions;
  executionId?: string;
}

export interface ConsumptionReceipt {
  consumerId: string;
  consumedAt: string;
  requestId: string;
  evidenceHash: string;
  pipelineStages: string[];
  intake: ControlPlaneIntakeResult;
  freeze?: {
    executionId: string;
    frozenContextHash: string;
  };
}

export interface ConsumerContractDependencies {
  shell?: ControlPlaneIntakeShell;
  context?: ContextFreezer;
  now?: () => string;
}

// ─── Consumer Contract ───────────────────────────────────────────────

export class ConsumerContract {
  private readonly shell: ControlPlaneIntakeShell | undefined;
  private readonly context: ContextFreezer;
  private readonly now: () => string;

  constructor(dependencies: ConsumerContractDependencies = {}) {
    this.shell = dependencies.shell;
    this.context = dependencies.context ?? new ContextFreezer();
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  getContext(): ContextFreezer {
    return this.context;
  }

  consume(request: ConsumerRequest): ConsumptionReceipt {
    const consumedAt = this.now();

    const intakeContract = new ControlPlaneIntakeContract({
      shell: this.shell,
      now: this.now,
    });

    const intake = intakeContract.execute({
      vibe: request.vibe,
      retrievalQuery: request.retrievalQuery,
      tokenBudget: request.tokenBudget,
      consumerId: request.consumerId,
      retrieval: request.retrieval,
    });

    const pipelineStages = buildPipelineStages(intake);

    const evidenceHash = computeDeterministicHash(
      "w1-t2-cp4-consumer",
      `${request.consumerId}:${consumedAt}`,
      `stages:${pipelineStages.length}:chunks:${intake.retrieval.chunkCount}`,
      intake.packagedContext.snapshotHash,
    );

    let freeze: ConsumptionReceipt["freeze"];
    if (
      typeof request.executionId === "string" &&
      request.executionId.length > 0
    ) {
      const fileHashes: Record<string, string> = {};
      for (const chunk of intake.packagedContext.chunks) {
        fileHashes[chunk.id] = computeDeterministicHash(
          "consumer-chunk",
          chunk.id,
          chunk.content,
          chunk.source,
        );
      }

      const frozenContextHash = this.context.freeze(
        request.executionId,
        fileHashes,
        evidenceHash,
      );

      freeze = {
        executionId: request.executionId,
        frozenContextHash,
      };
    }

    return {
      consumerId: request.consumerId,
      consumedAt,
      requestId: intake.requestId,
      evidenceHash,
      pipelineStages,
      intake,
      freeze,
    };
  }
}

// ─── Factory ─────────────────────────────────────────────────────────

export function createConsumerContract(
  dependencies?: ConsumerContractDependencies,
): ConsumerContract {
  return new ConsumerContract(dependencies);
}

// ─── Helpers ─────────────────────────────────────────────────────────

export function buildPipelineStages(
  intake: ControlPlaneIntakeResult,
): string[] {
  const stages: string[] = [];

  stages.push("intent-validation");

  if (intake.retrieval.chunkCount > 0) {
    stages.push("knowledge-retrieval");
  }

  stages.push("context-packaging");

  if (intake.packagedContext.snapshotHash.length === 32) {
    stages.push("deterministic-hashing");
  }

  return stages;
}
