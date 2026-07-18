/** Delta-T4A approval evidence for fixed mutating command profiles. */

import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';

export const MUTATING_PROFILE_APPROVAL_CONTRACT =
  'cvf.delta.mutatingProfileApprovalPolicy.v1' as const;
export const APPROVAL_MARKER_PROFILE_ID = 'approval-marker-write' as const;
export const APPROVAL_MARKER_TARGET_RELATIVE_PATH =
  '.cvf/delta/approval-marker-write.json' as const;
export const MUTATING_APPROVAL_RECORDS_FILE = 'mutating-profile-approvals.json' as const;
export const APPROVAL_MARKER_CONTRACT = 'cvf.delta.approvalMarkerWrite.v1' as const;

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

interface ApprovalStoreFile {
  records: MutatingProfileApprovalRecord[];
  lastUpdated: string;
}

export function hashMutatingProfileAction(action: string): string {
  return createHash('sha256').update(action).digest('hex');
}

export function buildMutatingProfileApprovalRecord(input: {
  approvalId: string;
  action: string;
  approvedAt: string;
  expiresAt: string;
  approvedBy: string;
  reason?: string;
  bindingHash?: string;
}): MutatingProfileApprovalRecord {
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

export class JsonMutatingProfileApprovalPolicy implements MutatingProfileApprovalPolicy {
  private readonly filePath: string;

  constructor(dataDir: string) {
    this.filePath = join(dataDir, MUTATING_APPROVAL_RECORDS_FILE);
  }

  async evaluate(request: MutatingProfileApprovalRequest): Promise<MutatingProfileApprovalVerdict> {
    const targetVerdict = validateApprovalMarkerTarget(request.targetRelativePath);
    if (!targetVerdict.valid) {
      return rejected('APPROVAL_TARGET_MISMATCH');
    }
    if (request.profileId !== APPROVAL_MARKER_PROFILE_ID) {
      return rejected('APPROVAL_PROFILE_MISMATCH');
    }

    let store: ApprovalStoreFile;
    try {
      store = await this.loadStore();
    } catch {
      return rejected('APPROVAL_STORE_UNREADABLE');
    }

    const actionHash = hashMutatingProfileAction(request.action);
    const record = store.records.find(
      (candidate) =>
        candidate.contractVersion === MUTATING_PROFILE_APPROVAL_CONTRACT &&
        candidate.profileId === APPROVAL_MARKER_PROFILE_ID &&
        candidate.targetRelativePath === APPROVAL_MARKER_TARGET_RELATIVE_PATH &&
        candidate.actionHash === actionHash &&
        (!candidate.bindingHash || candidate.bindingHash === request.bindingHash)
    );
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

  private async loadStore(): Promise<ApprovalStoreFile> {
    if (!existsSync(this.filePath)) {
      return { records: [], lastUpdated: new Date(0).toISOString() };
    }
    const parsed = JSON.parse(await readFile(this.filePath, 'utf-8')) as ApprovalStoreFile;
    return {
      records: Array.isArray(parsed.records) ? parsed.records : [],
      lastUpdated:
        typeof parsed.lastUpdated === 'string' ? parsed.lastUpdated : new Date(0).toISOString(),
    };
  }
}

export function validateApprovalMarkerTarget(targetRelativePath: string): {
  valid: boolean;
  normalizedTarget: typeof APPROVAL_MARKER_TARGET_RELATIVE_PATH | null;
} {
  const normalized = targetRelativePath.trim().replace(/\\/g, '/');
  if (
    normalized !== APPROVAL_MARKER_TARGET_RELATIVE_PATH ||
    isAbsolute(normalized) ||
    normalized.includes('../')
  ) {
    return { valid: false, normalizedTarget: null };
  }
  return { valid: true, normalizedTarget: APPROVAL_MARKER_TARGET_RELATIVE_PATH };
}

export async function writeApprovalMarkerFile(input: {
  workspaceRoot: string;
  targetRelativePath: typeof APPROVAL_MARKER_TARGET_RELATIVE_PATH;
  approvalId: string;
  profileId: typeof APPROVAL_MARKER_PROFILE_ID;
  bindingHash: string;
  consumptionId: string;
  completedAt: string;
}): Promise<void> {
  const targetPath = resolve(input.workspaceRoot, input.targetRelativePath);
  const relativeTarget = String(relative(input.workspaceRoot, targetPath).replace(/\\/g, '/'));
  if (
    relativeTarget === '..' ||
    relativeTarget.startsWith('../') ||
    isAbsolute(relativeTarget) ||
    relativeTarget !== input.targetRelativePath
  ) {
    throw new Error('APPROVAL_MARKER_TARGET_OUTSIDE_WORKSPACE');
  }

  await mkdir(dirname(targetPath), { recursive: true });
  await writeFile(
    targetPath,
    JSON.stringify(
      {
        contractVersion: APPROVAL_MARKER_CONTRACT,
        profileId: input.profileId,
        approvalId: input.approvalId,
        bindingHash: input.bindingHash,
        consumptionId: input.consumptionId,
        targetRelativePath: input.targetRelativePath,
        completedAt: input.completedAt,
      },
      null,
      2
    ),
    { encoding: 'utf-8', flag: 'wx' }
  );
}

function rejected(
  diagnosticCode: string,
  actionHash: string | null = null
): MutatingProfileApprovalVerdict {
  return {
    approved: false,
    approvalId: null,
    targetRelativePath: null,
    actionHash,
    diagnosticCode,
  };
}
