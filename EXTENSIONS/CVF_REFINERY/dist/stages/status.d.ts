import type { PipelineContext } from "../pipeline/pipeline-context.js";
import type { RefineryFailureToken, RefineryStatus } from "../types/refinery-packet.js";
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
export declare function computeStatus(context: PipelineContext, completedStageCount: number): StatusComputation;
