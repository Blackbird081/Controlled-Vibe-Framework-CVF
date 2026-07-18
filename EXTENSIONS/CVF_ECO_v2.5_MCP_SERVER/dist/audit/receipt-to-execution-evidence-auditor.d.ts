/** Delta-T7 pure receipt-to-execution evidence consistency auditor. */
import type { GuardAuditEntry } from '../guards/types.js';
import type { ReceiptConsumptionMarker } from '../persistence/json-receipt-consumption.store.js';
import { type GovernedExecutionReceipt } from '../persistence/json-governed-execution.store.js';
export declare const RECEIPT_TO_EXECUTION_AUDIT_CONTRACT: "cvf.delta.receiptToExecutionEvidenceAudit.v1";
export type ReceiptToExecutionFindingCode = 'AUDIT_ID_MISMATCH' | 'PREFLIGHT_CONTRACT_MISMATCH' | 'PREFLIGHT_NOT_ALLOW' | 'ACTION_CLASS_MISMATCH' | 'RECEIPT_ID_MISMATCH' | 'CONSUMPTION_ID_MISMATCH' | 'BINDING_HASH_MISMATCH' | 'EXECUTION_CONTRACT_MISMATCH' | 'PROFILE_UNKNOWN' | 'PROFILE_MISMATCH' | 'EXECUTION_NOT_FINALIZED' | 'EXECUTION_STATE_INVALID' | 'CHRONOLOGY_INVALID' | 'PREFLIGHT_TARGET_MISMATCH' | 'OBSERVED_CHANGED_SET_MISMATCH' | 'APPROVAL_MARKER_REQUIRED' | 'APPROVAL_MARKER_UNEXPECTED' | 'APPROVAL_MARKER_MISMATCH' | 'EXTERNAL_INTERCEPTION_CLAIM_INVALID';
export interface ApprovalMarkerEvidence {
    contractVersion: string;
    profileId: string;
    approvalId: string;
    bindingHash: string;
    consumptionId: string;
    targetRelativePath: string;
    completedAt: string;
}
export interface ReceiptToExecutionEvidenceInput {
    preflightAudit: GuardAuditEntry;
    consumption: ReceiptConsumptionMarker;
    execution: GovernedExecutionReceipt;
    expectedProfileId: string;
    observedChangedSet: string[];
    approvalMarker?: ApprovalMarkerEvidence | null;
}
export interface ReceiptToExecutionEvidenceAudit {
    contractVersion: typeof RECEIPT_TO_EXECUTION_AUDIT_CONTRACT;
    passed: boolean;
    evidenceChainValid: boolean;
    actionExecutionProved: boolean;
    approvalBackedMutationProved: boolean;
    expectedChangedSet: string[];
    observedChangedSet: string[];
    findings: ReceiptToExecutionFindingCode[];
    mandatoryInvocationProved: false;
    externalInterceptionProved: false;
}
export declare function auditReceiptToExecutionEvidence(input: ReceiptToExecutionEvidenceInput): ReceiptToExecutionEvidenceAudit;
//# sourceMappingURL=receipt-to-execution-evidence-auditor.d.ts.map