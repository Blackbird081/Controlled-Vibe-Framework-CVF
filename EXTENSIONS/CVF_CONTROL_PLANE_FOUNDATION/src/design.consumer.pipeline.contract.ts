import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  DesignContract,
  createDesignContract,
} from "./design.contract";
import type {
  DesignContractDependencies,
  DesignPlan,
  DesignTaskPhase,
  DesignTaskRisk,
} from "./design.contract";
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

// ─── Warning constants ────────────────────────────────────────────────────────

const WARNING_NO_TASKS =
  "[design] no tasks — design plan contains zero tasks";
const WARNING_HIGH_RISK_TASKS =
  "[design] high risk tasks — plan contains R3 (critical) risk tasks requiring full governance review";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DesignConsumerPipelineRequest {
  intakeResult: ControlPlaneIntakeResult;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface DesignConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  designPlan: DesignPlan;
  dominantPhase: DesignTaskPhase;
  dominantRisk: DesignTaskRisk;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
  consumerId: string | undefined;
}

export interface DesignConsumerPipelineContractDependencies {
  now?: () => string;
}

// ─── Dominant Phase Logic ─────────────────────────────────────────────────────

// Frequency-based: most common phase wins; ties broken by REVIEW > BUILD > DESIGN
const PHASE_ORDER: DesignTaskPhase[] = ["REVIEW", "BUILD", "DESIGN"];

function computeDominantPhase(designPlan: DesignPlan): DesignTaskPhase {
  if (designPlan.tasks.length === 0) return "DESIGN";

  const phaseCounts: Record<string, number> = {};

  for (const task of designPlan.tasks) {
    phaseCounts[task.targetPhase] = (phaseCounts[task.targetPhase] ?? 0) + 1;
  }

  let maxCount = 0;
  let dominantPhase: DesignTaskPhase = "DESIGN";

  for (const phase of PHASE_ORDER) {
    const count = phaseCounts[phase] ?? 0;
    if (count > maxCount) {
      maxCount = count;
      dominantPhase = phase;
    }
  }

  return dominantPhase;
}

// ─── Dominant Risk Logic ──────────────────────────────────────────────────────

// Frequency-based: most common risk wins; ties broken by R3 > R2 > R1 > R0
const RISK_ORDER: DesignTaskRisk[] = ["R3", "R2", "R1", "R0"];

function computeDominantRisk(designPlan: DesignPlan): DesignTaskRisk {
  if (designPlan.tasks.length === 0) return "R0";

  let maxCount = 0;
  let dominantRisk: DesignTaskRisk = "R0";

  for (const risk of RISK_ORDER) {
    const count = designPlan.riskSummary[risk];
    if (count > maxCount) {
      maxCount = count;
      dominantRisk = risk;
    }
  }

  return dominantRisk;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * DesignConsumerPipelineContract (W2-T26 CP1 — Full Lane)
 * --------------------------------------------------------
 * Bridges DesignContract into CPF consumer pipeline.
 *
 * Query format: "DesignPlan: {totalTasks} tasks, phase={dominantPhase}, risk={dominantRisk}"
 * contextId: designPlan.planId
 *
 * Warnings:
 *   - totalTasks === 0 → WARNING_NO_TASKS
 *   - riskSummary.R3 > 0 → WARNING_HIGH_RISK_TASKS
 */
export class DesignConsumerPipelineContract {
  private readonly now: () => string;
  private readonly designContract: DesignContract;
  private readonly consumerPipelineContract: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: DesignConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());

    const designDeps: DesignContractDependencies = {
      now: this.now,
    };
    this.designContract = createDesignContract(designDeps);

    const consumerDeps: ControlPlaneConsumerPipelineContractDependencies = {
      now: this.now,
    };
    this.consumerPipelineContract = createControlPlaneConsumerPipelineContract(consumerDeps);
  }

  execute(
    request: DesignConsumerPipelineRequest,
  ): DesignConsumerPipelineResult {
    const createdAt = this.now();

    // Create design plan
    const designPlan = this.designContract.design(request.intakeResult);

    const dominantPhase = computeDominantPhase(designPlan);
    const dominantRisk = computeDominantRisk(designPlan);

    // Derive query
    const query = `DesignPlan: ${designPlan.totalTasks} tasks, phase=${dominantPhase}, risk=${dominantRisk}`.slice(0, 120);

    // Build consumer package
    const consumerPackage = this.consumerPipelineContract.execute({
      rankingRequest: {
        query,
        contextId: designPlan.planId,
        candidateItems: request.candidateItems ?? [],
        scoringWeights: request.scoringWeights,
      },
      segmentTypeConstraints: request.segmentTypeConstraints,
    });

    // Compute warnings
    const warnings: string[] = [];
    if (designPlan.totalTasks === 0) {
      warnings.push(WARNING_NO_TASKS);
    }
    if (designPlan.riskSummary.R3 > 0) {
      warnings.push(WARNING_HIGH_RISK_TASKS);
    }

    // Compute pipeline hash
    const pipelineHash = computeDeterministicHash(
      "w2-t26-cp1-design-consumer-pipeline",
      designPlan.planHash,
      consumerPackage.pipelineHash,
      `warnings=${warnings.length}`,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w2-t26-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      designPlan,
      dominantPhase,
      dominantRisk,
      consumerPackage,
      pipelineHash,
      warnings,
      consumerId: request.consumerId,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createDesignConsumerPipelineContract(
  dependencies?: DesignConsumerPipelineContractDependencies,
): DesignConsumerPipelineContract {
  return new DesignConsumerPipelineContract(dependencies);
}
