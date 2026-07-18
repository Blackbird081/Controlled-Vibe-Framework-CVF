// CVF MAO-T3 - Provider-Neutral Delegation Adapter
//
// Implements the fake/local invocation port defined by
// docs/reference/multi_agent_orchestration/CVF_MAO_RUNTIME_FOUNDATION_CONTRACT.md
// ("Provider-Neutral Capability Port") and the invocationReceipt shape in
// CVF_MAO_RUNTIME_FOUNDATION_SCHEMA.json. This adapter consumes an admitted
// MAO-T2 role-resolution receipt and an immutable MAO-T1 authority envelope,
// validates a capability declaration, enforces idempotency, and returns a
// deterministic invocation receipt or a classified diagnostic. It never
// calls a real provider or network endpoint, never selects which provider
// serves a role (that remains ProviderRouterContract's job downstream of
// admission), and never hardcodes a provider name as a schema value or
// branch. Local execution-plane module only; no queue, UI, or runtime
// caller wiring.

import { computeDeterministicHash } from "../../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { MaoTaskGraph } from "./task.graph.contract";
import { verifyAuthorityEnvelope } from "./task.graph.contract";

// --- Types (mirror CVF_MAO_RUNTIME_FOUNDATION_SCHEMA.json invocationReceipt) ---

/**
 * Minimal shape of the MAO-T2 admission receipt this adapter depends on.
 * Declared structurally here (not imported from the control-plane package)
 * to keep the execution-plane -> control-plane dependency direction
 * one-way, per the MAO contract's Role Resolver Ownership decision: the
 * control-plane resolver depends on execution-plane's task graph, never the
 * reverse. Any object satisfying this shape (including MAO-T2's real
 * MaoRoleResolutionReceipt) is accepted.
 */
export interface MaoAdmissionReceiptLike {
  taskGraphId: string;
  decision: "SINGLE_WORKER_ADMITTED" | "BOUNDED_ROLE_PLAN_ADMITTED" | "OPERATOR_APPROVAL_REQUIRED" | "REJECTED";
  approvalRequired: boolean;
  admittedRoles: string[];
}

export type MaoDiagnosticClass =
  | "RETRYABLE_TRANSPORT_INTERRUPTION"
  | "RETRYABLE_PROVIDER_TRANSIENT"
  | "RETRYABLE_SAFE_TIMEOUT"
  | "NON_RETRYABLE_AUTHORITY_REJECTION"
  | "NON_RETRYABLE_APPROVAL_DENIAL"
  | "NON_RETRYABLE_INVALID_OUTPUT"
  | "NON_RETRYABLE_SCOPE_BREACH"
  | "NON_RETRYABLE_AMBIGUOUS_SIDE_EFFECT";

export interface MaoCapabilityDeclaration {
  role: string;
  requiredCapabilities: string[];
  /** Capabilities the fake/local adapter actually offers in this environment. */
  offeredCapabilities: string[];
}

export interface MaoUsageEnvelope {
  tokensReported: number | null;
  tokensEstimated: number | null;
  latencyMs: number | null;
  measurementLabel: "PROVIDER_REPORTED" | "ESTIMATED" | "UNAVAILABLE";
}

export interface MaoInvocationReceipt {
  invocationId: string;
  taskId: string;
  attemptId: string;
  adapterId: string;
  role: string;
  authorityHash: string;
  inputManifestHash: string;
  idempotencyKey: string;
  startedAt: string;
  completedAt: string | null;
  usage: MaoUsageEnvelope;
  diagnosticClass: MaoDiagnosticClass | null;
}

export type MaoInvocationRejectionReason =
  | "REJECTED_TASK_NOT_IN_GRAPH"
  | "REJECTED_ADMISSION_GRAPH_MISMATCH"
  | "REJECTED_ADMISSION_DECISION_REJECTED"
  | "REJECTED_ADMISSION_APPROVAL_PENDING"
  | "REJECTED_AUTHORITY_HASH_INVALID"
  | "REJECTED_MISSING_CAPABILITY"
  | "REJECTED_ROLE_NOT_ADMITTED"
  | "REJECTED_CAPABILITY_ROLE_MISMATCH"
  | "REJECTED_IDEMPOTENCY_KEY_CONFLICT"
  | "REJECTED_INVALID_INPUT_MANIFEST";

