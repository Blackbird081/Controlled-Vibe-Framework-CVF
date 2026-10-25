import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { SyntheticDraftProfile } from './html-draft-snapshot-store';
import { receiptOperationIsolatedForHtmlPilot } from './receipt-operation-profile';

export const HTML_PILOT_PROFILE_SELECTOR = 'CVF_NCR_HTML_PILOT_MANIFEST_PATH';
const rec = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const keys = (v: Record<string, unknown>, required: string[]) => Object.keys(v).length === required.length && required.every(k => Object.hasOwn(v, k));
const absoluteOwnedRoot = (v: unknown): v is string => typeof v === 'string' && path.isAbsolute(v) && path.resolve(v) === v
  && v !== path.parse(v).root && !v.startsWith('\\');
const ident = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9_.-]{1,150}$/.test(v);
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

export interface HtmlPilotRuntimeProfile {
  kind: 'REAL_PROVIDER_FICTIONAL_CONTENT';
  sourcePin: string;
  initialIntentSha256: string;
  revisionIntentSha256: string;
  provider: 'alibaba';
  model: string;
  endpoint: string;
  owner: { userId: string; orgId: string; teamId: string };
  storeRoot: string;
  operationRoot: string;
  grantPath: string;
  authorityPath: string;
  authoritySha256: string;
  provenanceRoot: string;
  runId: string;
  retention: 'UP_TO_30_DAYS_PLUS_LEGAL_SECURITY_EXCEPTIONS';
  disclosure: 'FICTIONAL_INPUT_PLUS_CVF_STATIC_PROMPT';
  maxPaidStarts: 2;
  maxTokens: number;
  maxUsd: number;
  maxSeconds: number;
  manifestSha256: string;
  store: SyntheticDraftProfile;
}

export interface HtmlPilotPublicDisclosure {
  kind: 'REAL_PROVIDER_FICTIONAL_CONTENT';
  provider: 'alibaba'; model: string; endpoint: string;
  sent: 'FICTIONAL_INPUT_PLUS_CVF_STATIC_PROMPT';
  retention: 'UP_TO_30_DAYS_PLUS_LEGAL_SECURITY_EXCEPTIONS';
  maxPaidStarts: 2; maxTokens: number; maxUsd: number; maxSeconds: number;
  stop: 'LOCAL_STOP_REMOTE_OUTCOME_UNKNOWN'; unknown: 'NO_AUTOMATIC_RESEND';
  profileDigest: string;
}

export function publicHtmlPilotDisclosure(profile: HtmlPilotRuntimeProfile): HtmlPilotPublicDisclosure {
  return { kind: profile.kind, provider: profile.provider, model: profile.model, endpoint: profile.endpoint,
    sent: profile.disclosure, retention: profile.retention, maxPaidStarts: profile.maxPaidStarts,
    maxTokens: profile.maxTokens, maxUsd: profile.maxUsd, maxSeconds: profile.maxSeconds,
    stop: 'LOCAL_STOP_REMOTE_OUTCOME_UNKNOWN', unknown: 'NO_AUTOMATIC_RESEND', profileDigest: profile.manifestSha256 };
}

