// CVF MAO-T7 - Evidence, Observability, And Operator Readout Contract
//
// Implements the secret-safe local evidence ledger, deterministic read-model
// projection, retention/freshness policy, and milestone-only workspace
// projection defined by
// docs/reference/multi_agent_orchestration/CVF_MAO_RUNTIME_FOUNDATION_CONTRACT.md
// ("Evidence And Receipt Model", "Storage And Retention Decision": "Retention
// | receipts retained for the life of the governed batch plus closure
// evidence window; long-term retention policy is MAO-T7 scope" and
// "Workspace projection | lifecycle milestones only (graph created, admitted,
// terminal outcome, closure); no per-heartbeat mirroring") and
// `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_TOPOLOGY_CONTRACT.md`
// (workspace state remains a read-only projection; the execution-plane
// ledger owns runtime evidence). Local execution-plane module only; no
// provider, queue, UI, or workspace/session state mutation. Secrets are
// never accepted as receipt content: every ingested record is redacted
// before storage, per the contract's "adapters must redact before receipt
// emission" rule.

import { computeDeterministicHash } from "../../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Receipt kind vocabulary (mirrors the contract's Evidence And Receipt Model) ---

/**
 * The six receipt kinds named by the contract's Evidence And Receipt Model
 * section. This module does not redefine their shapes (graph, role
 * resolution, invocation, output, review, and integration receipts are
 * owned by their respective MAO-T1/T2/T3/T4/T5 contracts); it stores a
 * secret-safe evidence record per emitted receipt, keyed by this kind.
 */
export type MaoReceiptKind =
  | "GRAPH"
  | "ROLE_RESOLUTION"
  | "INVOCATION"
  | "OUTPUT"
  | "REVIEW"
  | "INTEGRATION";

export const MAO_MILESTONE_RECEIPT_KINDS: ReadonlySet<MaoReceiptKind> = new Set([
  "GRAPH",
  "ROLE_RESOLUTION",
  "INTEGRATION",
]);

// --- Secret-safe redaction ---

/**
 * Field names that are always dropped from an ingested record before it is
 * stored as evidence, regardless of case. Per the contract: "Raw prompts,
 * secrets, provider-private memory, and unrestricted model traces are not
 * required receipt content. Evidence must be secret-safe." This is a
 * denylist, not a heuristic scanner: any field not enumerated here that also
 * looks like a secret must be excluded by the caller before it ever reaches
 * `ingestReceiptEvidence`, since this module has no visibility into runtime
 * secret material.
 */
const ALWAYS_REDACTED_FIELD_NAMES: ReadonlySet<string> = new Set([
  "rawprompt",
  "prompt",
  "secret",
  "secrets",
  "apikey",
  "api_key",
  "token",
  "accesstoken",
  "access_token",
  "bearer",
  "password",
  "credential",
  "credentials",
  "providertrace",
  "provider_trace",
  "modeltrace",
  "model_trace",
  "sessionmemory",
  "session_memory",
  "privatememory",
  "private_memory",
]);

export interface MaoRedactionResult {
  readonly redactedFields: readonly string[];
  readonly safeFields: Readonly<Record<string, string>>;
}

function isRedactedFieldName(name: string): boolean {
  return ALWAYS_REDACTED_FIELD_NAMES.has(name.trim().toLowerCase().replace(/[\s-]+/g, "_").replace(/_/g, ""));
}

/**
 * Redact a flat field map before it is allowed into an evidence record.
 * Every key whose normalized name matches the denylist is dropped entirely
 * (not masked) so a redacted field can never leak partial secret content
 * through its value. Redacted field names are recorded (not their values)
 * so the evidence record can prove what was excluded without reproducing
 * excluded content.
 */
export function redactFields(fields: Readonly<Record<string, string>>): MaoRedactionResult {
  const redactedFields: string[] = [];
  const safeFields: Record<string, string> = {};
  for (const key of Object.keys(fields).sort()) {
    if (isRedactedFieldName(key)) {
      redactedFields.push(key);
      continue;
    }
    safeFields[key] = fields[key];
  }
  return Object.freeze({
    redactedFields: Object.freeze(redactedFields),
    safeFields: Object.freeze(safeFields),
  });
}

// --- Evidence record and ledger ---

/**
 * One secret-safe evidence record derived from an emitted receipt. The
 * record never stores the raw receipt object; it stores a deterministic
 * content hash plus the already-redacted field map, so the ledger can prove
 * a receipt existed and was consistent without ever holding secret material.
 */