export interface MaoInvocationRequest {
  graph: MaoTaskGraph;
  admission: MaoAdmissionReceiptLike;
  taskId: string;
  capability: MaoCapabilityDeclaration;
  inputManifest: string[];
  idempotencyKey: string;
  startedAt: string;
  adapterId?: string;
}

export interface MaoInvocationSuccess {
  ok: true;
  receipt: MaoInvocationReceipt;
  /** True only when this call returned a pre-existing receipt for a repeated idempotencyKey. */
  replayed: boolean;
}

export interface MaoInvocationFailure {
  ok: false;
  reason: MaoInvocationRejectionReason;
  detail: string;
  diagnosticClass: MaoDiagnosticClass;
}

export type MaoInvocationResult = MaoInvocationSuccess | MaoInvocationFailure;

const DEFAULT_ADAPTER_ID = "mao-t3-fake-local-adapter-0.1.0";

function computeInputManifestHash(inputManifest: readonly string[]): string {
  return computeDeterministicHash("mao-t3-input-manifest", ...[...inputManifest].sort());
}

function computeInvocationId(taskId: string, attemptSequence: number, authorityHash: string, idempotencyKey: string): string {
  return computeDeterministicHash("mao-t3-invocation-id", taskId, String(attemptSequence), authorityHash, idempotencyKey);
}

function computeAttemptId(taskId: string, attemptSequence: number, idempotencyKey: string): string {
  return computeDeterministicHash("mao-t3-attempt-id", taskId, String(attemptSequence), idempotencyKey);
}

function missingCapabilities(capability: MaoCapabilityDeclaration): string[] {
  return capability.requiredCapabilities.filter((required) => !capability.offeredCapabilities.includes(required));
}

/**
 * Fake/local, provider-neutral delegation adapter. Holds an in-memory
 * idempotency store only (per the contract's Storage And Retention
 * Decision, this is not a durable runtime claim); no network, provider
 * SDK, or secret material is referenced anywhere in this class.
 *
 * Every `invoke` call fails closed before any fake "execution" happens:
 * the task must exist in the compiled graph, the admission receipt must
 * be bound to the same taskGraphId, the admission decision must not be
 * REJECTED and must not be an unapproved OPERATOR_APPROVAL_REQUIRED, the
 * graph's authority envelope must still verify, the capability declaration
 * must offer every required capability, and the input manifest must be
 * non-empty. Only after all of that does the adapter emit a deterministic
 * fake invocation receipt.
 */
export class MaoDelegationAdapter {
  private readonly adapterId: string;
  private readonly receiptsByIdempotencyKey = new Map<string, MaoInvocationReceipt>();
  private readonly attemptSequenceByTask = new Map<string, number>();
  private readonly requestFingerprintByIdempotencyKey = new Map<string, string>();

  constructor(adapterId: string = DEFAULT_ADAPTER_ID) {
    this.adapterId = adapterId;
  }

