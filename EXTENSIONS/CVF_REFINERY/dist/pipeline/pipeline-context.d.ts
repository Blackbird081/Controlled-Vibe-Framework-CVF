import type { SourceEnvelope, SourceScope } from "../types/source-envelope.js";
import type { NormalizedRecord } from "../types/normalized-record.js";
import type { DuplicateGroup } from "../types/duplicate-group.js";
import type { ConflictSet } from "../types/conflict-set.js";
import type { QualityFinding } from "../types/quality-finding.js";
import type { IntegrityResult } from "../types/integrity-result.js";
import type { LineageEvent } from "../types/lineage-event.js";
import type { RuleManifestRef } from "../types/refinery-packet.js";
export interface PipelineContext {
    readonly sourceEnvelopes: SourceEnvelope[];
    readonly rawRecords: Array<Record<string, unknown>>;
    readonly normalizedRecords: NormalizedRecord[];
    readonly duplicateGroups: DuplicateGroup[];
    readonly conflictSets: ConflictSet[];
    readonly qualityFindings: QualityFinding[];
    readonly integrityResults: IntegrityResult[];
    readonly schemaValid: boolean;
    readonly lineage: LineageEvent[];
    readonly declaredScope: SourceScope;
    readonly declaredOwner: string;
    readonly ruleManifest: RuleManifestRef;
}
export declare function cloneContext(context: PipelineContext): PipelineContext;
