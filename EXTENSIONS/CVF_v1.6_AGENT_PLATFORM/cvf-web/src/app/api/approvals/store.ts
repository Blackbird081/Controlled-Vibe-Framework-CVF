// C4.0: Unified ApprovalRequestRecord for web API layer.
// Single canonical model for all web-layer approval operations.
// The guard contract's ApprovalRequest (enterprise-org) remains unchanged (contract layer).
// Resets on server restart — sufficient for the current no-database scope.

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface ApprovalRequestContext {
    templateName?: string;
    intent?: string;
    cvfPhase?: string;
    cvfRiskLevel?: string;
    provider?: string;
    model?: string;
    policySnapshotId?: string;
    envelopeId?: string;
}

export interface ApprovalRequestRecord {
    id: string;
    templateId: string;
    templateName: string;
    intent: string;
    toolId?: string;
    toolPayload?: Record<string, unknown>;
    riskLevel?: string;
    phase?: string;
    reason: string;
    blockReason?: string;
    requestContext?: ApprovalRequestContext;
    expiresAt: string;
    status: ApprovalStatus;
    submittedAt: string;
    reviewedAt?: string;
    reviewedBy?: string;
    reviewComment?: string;
}

const approvalStore = new Map<string, ApprovalRequestRecord>();

export function getApprovalStore(): Map<string, ApprovalRequestRecord> {
    return approvalStore;
}