  /**
   * Attempt a fake/local invocation. Returns the existing receipt with
   * `replayed: true` when the same idempotencyKey was already used for the
   * same task and authority hash (duplicate-submission protection per the
   * contract's Idempotency, Retry, Cancel, And Recovery section). A
   * conflicting reuse of the same idempotencyKey for a different task or
   * authority hash is rejected rather than silently returning the wrong
   * receipt.
   */
  invoke(request: MaoInvocationRequest): MaoInvocationResult {
    const reject = (reason: MaoInvocationRejectionReason, detail: string, diagnosticClass: MaoDiagnosticClass): MaoInvocationFailure => ({
      ok: false, reason, detail, diagnosticClass,
    });
    const task = request.graph.tasks.find((t) => t.taskId === request.taskId);
    if (!task) {
      return reject("REJECTED_TASK_NOT_IN_GRAPH", `task ${request.taskId} is not declared in the compiled graph`, "NON_RETRYABLE_SCOPE_BREACH");
    }

    if (request.admission.taskGraphId !== request.graph.taskGraphId) {
      return reject("REJECTED_ADMISSION_GRAPH_MISMATCH", "admission receipt is bound to a different task graph", "NON_RETRYABLE_AUTHORITY_REJECTION");
    }

    if (request.admission.decision === "REJECTED") {
      return reject("REJECTED_ADMISSION_DECISION_REJECTED", "role resolver rejected this admission plan", "NON_RETRYABLE_APPROVAL_DENIAL");
    }

    if (request.admission.decision === "OPERATOR_APPROVAL_REQUIRED" && request.admission.approvalRequired) {
      return reject("REJECTED_ADMISSION_APPROVAL_PENDING", "admission requires an operator checkpoint", "NON_RETRYABLE_APPROVAL_DENIAL");
    }

    if (!verifyAuthorityEnvelope(request.graph.authorityEnvelope)) {
      return reject("REJECTED_AUTHORITY_HASH_INVALID", "authority envelope does not match its immutable hash", "NON_RETRYABLE_AUTHORITY_REJECTION");
    }

    if (!request.admission.admittedRoles.includes(task.role)) {
      return reject("REJECTED_ROLE_NOT_ADMITTED", `task role ${task.role} is not admitted`, "NON_RETRYABLE_AUTHORITY_REJECTION");
    }

    if (request.capability.role !== task.role) {
      return reject("REJECTED_CAPABILITY_ROLE_MISMATCH", "capability role does not match task role", "NON_RETRYABLE_SCOPE_BREACH");
    }

    if (request.inputManifest.length === 0) {
      return reject("REJECTED_INVALID_INPUT_MANIFEST", "input manifest must declare at least one input", "NON_RETRYABLE_INVALID_OUTPUT");
    }

    const missing = missingCapabilities(request.capability);
    if (missing.length > 0) {
      return reject("REJECTED_MISSING_CAPABILITY", `adapter lacks required capability count ${missing.length}`, "NON_RETRYABLE_SCOPE_BREACH");
    }

    const authorityHash = request.graph.authorityEnvelope.authorityHash;
    const requestFingerprint = computeDeterministicHash(
      "mao-t3-idempotency-binding",
      request.taskId,
      task.role,
      authorityHash,
      computeInputManifestHash(request.inputManifest),
      request.adapterId ?? this.adapterId,
      [...request.capability.requiredCapabilities].sort().join(","),
      [...request.capability.offeredCapabilities].sort().join(","),
    );
    const existing = this.receiptsByIdempotencyKey.get(request.idempotencyKey);
    if (existing) {
      if (this.requestFingerprintByIdempotencyKey.get(request.idempotencyKey) === requestFingerprint) {
        return { ok: true, receipt: existing, replayed: true };
      }
      return reject("REJECTED_IDEMPOTENCY_KEY_CONFLICT", "idempotency key is bound to different invocation inputs", "NON_RETRYABLE_AMBIGUOUS_SIDE_EFFECT");
    }

    const attemptSequence = (this.attemptSequenceByTask.get(request.taskId) ?? 0) + 1;
    this.attemptSequenceByTask.set(request.taskId, attemptSequence);

    const inputManifestHash = computeInputManifestHash(request.inputManifest);
    const invocationId = computeInvocationId(request.taskId, attemptSequence, authorityHash, request.idempotencyKey);
    const attemptId = computeAttemptId(request.taskId, attemptSequence, request.idempotencyKey);

    const receipt: MaoInvocationReceipt = Object.freeze({
      invocationId,
      taskId: request.taskId,
      attemptId,
      adapterId: request.adapterId ?? this.adapterId,
      role: task.role,
      authorityHash,
      inputManifestHash,
      idempotencyKey: request.idempotencyKey,
      startedAt: request.startedAt,
      completedAt: request.startedAt,
      usage: Object.freeze({
        tokensReported: null,
        tokensEstimated: null,
        latencyMs: 0,
        measurementLabel: "UNAVAILABLE",
      }),
      diagnosticClass: null,
    });

    this.receiptsByIdempotencyKey.set(request.idempotencyKey, receipt);
    this.requestFingerprintByIdempotencyKey.set(request.idempotencyKey, requestFingerprint);
    return { ok: true, receipt, replayed: false };
  }

  /** Read-only lookup of a previously issued receipt by idempotency key, for test/inspection use. */
  getReceiptByIdempotencyKey(idempotencyKey: string): MaoInvocationReceipt | null {
    return this.receiptsByIdempotencyKey.get(idempotencyKey) ?? null;
  }
}

export function createMaoDelegationAdapter(adapterId?: string): MaoDelegationAdapter {
  return new MaoDelegationAdapter(adapterId);
}
