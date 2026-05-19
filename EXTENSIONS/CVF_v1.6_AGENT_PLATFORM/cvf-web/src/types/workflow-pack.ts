export interface WorkflowPackRef {
    packId: string;
    version: string;
}

export interface FailureRecoveryStep {
    step: number;
    action: string;
    escalate?: boolean;
}

export interface FailureRecoveryPolicy {
    packId: string;
    recoverySteps: FailureRecoveryStep[];
    escalationPath: string;
}

export interface WorkflowPackRegistry {
    packId: string;
    templateId: string;
    version: string;
    specPath: string;
    policyPath: string;
    receiptSchemaPath: string;
    failureRecovery: FailureRecoveryPolicy;
}
