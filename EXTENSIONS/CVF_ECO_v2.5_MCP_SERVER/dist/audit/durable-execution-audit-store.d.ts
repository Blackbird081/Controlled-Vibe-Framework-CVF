/** Delta-T9 durable execution audit contract and local JSONL store boundary. */
import { type ReceiptToExecutionEvidenceAudit } from './receipt-to-execution-evidence-auditor.js';
export declare const DURABLE_EXECUTION_AUDIT_CONTRACT: "cvf.delta.durableExecutionAudit.v1";
export declare const BINDING_HASH_PATTERN: RegExp;
export type DurableAuditRetentionClass = 'LOCAL_GOVERNANCE_EVIDENCE';
export type DurableAuditDisposalAdvisory = 'RETAIN_UNTIL_MANUAL_REVIEW' | 'EPHEMERAL_TEST_ONLY';
export type DurableAuditPrivacyBoundary = 'NO_RAW_SECRETS_NO_ENV_NO_PROVIDER_KEYS_NO_FULL_COMMAND_OUTPUT';
export interface DurableExecutionAuditRecord {
    contractVersion: typeof DURABLE_EXECUTION_AUDIT_CONTRACT;
    receiptId: string;
    requestId: string;
    consumptionId: string;
    profileId: string;
    bindingHash: string;
    evidenceChainValid: boolean;
    actionExecutionProved: boolean;
    approvalBackedMutationProved: boolean;
    findings: string[];
    retentionClass: DurableAuditRetentionClass;
    disposalAdvisory: DurableAuditDisposalAdvisory;
    privacyBoundary: DurableAuditPrivacyBoundary;
    mandatoryInvocationProved: false;
    directInterceptionProved: false;
    auditedAt: string;
}
export interface DurableExecutionAuditInput {
    audit: ReceiptToExecutionEvidenceAudit;
    receiptId: string;
    requestId: string;
    consumptionId: string;
    profileId: string;
    bindingHash: string;
    disposalAdvisory?: DurableAuditDisposalAdvisory;
    auditedAt?: string;
}
export declare function buildDurableAuditRecord(input: DurableExecutionAuditInput): DurableExecutionAuditRecord;
export declare class JsonDurableExecutionAuditStore {
    private readonly filePath;
    constructor(filePath: string);
    appendRecord(record: DurableExecutionAuditRecord): Promise<void>;
    readRecords(): Promise<DurableExecutionAuditRecord[]>;
}
//# sourceMappingURL=durable-execution-audit-store.d.ts.map