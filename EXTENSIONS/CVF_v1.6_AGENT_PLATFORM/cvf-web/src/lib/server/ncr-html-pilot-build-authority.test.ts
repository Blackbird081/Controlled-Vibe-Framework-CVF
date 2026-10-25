import { afterEach, describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createGuardEngine } from 'cvf-guard-contract';
import { buildWebGuardContext } from '@/lib/guard-runtime-adapter';
import { loadHtmlPilotBuildContext } from './ncr-html-pilot-build-authority';
import type { HtmlPilotRuntimeProfile } from './ncr-html-pilot-runtime-profile';

const sha = (value: string) => createHash('sha256').update(value).digest('hex');
const root = path.resolve(process.cwd(), '../../..');
const runtime = path.join(root, '.cvf', 'runtime');
const owner = { userId: 'usr_3', orgId: 'org_cvf', teamId: 'team_eng' };
const rootOwner = { orgId: owner.orgId, teamId: owner.teamId, userId: owner.userId };
let current: string | null = null;

afterEach(async () => {
  if (current) {
    expect(path.relative(runtime, current).startsWith('..')).toBe(false);
    await fs.rm(current, { recursive: true, force: true });
    current = null;
  }
});

async function fixture() {
  await fs.mkdir(runtime, { recursive: true });
  current = await fs.mkdtemp(path.join(runtime, 'ncr-build-authority-test-'));
  const owned = current;
  const state = path.join(owned, 'state');
  const storeRoot = path.join(state, 'store');
  const operationRoot = path.join(state, 'operations');
  await fs.mkdir(storeRoot, { recursive: true });
  await fs.mkdir(operationRoot);
  const sourcePin = 'a'.repeat(40);
  const runId = `root_html_${'b'.repeat(32)}`;
  // Root's Python datetime.isoformat emits six fractional digits, unlike JS's three.
  const expiresAt = new Date(Date.now() + 60_000).toISOString().replace('Z', '000Z');
  const specPath = path.join(owned, 'spec.md');
  const mappingPath = path.join(owned, 'mapping.md');
  const approvalPath = path.join(owned, 'approval.md');
  const preflightPath = path.join(owned, 'skill-preflight.json');
  const authorityPath = path.join(owned, 'operation-authority.json');
  const profilePath = path.join(owned, 'effect-profile.json');
  const specText = 'Status: ACCEPTED_FOR_PILOT\n';
  const mappingText = 'Status: ACTIVE\nSkill ID: ncr_html_pilot_artifact_build\nVersion: 0.1.10-pilot\nAllowed Role: BUILDER\nAllowed Phase: BUILD\nRisk Level: R2\n';
  const approvalText = 'Operator authorization: fictional one-use HTML pilot\n';
  await fs.writeFile(specPath, specText);
  await fs.writeFile(mappingPath, mappingText);
  await fs.writeFile(approvalPath, approvalText);
  const preflight = { schema: 'cvf.ncrHtmlSkillPreflight.v1', status: 'PASS',
    skillId: 'ncr_html_pilot_artifact_build', skillVersion: '0.1.10-pilot', mappingPath,
    mappingSha256: sha(mappingText), sourcePin, runId, owner: rootOwner, profilePath,
    phase: 'BUILD', riskLevel: 'R2', initialIntentSha256: 'c'.repeat(64),
    revisionIntentSha256: 'd'.repeat(64), expiresAt };
  const preflightText = JSON.stringify(preflight);
  await fs.writeFile(preflightPath, preflightText);
  const scope = path.relative(root, state).replace(/\\/g, '/');
  const authority = { schema: 'cvf.ncrHtmlBuildAuthority.v1', sourcePin, runId, owner: rootOwner,
    provenanceRoot: root, profilePath, storeRoot, operationRoot,
    spec: { path: specPath, sha256: sha(specText), status: 'ACCEPTED' },
    workOrder: { status: 'VALID', ref: authorityPath, revoked: false, expiresAt, allowedScope: [scope] },
    skill: { id: preflight.skillId, version: preflight.skillVersion, mappingPath,
      mappingSha256: sha(mappingText), preflightPath, preflightSha256: sha(preflightText) },
    approval: { status: 'APPROVED', ref: authorityPath, approvedByRole: 'OPERATOR', actorId: owner.userId,
      subjectRole: 'BUILDER', subjectPhase: 'BUILD', actions: ['create_html_draft', 'modify_html_draft'],
      expiresAt, revoked: false, operatorApprovalPath: approvalPath, operatorApprovalSha256: sha(approvalText) } };
  const authorityText = JSON.stringify(authority);
  await fs.writeFile(authorityPath, authorityText);
  const profile = { sourcePin, runId, owner: rootOwner, provenanceRoot: root, storeRoot, operationRoot,
    authorityPath, authoritySha256: sha(authorityText), manifestSha256: 'e'.repeat(64),
    initialIntentSha256: preflight.initialIntentSha256,
    revisionIntentSha256: preflight.revisionIntentSha256 } as HtmlPilotRuntimeProfile;
  return { profile, authority, authorityPath, mappingPath, specPath, preflightPath, preflightText, state };
}

async function repinAuthority(profile: HtmlPilotRuntimeProfile, authorityPath: string, authority: object) {
  const text = JSON.stringify(authority);
  await fs.writeFile(authorityPath, text);
  profile.authoritySha256 = sha(text);
}

