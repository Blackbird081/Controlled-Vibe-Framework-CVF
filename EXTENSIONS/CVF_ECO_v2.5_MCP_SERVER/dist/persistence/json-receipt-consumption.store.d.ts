/**
 * Delta-T2 atomic receipt-consumption marker store.
 *
 * The store reads preflight audits through the existing persistence boundary
 * and claims one marker file per receipt with create-exclusive semantics.
 * Marker payloads contain no raw action descriptions or target paths.
 */
import type { GuardAuditEntry } from '../guards/types.js';
export declare const RECEIPT_CONSUMPTION_DIR = "receipt-consumptions";
export declare const RECEIPT_ID_PATTERN: RegExp;
export interface ReceiptAuditReader {
    getAuditEntries(options?: {
        requestId?: string;
        limit?: number;
        offset?: number;
    }): Promise<GuardAuditEntry[]>;
}
export interface ReceiptConsumptionMarker {
    contractVersion: string;
    preflightContractVersion: string;
    receiptId: string;
    consumptionId: string;
    consumedAt: string;
    actionClass: string;
    bindingHash: string;
    actionExecutionProved: false;
    externalInterceptionProved: false;
}
export interface ReceiptConsumptionStore {
    getPreflightAuditEntries(receiptId: string): Promise<GuardAuditEntry[]>;
    claimReceipt(marker: ReceiptConsumptionMarker): Promise<boolean>;
}
export interface JsonReceiptConsumptionStoreOptions {
    dataDir: string;
    auditReader: ReceiptAuditReader;
}
export declare class JsonReceiptConsumptionStore implements ReceiptConsumptionStore {
    private readonly options;
    private readonly markerDir;
    constructor(options: JsonReceiptConsumptionStoreOptions);
    getPreflightAuditEntries(receiptId: string): Promise<GuardAuditEntry[]>;
    markerPath(receiptId: string): string;
    claimReceipt(marker: ReceiptConsumptionMarker): Promise<boolean>;
}
//# sourceMappingURL=json-receipt-consumption.store.d.ts.map