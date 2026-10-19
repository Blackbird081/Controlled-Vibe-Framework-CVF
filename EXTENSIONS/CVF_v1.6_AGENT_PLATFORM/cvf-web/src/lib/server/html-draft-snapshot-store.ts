/** Isolated fixture repository for unverified HTML drafts. No active-data profile is wired. */
import { randomBytes } from 'node:crypto';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { MAX_OPERATIONS_PER_OWNER, MAX_OPERATION_RECORD_BYTES, OPERATION_RISK, OPERATION_SCHEMA, decodeRecord, envelopeSha256, makeIntent, makeOutcome, makeReservation,
  makeStart, ownerSha256, parseEnvelope, parseIntent, parseOutcome, parseReservation, parseStart, recordBytes,
  type IntentRecord, type OutcomeInput, type OutcomeRecord, type StartRecord } from '../artifacts-receipt-operation-contract';
// The bound contract and codec are type-only here. The bound codec is loaded on first bound use, so loading this module needs nothing beyond the v1 contract.
import type { BoundIntent, BoundOutcome, BoundOutcomeInput, BoundStart } from '../artifacts-bound-receipt-contract';
import type { BaseEnvelope, BaseIntent, BaseOutcome, BaseReceiptInput, BaseStart, OperationCodec, OperationSchemaKind } from '../receipt-operation-schema';
import { DRAFT_TTL_MS, MAX_SNAPSHOT_BYTES, SOURCE_ID, VERSION_ID, makeSnapshot, sha256, validateSnapshot,
  type DraftInput, type DraftPrincipal, type DraftSnapshot } from '../html-draft-recovery-contract';
import { MAX_JOB_METADATA_BYTES, makeDecision, makeJob, makeVersion, parseAcceptVersion, parseCreateJob, parseLinkVersion,
  reviewMatches, validateDecision, validateJob, validateVersion,
  type AcceptVersionInput, type CreateJobInput, type HtmlJob, type HtmlJobDecision, type HtmlJobVersion, type LinkVersionInput } from '../html-job-contract';

export interface SyntheticDraftProfile {
  kind: 'local-synthetic';
  root: string;
  production: false;
  jobDecisions?: true;
  /** Fixture-only: enables the immutable receipt-operation records in the operations child directory. */
  receiptOperations?: true;
  /** Fixture-only: enables the distinct bound-operation records in their own child directory. Never implied by receiptOperations. */
  boundReceiptOperations?: true;
}
export type SaveOutcome = 'SAVED' | 'COLLISION' | 'UNCONFIRMED' | 'UNAVAILABLE';
const safePrincipal = (p: DraftPrincipal) => [p.userId, p.orgId, p.teamId].every(v => typeof v === 'string' && v.length > 0 && v.length <= 150 && /^[A-Za-z0-9_-]+$/.test(v));
const sameOwner = (a: DraftPrincipal, b: DraftPrincipal) => a.userId === b.userId && a.orgId === b.orgId && a.teamId === b.teamId;

export type OperationState =
  | { state: 'ABSENT' }
  | { state: 'INTENT'; intent: IntentRecord }
  | { state: 'STARTED'; intent: IntentRecord; start: StartRecord }
  | { state: 'OUTCOME'; intent: IntentRecord; start: StartRecord; outcome: OutcomeRecord }
  | { state: 'CORRUPT' | 'UNCONFIRMED' | 'UNSUPPORTED'; reason: string };
export type ExistingOperation = Exclude<OperationState, { state: 'ABSENT' }>;
export type BoundOperationState =
  | { state: 'ABSENT' }
  | { state: 'INTENT'; intent: BoundIntent }
  | { state: 'STARTED'; intent: BoundIntent; start: BoundStart }
  | { state: 'OUTCOME'; intent: BoundIntent; start: BoundStart; outcome: BoundOutcome }
  | { state: 'CORRUPT' | 'UNCONFIRMED' | 'UNSUPPORTED'; reason: string };
export type ExistingBoundOperation = Exclude<BoundOperationState, { state: 'ABSENT' }>;
export type OperationDenial = 'DISABLED' | 'INVALID_INPUT' | 'UNSAFE_NAMESPACE' | 'CAPACITY_FULL' | 'UNKNOWN_ENTRY' | 'SCAN_BOUND_EXCEEDED'
  | 'RESERVATION_UNCONFIRMED' | 'INTENT_UNCONFIRMED' | 'NO_INTENT' | 'START_UNCONFIRMED' | 'LOOKUP_FAILED' | 'ADMISSION_REQUIRED';
export type AdmitResult = { kind: 'ADMITTED'; intent: IntentRecord; admission: OperationAdmission } | { kind: 'EXISTING'; operation: ExistingOperation } | { kind: 'DENIED'; reason: OperationDenial };
export type StartResult = { kind: 'STARTED'; grant: OperationGrant } | { kind: 'EXISTING'; operation: ExistingOperation } | { kind: 'DENIED'; reason: OperationDenial };
export type OutcomeWrite = { kind: 'SAVED'; outcome: OutcomeRecord } | { kind: 'COLLISION' | 'UNCONFIRMED' | 'UNAVAILABLE' };
export type BoundAdmitResult = { kind: 'ADMITTED'; intent: BoundIntent; admission: OperationAdmission } | { kind: 'EXISTING'; operation: ExistingBoundOperation } | { kind: 'DENIED'; reason: OperationDenial };
export type BoundStartResult = { kind: 'STARTED'; grant: OperationGrant } | { kind: 'EXISTING'; operation: ExistingBoundOperation } | { kind: 'DENIED'; reason: OperationDenial };
export type BoundOutcomeWrite = { kind: 'SAVED'; outcome: BoundOutcome } | { kind: 'COLLISION' | 'UNCONFIRMED' | 'UNAVAILABLE' };
/**
 * Opaque in-memory single-use authorities. Each is minted only by a verified exclusive create made by THIS caller in THIS store instance:
 * admission by the new intent, grant by the new STARTED record, consumed start by consuming that grant. A copy, a fabrication, a restart,
 * a durable record or a readOperation result can never recreate or reconstruct one. Each authority also carries the schema of the operation
 * that minted it, so a v1 authority can never act on a bound operation and the reverse.
 */