describe('Root-owned NCR HTML BUILD admission', () => {
  it('admits one exact fictional CREATE with all canonical guards ALLOW', async () => {
    const { profile } = await fixture();
    const build = await loadHtmlPilotBuildContext({ profile, owner, operationKey: 'create_1', kind: 'CREATE' });
    expect(build).not.toBeNull();
    expect(build!.riskApproval.expiresAt).toMatch(/\.\d{3}Z$/);
    expect(build!.buildAuthority.expiresAt).toMatch(/\.\d{3}Z$/);
    const context = buildWebGuardContext({ phase: 'BUILD', riskLevel: 'R2', role: 'BUILDER',
      userRole: 'developer', actorId: owner.userId, action: build!.action,
      targetFiles: build!.targetFiles, fileScope: build!.fileScope,
      traceHash: build!.traceHash, approvalBinding: build!.approvalBinding,
      riskApproval: build!.riskApproval, buildAuthority: build!.buildAuthority,
      aiCommit: { commitId: 'ui-create-1', agentId: 'cvf-web-ui', timestamp: Date.now() } });
    expect(createGuardEngine().evaluate(context).finalDecision).toBe('ALLOW');
  });

  it('rejects a changed Root approval document and a wrong owner before gateway', async () => {
    const { profile, authorityPath } = await fixture();
    for (const field of ['userId', 'orgId', 'teamId'] as const) {
      expect(await loadHtmlPilotBuildContext({ profile, owner: { ...owner, [field]: 'other' },
        operationKey: 'create_1', kind: 'CREATE' })).toBeNull();
    }
    await fs.appendFile(authorityPath, '\n');
    expect(await loadHtmlPilotBuildContext({ profile, owner, operationKey: 'create_1', kind: 'CREATE' })).toBeNull();
  });

  it('rejects an inactive skill even when the authority hash is refreshed', async () => {
    const { profile, authority, authorityPath, mappingPath } = await fixture();
    const revised = 'Status: DRAFT\nSkill ID: ncr_html_pilot_artifact_build\n';
    await fs.writeFile(mappingPath, revised);
    authority.skill.mappingSha256 = sha(revised);
    await fs.writeFile(authorityPath, JSON.stringify(authority));
    profile.authoritySha256 = sha(JSON.stringify(authority));
    expect(await loadHtmlPilotBuildContext({ profile, owner, operationKey: 'create_1', kind: 'CREATE' })).toBeNull();
  });

  it('rejects missing accepted SPEC and a revoked or expired operation work order', async () => {
    const { profile, authority, authorityPath, specPath } = await fixture();
    await fs.writeFile(specPath, 'Status: DESIGN_PENDING_AUTHORITY\n');
    authority.spec.sha256 = sha('Status: DESIGN_PENDING_AUTHORITY\n');
    await repinAuthority(profile, authorityPath, authority);
    expect(await loadHtmlPilotBuildContext({ profile, owner, operationKey: 'create_1', kind: 'CREATE' })).toBeNull();

    await fs.writeFile(specPath, 'Status: ACCEPTED_FOR_PILOT\n');
    authority.spec.sha256 = sha('Status: ACCEPTED_FOR_PILOT\n');
    authority.workOrder.revoked = true;
    await repinAuthority(profile, authorityPath, authority);
    expect(await loadHtmlPilotBuildContext({ profile, owner, operationKey: 'create_1', kind: 'CREATE' })).toBeNull();

    authority.workOrder.revoked = false;
    authority.workOrder.expiresAt = new Date(Date.now() - 60_000).toISOString();
    await repinAuthority(profile, authorityPath, authority);
    expect(await loadHtmlPilotBuildContext({ profile, owner, operationKey: 'create_1', kind: 'CREATE' })).toBeNull();
  });

  it('rejects an over-precision operation expiry even when Root authority is re-pinned', async () => {
    const { profile, authority, authorityPath } = await fixture();
    authority.workOrder.expiresAt = new Date(Date.now() + 60_000).toISOString().replace('Z', '0000Z');
    await repinAuthority(profile, authorityPath, authority);
    expect(await loadHtmlPilotBuildContext({ profile, owner, operationKey: 'create_1', kind: 'CREATE' })).toBeNull();
  });

  it('rejects a missing skill preflight and a target outside the run state root', async () => {
    const { profile, authority, authorityPath, preflightPath, preflightText, state } = await fixture();
    await fs.rm(preflightPath);
    expect(await loadHtmlPilotBuildContext({ profile, owner, operationKey: 'create_1', kind: 'CREATE' })).toBeNull();

    await fs.writeFile(preflightPath, preflightText);
    profile.storeRoot = path.join(path.dirname(state), 'escape');
    authority.storeRoot = profile.storeRoot;
    await fs.mkdir(profile.storeRoot);
    await repinAuthority(profile, authorityPath, authority);
    expect(await loadHtmlPilotBuildContext({ profile, owner, operationKey: 'create_1', kind: 'CREATE' })).toBeNull();
  });

  it('does not pass the mandatory gateway without an actual UI AI commit', async () => {
    const { profile } = await fixture();
    const build = await loadHtmlPilotBuildContext({ profile, owner, operationKey: 'create_1', kind: 'CREATE' });
    expect(build).not.toBeNull();
    const context = buildWebGuardContext({ phase: 'BUILD', riskLevel: 'R2', role: 'BUILDER',
      userRole: 'developer', actorId: owner.userId, action: build!.action,
      targetFiles: build!.targetFiles, fileScope: build!.fileScope,
      traceHash: build!.traceHash, approvalBinding: build!.approvalBinding,
      riskApproval: build!.riskApproval, buildAuthority: build!.buildAuthority });
    expect(createGuardEngine().evaluate(context).finalDecision).not.toBe('ALLOW');
  });
});
