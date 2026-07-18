/**
 * SOT3-ACT-A2 - Durable Activation Evidence Store
 *
 * Dedicated, atomic, integrity-bound local-file store for SOT3 knowledge
 * activation evidence. Deliberately does not reuse the generic
 * `FileEventListAdapter` (direct write, silent corrupt-file repair) or the
 * knowledge store's `_persist` (swallows write failure) - A2 requires
 * explicit failure propagation, no silent repair, and same-identity
 * duplicate/conflict semantics that neither existing owner provides.
 *
 * Authorization: docs/work_orders/CVF_AGENT_WORK_ORDER_SOT3_ACT_A2_DURABLE_ACTIVATION_EVIDENCE_2026-07-13.md
 */
import { randomUUID, createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { Sot3KnowledgeActivationMode, Sot3KnowledgeLifecycleTrace, Sot3KnowledgeTerminalOutcome, Sot3KnowledgeFailureStage } from './sot3-knowledge-adapter';

/**
 * Injectable filesystem port. Route/unit tests supply a fake implementation
 * so store tests never touch shared workspace evidence and so write/rename
 * failure can be injected deterministically without ESM-unmockable
 * `node:fs` named exports.
 */
export interface Sot3EvidenceFsPort {
  existsSync(path: string): boolean;
  mkdirSync(path: string, options: { recursive: true }): void;
  readFileSync(path: string, encoding: 'utf8'): string;
  writeFileSync(path: string, content: string, encoding: 'utf8'): void;
  renameSync(oldPath: string, newPath: string): void;
  unlinkSync(path: string): void;
}

export const nodeFsPort: Sot3EvidenceFsPort = {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
  unlinkSync,
};

export const SOT3_ACTIVATION_EVIDENCE_SCHEMA_VERSION = 'cvf.sot3.activation-evidence.v1';

export type Sot3EvidenceDiagnosticClass =
  | 'PERSISTED'
  | 'DUPLICATE_NOOP'
  | 'SOT3_EVIDENCE_DUPLICATE_CONFLICT'
  | 'SOT3_EVIDENCE_CORRUPT_STORE'
  | 'SOT3_EVIDENCE_RECORD_INTEGRITY_FAILED'
  | 'SOT3_EVIDENCE_PERSISTENCE_FAILED';

export interface Sot3ActivationEvidenceRecord {
  recordId: string;
  requestId: string;
  actorId: string;
  organization: string;
  team: string | null;
  mode: Sot3KnowledgeActivationMode;
  terminalOutcome: Sot3KnowledgeTerminalOutcome;
  failureStage: Sot3KnowledgeFailureStage | null;
  createdAtUtc: string;
  diagnosticClass: 'PERSISTED';
  schemaVersion: typeof SOT3_ACTIVATION_EVIDENCE_SCHEMA_VERSION;
  traces: Sot3KnowledgeLifecycleTrace[];
  integrityHash: string;
}

interface Sot3ActivationEvidenceDocument {
  schemaVersion: typeof SOT3_ACTIVATION_EVIDENCE_SCHEMA_VERSION;
  records: Sot3ActivationEvidenceRecord[];
}

export class Sot3EvidenceCorruptStoreError extends Error {
  constructor(message: string) {
    super(`SOT3_EVIDENCE_CORRUPT_STORE: ${message}`);
    this.name = 'Sot3EvidenceCorruptStoreError';
  }
}

export class Sot3EvidenceDuplicateConflictError extends Error {
  constructor(recordId: string) {
    super(`SOT3_EVIDENCE_DUPLICATE_CONFLICT: record ${recordId} already exists with a different integrity hash`);
    this.name = 'Sot3EvidenceDuplicateConflictError';
  }
}

export class Sot3EvidencePersistenceFailedError extends Error {
  constructor(cause: unknown) {
    super(`SOT3_EVIDENCE_PERSISTENCE_FAILED: ${cause instanceof Error ? cause.message : String(cause)}`);
    this.name = 'Sot3EvidencePersistenceFailedError';
    this.cause = cause;
  }
}

export class Sot3EvidenceRecordIntegrityError extends Error {
  constructor(message: string) {
    super(`SOT3_EVIDENCE_RECORD_INTEGRITY_FAILED: ${message}`);
    this.name = 'Sot3EvidenceRecordIntegrityError';
  }
}

export function classifySot3EvidenceError(error: unknown): Exclude<Sot3EvidenceDiagnosticClass, 'PERSISTED' | 'DUPLICATE_NOOP'> {
  if (error instanceof Sot3EvidenceDuplicateConflictError) return 'SOT3_EVIDENCE_DUPLICATE_CONFLICT';
  if (error instanceof Sot3EvidenceCorruptStoreError) return 'SOT3_EVIDENCE_CORRUPT_STORE';
  if (error instanceof Sot3EvidenceRecordIntegrityError) return 'SOT3_EVIDENCE_RECORD_INTEGRITY_FAILED';
  return 'SOT3_EVIDENCE_PERSISTENCE_FAILED';
}

/** Deterministic record identity from the request-level activation identity only. */
export function deriveSot3EvidenceRecordId(input: {
  requestId: string;
  actorId: string;
  organization: string;
  team: string | null;
  mode: Sot3KnowledgeActivationMode;
}): string {
  const projection = {
    requestId: input.requestId,
    actorId: input.actorId,
    organization: input.organization,
    team: input.team ?? null,
    mode: input.mode,
  };
  const preimage = canonicalStringify(projection);
  return `SOT3EV-${createHash('sha256').update(preimage, 'utf8').digest('hex').slice(0, 32)}`;
}

/** Stable key-sorted JSON serialization used for both record identity and integrity hashing. */
function canonicalStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => canonicalStringify(item)).join(',')}]`;
  const record = value as Record<string, unknown>;
  const sortedKeys = Object.keys(record).sort();
  const parts = sortedKeys.map((key) => `${JSON.stringify(key)}:${canonicalStringify(record[key])}`);
  return `{${parts.join(',')}}`;
}

/** Computes the record integrity hash, excluding `integrityHash` and `recordId` from its own projection. */
export function computeSot3EvidenceRecordIntegrityHash(record: Omit<Sot3ActivationEvidenceRecord, 'integrityHash'>): string {
  const preimage = canonicalStringify(record);
  return `sha256:${createHash('sha256').update(preimage, 'utf8').digest('hex')}`;
}

function verifyRecordIntegrity(record: Sot3ActivationEvidenceRecord): boolean {
  const { integrityHash, ...rest } = record;
  return computeSot3EvidenceRecordIntegrityHash(rest) === integrityHash;
}

function hasExactKeys(value: object, expected: string[]): boolean {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function hasStringFields(value: Record<string, unknown>, fields: string[]): boolean {
  return fields.every((field) => typeof value[field] === 'string');
}

const FAILURE_STAGES = [
  'NO_CHUNKS', 'MISSING_PROVENANCE', 'REFINERY_NOT_READY', 'KERNEL_NOT_ACCEPTED',
  'REFERENCE_NOT_ACTIVE', 'FLOW_NOT_CREATED', 'FLOW_DELIVERY_REJECTED',
  'FLOW_CONSUMPTION_REJECTED', 'FLOW_ACKNOWLEDGEMENT_REJECTED',
  'EVIDENCE_PERSISTENCE_FAILED',
] as const;

function recordSchemaIssue(record: unknown): string | null {
  if (typeof record !== 'object' || record === null || Array.isArray(record)) return 'record is not an object';
  const candidate = record as Record<string, unknown>;
  if (!hasExactKeys(candidate, [
    'recordId', 'requestId', 'actorId', 'organization', 'team', 'mode',
    'terminalOutcome', 'failureStage', 'createdAtUtc', 'diagnosticClass',
    'schemaVersion', 'traces', 'integrityHash',
  ])) return 'record keys do not match the v1 schema';
  if (typeof candidate.recordId !== 'string' || typeof candidate.requestId !== 'string' ||
      typeof candidate.actorId !== 'string' || typeof candidate.organization !== 'string') return 'record identity or scope field is invalid';
  if (candidate.team !== null && typeof candidate.team !== 'string') return 'team must be a string or null';
  if (!['OFF', 'SHADOW', 'ENFORCE'].includes(String(candidate.mode))) return 'activation mode is invalid';
  if (!['APPROVED', 'REJECTED', 'NO_CONTEXT'].includes(String(candidate.terminalOutcome))) return 'terminal outcome is invalid';
  if (candidate.failureStage !== null && !FAILURE_STAGES.includes(candidate.failureStage as typeof FAILURE_STAGES[number])) return 'failure stage is invalid';
  if (typeof candidate.createdAtUtc !== 'string') return 'createdAtUtc is invalid';
  if (candidate.diagnosticClass !== 'PERSISTED') return 'persisted record diagnostic class must be PERSISTED';
  if (candidate.schemaVersion !== SOT3_ACTIVATION_EVIDENCE_SCHEMA_VERSION) return 'record schema version is invalid';
  if (typeof candidate.integrityHash !== 'string' || !/^sha256:[0-9a-f]{64}$/.test(candidate.integrityHash)) return 'integrity hash format is invalid';
  if (!Array.isArray(candidate.traces)) return 'traces must be an array';

  for (const [index, traceValue] of candidate.traces.entries()) {
    if (typeof traceValue !== 'object' || traceValue === null || Array.isArray(traceValue)) return `trace ${index} is not an object`;
    const trace = traceValue as Record<string, unknown>;
    if (!hasExactKeys(trace, [
      'chunkId', 'collectionId', 'sourceId', 'terminalOutcome', 'failureStage',
      'refineryPacketId', 'refineryPacketHash', 'refineryStatus',
      'kernelDecision', 'truthReceipt', 'truthReference', 'flowPackage',
    ])) return `trace ${index} keys do not match the v1 schema`;
    if (typeof trace.chunkId !== 'string' || typeof trace.collectionId !== 'string') return `trace ${index} identity is invalid`;
    for (const key of ['sourceId', 'failureStage', 'refineryPacketId', 'refineryPacketHash', 'refineryStatus']) {
      if (trace[key] !== null && typeof trace[key] !== 'string') return `trace ${index} ${key} must be a string or null`;
    }
    if (trace.failureStage !== null && !FAILURE_STAGES.includes(trace.failureStage as typeof FAILURE_STAGES[number])) return `trace ${index} failure stage is invalid`;
    if (!['APPROVED', 'REJECTED', 'NO_CONTEXT'].includes(String(trace.terminalOutcome))) return `trace ${index} terminal outcome is invalid`;

    if (trace.kernelDecision !== null) {
      if (typeof trace.kernelDecision !== 'object' || Array.isArray(trace.kernelDecision)) return `trace ${index} Kernel decision is invalid`;
      const decision = trace.kernelDecision as Record<string, unknown>;
      if (!hasExactKeys(decision, ['decision_id', 'request_id', 'packet_hash', 'decision', 'reasons', 'failed_obligations', 'verification_result_refs', 'policy_version', 'rule_version', 'decided_at_utc']) ||
          !hasStringFields(decision, ['decision_id', 'request_id', 'packet_hash', 'decision', 'policy_version', 'rule_version', 'decided_at_utc']) ||
          !isStringArray(decision.reasons) || !isStringArray(decision.failed_obligations) || !isStringArray(decision.verification_result_refs)) return `trace ${index} Kernel decision does not match its owner schema`;
    }
    if (trace.truthReceipt !== null) {
      if (typeof trace.truthReceipt !== 'object' || Array.isArray(trace.truthReceipt)) return `trace ${index} Truth receipt is invalid`;
      const receipt = trace.truthReceipt as Record<string, unknown>;
      if (!hasExactKeys(receipt, ['receipt_id', 'evaluated_content_hash', 'decision_id', 'decision', 'evidence_refs', 'obligation_refs', 'verification_result_refs', 'policy_version', 'rule_version', 'decided_at_utc', 'issued_at_utc', 'predecessor_receipt_hash', 'receipt_hash', 'status']) ||
          !hasStringFields(receipt, ['receipt_id', 'evaluated_content_hash', 'decision_id', 'decision', 'policy_version', 'rule_version', 'decided_at_utc', 'issued_at_utc', 'receipt_hash', 'status']) ||
          (receipt.predecessor_receipt_hash !== null && typeof receipt.predecessor_receipt_hash !== 'string') ||
          !isStringArray(receipt.evidence_refs) || !isStringArray(receipt.obligation_refs) || !isStringArray(receipt.verification_result_refs)) return `trace ${index} Truth receipt does not match its owner schema`;
    }
    if (trace.truthReference !== null) {
      if (typeof trace.truthReference !== 'object' || Array.isArray(trace.truthReference) ||
          !hasExactKeys(trace.truthReference, ['reference_id', 'receipt_id', 'scope', 'version', 'valid_from_utc', 'valid_until_utc', 'reference_state']) ||
          !hasStringFields(trace.truthReference as Record<string, unknown>, ['reference_id', 'receipt_id', 'scope', 'version', 'valid_from_utc', 'valid_until_utc', 'reference_state'])) return `trace ${index} Truth reference does not match its owner schema`;
    }
    if (trace.flowPackage !== null) {
      if (typeof trace.flowPackage !== 'object' || Array.isArray(trace.flowPackage)) return `trace ${index} Flow package is invalid`;
      const flow = trace.flowPackage as Record<string, unknown>;
      if (!hasExactKeys(flow, ['package_id', 'recipient', 'role', 'task', 'phase', 'truth_references', 'dose', 'restrictions', 'expiry_utc', 'routing_decision', 'acknowledgement_state']) ||
          !hasStringFields(flow, ['package_id', 'recipient', 'role', 'task', 'phase', 'dose', 'expiry_utc', 'routing_decision', 'acknowledgement_state']) ||
          !isStringArray(flow.truth_references) || !isStringArray(flow.restrictions)) return `trace ${index} Flow package does not match its owner schema`;
    }
  }
  return null;
}

function resolveStorePath(configuredPath: string | undefined): string {
  const trimmed = configuredPath?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : join(process.cwd(), '.cvf', 'runtime', 'sot3-activation-evidence.json');
}

function parseDocument(raw: string, storePath: string): Sot3ActivationEvidenceDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Sot3EvidenceCorruptStoreError(`main file at ${storePath} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !hasExactKeys(parsed, ['schemaVersion', 'records']) ||
    !('schemaVersion' in parsed) ||
    (parsed as { schemaVersion?: unknown }).schemaVersion !== SOT3_ACTIVATION_EVIDENCE_SCHEMA_VERSION ||
    !Array.isArray((parsed as { records?: unknown }).records)
  ) {
    throw new Sot3EvidenceCorruptStoreError(`main file at ${storePath} does not match schema ${SOT3_ACTIVATION_EVIDENCE_SCHEMA_VERSION}`);
  }
  const document = parsed as Sot3ActivationEvidenceDocument;
  for (const record of document.records) {
    const issue = recordSchemaIssue(record);
    if (issue) {
      throw new Sot3EvidenceCorruptStoreError(`record in ${storePath} failed schema validation: ${issue}`);
    }
    if (!verifyRecordIntegrity(record)) {
      throw new Sot3EvidenceCorruptStoreError(`record ${record.recordId ?? '<unknown>'} in ${storePath} failed integrity verification`);
    }
  }
  return document;
}

