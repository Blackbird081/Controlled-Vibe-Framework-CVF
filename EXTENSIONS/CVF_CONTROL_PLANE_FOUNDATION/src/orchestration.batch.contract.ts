import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { DesignPlan, DesignTaskRisk } from "./design.contract";
import type { OrchestrationResult } from "./orchestration.contract";
import { OrchestrationContract } from "./orchestration.contract";

// --- Types ---

export type DominantRiskLevel = DesignTaskRisk | "NONE";

export interface OrchestrationBatchResult {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalPlans: number;
  totalAssignments: number;
  r0Count: number;
  r1Count: number;
  r2Count: number;
  r3Count: number;
  dominantRiskLevel: DominantRiskLevel;
  results: OrchestrationResult[];
}

export interface OrchestrationBatchContractDependencies {
  now?: () => string;
}

// --- Dominant Risk Level Resolution ---

/*
 * Resolves the dominant DesignTaskRisk by highest assignment count across all plans.
 * Tie-breaking precedence: R3 > R2 > R1 > R0
 * Returns "NONE" when batch is empty (no assignments across all plans).
 *
 * Precedence reflects operational risk severity:
 *   R3 — highest risk; requires full governance review + audit trail
 *   R2 — elevated risk; requires peer review
 *   R1 — moderate risk; standard review applies
 *   R0 — no significant risk; lowest governance weight
 */
const RISK_PRIORITY: DesignTaskRisk[] = ["R3", "R2", "R1", "R0"];

function resolveDominantRiskLevel(
  r0Count: number,
  r1Count: number,
  r2Count: number,
  r3Count: number,
): DominantRiskLevel {
  const total = r0Count + r1Count + r2Count + r3Count;
  if (total === 0) return "NONE";

  const counts: Record<DesignTaskRisk, number> = {
    R0: r0Count,
    R1: r1Count,
    R2: r2Count,
    R3: r3Count,
  };

  let dominant: DesignTaskRisk = "R0";
  let maxCount = -1;
  for (const risk of RISK_PRIORITY) {
    if (counts[risk] > maxCount) {
      maxCount = counts[risk];
      dominant = risk;
    }
  }

  return dominant;
}

// --- Contract ---

export class OrchestrationBatchContract {
  private readonly now: () => string;

  constructor(dependencies: OrchestrationBatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    plans: DesignPlan[],
    contract: OrchestrationContract,
  ): OrchestrationBatchResult {
    const createdAt = this.now();
    const results: OrchestrationResult[] = [];

    for (const plan of plans) {
      results.push(contract.orchestrate(plan));
    }

    const totalAssignments = results.reduce((sum, r) => sum + r.totalAssignments, 0);
    const r0Count = results.reduce((sum, r) => sum + r.riskBreakdown.R0, 0);
    const r1Count = results.reduce((sum, r) => sum + r.riskBreakdown.R1, 0);
    const r2Count = results.reduce((sum, r) => sum + r.riskBreakdown.R2, 0);
    const r3Count = results.reduce((sum, r) => sum + r.riskBreakdown.R3, 0);

    const dominantRiskLevel = resolveDominantRiskLevel(r0Count, r1Count, r2Count, r3Count);

    const batchHash = computeDeterministicHash(
      "w26-t1-cp1-orchestration-batch",
      ...results.map((r) => r.orchestrationHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w26-t1-cp1-orchestration-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalPlans: results.length,
      totalAssignments,
      r0Count,
      r1Count,
      r2Count,
      r3Count,
      dominantRiskLevel,
      results,
    };
  }
}

export function createOrchestrationBatchContract(
  dependencies?: OrchestrationBatchContractDependencies,
): OrchestrationBatchContract {
  return new OrchestrationBatchContract(dependencies);
}