export interface MaoEvidenceRecord {
  readonly evidenceId: string;
  readonly taskGraphId: string;
  readonly taskId: string | null;
  readonly receiptKind: MaoReceiptKind;
  readonly receiptContentHash: string;
  readonly redactedFieldCount: number;
  readonly safeFields: Readonly<Record<string, string>>;
  readonly recordedAt: string;
  readonly sequence: number;
}

export interface MaoIngestReceiptEvidenceInput {
  taskGraphId: string;
  taskId: string | null;
  receiptKind: MaoReceiptKind;
  /** Every field this receipt carries; redaction is applied before storage. */
  fields: Readonly<Record<string, string>>;
  recordedAt: string;
}

export type MaoIngestEvidenceFailureReason =
  | "EMPTY_TASK_GRAPH_ID"
  | "TASK_GRAPH_ID_MISMATCH"
  | "EMPTY_RECORDED_AT";

export type MaoIngestEvidenceResult =
  | { readonly ok: true; readonly record: MaoEvidenceRecord; readonly redaction: MaoRedactionResult }
  | { readonly ok: false; readonly reason: MaoIngestEvidenceFailureReason; readonly detail: string };

/**
 * Append-only, in-memory, secret-safe evidence ledger. One ledger instance
 * is bound to a single task graph. Every ingested receipt is redacted
 * before it is stored; nothing pushed through `ingest` is ever retrievable
 * in raw form from this ledger.
 */
export class MaoEvidenceLedger {
  private readonly records: MaoEvidenceRecord[] = [];
  private sequenceCounter = 0;
  private readonly taskGraphId: string;

  constructor(taskGraphId: string) {
    this.taskGraphId = taskGraphId;
  }

  /**
   * Redact and store one receipt's evidence. Returns the stored record and
   * the redaction result (which fields were dropped) so the caller can
   * assert secret-safety without re-reading ledger internals.
   */
  ingest(input: MaoIngestReceiptEvidenceInput): MaoIngestEvidenceResult {
    if (!input.taskGraphId || input.taskGraphId.trim().length === 0) {
      return { ok: false, reason: "EMPTY_TASK_GRAPH_ID", detail: "evidence ingestion requires a non-empty taskGraphId" };
    }
    if (input.taskGraphId !== this.taskGraphId) {
      return {
        ok: false,
        reason: "TASK_GRAPH_ID_MISMATCH",
        detail: `evidence taskGraphId ${input.taskGraphId} does not match ledger taskGraphId ${this.taskGraphId}`,
      };
    }
    if (!input.recordedAt || input.recordedAt.trim().length === 0) {
      return { ok: false, reason: "EMPTY_RECORDED_AT", detail: "evidence ingestion requires a non-empty recordedAt timestamp" };
    }

    const redaction = redactFields(input.fields);
    this.sequenceCounter += 1;

    const receiptContentHash = computeDeterministicHash(
      "mao-t7-receipt-content",
      input.taskGraphId,
      input.taskId ?? "no-task",
      input.receiptKind,
      Object.keys(redaction.safeFields)
        .sort()
        .map((key) => `${key}=${redaction.safeFields[key]}`)
        .join("|"),
    );

    const evidenceId = computeDeterministicHash(
      "mao-t7-evidence-id",
      input.taskGraphId,
      input.taskId ?? "no-task",
      input.receiptKind,
      receiptContentHash,
      String(this.sequenceCounter),
    );

    const record: MaoEvidenceRecord = Object.freeze({
      evidenceId,
      taskGraphId: input.taskGraphId,
      taskId: input.taskId,
      receiptKind: input.receiptKind,
      receiptContentHash,
      redactedFieldCount: redaction.redactedFields.length,
      safeFields: redaction.safeFields,
      recordedAt: input.recordedAt,
      sequence: this.sequenceCounter,
    });

    this.records.push(record);
    return { ok: true, record, redaction };
  }

  getRecords(): readonly MaoEvidenceRecord[] {
    return Object.freeze([...this.records]);
  }

  getTaskGraphId(): string {
    return this.taskGraphId;
  }
}

// --- Deterministic read-model projection ---

/**
 * Compact, deterministic operator readout generated fresh from the evidence
 * ledger's records. Per the contract's Storage And Retention Decision, this
 * is a "deterministic generated aggregate, regenerated from the event
 * ledger" - it is never hand-edited and never itself treated as execution
 * truth. Mirrors the MAO-T1 read-model discipline (`buildReadModel` in
 * `read.model.contract.ts`) applied to receipt evidence instead of task
 * lifecycle state.
 */
