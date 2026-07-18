/**
 * MinerU internal system-chain harness (MSEA-R33-T3).
 *
 * This harness exercises the already accepted in-process MinerU system-chain
 * candidate without crossing into production release. It intentionally does
 * not bridge to the Python receipt writer, execute MinerU, read private output,
 * use file-backed persistence, retrieve, vectorize, or call providers.
 */

import {
  createInProcessDurableMemoryStore,
  type DurableMemoryStore,
} from "./durable-memory-store";
import type { MineruDurableStoreInvocationInput } from "./mineru-durable-store-invocation";
import type { RuntimeMemoryActorRole } from "./runtime-memory-hierarchy";
import type {
  MineruMemoryOwnerAuthorization,
  MineruMemoryRagRouteReleaseInput,
} from "./mineru-memory-rag-route-release";
import {
  buildMineruSystemChainRouteCandidate,
  MINERU_SYSTEM_CHAIN_ROUTE_CANDIDATE_ACCEPTED,
  PRODUCTION_MEMORY_RAG_ROUTE_NOT_RELEASED_BY_T25_CANDIDATE_ONLY,
  T24_AUTHORING_READY_DISPOSITION,
  type MineruSystemChainRouteAuthority,
  type MineruSystemChainRouteCandidateInput,
  type MineruSystemChainRouteCandidateResult,
} from "./mineru-system-chain-route-candidate";

export const MINERU_INTERNAL_SYSTEM_CHAIN_HARNESS_VERSION =
  "cvf.mineruInternalSystemChainHarness.r33t3.v1";

export const MINERU_INTERNAL_SYSTEM_CHAIN_HARNESS_PASS_BOUNDED =
  "MINERU_INTERNAL_SYSTEM_CHAIN_HARNESS_PASS_BOUNDED";

export const MINERU_INTERNAL_SYSTEM_CHAIN_HARNESS_FAIL_CLOSED =
  "MINERU_INTERNAL_SYSTEM_CHAIN_HARNESS_FAIL_CLOSED";

export const PYTHON_RECEIPT_BRIDGE_NOT_WIRED_BY_R33 =
  "PYTHON_RECEIPT_BRIDGE_NOT_WIRED_BY_R33";

export interface MineruInternalSystemChainHarnessResult {
  harnessVersion: typeof MINERU_INTERNAL_SYSTEM_CHAIN_HARNESS_VERSION;
  disposition:
    | typeof MINERU_INTERNAL_SYSTEM_CHAIN_HARNESS_PASS_BOUNDED
    | typeof MINERU_INTERNAL_SYSTEM_CHAIN_HARNESS_FAIL_CLOSED;
  sourceDisposition: string;
  pythonReceiptBridgeStatus: typeof PYTHON_RECEIPT_BRIDGE_NOT_WIRED_BY_R33;
  productionRouteAuthorized: false;
  fileBackedPersistenceUsed: false;
  mineruRuntimeExecuted: false;
  privateOutputContentRead: false;
  retrievalUsed: false;
  vectorizationUsed: false;
  providerLiveProofUsed: false;
  publicRuntimeClaimed: false;
  heldToken: typeof PRODUCTION_MEMORY_RAG_ROUTE_NOT_RELEASED_BY_T25_CANDIDATE_ONLY;
  storeRecordCount: number;
  routeCandidateResult: MineruSystemChainRouteCandidateResult;
}

function asRuntimeMemoryActorRole(role: string): RuntimeMemoryActorRole | undefined {
  const allowedRoles: readonly RuntimeMemoryActorRole[] = [
    "OPERATOR",
    "GOVERNOR",
    "HUMAN",
    "BUILDER",
    "AI_AGENT",
    "REVIEWER",
    "SERVICE_AGENT",
    "OBSERVER",
    "ANALYST",
    "unknown",
  ];
  return allowedRoles.includes(role as RuntimeMemoryActorRole)
    ? (role as RuntimeMemoryActorRole)
    : undefined;
}

