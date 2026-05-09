import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type {
  KnowledgeMaintenanceResult,
  KnowledgeMaintenanceSignalType,
} from "./knowledge.maintenance.contract";

// --- Types ---

/**
 * W74-T1 — KnowledgeRefactorContract (Lifecycle Step 6 — Refactor)
 * Produces a refactor proposal from a KnowledgeMaintenanceResult with issues.
 * This is a propose-only contract — no artifact mutations, no store writes.
 * Authorization: CVF_GC018_W74_T1_KNOWLEDGE_REFACTOR_CONTRACT_AUTHORIZATION_2026-04-14.md
 */
export type KnowledgeRefactorAction = "recompile" | "archive" | "review";

export interface KnowledgeRefactorProposal {
  proposalId: string;               // time-variant: hash(proposalHash + proposedAt)
  proposalHash: string;             // content-bound: hash(artifactId + triggerTypes + action)
  proposedAt: string;
  artifactId: string;
  triggerTypes: KnowledgeMaintenanceSignalType[];  // unique signal types from result
  triggeredBySignalCount: number;
  recommendedAction: KnowledgeRefactorAction;
  rationale: string;
}

export interface KnowledgeRefactorRequest {
  result: KnowledgeMaintenanceResult;  // must have hasIssues: true
}

export interface KnowledgeRefactorContractDependencies {
  now?: () => string;
}

// --- Action heuristic ---

function selectAction(
  triggerTypes: KnowledgeMaintenanceSignalType[],
): KnowledgeRefactorAction {
  const typeSet = new Set(triggerTypes);
  const hasContentUpdate = typeSet.has("drift") || typeSet.has("staleness");
  const hasOrphan = typeSet.has("orphan");
  const hasOther = typeSet.has("lint") || typeSet.has("contradiction");

  if (hasOrphan && !hasContentUpdate && !hasOther) return "archive";
  if (hasContentUpdate) return "recompile";
  return "review";
}

function buildRationale(action: KnowledgeRefactorAction): string {
  switch (action) {
    case "recompile":
      return "Source drift or staleness detected — artifact should be recompiled from updated source.";
    case "archive":
      return "All source IDs are inactive — artifact should be archived.";
    case "review":
      return "Contradiction or lint issues detected — artifact requires human review.";
  }
}

// --- Contract ---

export class KnowledgeRefactorContract {
  private readonly now: () => string;

  constructor(dependencies: KnowledgeRefactorContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  recommend(request: KnowledgeRefactorRequest): KnowledgeRefactorProposal {
    const { result } = request;

    if (!result.hasIssues) {
      throw new Error(
        `KnowledgeRefactor: result for artifact ${result.artifactId} has no issues — refactor not warranted`,
      );
    }

    const proposedAt = this.now();

    // Unique trigger types, order-stable
    const typesSeen = new Set<KnowledgeMaintenanceSignalType>();
    for (const s of result.signals) typesSeen.add(s.signalType);
    const triggerTypes: KnowledgeMaintenanceSignalType[] = Array.from(typesSeen);

    const recommendedAction = selectAction(triggerTypes);
    const rationale = buildRationale(recommendedAction);
    const triggerSig = triggerTypes.slice().sort().join(",");

    const proposalHash = computeDeterministicHash(
      "w74-t1-refactor-proposal",
      `artifactId:${result.artifactId}`,
      `triggerTypes:[${triggerSig}]`,
      `action:${recommendedAction}`,
    );

    const proposalId = computeDeterministicHash(
      "w74-t1-refactor-proposal-id",
      proposalHash,
      proposedAt,
    );

    return {
      proposalId,
      proposalHash,
      proposedAt,
      artifactId: result.artifactId,
      triggerTypes,
      triggeredBySignalCount: result.totalSignals,
      recommendedAction,
      rationale,
    };
  }
}

export function createKnowledgeRefactorContract(
  dependencies?: KnowledgeRefactorContractDependencies,
): KnowledgeRefactorContract {
  return new KnowledgeRefactorContract(dependencies);
}
