import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { BuildAuthorityEvidence, RiskApprovalEvidence } from 'cvf-guard-contract';
import type { HtmlPilotRuntimeProfile } from './ncr-html-pilot-runtime-profile';

type Json = Record<string, unknown>;
const rec = (value: unknown): value is Json => !!value && typeof value === 'object' && !Array.isArray(value);
const digest = (bytes: Buffer | string) => createHash('sha256').update(bytes).digest('hex');
const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
const sameOwner = (value: unknown, owner: HtmlPilotRuntimeProfile['owner']) => rec(value)
  && Object.keys(value).length === 3 && ['userId', 'orgId', 'teamId'].every(key => Object.hasOwn(value, key))
  && value.userId === owner.userId && value.orgId === owner.orgId && value.teamId === owner.teamId;
const hex = (value: unknown) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const future = (value: unknown) => typeof value === 'string'
  && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
  && Number.isFinite(Date.parse(value)) && Date.parse(value) > Date.now();

async function ownedPath(root: string, target: string, file: boolean): Promise<boolean> {
  const relative = path.relative(root, target);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return false;
  let cursor = root;
  for (const segment of relative.split(path.sep)) {
    if (!segment || segment === '.' || segment === '..') return false;
    cursor = path.join(cursor, segment);
    const stat = await fs.lstat(cursor);
    if (stat.isSymbolicLink()) return false;
  }
  const stat = await fs.lstat(target);
  return file ? stat.isFile() && stat.size <= 16_384 : stat.isDirectory();
}

async function pinnedFile(root: string, filename: unknown, sha256: unknown): Promise<string | null> {
  if (typeof filename !== 'string' || !path.isAbsolute(filename) || path.resolve(filename) !== filename || !hex(sha256)
    || !(await ownedPath(root, filename, true))) return null;
  const bytes = await fs.readFile(filename);
  return digest(bytes) === sha256 ? bytes.toString('utf8') : null;
}

export interface HtmlPilotBuildContext {
  action: 'create_html_draft' | 'modify_html_draft';
  traceHash: string;
  approvalBinding: string;
  riskApproval: RiskApprovalEvidence;
  buildAuthority: BuildAuthorityEvidence;
  targetFiles: string[];
  fileScope: string[];
  skillPreflight: { recordRef: string; declaration: string; skillIds: string[] };
}

