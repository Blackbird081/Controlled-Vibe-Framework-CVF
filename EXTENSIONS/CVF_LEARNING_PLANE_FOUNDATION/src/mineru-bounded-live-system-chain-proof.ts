import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import {
  createFileBackedDurableMemoryStore,
  type DurableMemoryReceipt,
} from "./durable-memory-store";
import {
  buildMineruInternalSystemChainHarnessInput,
  PYTHON_RECEIPT_BRIDGE_NOT_WIRED_BY_R33,
} from "./mineru-internal-system-chain-harness";
import {
  buildMineruSystemChainRouteCandidate,
  MINERU_SYSTEM_CHAIN_ROUTE_CANDIDATE_ACCEPTED,
  PRODUCTION_MEMORY_RAG_ROUTE_NOT_RELEASED_BY_T25_CANDIDATE_ONLY,
  type MineruSystemChainRouteCandidateResult,
} from "./mineru-system-chain-route-candidate";

export const MINERU_BOUNDED_LIVE_SYSTEM_CHAIN_PROOF_VERSION =
  "cvf.mineruBoundedLiveSystemChainProof.r46.v1";

export const R46_BOUNDED_LIVE_SYSTEM_CHAIN_PROOF_PASS =
  "R46_BOUNDED_LIVE_SYSTEM_CHAIN_PROOF_PASS";

export const R46_BOUNDED_LIVE_SYSTEM_CHAIN_PROOF_FAIL_CLOSED =
  "R46_BOUNDED_LIVE_SYSTEM_CHAIN_PROOF_FAIL_CLOSED";

export interface MineruBoundedLiveSystemChainProofResult {
  proofVersion: typeof MINERU_BOUNDED_LIVE_SYSTEM_CHAIN_PROOF_VERSION;
  disposition:
    | typeof R46_BOUNDED_LIVE_SYSTEM_CHAIN_PROOF_PASS
    | typeof R46_BOUNDED_LIVE_SYSTEM_CHAIN_PROOF_FAIL_CLOSED;
  sourceDisposition: string;
  productionRouteAuthorized: false;
  fileBackedPersistenceUsed: true;
  mineruRuntimeExecuted: false;
  privateOutputContentRead: false;
  retrievalUsed: false;
  vectorizationUsed: false;
  providerLiveProofUsed: false;
  publicRuntimeClaimed: false;
  pythonReceiptBridgeStatus: typeof PYTHON_RECEIPT_BRIDGE_NOT_WIRED_BY_R33;
  heldToken: typeof PRODUCTION_MEMORY_RAG_ROUTE_NOT_RELEASED_BY_T25_CANDIDATE_ONLY;
  storeFileExists: boolean;
  writeReceipt: DurableMemoryReceipt | null;
  readReceipt: DurableMemoryReceipt;
  readBackRecordCount: number;
  recordSummarySha256: string | null;
  recordSummaryLength: number;
  routeCandidateResult: MineruSystemChainRouteCandidateResult;
}

export interface MineruBoundedLiveSystemChainProofOptions {
  storePath: string;
  now?: () => number;
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function runMineruBoundedLiveSystemChainProof(
  options: MineruBoundedLiveSystemChainProofOptions,
): MineruBoundedLiveSystemChainProofResult {
  const now = options.now ?? (() => 1770000000000);
  const writeStore = createFileBackedDurableMemoryStore(options.storePath, { now });
  const input = buildMineruInternalSystemChainHarnessInput({
    authority: {
      productionPersistenceMode: "file-backed",
      fileBackedPersistenceRequested: true,
      fileBackedPersistenceActorRole: "OPERATOR",
      retrievalRequested: false,
      vectorizationRequested: false,
      privateOutputContentRead: false,
    },
    adapterPayload: {
      adapterCandidateId: "durable-memory-write-adapter:r46-live-proof",
      actorRole: "OPERATOR",
      claimBoundary:
        "R46 bounded live proof scope; no production release or private output read",
      outputContentRead: false,
      rawMemoryReleased: false,
      summary:
        "R46 bounded MinerU summary-only metadata fixture for file-backed system-chain proof",
      writeInputCandidateId: "r46-bounded-live-system-chain-proof",
    },
  });

  const routeCandidateResult = buildMineruSystemChainRouteCandidate(
    writeStore,
    input,
  );
  const writeReceipt =
    routeCandidateResult.routeResult?.invocationResult?.durableStoreReceipt ??
    null;

  const readStore = createFileBackedDurableMemoryStore(options.storePath, { now });
  const readResult = readStore.read({
    scope: "mineru-document-intelligence",
    actorId: "mineru-r46-live-proof-reader",
    actorRole: "OPERATOR",
    tier: "skill",
    query: "R46 bounded MinerU",
    maxResults: 1,
    actorAuthorized: true,
  });
  const record = readResult.records[0] ?? null;
  const passed =
    routeCandidateResult.disposition ===
      MINERU_SYSTEM_CHAIN_ROUTE_CANDIDATE_ACCEPTED &&
    writeReceipt?.decision === "allowed" &&
    readResult.receipt.decision === "allowed" &&
    record !== null;

  return {
    proofVersion: MINERU_BOUNDED_LIVE_SYSTEM_CHAIN_PROOF_VERSION,
    disposition: passed
      ? R46_BOUNDED_LIVE_SYSTEM_CHAIN_PROOF_PASS
      : R46_BOUNDED_LIVE_SYSTEM_CHAIN_PROOF_FAIL_CLOSED,
    sourceDisposition: routeCandidateResult.disposition,
    productionRouteAuthorized: false,
    fileBackedPersistenceUsed: true,
    mineruRuntimeExecuted: false,
    privateOutputContentRead: false,
    retrievalUsed: false,
    vectorizationUsed: false,
    providerLiveProofUsed: false,
    publicRuntimeClaimed: false,
    pythonReceiptBridgeStatus: PYTHON_RECEIPT_BRIDGE_NOT_WIRED_BY_R33,
    heldToken: PRODUCTION_MEMORY_RAG_ROUTE_NOT_RELEASED_BY_T25_CANDIDATE_ONLY,
    storeFileExists: existsSync(options.storePath),
    writeReceipt,
    readReceipt: readResult.receipt,
    readBackRecordCount: readResult.records.length,
    recordSummarySha256: record ? sha256(record.summary) : null,
    recordSummaryLength: record?.summary.length ?? 0,
    routeCandidateResult,
  };
}
