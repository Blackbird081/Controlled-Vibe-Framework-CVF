/** Delta-T10 durable audit integrity readout. Pure deterministic classification of supplied records. */
import { type DurableExecutionAuditRecord } from './durable-execution-audit-store.js';
export declare const DURABLE_AUDIT_INTEGRITY_READOUT_CONTRACT: "cvf.delta.durableAuditIntegrityReadout.v1";
export type DurableAuditIntegrityFindingCode = 'INVALID_CONTRACT_VERSION' | 'MALFORMED_RECEIPT_ID' | 'MALFORMED_CONSUMPTION_ID' | 'INVALID_BINDING_HASH' | 'FORBIDDEN_MANDATORY_INVOCATION_CLAIM' | 'FORBIDDEN_DIRECT_INTERCEPTION_CLAIM' | 'INVALID_PROOF_CONSISTENCY' | 'SECRET_LIKE_FIELD_DETECTED' | 'JSONL_PARSE_ERROR';
export type DurableAuditIntegrityFindingSeverity = 'ERROR' | 'WARN';
export interface DurableAuditIntegrityFinding {
    code: DurableAuditIntegrityFindingCode;
    severity: DurableAuditIntegrityFindingSeverity;
    receiptId: string | null;
    lineNumber: number | null;
    message: string;
}
export interface DurableAuditIntegrityReadout {
    contractVersion: typeof DURABLE_AUDIT_INTEGRITY_READOUT_CONTRACT;
    total: number;
    valid: number;
    invalid: number;
    parseErrorCount: number;
    findings: DurableAuditIntegrityFinding[];
    mandatoryInvocationProved: false;
    directInterceptionProved: false;
    allValid: boolean;
    readoutAt: string;
}
export interface DurableAuditJsonlParseResult {
    records: DurableExecutionAuditRecord[];
    parseFindings: DurableAuditIntegrityFinding[];
}
export declare function buildDurableAuditIntegrityReadout(records: DurableExecutionAuditRecord[], options?: {
    readoutAt?: string;
}): DurableAuditIntegrityReadout;
export declare function parseDurableAuditJsonlLines(text: string): DurableAuditJsonlParseResult;
export declare function buildDurableAuditIntegrityReadoutFromJsonl(text: string, options?: {
    readoutAt?: string;
}): DurableAuditIntegrityReadout;
//# sourceMappingURL=durable-execution-audit-readout.d.ts.map