// W92-T1: In-memory approval request store.
// Resets on server restart — sufficient for the current no-database scope.

export interface ApprovalRequest {
    id: string;
    templateId: string;
    templateName: string;
    intent: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: string;
}

const approvalStore = new Map<string, ApprovalRequest>();

export function getApprovalStore(): Map<string, ApprovalRequest> {
    return approvalStore;
}