export interface MaoEvidenceReadout {
  readonly taskGraphId: string;
  readonly generatedAt: string;
  readonly receiptCountByKind: Readonly<Record<MaoReceiptKind, number>>;
  readonly totalReceipts: number;
  readonly totalRedactedFields: number;
  readonly lastEvidenceId: string | null;
  readonly lastRecordedAt: string | null;
}

const RECEIPT_KIND_ORDER: readonly MaoReceiptKind[] = [
  "GRAPH",
  "ROLE_RESOLUTION",
  "INVOCATION",
  "OUTPUT",
  "REVIEW",
  "INTEGRATION",
];

function emptyReceiptCountByKind(): Record<MaoReceiptKind, number> {
  const counts = {} as Record<MaoReceiptKind, number>;
  for (const kind of RECEIPT_KIND_ORDER) {
    counts[kind] = 0;
  }
  return counts;
}

/**
 * Build the operator readout by folding the ledger's evidence records, in
 * ascending `sequence` order, into per-kind counts and a last-activity
 * pointer. Given the same records, this always returns an identical readout
 * except for `generatedAt` (see `readoutsAreEqual`).
 */
export function buildEvidenceReadout(
  ledger: MaoEvidenceLedger,
  generatedAt: string,
): MaoEvidenceReadout {
  const sortedRecords = [...ledger.getRecords()].sort((a, b) => a.sequence - b.sequence);

  const receiptCountByKind = emptyReceiptCountByKind();
  let totalRedactedFields = 0;
  for (const record of sortedRecords) {
    receiptCountByKind[record.receiptKind] += 1;
    totalRedactedFields += record.redactedFieldCount;
  }

  const last = sortedRecords.length > 0 ? sortedRecords[sortedRecords.length - 1] : null;

  return Object.freeze({
    taskGraphId: ledger.getTaskGraphId(),
    generatedAt,
    receiptCountByKind: Object.freeze(receiptCountByKind),
    totalReceipts: sortedRecords.length,
    totalRedactedFields,
    lastEvidenceId: last ? last.evidenceId : null,
    lastRecordedAt: last ? last.recordedAt : null,
  }) as MaoEvidenceReadout;
}

/**
 * Structural equality for two readouts, ignoring `generatedAt` (expected to
 * differ between replay runs taken at different wall-clock times) but
 * comparing every count and the last-activity pointer.
 */
export function readoutsAreEqual(a: MaoEvidenceReadout, b: MaoEvidenceReadout): boolean {
  if (a.taskGraphId !== b.taskGraphId) return false;
  if (a.totalReceipts !== b.totalReceipts) return false;
  if (a.totalRedactedFields !== b.totalRedactedFields) return false;
  if (a.lastEvidenceId !== b.lastEvidenceId) return false;
  if (a.lastRecordedAt !== b.lastRecordedAt) return false;
  for (const kind of RECEIPT_KIND_ORDER) {
    if (a.receiptCountByKind[kind] !== b.receiptCountByKind[kind]) return false;
  }
  return true;
}

// --- Retention policy ---

/**
 * Retention decision for a single evidence record, evaluated against the
 * contract's "receipts retained for the life of the governed batch plus
 * closure evidence window" rule. `batchClosedAt` is null while the governed
 * batch (task graph) is still open; retention never expires before closure.
 */
export type MaoRetentionDecision = "RETAIN" | "RETAIN_WITHIN_CLOSURE_WINDOW" | "ELIGIBLE_FOR_EXPIRY";

export interface MaoRetentionPolicyInput {
  record: MaoEvidenceRecord;
  batchClosedAt: string | null;
  closureEvidenceWindowMs: number;
  evaluatedAt: string;
}

/**
 * Evaluate retention for one record. The batch's life (open, no
 * `batchClosedAt`) always retains every record. After closure, records stay
 * retained through the closure evidence window; only records evaluated
 * strictly after the window has elapsed become eligible for expiry. This
 * function never deletes anything; it only classifies, per the contract's
 * append-only ledger discipline - expiry is a downstream operator decision.
 */
