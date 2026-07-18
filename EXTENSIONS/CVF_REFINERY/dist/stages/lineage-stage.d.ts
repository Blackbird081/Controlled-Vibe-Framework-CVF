import type { RefineryStage } from "../pipeline/stage.js";
import type { PipelineContext } from "../pipeline/pipeline-context.js";
/**
 * Proves that every output produced so far (normalized records, duplicate
 * groups, conflict sets) has at least one lineage event referencing it.
 * Required for READY_FOR_KERNEL eligibility (T2 invariant: incomplete
 * lineage/integrity blocks Kernel-ready status).
 */
export declare function lineageIsComplete(context: PipelineContext): boolean;
export declare const lineageStage: RefineryStage;
