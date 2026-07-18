import type { RefineryStage, StageDeps } from "../pipeline/stage.js";
import { buildLineageEvent } from "../pipeline/stage.js";
import type { PipelineContext } from "../pipeline/pipeline-context.js";
import type { QualityFinding } from "../types/quality-finding.js";
import { missingSourceIdentityFields } from "./intake-stage.js";

export const qualityStage: RefineryStage = {
  id: "quality",
  lineageStage: "QUALITY",
  run(context: PipelineContext, deps: StageDeps): PipelineContext {
    const findings: QualityFinding[] = [];
    const now = deps.clock.nowUtcIso();

    const missingFields = missingSourceIdentityFields(context);
    if (missingFields.length > 0) {
      findings.push({
        finding_id: deps.ids.nextId("QF"),
        rule_id: "source-identity-required",
        severity: "BLOCK",
        message: "One or more source envelopes are missing required identity fields.",
        affected_records: [],
        affected_fields: missingFields,
        failure_token: "QUALITY_CHECK_FAILED",
        details: {},
        created_at_utc: now,
      });
    }

    if (!context.schemaValid) {
      findings.push({
        finding_id: deps.ids.nextId("QF"),
        rule_id: "schema-must-validate",
        severity: "BLOCK",
        message: "Schema validation failed for the declared packet inputs.",
        affected_records: context.normalizedRecords.map((item) => item.record_id),
        affected_fields: [],
        failure_token: "SCHEMA_VALIDATION_FAILED",
        details: {},
        created_at_utc: now,
      });
    }

    for (const record of context.normalizedRecords) {
      if (record.warnings.length === 0) continue;
      findings.push({
        finding_id: deps.ids.nextId("QF"),
        rule_id: "normalization-warning",
        severity: "REVIEW",
        message: `Record ${record.record_id} carries normalization warnings.`,
        affected_records: [record.record_id],
        affected_fields: [],
        failure_token: null,
        details: { warnings: record.warnings },
        created_at_utc: now,
      });
    }

    for (const conflict of context.conflictSets) {
      if (conflict.resolution_status !== "UNRESOLVED") continue;
      findings.push({
        finding_id: deps.ids.nextId("QF"),
        rule_id: "unresolved-conflict-set",
        severity: "REVIEW",
        message: `Conflict set ${conflict.conflict_set_id} on field ${conflict.field} is unresolved.`,
        affected_records: conflict.candidates.map((item) => item.record_id),
        affected_fields: [conflict.field],
        failure_token: null,
        details: {},
        created_at_utc: now,
      });
    }

    for (const group of context.duplicateGroups) {
      if (group.disposition !== "REVIEW_REQUIRED") continue;
      findings.push({
        finding_id: deps.ids.nextId("QF"),
        rule_id: "unresolved-duplicate-group",
        severity: "REVIEW",
        message: `Duplicate group ${group.duplicate_group_id} requires review.`,
        affected_records: group.members,
        affected_fields: [],
        failure_token: null,
        details: {},
        created_at_utc: now,
      });
    }

    const event = buildLineageEvent(deps, {
      stage: "QUALITY",
      operation: "quality_findings_evaluated",
      inputReferences: context.normalizedRecords.map((item) => item.record_id),
      outputReferences: findings.map((item) => item.finding_id),
      details: { finding_count: findings.length },
    });

    return {
      ...context,
      qualityFindings: [...context.qualityFindings, ...findings],
      lineage: [...context.lineage, event],
    };
  },
};
