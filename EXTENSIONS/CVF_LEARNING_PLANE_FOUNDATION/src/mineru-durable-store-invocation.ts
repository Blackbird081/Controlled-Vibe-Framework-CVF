/**
 * MinerU Durable Store Invocation Helper (MSEA-R28-T20)
 *
 * Bounded TypeScript helper that consumes a T18 adapter payload shape, validates
 * the T19 prerequisites, maps the payload into a DurableMemoryWriteInput, invokes
 * an in-process DurableMemoryStore.write, and captures the durable store receipt.
 *
 * Invocation-only scope: this helper does not authorize memory/RAG route release,
 * vectorization, retrieval, MinerU runtime, private/generated output content
 * reads, provider/live proof, public-sync, or production file-backed storage.
 */

import type {
  DurableMemoryReceipt,
  DurableMemoryStore,
  DurableMemoryWriteInput,
} from "./durable-memory-store";
import type { RuntimeMemoryActorRole } from "./runtime-memory-hierarchy";

// ---------------------------------------------------------------------------
// T20 version and disposition tokens
// ---------------------------------------------------------------------------

export const MINERU_DURABLE_STORE_INVOCATION_VERSION =
  "cvf.mineruDurableStoreInvocation.r28t20.v1";

export const MINERU_DURABLE_STORE_INVOCATION_IMPLEMENTED =
  "MINERU_DURABLE_STORE_INVOCATION_IMPLEMENTED";

export const MEMORY_WRITE_NOT_AUTHORIZED_BY_T20_INVOCATION_ONLY =
  "MEMORY_WRITE_NOT_AUTHORIZED_BY_T20_INVOCATION_ONLY";

// ---------------------------------------------------------------------------
// Adapter-payload input shape (mirrors T18 adapter candidate payload keys)
// ---------------------------------------------------------------------------

export interface MineruDurableStoreInvocationInput {
  adapterCandidateId: string;
  adapterDisposition: string;
  adapterVersion: string;
  actorAuthorized: boolean;
  actorRole: string;
  canReinject: boolean;
  claimBoundary: string;
  durableStoreInvocationDisposition: string;
  memoryWriteAuthorized: boolean;
  outputContentRead: boolean;
  policyDecision: string;
  provenanceScore: number;
  r27ClaimBoundaryPrerequisite: boolean;
  r27DownstreamUsePrerequisite: boolean;
  r27QualityPrerequisite: boolean;
  r27ReceiptPrerequisite: boolean;
  r27SourcePointerPrerequisite: boolean;
  rawMemoryReleased: boolean;
  summary: string;
  summaryOnly: boolean;
  targetDurableTier: string;
  writeInputCandidateId: string;
}

// ---------------------------------------------------------------------------
// Helper result shape
// ---------------------------------------------------------------------------

export interface MineruDurableStoreInvocationResult {
  disposition: string;
  invocationVersion: string;
  memoryWriteAuthorized: false;
  writeInputCandidateId: string;
  adapterCandidateId: string;
  targetDurableTier: string;
  actorRole: string;
  durableStoreReceipt: DurableMemoryReceipt | null;
  preventedReason: string | null;
}

// ---------------------------------------------------------------------------
// Unsafe markers in metadata fields (shallow substring scan)
// ---------------------------------------------------------------------------

const UNSAFE_METADATA_MARKERS: readonly string[] = [
  "---",
  "```",
  "<script",
  "content:",
  "rawContent:",
  "secret",
  "password",
  "api_key",
  "apikey",
  "api-key",
  "token",
];

function hasUnsafeMetadataMarker(value: string): boolean {
  const lowered = value.toLowerCase();
  return UNSAFE_METADATA_MARKERS.some((m) => lowered.includes(m));
}

// ---------------------------------------------------------------------------
// Main helper
// ---------------------------------------------------------------------------

