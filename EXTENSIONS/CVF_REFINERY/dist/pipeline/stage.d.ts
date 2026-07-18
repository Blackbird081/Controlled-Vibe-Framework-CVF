import type { Clock, IdFactory } from "../deps.js";
import type { LineageEvent } from "../types/lineage-event.js";
import type { PipelineContext } from "./pipeline-context.js";
export interface StageDeps {
    clock: Clock;
    ids: IdFactory;
}
export interface RefineryStage {
    readonly id: string;
    readonly lineageStage: LineageEvent["stage"];
    run(context: PipelineContext, deps: StageDeps): PipelineContext;
}
export declare function buildLineageEvent(deps: StageDeps, fields: {
    stage: LineageEvent["stage"];
    operation: string;
    inputReferences: string[];
    outputReferences: string[];
    ruleId?: string | null;
    ruleVersion?: string | null;
    details?: Record<string, unknown>;
}): LineageEvent;