/**
 * Dedicated atomic, integrity-bound local-file evidence store. Every append
 * call is process-local-serialized via an internal promise chain so
 * concurrent local appends cannot lose an update. Reads and writes always
 * verify per-record integrity; a corrupt or unverifiable main file throws
 * and preserves its exact bytes.
 */
export class Sot3ActivationEvidenceStore {
  private readonly storePath: string;
  private readonly fs: Sot3EvidenceFsPort;
  private appendQueue: Promise<unknown> = Promise.resolve();

  constructor(configuredPath?: string, fsPort: Sot3EvidenceFsPort = nodeFsPort) {
    this.storePath = resolveStorePath(configuredPath);
    this.fs = fsPort;
  }

  private readDocument(): Sot3ActivationEvidenceDocument {
    if (!this.fs.existsSync(this.storePath)) {
      return { schemaVersion: SOT3_ACTIVATION_EVIDENCE_SCHEMA_VERSION, records: [] };
    }
    const raw = this.fs.readFileSync(this.storePath, 'utf8');
    return parseDocument(raw, this.storePath);
  }

  private writeDocumentAtomic(document: Sot3ActivationEvidenceDocument): void {
    const dir = dirname(this.storePath);
    try {
      this.fs.mkdirSync(dir, { recursive: true });
    } catch (error) {
      throw new Sot3EvidencePersistenceFailedError(error);
    }
    const tempPath = join(dir, `.sot3-activation-evidence.${randomUUID()}.tmp`);
    try {
      this.fs.writeFileSync(tempPath, canonicalStringify(document), 'utf8');
      this.fs.renameSync(tempPath, this.storePath);
    } catch (error) {
      try {
        if (this.fs.existsSync(tempPath)) this.fs.unlinkSync(tempPath);
      } catch {
        // best-effort temp cleanup only; the original error is what propagates
      }
      throw new Sot3EvidencePersistenceFailedError(error);
    }
  }

