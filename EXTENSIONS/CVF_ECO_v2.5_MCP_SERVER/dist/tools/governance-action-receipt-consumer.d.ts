/**
 * Delta-T2 governance-action receipt consumer.
 *
 * Validates one fresh Delta-T1 ALLOW receipt against an exact action binding,
 * then atomically claims a secret-safe one-time marker. It never executes the
 * action and does not prove external interception or mandatory invocation.
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ReceiptConsumptionStore } from '../persistence/json-receipt-consumption.store.js';
import { type PreflightActionClass } from './governance-action-preflight.js';
export declare const RECEIPT_CONSUMER_TOOL: "cvf_consume_governance_action_receipt";
export declare const RECEIPT_CONSUMER_CONTRACT: "cvf.delta.governanceActionReceiptConsumption.v1";
export declare const DEFAULT_RECEIPT_TTL_MS = 300000;
export declare const MIN_RECEIPT_TTL_SECONDS = 30;
export declare const MAX_RECEIPT_TTL_SECONDS = 3600;
export interface ReceiptConsumptionInput {
    receiptId: string;
    actionClass: PreflightActionClass;
    action: string;
    targetFiles?: string[];
}
export interface ReceiptConsumptionOptions {
    maxReceiptAgeMs?: number;
    futureSkewMs?: number;
    now?: () => number;
    generateConsumptionId?: () => string;
}
export interface ReceiptConsumptionResponse {
    contractVersion: typeof RECEIPT_CONSUMER_CONTRACT;
    tool: typeof RECEIPT_CONSUMER_TOOL;
    accepted: boolean;
    receiptId: string | null;
    actionClass: PreflightActionClass | null;
    receiptValid: boolean;
    receiptConsumed: boolean;
    executionAdmissionEligible: boolean;
    consumptionId: string | null;
    bindingHash: string | null;
    actionExecutionProved: false;
    externalInterceptionProved: false;
    rawSecretPrinted: false;
    reason?: string;
    error?: {
        code: string;
        message: string;
        retryable: boolean;
    };
}
export declare function resolveReceiptTtlMs(rawSeconds: string | undefined): number;
export declare function consumeGovernanceActionReceipt(input: ReceiptConsumptionInput, store: ReceiptConsumptionStore, options?: ReceiptConsumptionOptions): Promise<ReceiptConsumptionResponse>;
export declare function registerGovernanceActionReceiptConsumerTool(server: McpServer, store: ReceiptConsumptionStore, options?: ReceiptConsumptionOptions): void;
//# sourceMappingURL=governance-action-receipt-consumer.d.ts.map