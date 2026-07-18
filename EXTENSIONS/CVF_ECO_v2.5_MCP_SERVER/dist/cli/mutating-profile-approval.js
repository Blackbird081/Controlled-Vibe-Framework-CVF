/** Delta-T4A approval evidence for fixed mutating command profiles. */
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
export const MUTATING_PROFILE_APPROVAL_CONTRACT = 'cvf.delta.mutatingProfileApprovalPolicy.v1';
export const APPROVAL_MARKER_PROFILE_ID = 'approval-marker-write';
export const APPROVAL_MARKER_TARGET_RELATIVE_PATH = '.cvf/delta/approval-marker-write.json';
export const MUTATING_APPROVAL_RECORDS_FILE = 'mutating-profile-approvals.json';
export const APPROVAL_MARKER_CONTRACT = 'cvf.delta.approvalMarkerWrite.v1';
export function hashMutatingProfileAction(action) {
    return createHash('sha256').update(action).digest('hex');
}
export function buildMutatingProfileApprovalRecord(input) {
    return {
        contractVersion: MUTATING_PROFILE_APPROVAL_CONTRACT,
        approvalId: input.approvalId,
        profileId: APPROVAL_MARKER_PROFILE_ID,
        targetRelativePath: APPROVAL_MARKER_TARGET_RELATIVE_PATH,
        actionHash: hashMutatingProfileAction(input.action),
        approvedAt: input.approvedAt,
        expiresAt: input.expiresAt,
        approvedBy: input.approvedBy,
        reason: input.reason,
        bindingHash: input.bindingHash,
    };
}
export class JsonMutatingProfileApprovalPolicy {
    filePath;
    constructor(dataDir) {
        this.filePath = join(dataDir, MUTATING_APPROVAL_RECORDS_FILE);
    }
    async evaluate(request) {
        const targetVerdict = validateApprovalMarkerTarget(request.targetRelativePath);
        if (!targetVerdict.valid) {
            return rejected('APPROVAL_TARGET_MISMATCH');
        }
        if (request.profileId !== APPROVAL_MARKER_PROFILE_ID) {
            return rejected('APPROVAL_PROFILE_MISMATCH');
        }
        let store;
        try {
            store = await this.loadStore();
        }
        catch {
            return rejected('APPROVAL_STORE_UNREADABLE');
        }
        const actionHash = hashMutatingProfileAction(request.action);
        const record = store.records.find((candidate) => candidate.contractVersion === MUTATING_PROFILE_APPROVAL_CONTRACT &&
            candidate.profileId === APPROVAL_MARKER_PROFILE_ID &&
            candidate.targetRelativePath === APPROVAL_MARKER_TARGET_RELATIVE_PATH &&
            candidate.actionHash === actionHash &&
            (!candidate.bindingHash || candidate.bindingHash === request.bindingHash));
        if (!record) {
            return rejected('APPROVAL_RECORD_NOT_FOUND', actionHash);
        }
        const approvedAtMs = Date.parse(record.approvedAt);
        const expiresAtMs = Date.parse(record.expiresAt);
        if (!Number.isFinite(approvedAtMs) || !Number.isFinite(expiresAtMs)) {
            return rejected('APPROVAL_TIMESTAMP_INVALID', actionHash);
        }
        if (approvedAtMs - request.nowMs > 30_000) {
            return rejected('APPROVAL_FROM_FUTURE', actionHash);
        }
        if (request.nowMs > expiresAtMs) {
            return rejected('APPROVAL_EXPIRED', actionHash);
        }
        return {
            approved: true,
            approvalId: record.approvalId,
            targetRelativePath: record.targetRelativePath,
            actionHash,
            diagnosticCode: null,
        };
    }
    async loadStore() {
        if (!existsSync(this.filePath)) {
            return { records: [], lastUpdated: new Date(0).toISOString() };
        }
        const parsed = JSON.parse(await readFile(this.filePath, 'utf-8'));
        return {
            records: Array.isArray(parsed.records) ? parsed.records : [],
            lastUpdated: typeof parsed.lastUpdated === 'string' ? parsed.lastUpdated : new Date(0).toISOString(),
        };
    }
}
export function validateApprovalMarkerTarget(targetRelativePath) {
    const normalized = targetRelativePath.trim().replace(/\\/g, '/');
    if (normalized !== APPROVAL_MARKER_TARGET_RELATIVE_PATH ||
        isAbsolute(normalized) ||
        normalized.includes('../')) {
        return { valid: false, normalizedTarget: null };
    }
    return { valid: true, normalizedTarget: APPROVAL_MARKER_TARGET_RELATIVE_PATH };
}
export async function writeApprovalMarkerFile(input) {
    const targetPath = resolve(input.workspaceRoot, input.targetRelativePath);
    const relativeTarget = String(relative(input.workspaceRoot, targetPath).replace(/\\/g, '/'));
    if (relativeTarget === '..' ||
        relativeTarget.startsWith('../') ||
        isAbsolute(relativeTarget) ||
        relativeTarget !== input.targetRelativePath) {
        throw new Error('APPROVAL_MARKER_TARGET_OUTSIDE_WORKSPACE');
    }
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, JSON.stringify({
        contractVersion: APPROVAL_MARKER_CONTRACT,
        profileId: input.profileId,
        approvalId: input.approvalId,
        bindingHash: input.bindingHash,
        consumptionId: input.consumptionId,
        targetRelativePath: input.targetRelativePath,
        completedAt: input.completedAt,
    }, null, 2), { encoding: 'utf-8', flag: 'wx' });
}
function rejected(diagnosticCode, actionHash = null) {
    return {
        approved: false,
        approvalId: null,
        targetRelativePath: null,
        actionHash,
        diagnosticCode,
    };
}
//# sourceMappingURL=mutating-profile-approval.js.map