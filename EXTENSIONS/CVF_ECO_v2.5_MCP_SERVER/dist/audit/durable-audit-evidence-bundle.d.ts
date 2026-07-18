/** Delta-T11 durable audit evidence bundle and external reviewer readout. Pure deterministic summarization over supplied artifacts. */
import { type DurableExecutionAuditRecord } from './durable-execution-audit-store.js';
import { DURABLE_AUDIT_INTEGRITY_READOUT_CONTRACT, type DurableAuditIntegrityReadout } from './durable-execution-audit-readout.js';
export declare const DURABLE_AUDIT_EVIDENCE_BUNDLE_CONTRACT: "cvf.delta.durableAuditEvidenceBundle.v1";
export type DurableAuditEvidenceBundleClaimDisposition = 'PROVED' | 'BOUNDED' | 'REJECTED' | 'NOT_CLAIMED';
export interface DurableAuditEvidenceBundleSourceRef {
    label: string;
    kind: 'record_store' | 'readout' | 'other';
    ref?: string;
}
export interface DurableAuditEvidenceBundleClaim {
    claimName: string;
    disposition: DurableAuditEvidenceBundleClaimDisposition;
    evidence: string;
    reviewerNote: string;
}
export interface DurableAuditEvidenceBundle {
    contractVersion: typeof DURABLE_AUDIT_EVIDENCE_BUNDLE_CONTRACT;
    readoutContractVersion: typeof DURABLE_AUDIT_INTEGRITY_READOUT_CONTRACT;
    recordCount: number;
    validRecordCount: number;
    invalidRecordCount: number;
    parseErrorCount: number;
    readoutAllValid: boolean;
    sourceRefs: DurableAuditEvidenceBundleSourceRef[];
    claimMatrix: DurableAuditEvidenceBundleClaim[];
    mandatoryInvocationProved: false;
    directInterceptionProved: false;
    bundledAt: string;
}
export declare function buildDurableAuditEvidenceBundle(_records: DurableExecutionAuditRecord[], readout: DurableAuditIntegrityReadout, options?: {
    sourceRefs?: DurableAuditEvidenceBundleSourceRef[];
    bundledAt?: string;
}): DurableAuditEvidenceBundle;
export declare function renderDurableAuditEvidenceBundleMarkdown(bundle: DurableAuditEvidenceBundle): string;
//# sourceMappingURL=durable-audit-evidence-bundle.d.ts.map