/**
 * MinerU bounded system-chain route candidate (MSEA-R28-T25).
 *
 * This helper is a thin foundation-plane coordinator over the accepted T22
 * route-candidate helper. It verifies the T23 authoring-ready disposition and
 * rejects file-backed production persistence, retrieval, vectorization, MinerU
 * runtime execution, private/generated content reads, provider/live proof, and
 * public-sync behavior.
 *
 * Candidate scope only: production memory/RAG route release remains held by
 * PRODUCTION_MEMORY_RAG_ROUTE_NOT_RELEASED_BY_T25_CANDIDATE_ONLY.
 */

import type { DurableMemoryStore } from "./durable-memory-store";
import type { RuntimeMemoryActorRole } from "./runtime-memory-hierarchy";
import {
  MINERU_MEMORY_RAG_ROUTE_RELEASE_IMPLEMENTED_BOUNDED_CANDIDATE,
  releaseMineruMemoryRagRouteCandidate,
  type MineruMemoryRagRouteReleaseInput,
  type MineruMemoryRagRouteReleaseResult,
} from "./mineru-memory-rag-route-release";

export const MINERU_SYSTEM_CHAIN_ROUTE_CANDIDATE_VERSION =
  "cvf.mineruSystemChainRouteCandidate.r28t25.v1";

export const MINERU_SYSTEM_CHAIN_ROUTE_CANDIDATE_ACCEPTED =
  "MINERU_SYSTEM_CHAIN_ROUTE_CANDIDATE_ACCEPTED";

export const PRODUCTION_MEMORY_RAG_ROUTE_NOT_RELEASED_BY_T25_CANDIDATE_ONLY =
  "PRODUCTION_MEMORY_RAG_ROUTE_NOT_RELEASED_BY_T25_CANDIDATE_ONLY";

export const T24_AUTHORING_READY_DISPOSITION =
  "T24_PRODUCTION_MEMORY_RAG_ROUTE_RELEASE_IMPLEMENTATION_WORK_ORDER_AUTHORING_READY";

export const FAIL_CLOSED_FILE_BACKED_PERSISTENCE_ACTOR_ROLE_NOT_AUTHORIZED =
  "FAIL_CLOSED_FILE_BACKED_PERSISTENCE_ACTOR_ROLE_NOT_AUTHORIZED";

/**
 * Route-local allowlist for actor roles permitted to request file-backed
 * persistence. Operator-approved per MSEA-R43-T2 dispatch policy.
 * CVF controls route-boundary authority and traceability only; it does not
 * intervene in agent internal operation.
 */
const FILE_BACKED_PERSISTENCE_ACTOR_ROLE_ALLOWLIST: ReadonlyArray<RuntimeMemoryActorRole> =
  ["OPERATOR", "GOVERNOR"];

export type MineruSystemChainPersistenceMode = "in-process-only" | "file-backed";

export interface MineruSystemChainRouteAuthority {
  t23Disposition: string;
  freshMemoryOwnerAuthorization: boolean;
  productionPersistenceMode: MineruSystemChainPersistenceMode;
  fileBackedPersistenceRequested: boolean;
  /**
   * Actor role authorizing the file-backed persistence request.
   * Required when fileBackedPersistenceRequested is true.
   * Must be one of the route-local operator-approved allowlist values.
   * CVF records this for route-boundary evidence and traceability only.
   */
  fileBackedPersistenceActorRole?: RuntimeMemoryActorRole;
  retrievalRequested: boolean;
  vectorizationRequested: boolean;
  privateOutputContentRead: boolean;
}

export interface MineruSystemChainRouteCandidateInput {
  authority: MineruSystemChainRouteAuthority;
  routeInput: MineruMemoryRagRouteReleaseInput;
}

export interface MineruSystemChainRouteCandidateResult {
  disposition: string;
  routeCandidateVersion: string;
  productionRouteAuthorized: false;
  systemChainCandidateReady: boolean;
  persistenceMode: MineruSystemChainPersistenceMode | "rejected";
  routeResult: MineruMemoryRagRouteReleaseResult | null;
  preventedReason: string | null;
  heldToken: typeof PRODUCTION_MEMORY_RAG_ROUTE_NOT_RELEASED_BY_T25_CANDIDATE_ONLY;
}

function blocked(
  disposition: string,
  preventedReason: string,
): MineruSystemChainRouteCandidateResult {
  return {
    disposition,
    routeCandidateVersion: MINERU_SYSTEM_CHAIN_ROUTE_CANDIDATE_VERSION,
    productionRouteAuthorized: false,
    systemChainCandidateReady: false,
    persistenceMode: "rejected",
    routeResult: null,
    preventedReason,
    heldToken: PRODUCTION_MEMORY_RAG_ROUTE_NOT_RELEASED_BY_T25_CANDIDATE_ONLY,
  };
}