export function buildMineruInternalSystemChainHarnessInput(
  overrides: {
    authority?: Partial<MineruSystemChainRouteAuthority>;
    authorization?: Partial<MineruMemoryOwnerAuthorization>;
    adapterPayload?: Partial<MineruDurableStoreInvocationInput>;
  } = {},
): MineruSystemChainRouteCandidateInput {
  const adapterPayload: MineruDurableStoreInvocationInput = {
    adapterCandidateId: "durable-memory-write-adapter:r33-harness",
    adapterDisposition:
      "DURABLE_MEMORY_WRITE_ADAPTER_IMPLEMENTATION_CANDIDATE_READY",
    adapterVersion: "cvf.mineruDurableMemoryWriteAdapterCandidate.r28t18.v1",
    actorAuthorized: true,
    actorRole: "OPERATOR",
    canReinject: false,
    claimBoundary:
      "R33 internal harness scope; no production release or private output read",
    durableStoreInvocationDisposition:
      "DURABLE_STORE_INVOCATION_NOT_AUTHORIZED_BY_T18",
    memoryWriteAuthorized: false,
    outputContentRead: false,
    policyDecision: "allow",
    provenanceScore: 0.92,
    r27ClaimBoundaryPrerequisite: true,
    r27DownstreamUsePrerequisite: true,
    r27QualityPrerequisite: true,
    r27ReceiptPrerequisite: true,
    r27SourcePointerPrerequisite: true,
    rawMemoryReleased: false,
    summary:
      "R33 internal MinerU system-chain harness metadata summary only",
    summaryOnly: true,
    targetDurableTier: "skill",
    writeInputCandidateId: "r33-harness",
    ...overrides.adapterPayload,
  };

  const authorization: MineruMemoryOwnerAuthorization = {
    policyDecision: "allow",
    actorAuthorized: true,
    provenanceScore: 0.92,
    actorRole: adapterPayload.actorRole,
    targetDurableTier: adapterPayload.targetDurableTier,
    ...overrides.authorization,
  };

  const authority: MineruSystemChainRouteAuthority = {
    t23Disposition: T24_AUTHORING_READY_DISPOSITION,
    freshMemoryOwnerAuthorization: true,
    productionPersistenceMode: "in-process-only",
    fileBackedPersistenceRequested: false,
    fileBackedPersistenceActorRole: asRuntimeMemoryActorRole(adapterPayload.actorRole),
    retrievalRequested: false,
    vectorizationRequested: false,
    privateOutputContentRead: false,
    ...overrides.authority,
  };

  const routeInput: MineruMemoryRagRouteReleaseInput = {
    authorization,
    adapterPayload,
  };

  return { authority, routeInput };
}

export function runMineruInternalSystemChainHarness(
  input: MineruSystemChainRouteCandidateInput =
    buildMineruInternalSystemChainHarnessInput(),
  options: { now?: () => number; store?: DurableMemoryStore } = {},
): MineruInternalSystemChainHarnessResult {
  const store =
    options.store ??
    createInProcessDurableMemoryStore({ now: options.now ?? (() => 1770000000000) });
  const routeCandidateResult = buildMineruSystemChainRouteCandidate(store, input);
  const passed =
    routeCandidateResult.disposition ===
    MINERU_SYSTEM_CHAIN_ROUTE_CANDIDATE_ACCEPTED;

  return {
    harnessVersion: MINERU_INTERNAL_SYSTEM_CHAIN_HARNESS_VERSION,
    disposition: passed
      ? MINERU_INTERNAL_SYSTEM_CHAIN_HARNESS_PASS_BOUNDED
      : MINERU_INTERNAL_SYSTEM_CHAIN_HARNESS_FAIL_CLOSED,
    sourceDisposition: routeCandidateResult.disposition,
    pythonReceiptBridgeStatus: PYTHON_RECEIPT_BRIDGE_NOT_WIRED_BY_R33,
    productionRouteAuthorized: false,
    fileBackedPersistenceUsed: false,
    mineruRuntimeExecuted: false,
    privateOutputContentRead: false,
    retrievalUsed: false,
    vectorizationUsed: false,
    providerLiveProofUsed: false,
    publicRuntimeClaimed: false,
    heldToken: PRODUCTION_MEMORY_RAG_ROUTE_NOT_RELEASED_BY_T25_CANDIDATE_ONLY,
    storeRecordCount: store.list().length,
    routeCandidateResult,
  };
}