export interface OperationAdmission { readonly kind: 'OPERATION_ADMISSION' }
export interface OperationGrant { readonly kind: 'OPERATION_GRANT' }
export interface ConsumedGrant { readonly kind: 'CONSUMED_START' }
interface Authority { store: object; schema: OperationSchemaKind; owner: DraftPrincipal; operationKey: string; envelopeSha256: string; attemptId: string }
interface AdmissionState extends Authority { spent: boolean }
interface GrantState extends Authority { startNonce: string; invoker: unknown; spent: boolean }
interface ConsumedState extends Authority { startNonce: string; result: 'PENDING' | OutcomeWrite['kind'] | null }
const admissions = new WeakMap<object, AdmissionState>();
const grants = new WeakMap<object, GrantState>();
const consumedStarts = new WeakMap<object, ConsumedState>();
const trustedStores = new WeakSet<object>();
/** Only a store constructed by this module is a trusted source of admissions, grants and outcome handles. */
export const isReceiptOperationStore = (value: unknown): value is HtmlDraftSnapshotStore => typeof value === 'object' && value !== null && trustedStores.has(value);
const ACCEPTED_DECISIONS: readonly string[] = ['ALLOW', 'DENY', 'REVIEW', 'ESCALATE', 'SANDBOX'];
/** The v1 codec over the v1 contract exactly as before this change. */
const V1_CODEC: OperationCodec = Object.freeze({
  kind: 'V1', schema: OPERATION_SCHEMA, directory: 'operations',
  parseEnvelope, envelopeSha256: (envelope: BaseEnvelope) => envelopeSha256(parseEnvelope(envelope)!),
  makeReservation, parseReservation,
  makeIntent: (slot: number, envelope: BaseEnvelope, now: number) => makeIntent(slot, parseEnvelope(envelope)!, now), parseIntent,
  makeStart: (envelope: BaseEnvelope, nonce: string, now: number) => makeStart(parseEnvelope(envelope)!, nonce, now), parseStart,
  makeOutcome: (start: BaseStart, input: BaseReceiptInput, now: number) => makeOutcome(start as StartRecord, input as OutcomeInput, now), parseOutcome,
  recordBytes: (value: unknown) => recordBytes(value as Parameters<typeof recordBytes>[0]), decode: decodeRecord,
  receiptJoins: (attemptId: string, input: BaseReceiptInput) => input.receipt === null
    || (input.receipt.receiptId === attemptId && input.receipt.riskLevel === OPERATION_RISK && ACCEPTED_DECISIONS.includes(input.receipt.decision)),
});
let boundCodec: OperationCodec | null = null;
/** Loaded once, on the first bound call. A grant or admission of the bound schema can only exist after this has completed. */
const loadBoundCodec = async (): Promise<OperationCodec> => boundCodec ?? (boundCodec = (await import('../receipt-operation-schema')).BOUND_CODEC);
const SLOT_FILE = /^slot-(\d{3})\.json$/;
const LIFECYCLE_FILE = /^op-[a-f0-9]{64}\.(?:intent|start|outcome)\.json$/;
const MAX_OPERATION_ENTRIES = MAX_OPERATIONS_PER_OWNER * 4;
const slotName = (slot: number) => `slot-${String(slot).padStart(3, '0')}.json`;
const lifecycleName = (key: string, kind: 'intent' | 'start' | 'outcome') => `op-${key}.${kind}.json`;
const errno = (error: unknown) => (error as NodeJS.ErrnoException).code;
type FileRead = { kind: 'MISSING' } | { kind: 'OK'; bytes: Buffer } | { kind: 'CORRUPT' | 'UNCONFIRMED'; reason: string };
type RecordRead<T> = { kind: 'MISSING' } | { kind: 'OK'; value: T } | { kind: 'BAD'; state: 'CORRUPT' | 'UNCONFIRMED' | 'UNSUPPORTED'; reason: string };
/** Schema-neutral state used by the shared internals; the public methods narrow it to the schema-specific types. */
type RawState =
  | { state: 'ABSENT' }
  | { state: 'INTENT'; intent: BaseIntent }
  | { state: 'STARTED'; intent: BaseIntent; start: BaseStart }
  | { state: 'OUTCOME'; intent: BaseIntent; start: BaseStart; outcome: BaseOutcome }
  | { state: 'CORRUPT' | 'UNCONFIRMED' | 'UNSUPPORTED'; reason: string };
