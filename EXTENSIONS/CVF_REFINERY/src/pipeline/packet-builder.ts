import type { PipelineContext } from "./pipeline-context.js";
import type { StageDeps } from "./stage.js";
import type { RefineryPacket } from "../types/refinery-packet.js";
import { computeStatus } from "../stages/status.js";

export function buildRefineryPacket(
  context: PipelineContext,
  deps: StageDeps,
  completedStageCount: number,
): RefineryPacket {
  const { status, failureTokens } = computeStatus(context, completedStageCount);

  return {
    refinery_packet_id: deps.ids.nextId("RP"),
    source_envelopes: context.sourceEnvelopes.map((item) => structuredClone(item)),
    normalized_records: context.normalizedRecords.map((item) => structuredClone(item)),
    duplicate_groups: context.duplicateGroups.map((item) => structuredClone(item)),
    conflict_sets: context.conflictSets.map((item) => structuredClone(item)),
    quality_findings: context.qualityFindings.map((item) => structuredClone(item)),
    integrity_results: context.integrityResults.map((item) => structuredClone(item)),
    transformation_lineage: context.lineage.map((item) => structuredClone(item)),
    declared_scope: structuredClone(context.declaredScope),
    declared_owner: context.declaredOwner,
    rule_manifest: structuredClone(context.ruleManifest),
    status,
    failure_tokens: failureTokens,
    created_at_utc: deps.clock.nowUtcIso(),
  };
}
