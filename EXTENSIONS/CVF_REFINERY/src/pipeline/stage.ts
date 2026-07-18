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

export function buildLineageEvent(
  deps: StageDeps,
  fields: {
    stage: LineageEvent["stage"];
    operation: string;
    inputReferences: string[];
    outputReferences: string[];
    ruleId?: string | null;
    ruleVersion?: string | null;
    details?: Record<string, unknown>;
  },
): LineageEvent {
  return {
    lineage_event_id: deps.ids.nextId("LE"),
    stage: fields.stage,
    operation: fields.operation,
    input_references: [...fields.inputReferences],
    output_references: [...fields.outputReferences],
    rule_id: fields.ruleId ?? null,
    rule_version: fields.ruleVersion ?? null,
    performed_at_utc: deps.clock.nowUtcIso(),
    performed_by: "cvf-refinery",
    details: fields.details ? structuredClone(fields.details) : {},
  };
}