type RawAdmit = { kind: 'ADMITTED'; intent: BaseIntent; admission: OperationAdmission } | { kind: 'EXISTING'; operation: Exclude<RawState, { state: 'ABSENT' }> } | { kind: 'DENIED'; reason: OperationDenial };
type RawStart = { kind: 'STARTED'; grant: OperationGrant } | { kind: 'EXISTING'; operation: Exclude<RawState, { state: 'ABSENT' }> } | { kind: 'DENIED'; reason: OperationDenial };
type RawWrite = { kind: 'SAVED'; outcome: BaseOutcome } | { kind: 'COLLISION' | 'UNCONFIRMED' | 'UNAVAILABLE' };

export class HtmlDraftSnapshotStore {
  private readonly root: string;
  private readonly jobDecisions: boolean;
  private readonly receiptOperations: boolean;
  private readonly boundOperations: boolean;
  constructor(profile: SyntheticDraftProfile, private readonly clock: () => number = Date.now) {
    if (profile.kind !== 'local-synthetic' || profile.production !== false || !path.isAbsolute(profile.root)
      || path.resolve(profile.root) === path.parse(profile.root).root || profile.root.startsWith('\\\\')) {
      throw new Error('SYNTHETIC_PROFILE_REQUIRED');
    }
    this.root = path.resolve(profile.root);
    this.jobDecisions = profile.jobDecisions === true;
    this.receiptOperations = profile.receiptOperations === true;
    this.boundOperations = profile.boundReceiptOperations === true;
    trustedStores.add(this);
  }
  private async directory(owner: DraftPrincipal, create: boolean): Promise<string | null> {
    if (!safePrincipal(owner)) throw new Error('INVALID_PRINCIPAL');
    const rootStat = await fs.lstat(this.root);
    if (!rootStat.isDirectory() || rootStat.isSymbolicLink() || await fs.realpath(this.root) !== this.root) throw new Error('UNSAFE_ROOT');
    const dir = path.join(this.root, sha256(JSON.stringify([owner.userId, owner.orgId, owner.teamId])));
    if (create) {
      try { await fs.mkdir(dir, { mode: 0o700 }); }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error; }
    }
    let stat;
    try { stat = await fs.lstat(dir); }
    catch (error) { if (!create && (error as NodeJS.ErrnoException).code === 'ENOENT') return null; throw error; }
    if (!stat.isDirectory() || stat.isSymbolicLink() || await fs.realpath(dir) !== dir) throw new Error('UNSAFE_NAMESPACE');
    return dir;
  }
  async save(input: DraftInput, owner: DraftPrincipal): Promise<SaveOutcome> {
    if (!safePrincipal(owner) || !VERSION_ID.test(input.versionId) || !SOURCE_ID.test(input.sourceRecordId)) return 'UNAVAILABLE';
    let snapshot: DraftSnapshot;
    try { snapshot = makeSnapshot(input, owner, this.clock()); }
    catch { return 'UNAVAILABLE'; }
    try {
      const dir = (await this.directory(owner, true))!;
      const file = path.join(dir, `${input.versionId}.json`);
      // Exclusive create: even an incomplete prior file consumes the ID. Never overwrite or retry.
      let handle;
      try { handle = await fs.open(file, 'wx', 0o600); }
      catch (error) { return (error as NodeJS.ErrnoException).code === 'EEXIST' ? 'COLLISION' : 'UNAVAILABLE'; }
      try { await handle.writeFile(JSON.stringify(snapshot), 'utf8'); await handle.sync(); }
      catch { return 'UNCONFIRMED'; }
      finally { try { await handle.close(); } catch { /* readback determines availability */ } }
      const stored = await this.get(input.versionId, input.sourceRecordId, owner);
      return stored && JSON.stringify(stored) === JSON.stringify(snapshot) ? 'SAVED' : 'UNCONFIRMED';
    } catch { return 'UNAVAILABLE'; }
  }
  async get(versionId: string, sourceRecordId: string, owner: DraftPrincipal): Promise<DraftSnapshot | null> {
    if (!VERSION_ID.test(versionId) || !SOURCE_ID.test(sourceRecordId)) return null;
    try {
      const dir = await this.directory(owner, false);
      if (!dir) return null;
      const file = path.join(dir, `${versionId}.json`);
      const stat = await fs.lstat(file);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_SNAPSHOT_BYTES || stat.size === 0) return null;
      const bytes = await fs.readFile(file);
      if (bytes.byteLength !== stat.size || bytes.byteLength > MAX_SNAPSHOT_BYTES) return null;
      const value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
      const snapshot = validateSnapshot(value, owner, this.clock());
      return snapshot?.versionId === versionId && snapshot.sourceRecordId === sourceRecordId ? snapshot : null;
    } catch { return null; }
  }
  async list(sourceRecordId: string, owner: DraftPrincipal): Promise<Array<Pick<DraftSnapshot, 'versionId' | 'sourceRecordId' | 'filename' | 'generatedAt' | 'createdAt' | 'expiresAt' | 'state' | 'acceptance'>>> {
    if (!SOURCE_ID.test(sourceRecordId)) return [];
    try {
      const dir = await this.directory(owner, false);
      if (!dir) return [];
      const entries = await fs.readdir(dir);
      const valid: DraftSnapshot[] = [];
      for (const entry of entries) {
        if (!entry.endsWith('.json') || !VERSION_ID.test(entry.slice(0, -5))) continue;
        const snapshot = await this.get(entry.slice(0, -5), sourceRecordId, owner);
        if (snapshot) valid.push(snapshot);
      }
      return valid.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.versionId.localeCompare(b.versionId))
        .slice(0, 8).map(({ versionId, sourceRecordId: record, filename, generatedAt, createdAt, expiresAt, state, acceptance }) => ({
          versionId, sourceRecordId: record, filename, generatedAt, createdAt, expiresAt, state, acceptance,
        }));
    } catch { return []; }
  }
  static readonly fixtureTtlMs = DRAFT_TTL_MS;

  private async readSidecar(name: string, owner: DraftPrincipal): Promise<unknown | null> {
    try {
      const dir = await this.directory(owner, false);
      if (!dir) return null;
      const file = path.join(dir, name);
      const stat = await fs.lstat(file);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.size < 1 || stat.size > MAX_JOB_METADATA_BYTES) return null;
      const bytes = await fs.readFile(file);
      if (bytes.byteLength !== stat.size || bytes.byteLength > MAX_JOB_METADATA_BYTES) return null;
      return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    } catch { return null; }
  }

  private async writeSidecar(name: string, value: unknown, owner: DraftPrincipal): Promise<SaveOutcome> {
    const bytes = Buffer.from(JSON.stringify(value), 'utf8');
    if (bytes.byteLength > MAX_JOB_METADATA_BYTES) return 'UNAVAILABLE';
    try {
      const dir = (await this.directory(owner, true))!;
      let handle;
      try { handle = await fs.open(path.join(dir, name), 'wx', 0o600); }
      catch (error) { return (error as NodeJS.ErrnoException).code === 'EEXIST' ? 'COLLISION' : 'UNAVAILABLE'; }
      try { await handle.writeFile(bytes); await handle.sync(); }
      catch { return 'UNCONFIRMED'; }
      finally { try { await handle.close(); } catch { /* readback is authoritative */ } }
      return JSON.stringify(await this.readSidecar(name, owner)) === JSON.stringify(value) ? 'SAVED' : 'UNCONFIRMED';
    } catch { return 'UNAVAILABLE'; }
  }

  async createJob(input: CreateJobInput, owner: DraftPrincipal): Promise<SaveOutcome> {
    if (!this.jobDecisions || !parseCreateJob(input) || !safePrincipal(owner)
      || !input.sourceRecordId.startsWith('ncr-synthetic-')) return 'UNAVAILABLE';
    return this.writeSidecar(`job-${input.jobId}.json`, makeJob(input, owner, this.clock()), owner);
  }
  async getJob(jobId: string, sourceRecordId: string, owner: DraftPrincipal): Promise<HtmlJob | null> {
    if (!this.jobDecisions || !VERSION_ID.test(jobId) || !SOURCE_ID.test(sourceRecordId)) return null;
    const job = validateJob(await this.readSidecar(`job-${jobId}.json`, owner), owner, this.clock());
    return job?.jobId === jobId && job.sourceRecordId === sourceRecordId ? job : null;
  }

  async linkVersion(input: LinkVersionInput, owner: DraftPrincipal): Promise<SaveOutcome> {
    if (!this.jobDecisions || !parseLinkVersion(input) || !safePrincipal(owner)) return 'UNAVAILABLE';
    const job = await this.getJob(input.jobId, input.sourceRecordId, owner);
    const snapshot = await this.get(input.versionId, input.sourceRecordId, owner);
    if (!job || !snapshot || snapshot.requestSha256 !== job.requestSha256) return 'UNAVAILABLE';
    const link = makeVersion(job, snapshot, this.clock());
    return this.writeSidecar(`version-${input.versionId}-job.json`, link, owner);
  }
  async getVersion(jobId: string, sourceRecordId: string, versionId: string, owner: DraftPrincipal): Promise<HtmlJobVersion | null> {
    if (!this.jobDecisions || !VERSION_ID.test(jobId) || !VERSION_ID.test(versionId) || !SOURCE_ID.test(sourceRecordId)) return null;
    const link = validateVersion(await this.readSidecar(`version-${versionId}-job.json`, owner), owner, this.clock());
    if (!link || link.jobId !== jobId || link.sourceRecordId !== sourceRecordId || link.versionId !== versionId) return null;
    const job = await this.getJob(jobId, sourceRecordId, owner);
    const snapshot = await this.get(versionId, sourceRecordId, owner);
    if (!job || !snapshot || link.requestSha256 !== job.requestSha256 || link.requestSha256 !== snapshot.requestSha256
      || link.htmlSha256 !== snapshot.htmlSha256 || link.expiresAt !== new Date(Math.min(Date.parse(job.expiresAt), Date.parse(snapshot.expiresAt))).toISOString()) return null;
    return link;
  }

  async acceptVersion(input: AcceptVersionInput, owner: DraftPrincipal): Promise<SaveOutcome> {
    if (!this.jobDecisions || !parseAcceptVersion(input) || !safePrincipal(owner)) return 'UNAVAILABLE';
    const job = await this.getJob(input.jobId, input.sourceRecordId, owner);
    const link = await this.getVersion(input.jobId, input.sourceRecordId, input.versionId, owner);
    const snapshot = await this.get(input.versionId, input.sourceRecordId, owner);
    if (!job || !link || !snapshot || !reviewMatches(job.criteria, input.criteriaReview)
      || input.requestSha256 !== link.requestSha256 || input.htmlSha256 !== link.htmlSha256) return 'UNAVAILABLE';
    const expiry = new Date(Math.min(Date.parse(job.expiresAt), Date.parse(link.expiresAt), Date.parse(snapshot.expiresAt))).toISOString();
    const decision = makeDecision(input, owner, expiry, this.clock());
    return this.writeSidecar(`job-${input.jobId}-decision-${input.versionId}.json`, decision, owner);
  }
  async getDecision(jobId: string, sourceRecordId: string, versionId: string, decisionId: string, owner: DraftPrincipal): Promise<HtmlJobDecision | null> {
    if (!this.jobDecisions || ![jobId, versionId, decisionId].every(x => VERSION_ID.test(x)) || !SOURCE_ID.test(sourceRecordId)) return null;
    const decision = validateDecision(await this.readSidecar(`job-${jobId}-decision-${versionId}.json`, owner), owner, this.clock());
    if (!decision || decision.jobId !== jobId || decision.sourceRecordId !== sourceRecordId || decision.versionId !== versionId
      || decision.decisionId !== decisionId) return null;
    const job = await this.getJob(jobId, sourceRecordId, owner);
    const link = await this.getVersion(jobId, sourceRecordId, versionId, owner);
    const snapshot = await this.get(versionId, sourceRecordId, owner);
    if (!job || !link || !snapshot || !reviewMatches(job.criteria, decision.criteriaReview)
      || decision.expiresAt !== new Date(Math.min(Date.parse(job.expiresAt), Date.parse(link.expiresAt), Date.parse(snapshot.expiresAt))).toISOString()
      || decision.requestSha256 !== link.requestSha256 || decision.htmlSha256 !== link.htmlSha256) return null;
    return decision;
  }

  // ---- Receipt operations: one-shot, monotonic exclusive-create records in a schema-specific operations child directory. ----
  // No lock, rollback, append, TTL, eviction, retry or recycled slot. File sync does not establish directory or power-loss durability.
  // The v1 methods and the bound methods below share these internals; the schema codec is selected by the caller's public method or by the
  // opaque authority, never by an untrusted flag.

  private enabled(kind: OperationSchemaKind): boolean { return kind === 'BOUND' ? this.boundOperations : this.receiptOperations; }

  private async operationDirectory(owner: DraftPrincipal, create: boolean, ops: OperationCodec): Promise<string | null> {
    const base = await this.directory(owner, create);
    if (!base) return null;
    const dir = path.join(base, ops.directory);
    if (create) {
      try { await fs.mkdir(dir, { mode: 0o700 }); }
      catch (error) { if (errno(error) !== 'EEXIST') throw error; }
    }
    let stat;
    try { stat = await fs.lstat(dir); }
    catch (error) { if (!create && errno(error) === 'ENOENT') return null; throw error; }
    if (!stat.isDirectory() || stat.isSymbolicLink() || await fs.realpath(dir) !== dir) throw new Error('UNSAFE_OPERATIONS_NAMESPACE');
    return dir;
  }

  private async readFileExact(dir: string, name: string): Promise<FileRead> {
    const file = path.join(dir, name);
    let stat;
    try { stat = await fs.lstat(file); }
    catch (error) { return errno(error) === 'ENOENT' ? { kind: 'MISSING' } : { kind: 'UNCONFIRMED', reason: 'LSTAT_FAILED' }; }
    if (!stat.isFile() || stat.isSymbolicLink()) return { kind: 'CORRUPT', reason: 'NOT_REGULAR_FILE' };
    if (stat.size === 0 || stat.size > MAX_OPERATION_RECORD_BYTES) return { kind: 'CORRUPT', reason: stat.size === 0 ? 'EMPTY_RECORD' : 'OVERSIZE_RECORD' };
    try {
      const bytes = await fs.readFile(file);
      return bytes.byteLength === stat.size ? { kind: 'OK', bytes } : { kind: 'UNCONFIRMED', reason: 'SIZE_CHANGED' };
    } catch { return { kind: 'UNCONFIRMED', reason: 'READ_FAILED' }; }
  }

  private async readRecord<T>(ops: OperationCodec, dir: string, name: string, parse: (value: unknown) => T | null): Promise<RecordRead<T>> {
    const read = await this.readFileExact(dir, name);
    if (read.kind === 'MISSING') return read;
    if (read.kind !== 'OK') return { kind: 'BAD', state: read.kind, reason: read.reason };
    const decoded = ops.decode(read.bytes);
    if (decoded.kind === 'UNSUPPORTED') return { kind: 'BAD', state: 'UNSUPPORTED', reason: 'UNSUPPORTED_REVISION' };
    const value = decoded.kind === 'OK' ? parse(decoded.value) : null;
    return value === null ? { kind: 'BAD', state: 'CORRUPT', reason: 'INVALID_RECORD' } : { kind: 'OK', value };
  }

  /** Exclusive create, sync and exact byte readback. A file that exists after any failure stays consumed. */
  private async createOnce(dir: string, name: string, bytes: Buffer): Promise<'CREATED' | 'EXISTS' | 'UNCONFIRMED' | 'UNAVAILABLE'> {
    let handle;
    try { handle = await fs.open(path.join(dir, name), 'wx', 0o600); }
    catch (error) { return errno(error) === 'EEXIST' ? 'EXISTS' : 'UNAVAILABLE'; }
    try { await handle.writeFile(bytes); await handle.sync(); }
    catch { return 'UNCONFIRMED'; }
    finally { try { await handle.close(); } catch { /* exact readback is authoritative */ } }
    const back = await this.readFileExact(dir, name);
    return back.kind === 'OK' && Buffer.compare(back.bytes, bytes) === 0 ? 'CREATED' : 'UNCONFIRMED';
  }

  /** Read-only lookup. Distinguishes missing from corrupt, unconfirmed and unsupported; never reserves, creates or repairs. */
  private async readWith(ops: OperationCodec, key: string, owner: DraftPrincipal): Promise<RawState> {
    if (!this.enabled(ops.kind) || !/^[a-f0-9]{64}$/.test(key) || !safePrincipal(owner)) return { state: 'UNCONFIRMED', reason: 'LOOKUP_REFUSED' };
    let dir: string | null;
    try { dir = await this.operationDirectory(owner, false, ops); }
    catch { return { state: 'UNCONFIRMED', reason: 'UNSAFE_NAMESPACE' }; }
    if (!dir) return { state: 'ABSENT' };
    const intent = await this.readRecord(ops, dir, lifecycleName(key, 'intent'), ops.parseIntent);
    const start = await this.readRecord(ops, dir, lifecycleName(key, 'start'), ops.parseStart);
    const outcome = await this.readRecord(ops, dir, lifecycleName(key, 'outcome'), ops.parseOutcome);
    if (intent.kind === 'BAD') return { state: intent.state, reason: intent.reason };
    if (start.kind === 'BAD') return { state: start.state, reason: start.reason };
    if (outcome.kind === 'BAD') return { state: outcome.state, reason: outcome.reason };
    if (intent.kind === 'MISSING') {
      return start.kind === 'MISSING' && outcome.kind === 'MISSING' ? { state: 'ABSENT' } : { state: 'CORRUPT', reason: 'ORPHAN_LIFECYCLE' };
    }
    const record = intent.value;
    if (record.operationKey !== key || !sameOwner(record.envelope.owner, owner)) return { state: 'CORRUPT', reason: 'KEY_MISMATCH' };
    const reservation = await this.readRecord(ops, dir, slotName(record.slot), ops.parseReservation);
    if (reservation.kind === 'BAD') return { state: reservation.state, reason: reservation.reason };
    if (reservation.kind === 'MISSING' || reservation.value.operationKey !== key || reservation.value.slot !== record.slot
      || reservation.value.configDigest !== record.envelope.config.configDigest || reservation.value.ownerSha256 !== ownerSha256(owner)) {
      return { state: 'CORRUPT', reason: 'RESERVATION_MISMATCH' };
    }
    if (start.kind === 'MISSING') {
      return outcome.kind === 'MISSING' ? { state: 'INTENT', intent: record } : { state: 'CORRUPT', reason: 'OUTCOME_WITHOUT_START' };
    }
    if (start.value.operationKey !== key || start.value.envelopeSha256 !== record.envelopeSha256 || start.value.attemptId !== record.envelope.attemptId) {
      return { state: 'CORRUPT', reason: 'START_MISMATCH' };
    }
    if (outcome.kind === 'MISSING') return { state: 'STARTED', intent: record, start: start.value };
    if (outcome.value.operationKey !== key || outcome.value.envelopeSha256 !== record.envelopeSha256
      || outcome.value.attemptId !== start.value.attemptId || outcome.value.startNonce !== start.value.startNonce) {
      return { state: 'CORRUPT', reason: 'OUTCOME_MISMATCH' };
    }
    return { state: 'OUTCOME', intent: record, start: start.value, outcome: outcome.value };
  }
  async readOperation(key: string, owner: DraftPrincipal): Promise<OperationState> { return await this.readWith(V1_CODEC, key, owner) as OperationState; }
  async readBoundOperation(key: string, owner: DraftPrincipal): Promise<BoundOperationState> { return await this.readWith(await loadBoundCodec(), key, owner) as BoundOperationState; }

  /** Bounded scan of the operations directory only. Unknown names deny; they are never ignored. */
  private async scanOperations(dir: string): Promise<{ kind: 'OK'; slots: Set<number> } | { kind: 'DENIED'; reason: OperationDenial }> {
    const entries = await fs.readdir(dir);
    if (entries.length > MAX_OPERATION_ENTRIES) return { kind: 'DENIED', reason: 'SCAN_BOUND_EXCEEDED' };
    const slots = new Set<number>();
    for (const entry of entries) {
      const slot = SLOT_FILE.exec(entry);
      if (slot && Number(slot[1]) < MAX_OPERATIONS_PER_OWNER) { slots.add(Number(slot[1])); continue; }
      if (!LIFECYCLE_FILE.test(entry)) return { kind: 'DENIED', reason: 'UNKNOWN_ENTRY' };
    }
    return { kind: 'OK', slots };
  }

  /** Claim one of 256 fixed numbered markers. A lost race moves on; a consumed marker is never released or recycled. */
  private async reserveSlot(ops: OperationCodec, dir: string, taken: Set<number>, envelope: BaseEnvelope): Promise<number | 'CAPACITY_FULL' | 'RESERVATION_UNCONFIRMED'> {
    for (let slot = 0; slot < MAX_OPERATIONS_PER_OWNER; slot++) {
      if (taken.has(slot)) continue;
      const bytes = ops.recordBytes(ops.makeReservation(slot, envelope.owner, envelope.operationKey, envelope.config.configDigest, this.clock()));
      if (!bytes) return 'RESERVATION_UNCONFIRMED';
      const result = await this.createOnce(dir, slotName(slot), bytes);
      if (result === 'EXISTS') continue;
      return result === 'CREATED' ? slot : 'RESERVATION_UNCONFIRMED';
    }
    return 'CAPACITY_FULL';
  }

  /** Existing-record lookup first (no new slot), then reservation, then the exclusive key/intent record. */
  private async admitWith(ops: OperationCodec, input: unknown, owner: DraftPrincipal): Promise<RawAdmit> {
    if (!this.enabled(ops.kind)) return { kind: 'DENIED', reason: 'DISABLED' };
    const envelope = ops.parseEnvelope(input);
    if (!envelope || !safePrincipal(owner) || !sameOwner(envelope.owner, owner)) return { kind: 'DENIED', reason: 'INVALID_INPUT' };
    const existing = await this.readWith(ops, envelope.operationKey, owner);
    if (existing.state === 'UNCONFIRMED' && existing.reason === 'UNSAFE_NAMESPACE') return { kind: 'DENIED', reason: 'UNSAFE_NAMESPACE' };
    if (existing.state !== 'ABSENT') return { kind: 'EXISTING', operation: existing };
    let dir: string | null;
    try { dir = await this.operationDirectory(owner, true, ops); }
    catch { return { kind: 'DENIED', reason: 'UNSAFE_NAMESPACE' }; }
    if (!dir) return { kind: 'DENIED', reason: 'UNSAFE_NAMESPACE' };
    let scan;
    try { scan = await this.scanOperations(dir); }
    catch { return { kind: 'DENIED', reason: 'LOOKUP_FAILED' }; }
    if (scan.kind === 'DENIED') return scan;
    const reserved = await this.reserveSlot(ops, dir, scan.slots, envelope);
    if (typeof reserved !== 'number') return { kind: 'DENIED', reason: reserved };
    const intent = ops.makeIntent(reserved, envelope, this.clock());
    const bytes = ops.recordBytes(intent);
    if (!bytes) return { kind: 'DENIED', reason: 'INVALID_INPUT' };
    const created = await this.createOnce(dir, lifecycleName(envelope.operationKey, 'intent'), bytes);
    if (created === 'CREATED') {
      const admission: OperationAdmission = Object.freeze({ kind: 'OPERATION_ADMISSION' as const });
      admissions.set(admission, { store: this, schema: ops.kind, owner: { ...owner }, operationKey: envelope.operationKey, envelopeSha256: intent.envelopeSha256,
        attemptId: envelope.attemptId, spent: false });
      return { kind: 'ADMITTED', intent, admission };
    }
    if (created === 'EXISTS') {
      const raced = await this.readWith(ops, envelope.operationKey, owner);
      return raced.state === 'ABSENT' ? { kind: 'DENIED', reason: 'LOOKUP_FAILED' } : { kind: 'EXISTING', operation: raced };
    }
    return { kind: 'DENIED', reason: 'INTENT_UNCONFIRMED' };
  }
  async admitOperation(input: unknown, owner: DraftPrincipal): Promise<AdmitResult> { return await this.admitWith(V1_CODEC, input, owner) as AdmitResult; }
  async admitBoundOperation(input: unknown, owner: DraftPrincipal): Promise<BoundAdmitResult> { return await this.admitWith(await loadBoundCodec(), input, owner) as BoundAdmitResult; }

  /** An admission of another schema is never spent by a mismatched call and never authorizes it. */
  private spendAdmission(admission: unknown, owner: DraftPrincipal, key: string, schema: OperationSchemaKind): AdmissionState | null {
    if (admission === null || typeof admission !== 'object') return null;
    const state = admissions.get(admission);
    if (!state || state.spent || state.store !== this || state.schema !== schema || state.operationKey !== key || owner === null || typeof owner !== 'object'
      || !sameOwner(state.owner, owner)) return null;
    state.spent = true;
    return state;
  }

  /**
   * Only the original ADMITTED caller can start, once. The admission is spent before the first await, so a failed, timed-out or lost start
   * never gives anyone a retry; a durable INTENT, a restart or another store instance cannot mint a grant. Durable start existence never does.
   */
  private async startWith(ops: OperationCodec, owner: DraftPrincipal, key: string, invoker: unknown, admission?: unknown): Promise<RawStart> {
    if (!this.enabled(ops.kind)) return { kind: 'DENIED', reason: 'DISABLED' };
    if (typeof invoker !== 'function') return { kind: 'DENIED', reason: 'INVALID_INPUT' };
    const authority = this.spendAdmission(admission, owner, key, ops.kind);
    const state = await this.readWith(ops, key, owner);
    if (state.state === 'ABSENT') return { kind: 'DENIED', reason: 'NO_INTENT' };
    if (state.state !== 'INTENT') return { kind: 'EXISTING', operation: state };
    if (!authority || authority.envelopeSha256 !== state.intent.envelopeSha256) return { kind: 'DENIED', reason: 'ADMISSION_REQUIRED' };
    let dir: string | null;
    try { dir = await this.operationDirectory(owner, false, ops); }
    catch { return { kind: 'DENIED', reason: 'UNSAFE_NAMESPACE' }; }
    if (!dir) return { kind: 'DENIED', reason: 'UNSAFE_NAMESPACE' };
    const start = ops.makeStart(state.intent.envelope, randomBytes(16).toString('hex'), this.clock());
    const bytes = ops.recordBytes(start);
    if (!bytes) return { kind: 'DENIED', reason: 'INVALID_INPUT' };
    const created = await this.createOnce(dir, lifecycleName(key, 'start'), bytes);
    if (created === 'EXISTS') {
      const raced = await this.readWith(ops, key, owner);
      return raced.state === 'ABSENT' ? { kind: 'DENIED', reason: 'LOOKUP_FAILED' } : { kind: 'EXISTING', operation: raced };
    }
    if (created !== 'CREATED') return { kind: 'DENIED', reason: 'START_UNCONFIRMED' };
    const grant: OperationGrant = Object.freeze({ kind: 'OPERATION_GRANT' as const });
    grants.set(grant, { store: this, schema: ops.kind, owner: { ...authority.owner }, operationKey: key, envelopeSha256: start.envelopeSha256, attemptId: start.attemptId,
      startNonce: start.startNonce, invoker, spent: false });
    return { kind: 'STARTED', grant };
  }
  async startOperation(owner: DraftPrincipal, key: string, invoker: unknown, admission?: unknown): Promise<StartResult> {
    return await this.startWith(V1_CODEC, owner, key, invoker, admission) as StartResult;
  }
  async startBoundOperation(owner: DraftPrincipal, key: string, invoker: unknown, admission?: unknown): Promise<BoundStartResult> {
    return await this.startWith(await loadBoundCodec(), owner, key, invoker, admission) as BoundStartResult;
  }

  /** Consume before invoke. A fabricated, copied, spent, foreign-store, other-schema, other-invoker or other-envelope grant returns null; a mismatch does not spend it. */
  private consumeWith(ops: OperationCodec, grant: unknown, invoker: unknown, envelope: unknown): ConsumedGrant | null {
    if (grant === null || typeof grant !== 'object') return null;
    const state = grants.get(grant);
    if (!state || state.spent || state.store !== this || state.schema !== ops.kind || state.invoker !== invoker) return null;
    let expected;
    try { expected = ops.parseEnvelope(envelope); } catch { return null; }
    if (!expected || ops.envelopeSha256(expected) !== state.envelopeSha256 || expected.operationKey !== state.operationKey
      || expected.attemptId !== state.attemptId || !sameOwner(expected.owner, state.owner)) return null;
    state.spent = true;
    const handle: ConsumedGrant = Object.freeze({ kind: 'CONSUMED_START' as const });
    consumedStarts.set(handle, { store: this, schema: ops.kind, owner: { ...state.owner }, operationKey: state.operationKey, envelopeSha256: state.envelopeSha256,
      attemptId: state.attemptId, startNonce: state.startNonce, result: null });
    return handle;
  }
  consumeGrant(grant: unknown, invoker: unknown, envelope: unknown): ConsumedGrant | null { return this.consumeWith(V1_CODEC, grant, invoker, envelope); }
  consumeBoundGrant(grant: unknown, invoker: unknown, envelope: unknown): ConsumedGrant | null { return boundCodec ? this.consumeWith(boundCodec, grant, invoker, envelope) : null; }

  /** The single immutable terminal record for a consumed start. The handle works once: a failed or unconfirmed write is never retried through it. */
  private async writeWith(ops: OperationCodec, handle: unknown, input: BaseReceiptInput): Promise<RawWrite> {
    const consumed = this.enabled(ops.kind) && handle !== null && typeof handle === 'object' ? consumedStarts.get(handle) : undefined;
    if (!consumed || consumed.store !== this || consumed.schema !== ops.kind) return { kind: 'UNAVAILABLE' };
    if (consumed.result !== null) return { kind: consumed.result === 'SAVED' || consumed.result === 'COLLISION' ? 'COLLISION' : 'UNAVAILABLE' };
    consumed.result = 'PENDING';
    let write: RawWrite;
    try { write = await this.writeConsumedOutcome(ops, consumed, input); } catch { write = { kind: 'UNAVAILABLE' }; }
    consumed.result = write.kind;
    return write;
  }
  async writeOutcome(handle: unknown, input: OutcomeInput): Promise<OutcomeWrite> { return await this.writeWith(V1_CODEC, handle, input) as OutcomeWrite; }
  async writeBoundOutcome(handle: unknown, input: BoundOutcomeInput): Promise<BoundOutcomeWrite> { return await this.writeWith(await loadBoundCodec(), handle, input) as BoundOutcomeWrite; }

  private async writeConsumedOutcome(ops: OperationCodec, consumed: ConsumedState, input: BaseReceiptInput): Promise<RawWrite> {
    if (!safePrincipal(consumed.owner) || !ops.receiptJoins(consumed.attemptId, input)) return { kind: 'UNAVAILABLE' };
    const state = await this.readWith(ops, consumed.operationKey, consumed.owner);
    if (state.state === 'OUTCOME') return { kind: 'COLLISION' };
    if (state.state !== 'STARTED' || state.start.startNonce !== consumed.startNonce || state.start.attemptId !== consumed.attemptId
      || state.start.envelopeSha256 !== consumed.envelopeSha256) return { kind: 'UNAVAILABLE' };
    const outcome = ops.parseOutcome(ops.makeOutcome(state.start, input, this.clock()));
    const bytes = outcome ? ops.recordBytes(outcome) : null;
    if (!outcome || !bytes) return { kind: 'UNAVAILABLE' };
    let dir: string | null;
    try { dir = await this.operationDirectory(consumed.owner, false, ops); }
    catch { return { kind: 'UNAVAILABLE' }; }
    if (!dir) return { kind: 'UNAVAILABLE' };
    const created = await this.createOnce(dir, lifecycleName(consumed.operationKey, 'outcome'), bytes);
    if (created === 'CREATED') return { kind: 'SAVED', outcome };
    return { kind: created === 'EXISTS' ? 'COLLISION' : created };
  }
}
