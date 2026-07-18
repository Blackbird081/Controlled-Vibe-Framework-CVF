/**
 * MinerU Memory/RAG Route Release Implementation Candidate (MSEA-R28-T22)
 *
 * Bounded TypeScript helper that cross-checks an explicit memory-owner
 * authorization object against a T20-compatible adapter payload, verifies all
 * five R27 prerequisites and the R24-T4 privacy invariants, and only then
 * invokes the accepted T20 durable-store invocation helper.
 *
 * Implementation-candidate scope: this helper does not authorize production
 * memory/RAG route release, file-backed production persistence, retrieval,
 * vectorization, MinerU runtime execution, private/generated output content
 * reads, provider/live proof, or public-sync. Production route release
 * remains held by MEMORY_RAG_ROUTE_RELEASE_NOT_PRODUCTION_AUTHORIZED_BY_T22.
 */

import type { DurableMemoryStore } from "./durable-memory-store";
import {
  invokeMineruDurableStoreWrite,
  type MineruDurableStoreInvocationInput,
  type MineruDurableStoreInvocationResult,
} from "./mineru-durable-store-invocation";

// ---------------------------------------------------------------------------
// T22 version and disposition tokens
// ---------------------------------------------------------------------------

export const MINERU_MEMORY_RAG_ROUTE_RELEASE_VERSION =
  "cvf.mineruMemoryRagRouteRelease.r28t22.v1";

export const MINERU_MEMORY_RAG_ROUTE_RELEASE_IMPLEMENTED_BOUNDED_CANDIDATE =
  "MINERU_MEMORY_RAG_ROUTE_RELEASE_IMPLEMENTED_BOUNDED_CANDIDATE";

export const MEMORY_RAG_ROUTE_RELEASE_NOT_PRODUCTION_AUTHORIZED_BY_T22 =
  "MEMORY_RAG_ROUTE_RELEASE_NOT_PRODUCTION_AUTHORIZED_BY_T22";

// ---------------------------------------------------------------------------
// Explicit memory-owner authorization shape
// ---------------------------------------------------------------------------

export interface MineruMemoryOwnerAuthorization {
  policyDecision: string;
  actorAuthorized: boolean;
  provenanceScore: number;
  actorRole: string;
  targetDurableTier: string;
}

// ---------------------------------------------------------------------------
// Helper input shape
// ---------------------------------------------------------------------------

export interface MineruMemoryRagRouteReleaseInput {
  authorization: MineruMemoryOwnerAuthorization;
  adapterPayload: MineruDurableStoreInvocationInput;
}

// ---------------------------------------------------------------------------
// Helper result shape
// ---------------------------------------------------------------------------

export interface MineruMemoryRagRouteReleaseResult {
  disposition: string;
  releaseVersion: string;
  productionRouteAuthorized: false;
  writeInputCandidateId: string;
  adapterCandidateId: string;
  invocationResult: MineruDurableStoreInvocationResult | null;
  preventedReason: string | null;
}

const MIN_PROVENANCE_SCORE = 0.7;

function blocked(
  input: MineruMemoryRagRouteReleaseInput,
  disposition: string,
  preventedReason: string,
): MineruMemoryRagRouteReleaseResult {
  return {
    disposition,
    releaseVersion: MINERU_MEMORY_RAG_ROUTE_RELEASE_VERSION,
    productionRouteAuthorized: false,
    writeInputCandidateId: input.adapterPayload.writeInputCandidateId,
    adapterCandidateId: input.adapterPayload.adapterCandidateId,
    invocationResult: null,
    preventedReason,
  };
}

// ---------------------------------------------------------------------------
// Main helper
// ---------------------------------------------------------------------------

