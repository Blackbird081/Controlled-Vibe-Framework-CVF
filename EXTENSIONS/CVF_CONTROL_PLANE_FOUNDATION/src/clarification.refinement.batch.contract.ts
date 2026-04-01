import {
  ClarificationRefinementContract,
  type ClarificationAnswer,
  type RefinedIntakeRequest,
  type ClarificationRefinementContractDependencies,
} from "./clarification.refinement.contract";
import type { ReversePromptPacket } from "./reverse.prompting.contract";
import { createDeterministicBatchIdentity } from "./batch.contract.shared";

// --- Types ---

export interface ClarificationRefinementRequest {
  packet: ReversePromptPacket;
  answers: ClarificationAnswer[];
}

export interface ClarificationRefinementBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalRefinements: number;
  dominantConfidenceBoost: number;
  results: RefinedIntakeRequest[];
}

export interface ClarificationRefinementBatchContractDependencies {
  contractDependencies?: ClarificationRefinementContractDependencies;
  now?: () => string;
}

// --- Contract ---

export class ClarificationRefinementBatchContract {
  private readonly contract: ClarificationRefinementContract;
  private readonly now: () => string;

  constructor(
    dependencies: ClarificationRefinementBatchContractDependencies = {},
  ) {
    this.contract = new ClarificationRefinementContract(
      dependencies.contractDependencies ?? {},
    );
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(requests: ClarificationRefinementRequest[]): ClarificationRefinementBatch {
    const createdAt = this.now();
    const results: RefinedIntakeRequest[] = requests.map((req) =>
      this.contract.refine(req.packet, req.answers),
    );

    const totalRefinements = results.length;
    const dominantConfidenceBoost =
      totalRefinements === 0
        ? 0
        : Math.max(...results.map((r) => r.confidenceBoost));

    const { batchHash, batchId } = createDeterministicBatchIdentity({
      batchSeed: "w34-t1-cp1-clarification-refinement-batch",
      batchIdSeed: "w34-t1-cp1-clarification-refinement-batch-id",
      hashParts: [
        `${createdAt}:total:${totalRefinements}`,
        `dominantConfidenceBoost:${dominantConfidenceBoost}`,
      ],
      batchIdParts: [createdAt],
    });

    return {
      batchId,
      batchHash,
      createdAt,
      totalRefinements,
      dominantConfidenceBoost,
      results,
    };
  }
}

export function createClarificationRefinementBatchContract(
  dependencies?: ClarificationRefinementBatchContractDependencies,
): ClarificationRefinementBatchContract {
  return new ClarificationRefinementBatchContract(dependencies);
}
