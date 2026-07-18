/** Delta-T3 durable governed-execution receipt store. */
export declare const GOVERNED_EXECUTION_DIR = "governed-executions";
export declare const GOVERNED_EXECUTION_RECEIPT_CONTRACT: "cvf.delta.governedExecutionReceipt.v1";
export declare const CONSUMPTION_ID_PATTERN: RegExp;
export type GovernedExecutionStatus = 'ADMITTED' | 'COMPLETED' | 'FAILED';
export interface GovernedExecutionReceipt {
    contractVersion: typeof GOVERNED_EXECUTION_RECEIPT_CONTRACT;
    consumptionId: string;
    receiptId: string;
    profileId: string;
    bindingHash: string;
    status: GovernedExecutionStatus;
    admittedAt: string;
    startedAt: string | null;
    completedAt: string | null;
    exitCode: number | null;
    signal: string | null;
    diagnosticCode: string | null;
    executionStarted: boolean;
    executionCompleted: boolean;
    externalInterceptionProved: false;
}
export interface GovernedExecutionFinalization {
    status: 'COMPLETED' | 'FAILED';
    startedAt: string | null;
    completedAt: string;
    exitCode: number | null;
    signal: string | null;
    diagnosticCode: string | null;
    executionStarted: boolean;
    executionCompleted: boolean;
}
export interface GovernedExecutionStore {
    beginExecution(receipt: GovernedExecutionReceipt): Promise<boolean>;
    finalizeExecution(consumptionId: string, finalization: GovernedExecutionFinalization): Promise<GovernedExecutionReceipt>;
}
export declare class JsonGovernedExecutionStore implements GovernedExecutionStore {
    private readonly receiptDir;
    constructor(dataDir: string);
    receiptPath(consumptionId: string): string;
    beginExecution(receipt: GovernedExecutionReceipt): Promise<boolean>;
    finalizeExecution(consumptionId: string, finalization: GovernedExecutionFinalization): Promise<GovernedExecutionReceipt>;
    readExecution(consumptionId: string): Promise<GovernedExecutionReceipt>;
}
//# sourceMappingURL=json-governed-execution.store.d.ts.map