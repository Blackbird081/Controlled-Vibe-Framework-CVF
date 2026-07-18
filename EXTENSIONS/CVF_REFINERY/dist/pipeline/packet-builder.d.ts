import type { PipelineContext } from "./pipeline-context.js";
import type { StageDeps } from "./stage.js";
import type { RefineryPacket } from "../types/refinery-packet.js";
export declare function buildRefineryPacket(context: PipelineContext, deps: StageDeps, completedStageCount: number): RefineryPacket;