export function invokeMineruDurableStoreWrite(
  store: DurableMemoryStore,
  input: MineruDurableStoreInvocationInput,
): MineruDurableStoreInvocationResult {
  // --- Fail-closed validation before store invocation ---

  // 1. outputContentRead must be false
  if (input.outputContentRead !== false) {
    return {
      disposition: "FAIL_CLOSED_OUTPUT_CONTENT_READ",
      invocationVersion: MINERU_DURABLE_STORE_INVOCATION_VERSION,
      memoryWriteAuthorized: false,
      writeInputCandidateId: input.writeInputCandidateId,
      adapterCandidateId: input.adapterCandidateId,
      targetDurableTier: input.targetDurableTier,
      actorRole: input.actorRole,
      durableStoreReceipt: null,
      preventedReason:
        "outputContentRead must be false for MinerU durable-store invocation",
    };
  }

  // 2. rawMemoryReleased must be false
  if (input.rawMemoryReleased !== false) {
    return {
      disposition: "FAIL_CLOSED_RAW_MEMORY_RELEASED",
      invocationVersion: MINERU_DURABLE_STORE_INVOCATION_VERSION,
      memoryWriteAuthorized: false,
      writeInputCandidateId: input.writeInputCandidateId,
      adapterCandidateId: input.adapterCandidateId,
      targetDurableTier: input.targetDurableTier,
      actorRole: input.actorRole,
      durableStoreReceipt: null,
      preventedReason:
        "rawMemoryReleased must be false for MinerU durable-store invocation",
    };
  }

  // 3. canReinject must be false
  if (input.canReinject !== false) {
    return {
      disposition: "FAIL_CLOSED_REINJECTION_ENABLED",
      invocationVersion: MINERU_DURABLE_STORE_INVOCATION_VERSION,
      memoryWriteAuthorized: false,
      writeInputCandidateId: input.writeInputCandidateId,
      adapterCandidateId: input.adapterCandidateId,
      targetDurableTier: input.targetDurableTier,
      actorRole: input.actorRole,
      durableStoreReceipt: null,
      preventedReason:
        "canReinject must be false for MinerU durable-store invocation",
    };
  }

  // 4. summaryOnly must be true
  if (input.summaryOnly !== true) {
    return {
      disposition: "FAIL_CLOSED_SUMMARY_ONLY_FALSE",
      invocationVersion: MINERU_DURABLE_STORE_INVOCATION_VERSION,
      memoryWriteAuthorized: false,
      writeInputCandidateId: input.writeInputCandidateId,
      adapterCandidateId: input.adapterCandidateId,
      targetDurableTier: input.targetDurableTier,
      actorRole: input.actorRole,
      durableStoreReceipt: null,
      preventedReason:
        "summaryOnly must be true for MinerU durable-store invocation",
    };
  }

  // 5. memoryWriteAuthorized must be false
  if (input.memoryWriteAuthorized !== false) {
    return {
      disposition: "FAIL_CLOSED_MEMORY_WRITE_ALREADY_AUTHORIZED",
      invocationVersion: MINERU_DURABLE_STORE_INVOCATION_VERSION,
      memoryWriteAuthorized: false,
      writeInputCandidateId: input.writeInputCandidateId,
      adapterCandidateId: input.adapterCandidateId,
      targetDurableTier: input.targetDurableTier,
      actorRole: input.actorRole,
      durableStoreReceipt: null,
      preventedReason:
        "memoryWriteAuthorized must be false for T20 invocation-only scope",
    };
  }

  // 6. All five R27 prerequisites must be true
  if (!input.r27ReceiptPrerequisite) {
    return {
      disposition: "FAIL_CLOSED_R27_RECEIPT_MISSING",
      invocationVersion: MINERU_DURABLE_STORE_INVOCATION_VERSION,
      memoryWriteAuthorized: false,
      writeInputCandidateId: input.writeInputCandidateId,
      adapterCandidateId: input.adapterCandidateId,
      targetDurableTier: input.targetDurableTier,
      actorRole: input.actorRole,
      durableStoreReceipt: null,
      preventedReason:
        "R27 receipt prerequisite must be satisfied",
    };
  }
  if (!input.r27QualityPrerequisite) {
    return {
      disposition: "FAIL_CLOSED_R27_QUALITY_MISSING",
      invocationVersion: MINERU_DURABLE_STORE_INVOCATION_VERSION,
      memoryWriteAuthorized: false,
      writeInputCandidateId: input.writeInputCandidateId,
      adapterCandidateId: input.adapterCandidateId,
      targetDurableTier: input.targetDurableTier,
      actorRole: input.actorRole,
      durableStoreReceipt: null,
      preventedReason:
        "R27 quality prerequisite must be satisfied",
    };
  }
  if (!input.r27SourcePointerPrerequisite) {
    return {
      disposition: "FAIL_CLOSED_R27_SOURCE_POINTER_MISSING",
      invocationVersion: MINERU_DURABLE_STORE_INVOCATION_VERSION,
      memoryWriteAuthorized: false,
      writeInputCandidateId: input.writeInputCandidateId,
      adapterCandidateId: input.adapterCandidateId,
      targetDurableTier: input.targetDurableTier,
      actorRole: input.actorRole,
      durableStoreReceipt: null,
      preventedReason:
        "R27 source pointer prerequisite must be satisfied",
    };
  }
  if (!input.r27DownstreamUsePrerequisite) {
    return {
      disposition: "FAIL_CLOSED_R27_DOWNSTREAM_USE_MISSING",
      invocationVersion: MINERU_DURABLE_STORE_INVOCATION_VERSION,
      memoryWriteAuthorized: false,
      writeInputCandidateId: input.writeInputCandidateId,
      adapterCandidateId: input.adapterCandidateId,
      targetDurableTier: input.targetDurableTier,
      actorRole: input.actorRole,
      durableStoreReceipt: null,
      preventedReason:
        "R27 downstream use prerequisite must be satisfied",
    };
  }
  if (!input.r27ClaimBoundaryPrerequisite) {
    return {
      disposition: "FAIL_CLOSED_R27_CLAIM_BOUNDARY_MISSING",
      invocationVersion: MINERU_DURABLE_STORE_INVOCATION_VERSION,
      memoryWriteAuthorized: false,
      writeInputCandidateId: input.writeInputCandidateId,
      adapterCandidateId: input.adapterCandidateId,
      targetDurableTier: input.targetDurableTier,
      actorRole: input.actorRole,
      durableStoreReceipt: null,
      preventedReason:
        "R27 claim boundary prerequisite must be satisfied",
    };
  }

  // 7. Metadata must be present
  if (!input.summary || !input.summary.trim()) {
    return {
      disposition: "FAIL_CLOSED_MISSING_SUMMARY",
      invocationVersion: MINERU_DURABLE_STORE_INVOCATION_VERSION,
      memoryWriteAuthorized: false,
      writeInputCandidateId: input.writeInputCandidateId,
      adapterCandidateId: input.adapterCandidateId,
      targetDurableTier: input.targetDurableTier,
      actorRole: input.actorRole,
      durableStoreReceipt: null,
      preventedReason:
        "summary is required for MinerU durable-store invocation",
    };
  }
  if (!input.actorRole || !input.actorRole.trim()) {
    return {
      disposition: "FAIL_CLOSED_MISSING_ACTOR_ROLE",
      invocationVersion: MINERU_DURABLE_STORE_INVOCATION_VERSION,
      memoryWriteAuthorized: false,
      writeInputCandidateId: input.writeInputCandidateId,
      adapterCandidateId: input.adapterCandidateId,
      targetDurableTier: input.targetDurableTier,
      actorRole: input.actorRole,
      durableStoreReceipt: null,
      preventedReason:
        "actorRole is required for MinerU durable-store invocation",
    };
  }
  if (!input.targetDurableTier || !input.targetDurableTier.trim()) {
    return {
      disposition: "FAIL_CLOSED_MISSING_TARGET_TIER",
      invocationVersion: MINERU_DURABLE_STORE_INVOCATION_VERSION,
      memoryWriteAuthorized: false,
      writeInputCandidateId: input.writeInputCandidateId,
      adapterCandidateId: input.adapterCandidateId,
      targetDurableTier: input.targetDurableTier,
      actorRole: input.actorRole,
      durableStoreReceipt: null,
      preventedReason:
        "targetDurableTier is required for MinerU durable-store invocation",
    };
  }
  if (!input.adapterCandidateId || !input.adapterCandidateId.trim()) {
    return {
      disposition: "FAIL_CLOSED_MISSING_ADAPTER_ID",
      invocationVersion: MINERU_DURABLE_STORE_INVOCATION_VERSION,
      memoryWriteAuthorized: false,
      writeInputCandidateId: input.writeInputCandidateId,
      adapterCandidateId: input.adapterCandidateId,
      targetDurableTier: input.targetDurableTier,
      actorRole: input.actorRole,
      durableStoreReceipt: null,
      preventedReason:
        "adapterCandidateId is required for MinerU durable-store invocation",
    };
  }

  // 8. Raw-content-like markers in metadata fields (summary, actorRole, targetTier)
  if (hasUnsafeMetadataMarker(input.summary)) {
    return {
      disposition: "FAIL_CLOSED_UNSAFE_SUMMARY_MARKER",
      invocationVersion: MINERU_DURABLE_STORE_INVOCATION_VERSION,
      memoryWriteAuthorized: false,
      writeInputCandidateId: input.writeInputCandidateId,
      adapterCandidateId: input.adapterCandidateId,
      targetDurableTier: input.targetDurableTier,
      actorRole: input.actorRole,
      durableStoreReceipt: null,
      preventedReason:
        "summary contains unsafe metadata markers",
    };
  }
  if (hasUnsafeMetadataMarker(input.actorRole)) {
    return {
      disposition: "FAIL_CLOSED_UNSAFE_ACTOR_ROLE_MARKER",
      invocationVersion: MINERU_DURABLE_STORE_INVOCATION_VERSION,
      memoryWriteAuthorized: false,
      writeInputCandidateId: input.writeInputCandidateId,
      adapterCandidateId: input.adapterCandidateId,
      targetDurableTier: input.targetDurableTier,
      actorRole: input.actorRole,
      durableStoreReceipt: null,
      preventedReason:
        "actorRole contains unsafe metadata markers",
    };
  }
  if (hasUnsafeMetadataMarker(input.targetDurableTier)) {
    return {
      disposition: "FAIL_CLOSED_UNSAFE_TARGET_TIER_MARKER",
      invocationVersion: MINERU_DURABLE_STORE_INVOCATION_VERSION,
      memoryWriteAuthorized: false,
      writeInputCandidateId: input.writeInputCandidateId,
      adapterCandidateId: input.adapterCandidateId,
      targetDurableTier: input.targetDurableTier,
      actorRole: input.actorRole,
      durableStoreReceipt: null,
      preventedReason:
        "targetDurableTier contains unsafe metadata markers",
    };
  }

  // --- Map validated adapter payload to durable store write input ---

  const writeInput: DurableMemoryWriteInput = {
    id: input.adapterCandidateId,
    scope: "mineru-document-intelligence",
    actorId: `mineru-${input.writeInputCandidateId}`,
    actorRole: input.actorRole as RuntimeMemoryActorRole,
    summary: input.summary,
    lifecycleState: "semantic",
    provenanceScore: input.provenanceScore,
    containsSecret: false,
    policyDecision: input.policyDecision as "allow" | "deny" | "require_human_approval",
    actorAuthorized: input.actorAuthorized,
    tier: input.targetDurableTier,
  };

  // --- Invoke the durable store ---

  const writeResult = store.write(writeInput);
  const receipt = writeResult.receipt;

  return {
    disposition:
      receipt.decision === "allowed"
        ? MINERU_DURABLE_STORE_INVOCATION_IMPLEMENTED
        : `STORE_DENIED: ${receipt.reason}`,
    invocationVersion: MINERU_DURABLE_STORE_INVOCATION_VERSION,
    memoryWriteAuthorized: false,
    writeInputCandidateId: input.writeInputCandidateId,
    adapterCandidateId: input.adapterCandidateId,
    targetDurableTier: input.targetDurableTier,
    actorRole: input.actorRole,
    durableStoreReceipt: receipt,
    preventedReason: receipt.decision === "denied" ? receipt.reason : null,
  };
}
