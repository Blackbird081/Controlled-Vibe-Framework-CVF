import { createHash } from "node:crypto";
import type { RefineryStage, StageDeps } from "../pipeline/stage.js";
import { buildLineageEvent } from "../pipeline/stage.js";
import type { PipelineContext } from "../pipeline/pipeline-context.js";
import type { IntegrityResult } from "../types/integrity-result.js";

function canonicalRecordsForSource(
  context: PipelineContext,
  sourceId: string,
): Array<Record<string, unknown>> {
  return context.rawRecords.filter((record) => record.source_id === sourceId);
}

/** Deterministic content hash: SHA-256 over stably key-sorted JSON. No randomness or wall-clock input. */
export function computeContentHash(records: Array<Record<string, unknown>>): string {
  const sorted = records.map((record) => {
    const keys = Object.keys(record).sort();
    return keys.map((key) => [key, record[key]]);
  });
  return `sha256:${createHash("sha256").update(JSON.stringify(sorted)).digest("hex")}`;
}

export const integrityStage: RefineryStage = {
  id: "integrity",
  lineageStage: "INTEGRITY",
  run(context: PipelineContext, deps: StageDeps): PipelineContext {
    const results: IntegrityResult[] = context.sourceEnvelopes.map((envelope) => {
      const records = canonicalRecordsForSource(context, envelope.source_id);
      const actualHash = computeContentHash(records);
      const pass = actualHash === envelope.content_hash;
      return {
        source_id: envelope.source_id,
        status: pass ? "PASS" : "FAIL",
        expected_hash: envelope.content_hash,
        actual_hash: actualHash,
        failure_token: pass ? null : "INTEGRITY_CHECK_FAILED",
      };
    });

    const event = buildLineageEvent(deps, {
      stage: "INTEGRITY",
      operation: "integrity_checked",
      inputReferences: context.sourceEnvelopes.map((item) => item.source_id),
      outputReferences: results.map((item) => item.source_id),
      details: {
        pass_count: results.filter((item) => item.status === "PASS").length,
        fail_count: results.filter((item) => item.status === "FAIL").length,
      },
    });

    return {
      ...context,
      integrityResults: results,
      lineage: [...context.lineage, event],
    };
  },
};
