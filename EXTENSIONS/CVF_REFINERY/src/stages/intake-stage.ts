import type { RefineryStage, StageDeps } from "../pipeline/stage.js";
import { buildLineageEvent } from "../pipeline/stage.js";
import type { PipelineContext } from "../pipeline/pipeline-context.js";

const REQUIRED_ENVELOPE_FIELDS = [
  "source_id",
  "source_type",
  "owner",
  "captured_at_utc",
  "scope",
  "purpose",
  "confidentiality",
  "content_hash",
  "raw_reference",
] as const;

export function missingSourceIdentityFields(context: PipelineContext): string[] {
  const missing: string[] = [];
  if (context.sourceEnvelopes.length === 0) {
    missing.push("source_envelopes");
    return missing;
  }
  for (const envelope of context.sourceEnvelopes) {
    for (const field of REQUIRED_ENVELOPE_FIELDS) {
      const value = (envelope as unknown as Record<string, unknown>)[field];
      if (value === undefined || value === null || value === "") {
        missing.push(`${envelope.source_id || "UNKNOWN_SOURCE"}.${field}`);
      }
    }
  }
  return missing;
}

export const intakeStage: RefineryStage = {
  id: "intake",
  lineageStage: "INTAKE",
  run(context: PipelineContext, deps: StageDeps): PipelineContext {
    const event = buildLineageEvent(deps, {
      stage: "INTAKE",
      operation: "source_envelopes_registered",
      inputReferences: context.sourceEnvelopes.map((item) => item.raw_reference.location),
      outputReferences: context.sourceEnvelopes.map((item) => item.source_id),
      details: { count: context.sourceEnvelopes.length },
    });
    return {
      ...context,
      lineage: [...context.lineage, event],
    };
  },
};
