export declare const INT1_CONTRACT: "cvf.genericMcpAdapter.int1.v1";
export declare const INT1_ALLOWED_EVENT_TYPES: Set<string>;
export interface Int1PlanInput {
    planSteps: string[];
    toolsRequired: string[];
    agentRole: string;
    planContext?: string;
    connectionPointMode?: ConnectionPointMode | string;
}
export interface Int1AgentEventInput {
    eventType: string;
    agentId: string;
    payload: Record<string, unknown>;
}
export type AdvisoryDecision = 'ALLOW_ADVISORY' | 'REVIEW_RECOMMENDED' | 'REJECT_ADVISORY';
export type ConnectionPointMode = 'advisory' | 'enforce';
export type ConnectionPointProgressionDisposition = 'ADVISORY_ONLY' | 'ALLOW_PROGRESSION' | 'REVIEW_HOLD' | 'REJECT_BLOCK';
export interface ConnectionPointProgressionDecision {
    mode: ConnectionPointMode;
    advisoryDecision: AdvisoryDecision;
    progressionDisposition: ConnectionPointProgressionDisposition;
    acceptedForProgression: boolean;
    requiresReview: boolean;
    blocked: boolean;
    reason: string;
    modeWarning?: string;
}
export declare function validateInt1Plan(args: Int1PlanInput): {
    contractVersion: "cvf.genericMcpAdapter.int1.v1";
    tool: string;
    connectionPointMode: ConnectionPointMode;
    connectionPointProgression: ConnectionPointProgressionDecision;
    advisoryDecision: AdvisoryDecision;
    planRisk: string;
    forbiddenStepsDetected: string[];
    stepCount: number;
    toolCount: number;
    runtimeExecutionAuthorized: boolean;
    evaluatedAt: string;
};
export declare function emitInt1AgentEvent(args: Int1AgentEventInput): {
    contractVersion: "cvf.genericMcpAdapter.int1.v1";
    tool: string;
    accepted: boolean;
    eventType: string;
    rejectionReason: string;
    emittedAt: string;
    eventId?: undefined;
    agentId?: undefined;
    runtimeExecutionAuthorized?: undefined;
} | {
    contractVersion: "cvf.genericMcpAdapter.int1.v1";
    tool: string;
    accepted: boolean;
    eventType: string;
    eventId: string;
    agentId: string;
    runtimeExecutionAuthorized: boolean;
    emittedAt: string;
    rejectionReason?: undefined;
};
//# sourceMappingURL=int1-connection-point-policy.d.ts.map