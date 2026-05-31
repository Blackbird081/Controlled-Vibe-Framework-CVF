export interface WorkflowComposition {
    outcomeKey: string;
    packIds: string[];
    policyRefs: string[];
    inputContract: string;
    outputContract: string;
    deterministicFixturePath: string;
}

export interface WorkflowCompositionSummary {
    outcomeKey: string;
    packIds: string[];
    compositionVersion: string;
}
