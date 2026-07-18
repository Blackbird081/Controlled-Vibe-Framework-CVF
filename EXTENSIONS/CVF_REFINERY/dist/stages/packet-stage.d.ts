import type { RefineryStage } from "../pipeline/stage.js";
/**
 * Records the terminal PACKET lineage event only. The RefineryPacket
 * object itself is assembled by buildRefineryPacket in packet-builder.ts,
 * which runs after all stages (including this one) have completed, so
 * that the final packet's own construction is also traceable in lineage.
 */
export declare const packetStage: RefineryStage;