  /**
   * Appends one record. Same identity + same integrity hash is an
   * idempotent no-op (`DUPLICATE_NOOP`, no main-file mutation). Same
   * identity + different integrity hash throws
   * `Sot3EvidenceDuplicateConflictError` without mutating the main file. A
   * write or rename failure throws `Sot3EvidencePersistenceFailedError` and
   * leaves prior valid main bytes unchanged. Serialized within this process
   * via an internal queue so concurrent local callers cannot lose a record.
   */
  append(record: Sot3ActivationEvidenceRecord): Promise<{ diagnosticClass: Sot3EvidenceDiagnosticClass }> {
    const run = async (): Promise<{ diagnosticClass: Sot3EvidenceDiagnosticClass }> => {
      const issue = recordSchemaIssue(record);
      if (issue) throw new Sot3EvidenceRecordIntegrityError(issue);
      if (!verifyRecordIntegrity(record)) throw new Sot3EvidenceRecordIntegrityError(`record ${record.recordId} hash does not match its canonical projection`);
      const document = this.readDocument();
      const existing = document.records.find((item) => item.recordId === record.recordId);
      if (existing) {
        if (existing.integrityHash === record.integrityHash) {
          return { diagnosticClass: 'DUPLICATE_NOOP' };
        }
        throw new Sot3EvidenceDuplicateConflictError(record.recordId);
      }
      const next: Sot3ActivationEvidenceDocument = {
        schemaVersion: SOT3_ACTIVATION_EVIDENCE_SCHEMA_VERSION,
        records: [...document.records, record].sort((left, right) => left.recordId.localeCompare(right.recordId)),
      };
      this.writeDocumentAtomic(next);
      return { diagnosticClass: 'PERSISTED' };
    };

    const result = this.appendQueue.then(run, run);
    this.appendQueue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  /** Retrieves a record by record ID. Returns `undefined` if not found. */
  findByRecordId(recordId: string): Sot3ActivationEvidenceRecord | undefined {
    return this.readDocument().records.find((item) => item.recordId === recordId);
  }

  /** Retrieves every record for a given request ID. */
  findByRequestId(requestId: string): Sot3ActivationEvidenceRecord[] {
    return this.readDocument().records.filter((item) => item.requestId === requestId);
  }

  /** Returns every record currently in the store, in document order. */
  list(): Sot3ActivationEvidenceRecord[] {
    return this.readDocument().records;
  }
}
