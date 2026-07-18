import type { RefineryStage, StageDeps } from "../pipeline/stage.js";
import { buildLineageEvent } from "../pipeline/stage.js";
import type { PipelineContext } from "../pipeline/pipeline-context.js";

/**
 * Records the terminal PACKET lineage event only. The RefineryPacket
 * object itself is assembled by buildRefineryPacket in packet-builder.ts,
 * which runs after all stages (including this one) have completed, so
 * that the final packet's own construction is also traceable in lineage.
 */
export const packetStage: RefineryStage = {
  id: "packet",
  lineageStage: "PACKET",
  run(context: PipelineContext, deps: StageDeps): PipelineContext {
    const event = buildLineageEvent(deps, {
      stage: "PACKET",
      operation: "packet_finalization_prepared",
      inputReferences: context.lineage.map((item) => item.lineage_event_id),
      outputReferences: [],
      details: {},
    });
    return {
      ...context,
      lineage: [...context.lineage, event],
    };
  },
};