/** All assertions are made against Root-owned bytes; no browser field supplies authority. */
export async function loadHtmlPilotBuildContext(input: {
  profile: HtmlPilotRuntimeProfile;
  owner: HtmlPilotRuntimeProfile['owner'];
  operationKey: string;
  kind: 'CREATE' | 'REVISION';
}): Promise<HtmlPilotBuildContext | null> {
  const { profile, owner, operationKey, kind } = input;
  try {
    const root = profile.provenanceRoot;
    const owned = path.dirname(profile.authorityPath);
    const relativeOwned = path.relative(root, owned).replace(/\\/g, '/');
    if (!relativeOwned.startsWith('.cvf/runtime/') || relativeOwned.includes('..')
      || !(await ownedPath(root, owned, false))
      || path.resolve(profile.storeRoot) !== path.join(owned, 'state', 'store')
      || path.resolve(profile.operationRoot) !== path.join(owned, 'state', 'operations')
      || !(await ownedPath(owned, profile.storeRoot, false))
      || !(await ownedPath(owned, profile.operationRoot, false))) return null;

    const authorityText = await pinnedFile(owned, profile.authorityPath, profile.authoritySha256);
    const authority: unknown = authorityText && JSON.parse(authorityText);
    if (!rec(authority) || authority.schema !== 'cvf.ncrHtmlBuildAuthority.v1'
      || authority.sourcePin !== profile.sourcePin || authority.runId !== profile.runId
      || authority.provenanceRoot !== root || !sameOwner(authority.owner, owner)
      || authority.profilePath !== path.join(owned, 'effect-profile.json')
      || authority.storeRoot !== profile.storeRoot || authority.operationRoot !== profile.operationRoot) return null;

    const spec = authority.spec;
    const workOrder = authority.workOrder;
    const skill = authority.skill;
    const approval = authority.approval;
    if (!rec(spec) || !rec(workOrder) || !rec(skill) || !rec(approval)) return null;
    const specText = await pinnedFile(root, spec.path, spec.sha256);
    if (!specText || spec.status !== 'ACCEPTED' || !/^Status: ACCEPTED_FOR_PILOT$/m.test(specText)) return null;
    if (workOrder.status !== 'VALID' || workOrder.revoked !== false || !future(workOrder.expiresAt)
      || workOrder.ref !== profile.authorityPath) return null;
    const scope = path.relative(root, path.join(owned, 'state')).replace(/\\/g, '/');
    if (!same(workOrder.allowedScope, [scope])) return null;

    const mappingText = await pinnedFile(root, skill.mappingPath, skill.mappingSha256);
    const preflightText = await pinnedFile(owned, skill.preflightPath, skill.preflightSha256);
    const preflight: unknown = preflightText && JSON.parse(preflightText);
    if (!mappingText || skill.id !== 'ncr_html_pilot_artifact_build' || skill.version !== '0.1.10-pilot'
      || !/^Status: ACTIVE$/m.test(mappingText)
      || !/^Skill ID: ncr_html_pilot_artifact_build$/m.test(mappingText)
      || !/^Version: 0\.1\.10-pilot$/m.test(mappingText)
      || !/^Allowed Role: BUILDER$/m.test(mappingText)
      || !/^Allowed Phase: BUILD$/m.test(mappingText)
      || !/^Risk Level: R2$/m.test(mappingText)
      || !rec(preflight) || preflight.schema !== 'cvf.ncrHtmlSkillPreflight.v1'
      || preflight.status !== 'PASS' || preflight.skillId !== skill.id || preflight.skillVersion !== skill.version
      || preflight.mappingSha256 !== skill.mappingSha256 || preflight.mappingPath !== skill.mappingPath
      || preflight.sourcePin !== profile.sourcePin || preflight.runId !== profile.runId
      || preflight.profilePath !== authority.profilePath || !sameOwner(preflight.owner, owner)
      || preflight.phase !== 'BUILD' || preflight.riskLevel !== 'R2'
      || preflight.initialIntentSha256 !== profile.initialIntentSha256
      || preflight.revisionIntentSha256 !== profile.revisionIntentSha256
      || !future(preflight.expiresAt)) return null;

    const action = kind === 'CREATE' ? 'create_html_draft' : 'modify_html_draft';
    if (approval.status !== 'APPROVED' || approval.revoked !== false || !future(approval.expiresAt)
      || approval.approvedByRole !== 'OPERATOR' || approval.actorId !== owner.userId
      || approval.subjectRole !== 'BUILDER' || approval.subjectPhase !== 'BUILD'
      || !same(approval.actions, ['create_html_draft', 'modify_html_draft'])
      || approval.ref !== profile.authorityPath) return null;
    const operatorInstruction = await pinnedFile(root, approval.operatorApprovalPath, approval.operatorApprovalSha256);
    if (!operatorInstruction || !operatorInstruction.includes('Operator authorization:')) return null;
    // Root writes microseconds; canonical guards accept millisecond ISO evidence.
    // Normalizing after the strict source/future checks never extends the expiry.
    const guardExpiry = new Date(approval.expiresAt as string).toISOString();
    const workOrderGuardExpiry = new Date(workOrder.expiresAt as string).toISOString();
    const traceHash = digest(`${profile.sourcePin}:${profile.manifestSha256}:${profile.authoritySha256}:${operationKey}:${action}:${owner.userId}`);
    const riskApproval: RiskApprovalEvidence = {
      status: 'APPROVED', approvalRef: profile.authorityPath, approvedByRole: 'OPERATOR',
      subjectRole: 'BUILDER', subjectPhase: 'BUILD', action, actorId: owner.userId,
      binding: profile.manifestSha256, traceHash, expiresAt: guardExpiry, revoked: false,
    };
    const targetFiles = [profile.storeRoot, profile.operationRoot].map(p => path.relative(root, p).replace(/\\/g, '/'));
    return {
      action, traceHash, approvalBinding: profile.manifestSha256, riskApproval,
      buildAuthority: {
        specStatus: 'ACCEPTED', acceptedSpecRef: spec.path as string,
        workOrderStatus: 'VALID', workOrderRef: profile.authorityPath,
        revoked: false, expiresAt: workOrderGuardExpiry, allowedScope: [scope],
      },
      targetFiles, fileScope: [scope],
      skillPreflight: {
        recordRef: skill.preflightPath as string,
        declaration: `Skill Preflight PASS. Using skill(s): ${skill.id}. Mapped record(s): ${skill.mappingPath}. Phase: BUILD. Risk: R2. Execution allowed under CVF.`,
        skillIds: [skill.id as string],
      },
    };
  } catch {
    return null;
  }
}