export function buildMineruSystemChainRouteCandidate(
  store: DurableMemoryStore,
  input: MineruSystemChainRouteCandidateInput,
): MineruSystemChainRouteCandidateResult {
  const { authority } = input;

  if (authority.t23Disposition !== T24_AUTHORING_READY_DISPOSITION) {
    return blocked(
      "FAIL_CLOSED_T23_DISPOSITION_NOT_READY",
      "T23 disposition must authorize only T24 work-order authoring readiness",
    );
  }

  if (authority.freshMemoryOwnerAuthorization !== true) {
    return blocked(
      "FAIL_CLOSED_MEMORY_OWNER_AUTHORIZATION_MISSING",
      "fresh memory-owner authorization must be present before a route candidate",
    );
  }

  if (
    authority.productionPersistenceMode !== "in-process-only" &&
    authority.productionPersistenceMode !== "file-backed"
  ) {
    return blocked(
      "FAIL_CLOSED_UNSUPPORTED_PERSISTENCE_MODE",
      "T25 bounded system-chain candidate supports only in-process or file-backed persistence",
    );
  }

  if (authority.productionPersistenceMode === "file-backed") {
    if (authority.fileBackedPersistenceRequested !== true) {
      return blocked(
        "FAIL_CLOSED_FILE_BACKED_PERSISTENCE_NOT_REQUESTED",
        "file-backed persistence mode requires fileBackedPersistenceRequested to be true",
      );
    }
    const actorRole = authority.fileBackedPersistenceActorRole;
    if (
      actorRole === undefined ||
      actorRole === null ||
      !FILE_BACKED_PERSISTENCE_ACTOR_ROLE_ALLOWLIST.includes(actorRole)
    ) {
      return blocked(
        FAIL_CLOSED_FILE_BACKED_PERSISTENCE_ACTOR_ROLE_NOT_AUTHORIZED,
        "file-backed persistence actor role is missing or not in the operator-approved allowlist (OPERATOR, GOVERNOR)",
      );
    }
  } else if (authority.fileBackedPersistenceRequested !== false) {
    // Actor-role gate: check before any other file-backed persistence handling.
    // CVF controls only the route boundary; it records actor-role evidence
    // and requires fail-closed behavior for traceability. It does not
    // intervene in or direct the agent's internal operation.
    const actorRole = authority.fileBackedPersistenceActorRole;
    if (
      actorRole === undefined ||
      actorRole === null ||
      !FILE_BACKED_PERSISTENCE_ACTOR_ROLE_ALLOWLIST.includes(actorRole)
    ) {
      return blocked(
        FAIL_CLOSED_FILE_BACKED_PERSISTENCE_ACTOR_ROLE_NOT_AUTHORIZED,
        "file-backed persistence actor role is missing or not in the operator-approved allowlist (OPERATOR, GOVERNOR)",
      );
    }
    return blocked(
      "FAIL_CLOSED_FILE_BACKED_PERSISTENCE_REQUESTED",
      "file-backed production persistence is not authorized by T25",
    );
  }

  if (authority.retrievalRequested !== false) {
    return blocked(
      "FAIL_CLOSED_RETRIEVAL_REQUESTED",
      "retrieval remains outside the T25 bounded system-chain candidate",
    );
  }

  if (authority.vectorizationRequested !== false) {
    return blocked(
      "FAIL_CLOSED_VECTORIZATION_REQUESTED",
      "vectorization remains outside the T25 bounded system-chain candidate",
    );
  }

  if (authority.privateOutputContentRead !== false) {
    return blocked(
      "FAIL_CLOSED_PRIVATE_OUTPUT_CONTENT_READ",
      "private/generated output content reads remain forbidden",
    );
  }

  const routeResult = releaseMineruMemoryRagRouteCandidate(
    store,
    input.routeInput,
  );
  if (
    routeResult.disposition !==
    MINERU_MEMORY_RAG_ROUTE_RELEASE_IMPLEMENTED_BOUNDED_CANDIDATE
  ) {
    return {
      disposition: `T22_ROUTE_CANDIDATE_NOT_ACCEPTED: ${routeResult.disposition}`,
      routeCandidateVersion: MINERU_SYSTEM_CHAIN_ROUTE_CANDIDATE_VERSION,
      productionRouteAuthorized: false,
      systemChainCandidateReady: false,
      persistenceMode: "rejected",
      routeResult,
      preventedReason: routeResult.preventedReason,
      heldToken: PRODUCTION_MEMORY_RAG_ROUTE_NOT_RELEASED_BY_T25_CANDIDATE_ONLY,
    };
  }

  return {
    disposition: MINERU_SYSTEM_CHAIN_ROUTE_CANDIDATE_ACCEPTED,
    routeCandidateVersion: MINERU_SYSTEM_CHAIN_ROUTE_CANDIDATE_VERSION,
    productionRouteAuthorized: false,
    systemChainCandidateReady: true,
    persistenceMode: authority.productionPersistenceMode,
    routeResult,
    preventedReason: null,
    heldToken: PRODUCTION_MEMORY_RAG_ROUTE_NOT_RELEASED_BY_T25_CANDIDATE_ONLY,
  };
}
