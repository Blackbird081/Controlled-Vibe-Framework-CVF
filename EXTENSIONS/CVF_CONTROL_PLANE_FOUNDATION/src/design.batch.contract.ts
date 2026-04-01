import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { DesignPlan, DesignTaskRisk } from "./design.contract";
import { DesignContract } from "./design.contract";
import type { ControlPlaneIntakeResult } from "./intake.contract";

// --- Types ---

export type DominantDesignRisk = DesignTaskRisk | "NONE";

export interface DesignBatchResult {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalRequests: number;
  totalPlans: number;
  totalTasks: number;
  r0Count: number;
  r1Count: number;
  r2Count: number;
  r3Count: number;
  dominantRisk: DominantDesignRisk;
  plans: DesignPlan[];
}

export interface DesignBatchContractDependencies {
  now?: () => string;
}

// --- Dominant Design Risk Resolution ---

/*
 * Resolves the dominant DesignTaskRisk by highest task count across all plans.
 * Tie-breaking precedence: R3 > R2 > R1 > R0
 * Returns "NONE" when batch is empty (no tasks across all plans).
 *
 * Precedence reflects operational risk severity:
 *   R3 — highest risk; requires full governance review + audit trail
 *   R2 — elevated risk; requires peer review
 *   R1 — moderate risk; standard review applies
 *   R0 — no significant risk; lowest governance weight
 */
const RISK_PRIORITY: DesignTaskRisk[] = ["R3", "R2", "R1", "R0"];

function resolveDominantDesignRisk(
  r0Count: number,
  r1Count: number,
  r2Count: number,
  r3Count: number,
): DominantDesignRisk {
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

export class DesignBatchContract {
  private readonly now: () => string;

  constructor(dependencies: DesignBatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    intakeResults: ControlPlaneIntakeResult[],
    contract: DesignContract,
  ): DesignBatchResult {
    const createdAt = this.now();
    const plans: DesignPlan[] = [];

    for (const intakeResult of intakeResults) {
      plans.push(contract.design(intakeResult));
    }

    const totalTasks = plans.reduce((sum, p) => sum + p.totalTasks, 0);
    const r0Count = plans.reduce((sum, p) => sum + p.riskSummary.R0, 0);
    const r1Count = plans.reduce((sum, p) => sum + p.riskSummary.R1, 0);
    const r2Count = plans.reduce((sum, p) => sum + p.riskSummary.R2, 0);
    const r3Count = plans.reduce((sum, p) => sum + p.riskSummary.R3, 0);

    const dominantRisk = resolveDominantDesignRisk(r0Count, r1Count, r2Count, r3Count);

    const batchHash = computeDeterministicHash(
      "w27-t1-cp1-design-batch",
      ...plans.map((p) => p.planHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w27-t1-cp1-design-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalRequests: intakeResults.length,
      totalPlans: plans.length,
      totalTasks,
      r0Count,
      r1Count,
      r2Count,
      r3Count,
      dominantRisk,
      plans,
    };
  }
}

export function createDesignBatchContract(
  dependencies?: DesignBatchContractDependencies,
): DesignBatchContract {
  return new DesignBatchContract(dependencies);
}
