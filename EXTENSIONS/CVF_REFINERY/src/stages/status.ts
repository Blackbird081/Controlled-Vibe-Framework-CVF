import type { PipelineContext } from "../pipeline/pipeline-context.js";
import type { RefineryFailureToken, RefineryStatus } from "../types/refinery-packet.js";
import { lineageIsComplete } from "./lineage-stage.js";

export interface StatusComputation {
  status: RefineryStatus;
  failureTokens: RefineryFailureToken[];
}

/**
 * Exact status/failure-token computation per
 * docs/reference/sot_three_layer/CVF_SOT_THREE_LAYER_CONTRACT_CHAIN.md
 * RefineryPacket section and the companion invariants file, Invariant 3.
 * completedStageCount === 0 is checked first and always yields BLOCKED +
 * REFINERY_NO_STAGES_EXECUTED regardless of any other field state.
 */
export function computeStatus(
  context: PipelineContext,
  completedStageCount: number,
): StatusComputation {
  if (completedStageCount === 0) {
    return { status: "BLOCKED", failureTokens: ["REFINERY_NO_STAGES_EXECUTED"] };
  }

  const tokens = new Set<RefineryFailureToken>();

  if (!context.schemaValid) tokens.add("SCHEMA_VALIDATION_FAILED");

  const blockingFindings = context.qualityFindings.filter(
    (finding) => finding.severity === "BLOCK",
  );
  const reviewFindings = context.qualityFindings.filter(
    (finding) => finding.severity === "REVIEW",
  );
  if (blockingFindings.length > 0) tokens.add("QUALITY_CHECK_FAILED");

  const integrityFailures = context.integrityResults.filter((item) => item.status === "FAIL");
  if (integrityFailures.length > 0) tokens.add("INTEGRITY_CHECK_FAILED");

  const lineageComplete = lineageIsComplete(context);

  if (tokens.size > 0) {
    return { status: "BLOCKED", failureTokens: [...tokens] };
  }

  const hasUnresolvedGovernance =
    reviewFindings.length > 0 ||
    context.conflictSets.some((item) => item.resolution_status === "UNRESOLVED") ||
    context.duplicateGroups.some((item) => item.disposition === "REVIEW_REQUIRED");

  if (hasUnresolvedGovernance || !lineageComplete) {
    return { status: "REVIEW_REQUIRED", failureTokens: ["QUALITY_CHECK_FAILED"] };
  }

  return { status: "READY_FOR_KERNEL", failureTokens: [] };
}