/** Root-owned manifest is read only at request time. Absence or ambiguity is DENY. */
export async function loadHtmlPilotRuntimeProfile(
  env: Record<string, string | undefined> = process.env,
): Promise<HtmlPilotRuntimeProfile | null> {
  if (!receiptOperationIsolatedForHtmlPilot(env)) return null;
  const file = env[HTML_PILOT_PROFILE_SELECTOR];
  if (!absoluteOwnedRoot(file) || !file.endsWith('.json')) return null;
  try {
    const stat = await fs.lstat(file);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 16_384) return null;
    const bytes = await fs.readFile(file, 'utf8');
    const value: unknown = JSON.parse(bytes);
    if (!rec(value) || !keys(value, ['schema', 'kind', 'sourcePin', 'initialIntentSha256', 'revisionIntentSha256', 'provider', 'model', 'endpoint', 'owner',
      'storeRoot', 'operationRoot', 'grantPath', 'authorityPath', 'authoritySha256', 'provenanceRoot', 'runId',
      'retention', 'disclosure', 'maxPaidStarts', 'maxTokens', 'maxUsd', 'maxSeconds'])
      || value.schema !== 'cvf.ncrHtmlPilotEffectManifest.v2' || value.kind !== 'REAL_PROVIDER_FICTIONAL_CONTENT'
      || value.provider !== 'alibaba' || !ident(value.model) || typeof value.endpoint !== 'string'
      || !/^https:\/\/[A-Za-z0-9.-]+(?:\/[A-Za-z0-9/_-]*)?$/.test(value.endpoint)
      || !rec(value.owner) || !keys(value.owner, ['userId', 'orgId', 'teamId'])
      || ![value.owner.userId, value.owner.orgId, value.owner.teamId].every(ident)
      || !absoluteOwnedRoot(value.storeRoot) || !absoluteOwnedRoot(value.operationRoot) || !absoluteOwnedRoot(value.grantPath)
      || !absoluteOwnedRoot(value.authorityPath) || !absoluteOwnedRoot(value.provenanceRoot)
      || !/^[a-f0-9]{64}$/.test(String(value.authoritySha256)) || !/^root_html_[a-f0-9]{32}$/.test(String(value.runId))
      || !/^[a-f0-9]{40}$/.test(String(value.sourcePin))
      || !/^[a-f0-9]{64}$/.test(String(value.initialIntentSha256))
      || !/^[a-f0-9]{64}$/.test(String(value.revisionIntentSha256))
      || value.sourcePin !== env.CVF_NCR_HTML_PILOT_SOURCE_HEAD
      || value.retention !== 'UP_TO_30_DAYS_PLUS_LEGAL_SECURITY_EXCEPTIONS'
      || value.disclosure !== 'FICTIONAL_INPUT_PLUS_CVF_STATIC_PROMPT' || value.maxPaidStarts !== 2
      || !Number.isInteger(value.maxTokens) || Number(value.maxTokens) < 1 || Number(value.maxTokens) > 20_000
      || typeof value.maxUsd !== 'number' || value.maxUsd <= 0 || value.maxUsd > 10
      || !Number.isInteger(value.maxSeconds) || Number(value.maxSeconds) < 1 || Number(value.maxSeconds) > 600) return null;
    const storeStat = await fs.lstat(value.storeRoot);
    const opStat = await fs.lstat(value.operationRoot);
    const authorityStat = await fs.lstat(value.authorityPath);
    const provenanceStat = await fs.lstat(value.provenanceRoot);
    if (!storeStat.isDirectory() || storeStat.isSymbolicLink() || !opStat.isDirectory() || opStat.isSymbolicLink()
      || !authorityStat.isFile() || authorityStat.isSymbolicLink() || authorityStat.size > 16_384
      || !provenanceStat.isDirectory() || provenanceStat.isSymbolicLink()) return null;
    const owner = value.owner as HtmlPilotRuntimeProfile['owner'];
    return { kind: 'REAL_PROVIDER_FICTIONAL_CONTENT', sourcePin: value.sourcePin as string,
      initialIntentSha256: value.initialIntentSha256, revisionIntentSha256: value.revisionIntentSha256, provider: 'alibaba',
      model: value.model, endpoint: value.endpoint, owner, storeRoot: value.storeRoot, operationRoot: value.operationRoot,
      grantPath: value.grantPath, authorityPath: value.authorityPath, authoritySha256: value.authoritySha256,
      provenanceRoot: value.provenanceRoot, runId: value.runId,
      retention: value.retention, disclosure: value.disclosure, maxPaidStarts: 2,
      maxTokens: value.maxTokens, maxUsd: value.maxUsd, maxSeconds: value.maxSeconds, manifestSha256: sha(bytes),
      store: { kind: 'real-provider-fictional-content', root: value.storeRoot, production: false, jobDecisions: true },
    } as HtmlPilotRuntimeProfile;
  } catch { return null; }
}

export async function htmlPilotGrantActive(profile: HtmlPilotRuntimeProfile, now = Date.now()): Promise<boolean> {
  try {
    const stat = await fs.lstat(profile.grantPath);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 2048) return false;
    const value: unknown = JSON.parse(await fs.readFile(profile.grantPath, 'utf8'));
    return rec(value) && keys(value, ['schema', 'state', 'owner', 'profileDigest', 'expiresAt'])
      && value.schema === 'cvf.ncrHtmlPilotGrant.v1' && value.state === 'ACTIVE'
      && rec(value.owner) && JSON.stringify(value.owner) === JSON.stringify(profile.owner)
      && value.profileDigest === profile.manifestSha256 && typeof value.expiresAt === 'string'
      && Number.isFinite(Date.parse(value.expiresAt)) && Date.parse(value.expiresAt) > now;
  } catch { return false; }
}
