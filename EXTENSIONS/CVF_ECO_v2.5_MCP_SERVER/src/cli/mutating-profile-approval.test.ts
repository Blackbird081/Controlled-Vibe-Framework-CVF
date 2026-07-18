import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  APPROVAL_MARKER_PROFILE_ID,
  APPROVAL_MARKER_TARGET_RELATIVE_PATH,
  JsonMutatingProfileApprovalPolicy,
  MUTATING_APPROVAL_RECORDS_FILE,
  buildMutatingProfileApprovalRecord,
  hashMutatingProfileAction,
  validateApprovalMarkerTarget,
  writeApprovalMarkerFile,
} from './mutating-profile-approval.js';

const tempDirs: string[] = [];

async function tempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'cvf-delta-t4a-approval-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('Delta-T4A mutating profile approval policy', () => {
  it('validates only the fixed approval-marker target', () => {
    expect(validateApprovalMarkerTarget(APPROVAL_MARKER_TARGET_RELATIVE_PATH)).toEqual({
      valid: true,
      normalizedTarget: APPROVAL_MARKER_TARGET_RELATIVE_PATH,
    });
    expect(validateApprovalMarkerTarget('../escape.json').valid).toBe(false);
    expect(validateApprovalMarkerTarget('.cvf/delta/other.json').valid).toBe(false);
  });

  it('accepts a profile-bound target-bound unexpired approval record', async () => {
    const dataDir = await tempDir();
    const action = 'profile=approval-marker-write; executable=node; args=["--version"]; cwd=.; target=.cvf/delta/approval-marker-write.json';
    const record = buildMutatingProfileApprovalRecord({
      approvalId: 'approval-1',
      action,
      approvedAt: '2026-06-19T00:00:00.000Z',
      expiresAt: '2026-06-19T00:10:00.000Z',
      approvedBy: 'operator',
    });
    await writeFile(
      join(dataDir, MUTATING_APPROVAL_RECORDS_FILE),
      JSON.stringify({ records: [record], lastUpdated: record.approvedAt }, null, 2),
      'utf-8'
    );

    const verdict = await new JsonMutatingProfileApprovalPolicy(dataDir).evaluate({
      profileId: APPROVAL_MARKER_PROFILE_ID,
      targetRelativePath: APPROVAL_MARKER_TARGET_RELATIVE_PATH,
      action,
      bindingHash: 'binding-1',
      nowMs: Date.parse('2026-06-19T00:05:00.000Z'),
    });

    expect(verdict).toMatchObject({
      approved: true,
      approvalId: 'approval-1',
      actionHash: hashMutatingProfileAction(action),
    });
  });

  it('rejects missing, expired, or wrong-target approval evidence', async () => {
    const dataDir = await tempDir();
    const action = 'profile=approval-marker-write; executable=node; args=["--version"]; cwd=.; target=.cvf/delta/approval-marker-write.json';
    const expired = buildMutatingProfileApprovalRecord({
      approvalId: 'approval-expired',
      action,
      approvedAt: '2026-06-19T00:00:00.000Z',
      expiresAt: '2026-06-19T00:01:00.000Z',
      approvedBy: 'operator',
    });
    await writeFile(
      join(dataDir, MUTATING_APPROVAL_RECORDS_FILE),
      JSON.stringify({ records: [expired], lastUpdated: expired.approvedAt }, null, 2),
      'utf-8'
    );
    const policy = new JsonMutatingProfileApprovalPolicy(dataDir);

    await expect(
      policy.evaluate({
        profileId: APPROVAL_MARKER_PROFILE_ID,
        targetRelativePath: APPROVAL_MARKER_TARGET_RELATIVE_PATH,
        action,
        bindingHash: 'binding-1',
        nowMs: Date.parse('2026-06-19T00:05:00.000Z'),
      })
    ).resolves.toMatchObject({ approved: false, diagnosticCode: 'APPROVAL_EXPIRED' });

    await expect(
      policy.evaluate({
        profileId: APPROVAL_MARKER_PROFILE_ID,
        targetRelativePath: '.cvf/delta/other.json',
        action,
        bindingHash: 'binding-1',
        nowMs: Date.parse('2026-06-19T00:00:30.000Z'),
      })
    ).resolves.toMatchObject({ approved: false, diagnosticCode: 'APPROVAL_TARGET_MISMATCH' });

    await expect(
      policy.evaluate({
        profileId: APPROVAL_MARKER_PROFILE_ID,
        targetRelativePath: APPROVAL_MARKER_TARGET_RELATIVE_PATH,
        action: `${action};changed=true`,
        bindingHash: 'binding-1',
        nowMs: Date.parse('2026-06-19T00:00:30.000Z'),
      })
    ).resolves.toMatchObject({ approved: false, diagnosticCode: 'APPROVAL_RECORD_NOT_FOUND' });
  });

  it('writes the marker by create-exclusive fixed workspace-local path', async () => {
    const workspace = await tempDir();
    await writeApprovalMarkerFile({
      workspaceRoot: workspace,
      targetRelativePath: APPROVAL_MARKER_TARGET_RELATIVE_PATH,
      approvalId: 'approval-1',
      profileId: APPROVAL_MARKER_PROFILE_ID,
      bindingHash: 'binding-1',
      consumptionId: 'consumption-1',
      completedAt: '2026-06-19T00:00:00.000Z',
    });
    const marker = JSON.parse(
      await readFile(join(workspace, APPROVAL_MARKER_TARGET_RELATIVE_PATH), 'utf-8')
    ) as { approvalId: string; bindingHash: string };
    expect(marker).toMatchObject({ approvalId: 'approval-1', bindingHash: 'binding-1' });

    await expect(
      writeApprovalMarkerFile({
        workspaceRoot: workspace,
        targetRelativePath: APPROVAL_MARKER_TARGET_RELATIVE_PATH,
        approvalId: 'approval-2',
        profileId: APPROVAL_MARKER_PROFILE_ID,
        bindingHash: 'binding-2',
        consumptionId: 'consumption-2',
        completedAt: '2026-06-19T00:01:00.000Z',
      })
    ).rejects.toThrow();
  });
});
