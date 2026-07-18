/** Delta-T4A approval evidence for fixed mutating command profiles. */
export declare const MUTATING_PROFILE_APPROVAL_CONTRACT: "cvf.delta.mutatingProfileApprovalPolicy.v1";
export declare const APPROVAL_MARKER_PROFILE_ID: "approval-marker-write";
export declare const APPROVAL_MARKER_TARGET_RELATIVE_PATH: ".cvf/delta/approval-marker-write.json";
export declare const MUTATING_APPROVAL_RECORDS_FILE: "mutating-profile-approvals.json";
export declare const APPROVAL_MARKER_CONTRACT: "cvf.delta.approvalMarkerWrite.v1";
export interface MutatingProfileApprovalRecord {
    contractVersion: typeof MUTATING_PROFILE_APPROVAL_CONTRACT;
    approvalId: string;
    profileId: typeof APPROVAL_MARKER_PROFILE_ID;
    targetRelativePath: typeof APPROVAL_MARKER_TARGET_RELATIVE_PATH;
    actionHash: string;
    approvedAt: string;
    expiresAt: string;
    approvedBy: string;
    reason?: string;
    bindingHash?: string;
}
export interface MutatingProfileApprovalRequest {
    profileId: string;
    targetRelativePath: string;
    action: string;
    bindingHash: string;
    nowMs: number;
}
export interface MutatingProfileApprovalVerdict {
    approved: boolean;
    approvalId: string | null;
    targetRelativePath: string | null;
    actionHash: string | null;
    diagnosticCode: string | null;
}
export interface MutatingProfileApprovalPolicy {
    evaluate(request: MutatingProfileApprovalRequest): Promise<MutatingProfileApprovalVerdict>;
}
export declare function hashMutatingProfileAction(action: string): string;
export declare function buildMutatingProfileApprovalRecord(input: {
    approvalId: string;
    action: string;
    approvedAt: string;
    expiresAt: string;
    approvedBy: string;
    reason?: string;
    bindingHash?: string;
}): MutatingProfileApprovalRecord;
export declare class JsonMutatingProfileApprovalPolicy implements MutatingProfileApprovalPolicy {
    private readonly filePath;
    constructor(dataDir: string);
    evaluate(request: MutatingProfileApprovalRequest): Promise<MutatingProfileApprovalVerdict>;
    private loadStore;
}
export declare function validateApprovalMarkerTarget(targetRelativePath: string): {
    valid: boolean;
    normalizedTarget: typeof APPROVAL_MARKER_TARGET_RELATIVE_PATH | null;
};
export declare function writeApprovalMarkerFile(input: {
    workspaceRoot: string;
    targetRelativePath: typeof APPROVAL_MARKER_TARGET_RELATIVE_PATH;
    approvalId: string;
    profileId: typeof APPROVAL_MARKER_PROFILE_ID;
    bindingHash: string;
    consumptionId: string;
    completedAt: string;
}): Promise<void>;
//# sourceMappingURL=mutating-profile-approval.d.ts.map