export function releaseMineruMemoryRagRouteCandidate(
  store: DurableMemoryStore,
  input: MineruMemoryRagRouteReleaseInput,
): MineruMemoryRagRouteReleaseResult {
  const { authorization, adapterPayload } = input;

  // --- Explicit memory-owner authorization gate (fail-closed) ---

  if (authorization.policyDecision !== "allow") {
    return blocked(
      input,
      "FAIL_CLOSED_AUTHORIZATION_POLICY_DENIED",
      "memory-owner authorization policyDecision must be \"allow\"",
    );
  }

  if (authorization.actorAuthorized !== true) {
    return blocked(
      input,
      "FAIL_CLOSED_AUTHORIZATION_ACTOR_NOT_AUTHORIZED",
      "memory-owner authorization actorAuthorized must be true",
    );
  }

  if (
    typeof authorization.provenanceScore !== "number" ||
    !Number.isFinite(authorization.provenanceScore) ||
    authorization.provenanceScore < MIN_PROVENANCE_SCORE
  ) {
    return blocked(
      input,
      "FAIL_CLOSED_AUTHORIZATION_LOW_PROVENANCE",
      `memory-owner authorization provenanceScore must be at least ${MIN_PROVENANCE_SCORE}`,
    );
  }

  // --- Authorization must match the adapter payload it is authorizing ---

  if (authorization.actorRole !== adapterPayload.actorRole) {
    return blocked(
      input,
      "FAIL_CLOSED_AUTHORIZATION_ACTOR_ROLE_MISMATCH",
      "memory-owner authorization actorRole must match the adapter payload actorRole",
    );
  }

  if (authorization.targetDurableTier !== adapterPayload.targetDurableTier) {
    return blocked(
      input,
      "FAIL_CLOSED_AUTHORIZATION_TARGET_TIER_MISMATCH",
      "memory-owner authorization targetDurableTier must match the adapter payload targetDurableTier",
    );
  }

  // --- All five R27 prerequisites must be true on the adapter payload ---

  if (!adapterPayload.r27ReceiptPrerequisite) {
    return blocked(
      input,
      "FAIL_CLOSED_R27_RECEIPT_MISSING",
      "R27 receipt prerequisite must be satisfied before route release candidacy",
    );
  }
  if (!adapterPayload.r27QualityPrerequisite) {
    return blocked(
      input,
      "FAIL_CLOSED_R27_QUALITY_MISSING",
      "R27 quality prerequisite must be satisfied before route release candidacy",
    );
  }
  if (!adapterPayload.r27SourcePointerPrerequisite) {
    return blocked(
      input,
      "FAIL_CLOSED_R27_SOURCE_POINTER_MISSING",
      "R27 source pointer prerequisite must be satisfied before route release candidacy",
    );
  }
  if (!adapterPayload.r27DownstreamUsePrerequisite) {
    return blocked(
      input,
      "FAIL_CLOSED_R27_DOWNSTREAM_USE_MISSING",
      "R27 downstream use prerequisite must be satisfied before route release candidacy",
    );
  }
  if (!adapterPayload.r27ClaimBoundaryPrerequisite) {
    return blocked(
      input,
      "FAIL_CLOSED_R27_CLAIM_BOUNDARY_MISSING",
      "R27 claim boundary prerequisite must be satisfied before route release candidacy",
    );
  }

  // --- R24-T4 / T20 privacy and non-reinjection invariants (defense in depth) ---

  if (adapterPayload.outputContentRead !== false) {
    return blocked(
      input,
      "FAIL_CLOSED_OUTPUT_CONTENT_READ",
      "outputContentRead must be false for a route release candidate",
    );
  }

  if (adapterPayload.rawMemoryReleased !== false) {
    return blocked(
      input,
      "FAIL_CLOSED_RAW_MEMORY_RELEASED",
      "rawMemoryReleased must be false for a route release candidate",
    );
  }

  if (adapterPayload.canReinject !== false) {
    return blocked(
      input,
      "FAIL_CLOSED_REINJECTION_ENABLED",
      "canReinject must be false for a route release candidate",
    );
  }

  if (adapterPayload.summaryOnly !== true) {
    return blocked(
      input,
      "FAIL_CLOSED_SUMMARY_ONLY_FALSE",
      "summaryOnly must be true for a route release candidate",
    );
  }

  // --- Authorization gate passed; delegate to the accepted T20 helper ---

  const invocationResult = invokeMineruDurableStoreWrite(store, adapterPayload);

  const disposition =
    invocationResult.disposition === "MINERU_DURABLE_STORE_INVOCATION_IMPLEMENTED"
      ? MINERU_MEMORY_RAG_ROUTE_RELEASE_IMPLEMENTED_BOUNDED_CANDIDATE
      : `T20_INVOCATION_NOT_IMPLEMENTED: ${invocationResult.disposition}`;

  return {
    disposition,
    releaseVersion: MINERU_MEMORY_RAG_ROUTE_RELEASE_VERSION,
    productionRouteAuthorized: false,
    writeInputCandidateId: invocationResult.writeInputCandidateId,
    adapterCandidateId: invocationResult.adapterCandidateId,
    invocationResult,
    preventedReason: invocationResult.preventedReason,
  };
}
