import { createHash } from 'node:crypto';
import type { GovernanceEvidenceReceipt } from '@/lib/ai';

export const DRAFT_SCHEMA = 'cvf.htmlDraftSnapshot.v1' as const;
export const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;
export const MAX_SNAPSHOT_BYTES = 262_144;
export const VERSION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export const SOURCE_ID = /^[A-Za-z0-9_-]{1,150}$/;
const REQUEST_KEYS = ['title', 'sourcePath', 'sourceContent', 'memoryClass', 'status', 'claimBoundary', 'receiptAnchor'] as const;
const SAVE_KEYS = ['versionId', 'sourceRecordId', 'request', 'html', 'filename', 'generatedAt', 'buildNumber'] as const;
const LIMITS = { title: 200, sourcePath: 500, sourceContent: 100_000, memoryClass: 14, status: 100, claimBoundary: 2_000, receiptAnchor: 150 };
// Bounded copy of the seven patterns in the existing export route.
const SECRET_PATTERNS = [
  /\b(?:DASHSCOPE|ALIBABA|OPENAI|ANTHROPIC|DEEPSEEK|GEMINI|GOOGLE)_API_KEY\s*[:=]/i,
  /\b(?:API[_-]?KEY|ACCESS[_-]?TOKEN|SECRET[_-]?KEY|AUTH[_-]?TOKEN)\s*[:=]\s*\S{8,}/i,
  /\bBearer\s+[A-Za-z0-9._~+/-]{16,}/i,
  /\bsk-[A-Za-z0-9_-]{16,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\b(?:ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
];

export type DraftRequest = Record<(typeof REQUEST_KEYS)[number], string> & { memoryClass: 'POINTER_RECORD' | 'FULL_RECORD' };
export interface DraftInput {
  versionId: string;
  sourceRecordId: string;
  request: DraftRequest;
  html: string;
  filename: string;
  generatedAt: string;
  buildNumber: number;
  /** Pilot-only signed source. API verifies it against the current owner and exact sourceContent. */
  pilotSource?: { receipt: GovernanceEvidenceReceipt };
}
export interface DraftPrincipal { userId: string; orgId: string; teamId: string }
export interface DraftSnapshot extends DraftInput {
  schema: typeof DRAFT_SCHEMA;
  state: 'CLIENT_SUBMITTED_UNVERIFIED';
  acceptance: 'DRAFT_UNACCEPTED';
  owner: DraftPrincipal;
  createdAt: string;
  expiresAt: string;
  htmlSha256: string;
  requestSha256: string;
}

const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const exact = (value: Record<string, unknown>, keys: readonly string[]) => Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
export function safeText(value: unknown, max: number, allowEmpty = false): value is string {
  return typeof value === 'string' && (allowEmpty || value.length > 0) && value.length <= max
    && !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value)
    && !SECRET_PATTERNS.some(pattern => pattern.test(value));
}
export function parseDraftInput(value: unknown): DraftInput | null {
  if (!object(value) || !(exact(value, SAVE_KEYS) || exact(value, [...SAVE_KEYS, 'pilotSource']))
    || !object(value.request) || !exact(value.request, REQUEST_KEYS)) return null;
  const request = value.request;
  if (!REQUEST_KEYS.every(key => safeText(request[key], LIMITS[key]))
    || !['FULL_RECORD', 'POINTER_RECORD'].includes(request.memoryClass as string)
    || !safeText(value.versionId, 36) || !VERSION_ID.test(value.versionId)
    || !safeText(value.sourceRecordId, 150) || !SOURCE_ID.test(value.sourceRecordId)
    || !safeText(value.html, 250_000) || !safeText(value.filename, 200)
    || !safeText(value.generatedAt, 40) || !Number.isFinite(Date.parse(value.generatedAt))
    || new Date(value.generatedAt).toISOString() !== value.generatedAt
    || !Number.isSafeInteger(value.buildNumber) || (value.buildNumber as number) < 1 || (value.buildNumber as number) > 1_000_000
    || (Object.hasOwn(value, 'pilotSource') && (!object(value.pilotSource) || !exact(value.pilotSource, ['receipt'])
      || !object(value.pilotSource.receipt) || !object(value.pilotSource.receipt.htmlPilotEvidence)))) return null;
  return value as unknown as DraftInput;
}
export function requestIdentity(request: DraftRequest): string {
  return JSON.stringify(REQUEST_KEYS.map(key => [key, request[key]]));
}
export const sha256 = (value: string | Uint8Array): string => createHash('sha256').update(value).digest('hex');
export function makeSnapshot(input: DraftInput, owner: DraftPrincipal, now: number): DraftSnapshot {
  const snapshot: DraftSnapshot = {
    ...input, schema: DRAFT_SCHEMA, state: 'CLIENT_SUBMITTED_UNVERIFIED', acceptance: 'DRAFT_UNACCEPTED',
    owner: { ...owner }, createdAt: new Date(now).toISOString(), expiresAt: new Date(now + DRAFT_TTL_MS).toISOString(),
    htmlSha256: sha256(Buffer.from(input.html, 'utf8')), requestSha256: sha256(requestIdentity(input.request)),
  };
  if (Buffer.byteLength(JSON.stringify(snapshot), 'utf8') > MAX_SNAPSHOT_BYTES) throw new Error('SNAPSHOT_TOO_LARGE');
  return snapshot;
}
export function validateSnapshot(value: unknown, owner: DraftPrincipal, now: number): DraftSnapshot | null {
  const snapshotKeys = ['versionId', 'sourceRecordId', 'request', 'html', 'filename', 'generatedAt', 'buildNumber', 'schema', 'state', 'acceptance', 'owner', 'createdAt', 'expiresAt', 'htmlSha256', 'requestSha256'];
  if (!object(value) || !(exact(value, snapshotKeys) || exact(value, [...snapshotKeys, 'pilotSource']))) return null;
  const input = parseDraftInput(Object.fromEntries([...SAVE_KEYS, ...(Object.hasOwn(value, 'pilotSource') ? ['pilotSource'] : [])].map(key => [key, value[key]])));
  const actualOwner = value.owner;
  if (!input || value.schema !== DRAFT_SCHEMA || value.state !== 'CLIENT_SUBMITTED_UNVERIFIED' || value.acceptance !== 'DRAFT_UNACCEPTED'
    || !object(actualOwner) || !exact(actualOwner, ['userId', 'orgId', 'teamId'])
    || actualOwner.userId !== owner.userId || actualOwner.orgId !== owner.orgId || actualOwner.teamId !== owner.teamId
    || !safeText(value.createdAt, 40) || !safeText(value.expiresAt, 40)
    || !Number.isFinite(Date.parse(value.createdAt)) || !Number.isFinite(Date.parse(value.expiresAt))
    || new Date(value.createdAt).toISOString() !== value.createdAt || new Date(value.expiresAt).toISOString() !== value.expiresAt
    || now >= Date.parse(value.expiresAt) || Date.parse(value.expiresAt) - Date.parse(value.createdAt) !== DRAFT_TTL_MS
    || value.htmlSha256 !== sha256(Buffer.from(input.html, 'utf8')) || value.requestSha256 !== sha256(requestIdentity(input.request))) return null;
  return value as unknown as DraftSnapshot;
}
