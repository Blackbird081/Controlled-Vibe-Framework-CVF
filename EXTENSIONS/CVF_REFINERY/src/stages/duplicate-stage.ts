import type { RefineryStage, StageDeps } from "../pipeline/stage.js";
import { buildLineageEvent } from "../pipeline/stage.js";
import type { PipelineContext } from "../pipeline/pipeline-context.js";
import type { DuplicateGroup } from "../types/duplicate-group.js";
import type { SourceScope } from "../types/source-envelope.js";

function scopeKeyFor(scope: SourceScope): string {
  return JSON.stringify({
    organization: scope.organization,
    country: scope.country ?? null,
    project: scope.project ?? null,
    customer: scope.customer ?? null,
  });
}

/**
 * Fingerprint intentionally includes the scope key so that two records
 * with an identical value but different declared scope never collapse
 * into the same duplicate group (T2 negative-matrix requirement).
 */
function fingerprintFor(scopeKey: string, canonicalFields: Record<string, unknown>): string {
  const sortedKeys = Object.keys(canonicalFields).sort();
  const sortedEntries = sortedKeys.map((key) => [key, canonicalFields[key]]);
  return `${scopeKey}::${JSON.stringify(sortedEntries)}`;
}

export const duplicateStage: RefineryStage = {
  id: "duplicate",
  lineageStage: "DUPLICATE",
  run(context: PipelineContext, deps: StageDeps): PipelineContext {
    const bySource = new Map(context.sourceEnvelopes.map((item) => [item.source_id, item]));
    const buckets = new Map<string, { scopeKey: string; memberIds: string[] }>();

    for (const record of context.normalizedRecords) {
      const envelope = bySource.get(record.source_id);
      const scope = envelope?.scope ?? context.declaredScope;
      const scopeKey = scopeKeyFor(scope);
      const fingerprint = fingerprintFor(scopeKey, record.canonical_fields);
      const bucket = buckets.get(fingerprint) ?? { scopeKey, memberIds: [] };
      bucket.memberIds.push(record.record_id);
      buckets.set(fingerprint, bucket);
    }

    const duplicateGroups: DuplicateGroup[] = [];
    for (const [fingerprint, bucket] of buckets) {
      if (bucket.memberIds.length < 2) continue;
      duplicateGroups.push({
        duplicate_group_id: deps.ids.nextId("DG"),
        scope_key: bucket.scopeKey,
        members: [...bucket.memberIds],
        match_type: "EXACT",
        fingerprint,
        confidence: 1,
        reason_codes: ["EXACT_CANONICAL_FIELD_MATCH_WITHIN_SCOPE"],
        disposition: "REVIEW_REQUIRED",
      });
    }

    const event = buildLineageEvent(deps, {
      stage: "DUPLICATE",
      operation: "duplicate_groups_evaluated",
      inputReferences: context.normalizedRecords.map((item) => item.record_id),
      outputReferences: duplicateGroups.map((item) => item.duplicate_group_id),
      details: { group_count: duplicateGroups.length },
    });

    return {
      ...context,
      duplicateGroups,
      lineage: [...context.lineage, event],
    };
  },
};
