import type { SourceEnvelope, SourceScope } from "./source-envelope.js";
import type { NormalizedRecord } from "./normalized-record.js";
import type { DuplicateGroup } from "./duplicate-group.js";
import type { ConflictSet } from "./conflict-set.js";
import type { QualityFinding } from "./quality-finding.js";
import type { IntegrityResult } from "./integrity-result.js";
import type { LineageEvent } from "./lineage-event.js";

/**
 * Lifecycle-only status. Never carries a reason code - every failure
 * reason belongs in failure_tokens instead, per the T2 contract chain's
 * RefineryPacket section (status-versus-failure-tokens separation).
 */
export type RefineryStatus =
  | "IN_PROGRESS"
  | "READY_FOR_KERNEL"
  | "REVIEW_REQUIRED"
  | "BLOCKED";

export type RefineryFailureToken =
  | "REFINERY_NO_STAGES_EXECUTED"
  | "QUALITY_CHECK_FAILED"
  | "INTEGRITY_CHECK_FAILED"
  | "SCHEMA_VALIDATION_FAILED";

export interface RuleManifestRef {
  manifest_id: string;
  version: string;
}

/**
 * Sole-producer contract owned by CVF Refinery, per
 * docs/reference/sot_three_layer/CVF_SOT_THREE_LAYER_CONTRACT_CHAIN.md
 * section 2. This is a structural-eligibility marker only - it carries no
 * truth, approval, or Kernel-decision field.
 */
export interface RefineryPacket {
  refinery_packet_id: string;
  source_envelopes: SourceEnvelope[];
  normalized_records: NormalizedRecord[];
  duplicate_groups: DuplicateGroup[];
  conflict_sets: ConflictSet[];
  quality_findings: QualityFinding[];
  integrity_results: IntegrityResult[];
  transformation_lineage: LineageEvent[];
  declared_scope: SourceScope;
  declared_owner: string;
  rule_manifest: RuleManifestRef;
  status: RefineryStatus;
  failure_tokens: RefineryFailureToken[];
  created_at_utc: string;
}