export function evaluateRetention(input: MaoRetentionPolicyInput): MaoRetentionDecision {
  if (input.batchClosedAt === null) {
    return "RETAIN";
  }
  const closedAtMs = new Date(input.batchClosedAt).getTime();
  const evaluatedAtMs = new Date(input.evaluatedAt).getTime();
  const elapsedSinceClosureMs = evaluatedAtMs - closedAtMs;
  if (elapsedSinceClosureMs <= input.closureEvidenceWindowMs) {
    return "RETAIN_WITHIN_CLOSURE_WINDOW";
  }
  return "ELIGIBLE_FOR_EXPIRY";
}

// --- Freshness policy ---

/**
 * Freshness classification for a readout relative to its ledger's most
 * recent evidence. A readout generated well after the last recorded receipt
 * (beyond `staleAfterMs`) is stale and must be regenerated before an
 * operator treats it as current, matching the read-model discipline that
 * the readout is "always rebuilt fresh" rather than cached indefinitely.
 */
export type MaoFreshnessClass = "CURRENT" | "STALE" | "NO_EVIDENCE_YET";

export function classifyReadoutFreshness(
  readout: MaoEvidenceReadout,
  staleAfterMs: number,
  evaluatedAt: string,
): MaoFreshnessClass {
  if (readout.lastRecordedAt === null) {
    return "NO_EVIDENCE_YET";
  }
  const lastMs = new Date(readout.lastRecordedAt).getTime();
  const evaluatedAtMs = new Date(evaluatedAt).getTime();
  const staleness = evaluatedAtMs - lastMs;
  if (staleness > staleAfterMs) {
    return "STALE";
  }
  return "CURRENT";
}

// --- Milestone-only workspace projection ---

/**
 * Milestone kind vocabulary, matching the contract's Storage And Retention
 * Decision literally: "Workspace projection | lifecycle milestones only
 * (graph created, admitted, terminal outcome, closure); no per-heartbeat
 * mirroring." Any receipt kind not covered by `milestoneForReceiptKind`
 * never reaches the workspace projection.
 */
export type MaoWorkspaceMilestoneKind =
  | "GRAPH_CREATED"
  | "TASK_ADMITTED"
  | "TERMINAL_OUTCOME"
  | "CLOSURE";

export interface MaoWorkspaceMilestoneProjection {
  readonly milestoneKind: MaoWorkspaceMilestoneKind;
  readonly taskGraphId: string;
  readonly taskId: string | null;
  readonly evidenceId: string;
  readonly recordedAt: string;
}

/**
 * Map a receipt kind (plus an optional terminal-outcome flag for invocation/
 * output receipts) to its workspace milestone kind, or null when the
 * receipt kind must never reach the workspace projection. Per the AHB
 * workspace topology contract, workspace state is a read-only projection
 * only; this function performs no I/O and never writes to any workspace
 * path itself.
 */
export function milestoneForReceiptKind(
  receiptKind: MaoReceiptKind,
  isTerminalOutcome: boolean,
): MaoWorkspaceMilestoneKind | null {
  switch (receiptKind) {
    case "GRAPH":
      return "GRAPH_CREATED";
    case "ROLE_RESOLUTION":
      return "TASK_ADMITTED";
    case "INTEGRATION":
      return "CLOSURE";
    case "OUTPUT":
    case "REVIEW":
      return isTerminalOutcome ? "TERMINAL_OUTCOME" : null;
    case "INVOCATION":
      return null;
    default:
      return null;
  }
}

/**
 * Build the bounded list of milestone projections for a ledger's records.
 * Every non-milestone record (including every INVOCATION receipt, which the
 * contract explicitly excludes as "no per-heartbeat mirroring") is skipped.
 * This function returns a plain projection value; it performs no workspace
 * file write, matching the AHB workspace topology contract's read-only
 * projection boundary.
 */
export function projectWorkspaceMilestones(
  ledger: MaoEvidenceLedger,
  terminalOutcomeEvidenceIds: ReadonlySet<string>,
): readonly MaoWorkspaceMilestoneProjection[] {
  const sortedRecords = [...ledger.getRecords()].sort((a, b) => a.sequence - b.sequence);
  const projections: MaoWorkspaceMilestoneProjection[] = [];

  for (const record of sortedRecords) {
    const milestoneKind = milestoneForReceiptKind(
      record.receiptKind,
      terminalOutcomeEvidenceIds.has(record.evidenceId),
    );
    if (milestoneKind === null) continue;
    projections.push(
      Object.freeze({
        milestoneKind,
        taskGraphId: record.taskGraphId,
        taskId: record.taskId,
        evidenceId: record.evidenceId,
        recordedAt: record.recordedAt,
      }),
    );
  }

  return Object.freeze(projections);
}
