import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { createInProcessDurableMemoryStore, createFileBackedDurableMemoryStore } from "../src/durable-memory-store";
import type { MineruDurableStoreInvocationInput } from "../src/mineru-durable-store-invocation";
import type {
  MineruMemoryOwnerAuthorization,
  MineruMemoryRagRouteReleaseInput,
} from "../src/mineru-memory-rag-route-release";
import {
  buildMineruSystemChainRouteCandidate,
  FAIL_CLOSED_FILE_BACKED_PERSISTENCE_ACTOR_ROLE_NOT_AUTHORIZED,
  MINERU_SYSTEM_CHAIN_ROUTE_CANDIDATE_ACCEPTED,
  MINERU_SYSTEM_CHAIN_ROUTE_CANDIDATE_VERSION,
  PRODUCTION_MEMORY_RAG_ROUTE_NOT_RELEASED_BY_T25_CANDIDATE_ONLY,
  T24_AUTHORING_READY_DISPOSITION,
  type MineruSystemChainRouteAuthority,
  type MineruSystemChainRouteCandidateInput,
} from "../src/mineru-system-chain-route-candidate";

function validAdapterPayload(
  overrides: Partial<MineruDurableStoreInvocationInput> = {},
): MineruDurableStoreInvocationInput {
  return {
    adapterCandidateId: "durable-memory-write-adapter:t25-abc123",
    adapterDisposition:
      "DURABLE_MEMORY_WRITE_ADAPTER_IMPLEMENTATION_CANDIDATE_READY",
    adapterVersion: "cvf.mineruDurableMemoryWriteAdapterCandidate.r28t18.v1",
    actorAuthorized: true,
    actorRole: "OPERATOR",
    canReinject: false,
    claimBoundary: "T25 bounded system-chain candidate; no production release",
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
    summary: "T25 bounded system-chain route candidate for metadata summary abc",
    summaryOnly: true,
    targetDurableTier: "skill",
    writeInputCandidateId: "abc",
    ...overrides,
  };
}

function validAuthorization(
  overrides: Partial<MineruMemoryOwnerAuthorization> = {},
): MineruMemoryOwnerAuthorization {
  return {
    policyDecision: "allow",
    actorAuthorized: true,
    provenanceScore: 0.92,
    actorRole: "OPERATOR",
    targetDurableTier: "skill",
    ...overrides,
  };
}

function validRouteInput(
  overrides: {
    authorization?: Partial<MineruMemoryOwnerAuthorization>;
    adapterPayload?: Partial<MineruDurableStoreInvocationInput>;
  } = {},
): MineruMemoryRagRouteReleaseInput {
  return {
    authorization: validAuthorization(overrides.authorization),
    adapterPayload: validAdapterPayload(overrides.adapterPayload),
  };
}

function validAuthority(
  overrides: Partial<MineruSystemChainRouteAuthority> = {},
): MineruSystemChainRouteAuthority {
  return {
    t23Disposition: T24_AUTHORING_READY_DISPOSITION,
    freshMemoryOwnerAuthorization: true,
    productionPersistenceMode: "in-process-only",
    fileBackedPersistenceRequested: false,
    retrievalRequested: false,
    vectorizationRequested: false,
    privateOutputContentRead: false,
    ...overrides,
  };
}

function validInput(
  overrides: {
    authority?: Partial<MineruSystemChainRouteAuthority>;
    routeInput?: Parameters<typeof validRouteInput>[0];
  } = {},
): MineruSystemChainRouteCandidateInput {
  return {
    authority: validAuthority(overrides.authority),
    routeInput: validRouteInput(overrides.routeInput),
  };
}

describe("buildMineruSystemChainRouteCandidate", () => {
  it("accepts a bounded in-process system-chain candidate through T22/T20", () => {
    const store = createInProcessDurableMemoryStore({
      now: () => 1770000000000,
    });

    const result = buildMineruSystemChainRouteCandidate(store, validInput());

    expect(result.disposition).toBe(MINERU_SYSTEM_CHAIN_ROUTE_CANDIDATE_ACCEPTED);
    expect(result.routeCandidateVersion).toBe(
      MINERU_SYSTEM_CHAIN_ROUTE_CANDIDATE_VERSION,
    );
    expect(result.productionRouteAuthorized).toBe(false);
    expect(result.systemChainCandidateReady).toBe(true);
    expect(result.persistenceMode).toBe("in-process-only");
    expect(result.heldToken).toBe(
      PRODUCTION_MEMORY_RAG_ROUTE_NOT_RELEASED_BY_T25_CANDIDATE_ONLY,
    );
    expect(result.routeResult!.productionRouteAuthorized).toBe(false);
    expect(result.routeResult!.invocationResult!.memoryWriteAuthorized).toBe(
      false,
    );
    expect(result.routeResult!.invocationResult!.durableStoreReceipt!.summaryOnly)
      .toBe(true);
    expect(result.routeResult!.invocationResult!.durableStoreReceipt!.canReinject)
      .toBe(false);
    expect(
      result.routeResult!.invocationResult!.durableStoreReceipt!.rawMemoryReleased,
    ).toBe(false);
    expect(store.list()).toHaveLength(1);
  });

  it("fails closed when T23 did not select T24 authoring readiness", () => {
    const store = createInProcessDurableMemoryStore();
    const result = buildMineruSystemChainRouteCandidate(
      store,
      validInput({ authority: { t23Disposition: "WRONG_DISPOSITION" } }),
    );

    expect(result.disposition).toBe("FAIL_CLOSED_T23_DISPOSITION_NOT_READY");
    expect(result.systemChainCandidateReady).toBe(false);
    expect(result.routeResult).toBeNull();
    expect(store.list()).toHaveLength(0);
  });

  it("fails closed when fresh memory-owner authorization is missing", () => {
    const store = createInProcessDurableMemoryStore();
    const result = buildMineruSystemChainRouteCandidate(
      store,
      validInput({ authority: { freshMemoryOwnerAuthorization: false } }),
    );

    expect(result.disposition).toBe(
      "FAIL_CLOSED_MEMORY_OWNER_AUTHORIZATION_MISSING",
    );
    expect(result.routeResult).toBeNull();
    expect(store.list()).toHaveLength(0);
  });

  it("fails closed on file-backed production persistence request when actor role is missing", () => {
    const store = createInProcessDurableMemoryStore();
    const result = buildMineruSystemChainRouteCandidate(
      store,
      validInput({ authority: { fileBackedPersistenceRequested: true } }),
    );

    expect(result.disposition).toBe(
      FAIL_CLOSED_FILE_BACKED_PERSISTENCE_ACTOR_ROLE_NOT_AUTHORIZED,
    );
    expect(result.persistenceMode).toBe("rejected");
    expect(result.routeResult).toBeNull();
    expect(store.list()).toHaveLength(0);
  });

  it("fails closed on file-backed persistence with authorized actor role (T25 bounded cap still prevents release)", () => {
    const store = createInProcessDurableMemoryStore();
    const result = buildMineruSystemChainRouteCandidate(
      store,
      validInput({
        authority: {
          fileBackedPersistenceRequested: true,
          fileBackedPersistenceActorRole: "OPERATOR",
        },
      }),
    );

    // Actor-role gate passes for OPERATOR, but the T25 bounded cap still blocks
    expect(result.disposition).toBe("FAIL_CLOSED_FILE_BACKED_PERSISTENCE_REQUESTED");
    expect(result.persistenceMode).toBe("rejected");
    expect(result.routeResult).toBeNull();
    expect(store.list()).toHaveLength(0);
  });

  it("fails closed on retrieval request", () => {
    const store = createInProcessDurableMemoryStore();
    const result = buildMineruSystemChainRouteCandidate(
      store,
      validInput({ authority: { retrievalRequested: true } }),
    );

    expect(result.disposition).toBe("FAIL_CLOSED_RETRIEVAL_REQUESTED");
    expect(result.routeResult).toBeNull();
  });

  it("fails closed on vectorization request", () => {
    const store = createInProcessDurableMemoryStore();
    const result = buildMineruSystemChainRouteCandidate(
      store,
      validInput({ authority: { vectorizationRequested: true } }),
    );

    expect(result.disposition).toBe("FAIL_CLOSED_VECTORIZATION_REQUESTED");
    expect(result.routeResult).toBeNull();
  });

  it("fails closed on private/generated output content read request", () => {
    const store = createInProcessDurableMemoryStore();
    const result = buildMineruSystemChainRouteCandidate(
      store,
      validInput({ authority: { privateOutputContentRead: true } }),
    );

    expect(result.disposition).toBe("FAIL_CLOSED_PRIVATE_OUTPUT_CONTENT_READ");
    expect(result.routeResult).toBeNull();
  });

  it("surfaces a T22 fail-closed result without claiming system readiness", () => {
    const store = createInProcessDurableMemoryStore();
    const result = buildMineruSystemChainRouteCandidate(
      store,
      validInput({
        routeInput: {
          adapterPayload: { r27ReceiptPrerequisite: false },
        },
      }),
    );

    expect(result.disposition).toContain("T22_ROUTE_CANDIDATE_NOT_ACCEPTED");
    expect(result.routeResult!.disposition).toBe(
      "FAIL_CLOSED_R27_RECEIPT_MISSING",
    );
    expect(result.systemChainCandidateReady).toBe(false);
    expect(result.productionRouteAuthorized).toBe(false);
  });
});

describe("R43-T2 actor-role authority gate for fileBackedPersistenceRequested", () => {
  it("passes actor-role gate for authorized OPERATOR with fileBackedPersistenceRequested true (T25 bounded cap still active)", () => {
    const store = createInProcessDurableMemoryStore();
    const result = buildMineruSystemChainRouteCandidate(
      store,
      validInput({
        authority: {
          fileBackedPersistenceRequested: true,
          fileBackedPersistenceActorRole: "OPERATOR",
        },
      }),
    );

    // Actor-role gate passes for OPERATOR, but the bounded T25 cap still
    // prevents file-backed persistence release (productionRouteAuthorized remains false)
    expect(result.disposition).toBe("FAIL_CLOSED_FILE_BACKED_PERSISTENCE_REQUESTED");
    expect(result.disposition).not.toBe(FAIL_CLOSED_FILE_BACKED_PERSISTENCE_ACTOR_ROLE_NOT_AUTHORIZED);
    expect(result.productionRouteAuthorized).toBe(false);
    expect(result.systemChainCandidateReady).toBe(false);
    expect(result.heldToken).toBe(PRODUCTION_MEMORY_RAG_ROUTE_NOT_RELEASED_BY_T25_CANDIDATE_ONLY);
    expect(store.list()).toHaveLength(0);
  });

  it("passes actor-role gate for authorized GOVERNOR with fileBackedPersistenceRequested true (T25 bounded cap still active)", () => {
    const store = createInProcessDurableMemoryStore();
    const result = buildMineruSystemChainRouteCandidate(
      store,
      validInput({
        authority: {
          fileBackedPersistenceRequested: true,
          fileBackedPersistenceActorRole: "GOVERNOR",
        },
      }),
    );

    expect(result.disposition).toBe("FAIL_CLOSED_FILE_BACKED_PERSISTENCE_REQUESTED");
    expect(result.disposition).not.toBe(FAIL_CLOSED_FILE_BACKED_PERSISTENCE_ACTOR_ROLE_NOT_AUTHORIZED);
    expect(result.productionRouteAuthorized).toBe(false);
    expect(result.systemChainCandidateReady).toBe(false);
    expect(result.heldToken).toBe(PRODUCTION_MEMORY_RAG_ROUTE_NOT_RELEASED_BY_T25_CANDIDATE_ONLY);
    expect(store.list()).toHaveLength(0);
  });

  it("fails closed with actor-role token when fileBackedPersistenceActorRole is missing", () => {
    const store = createInProcessDurableMemoryStore();
    const result = buildMineruSystemChainRouteCandidate(
      store,
      validInput({
        authority: {
          fileBackedPersistenceRequested: true,
          // fileBackedPersistenceActorRole intentionally omitted
        },
      }),
    );

    expect(result.disposition).toBe(FAIL_CLOSED_FILE_BACKED_PERSISTENCE_ACTOR_ROLE_NOT_AUTHORIZED);
    expect(result.productionRouteAuthorized).toBe(false);
    expect(result.systemChainCandidateReady).toBe(false);
    expect(result.routeResult).toBeNull();
    expect(store.list()).toHaveLength(0);
  });

  it("fails closed with actor-role token for unauthorized role AI_AGENT", () => {
    const store = createInProcessDurableMemoryStore();
    const result = buildMineruSystemChainRouteCandidate(
      store,
      validInput({
        authority: {
          fileBackedPersistenceRequested: true,
          fileBackedPersistenceActorRole: "AI_AGENT",
        },
      }),
    );

    expect(result.disposition).toBe(FAIL_CLOSED_FILE_BACKED_PERSISTENCE_ACTOR_ROLE_NOT_AUTHORIZED);
    expect(result.productionRouteAuthorized).toBe(false);
    expect(result.routeResult).toBeNull();
    expect(store.list()).toHaveLength(0);
  });

  it("fails closed with actor-role token for unauthorized role SERVICE_AGENT", () => {
    const store = createInProcessDurableMemoryStore();
    const result = buildMineruSystemChainRouteCandidate(
      store,
      validInput({
        authority: {
          fileBackedPersistenceRequested: true,
          fileBackedPersistenceActorRole: "SERVICE_AGENT",
        },
      }),
    );

    expect(result.disposition).toBe(FAIL_CLOSED_FILE_BACKED_PERSISTENCE_ACTOR_ROLE_NOT_AUTHORIZED);
    expect(result.routeResult).toBeNull();
    expect(store.list()).toHaveLength(0);
  });

  it("fails closed with actor-role token for unauthorized role OBSERVER", () => {
    const store = createInProcessDurableMemoryStore();
    const result = buildMineruSystemChainRouteCandidate(
      store,
      validInput({
        authority: {
          fileBackedPersistenceRequested: true,
          fileBackedPersistenceActorRole: "OBSERVER",
        },
      }),
    );

    expect(result.disposition).toBe(FAIL_CLOSED_FILE_BACKED_PERSISTENCE_ACTOR_ROLE_NOT_AUTHORIZED);
    expect(result.routeResult).toBeNull();
    expect(store.list()).toHaveLength(0);
  });

  it("existing bounded happy path with fileBackedPersistenceRequested false still passes (R43-T2 regression)", () => {
    const store = createInProcessDurableMemoryStore({
      now: () => 1770000000000,
    });

    const result = buildMineruSystemChainRouteCandidate(store, validInput());

    expect(result.disposition).toBe(MINERU_SYSTEM_CHAIN_ROUTE_CANDIDATE_ACCEPTED);
    expect(result.productionRouteAuthorized).toBe(false);
    expect(result.systemChainCandidateReady).toBe(true);
    expect(result.persistenceMode).toBe("in-process-only");
    expect(result.heldToken).toBe(PRODUCTION_MEMORY_RAG_ROUTE_NOT_RELEASED_BY_T25_CANDIDATE_ONLY);
    expect(store.list()).toHaveLength(1);
  });
});

describe("R44-T2 narrow file-backed persistence invocation implementation", () => {
  const tempDbPath = join(__dirname, "fixtures", "tmp-file-backed-store-r44t2.json");

  const cleanup = () => {
    if (existsSync(tempDbPath)) {
      try {
        unlinkSync(tempDbPath);
      } catch {}
    }
  };

  beforeEach(() => {
    cleanup();
  });

  afterAll(() => {
    cleanup();
  });

  it("passes actor-role gate for authorized OPERATOR with fileBackedPersistenceRequested true and productionPersistenceMode file-backed", () => {
    const store = createFileBackedDurableMemoryStore(tempDbPath, {
      now: () => 1770000000000,
    });

    const result = buildMineruSystemChainRouteCandidate(
      store,
      validInput({
        authority: {
          productionPersistenceMode: "file-backed",
          fileBackedPersistenceRequested: true,
          fileBackedPersistenceActorRole: "OPERATOR",
        },
      }),
    );

    expect(result.disposition).toBe(MINERU_SYSTEM_CHAIN_ROUTE_CANDIDATE_ACCEPTED);
    expect(result.productionRouteAuthorized).toBe(false);
    expect(result.systemChainCandidateReady).toBe(true);
    expect(result.persistenceMode).toBe("file-backed");
    expect(result.heldToken).toBe(PRODUCTION_MEMORY_RAG_ROUTE_NOT_RELEASED_BY_T25_CANDIDATE_ONLY);
    expect(result.routeResult!.productionRouteAuthorized).toBe(false);
    expect(result.routeResult!.invocationResult!.memoryWriteAuthorized).toBe(
      false,
    );
    expect(result.routeResult!.invocationResult!.durableStoreReceipt!.summaryOnly)
      .toBe(true);
    expect(result.routeResult!.invocationResult!.durableStoreReceipt!.canReinject)
      .toBe(false);
    expect(
      result.routeResult!.invocationResult!.durableStoreReceipt!.rawMemoryReleased,
    ).toBe(false);
    expect(store.list()).toHaveLength(1);
    expect(existsSync(tempDbPath)).toBe(true);
  });

  it("passes actor-role gate for authorized GOVERNOR with fileBackedPersistenceRequested true and productionPersistenceMode file-backed", () => {
    const store = createFileBackedDurableMemoryStore(tempDbPath, {
      now: () => 1770000000000,
    });

    const result = buildMineruSystemChainRouteCandidate(
      store,
      validInput({
        authority: {
          productionPersistenceMode: "file-backed",
          fileBackedPersistenceRequested: true,
          fileBackedPersistenceActorRole: "GOVERNOR",
        },
      }),
    );

    expect(result.disposition).toBe(MINERU_SYSTEM_CHAIN_ROUTE_CANDIDATE_ACCEPTED);
    expect(result.productionRouteAuthorized).toBe(false);
    expect(result.systemChainCandidateReady).toBe(true);
    expect(result.persistenceMode).toBe("file-backed");
    expect(result.heldToken).toBe(PRODUCTION_MEMORY_RAG_ROUTE_NOT_RELEASED_BY_T25_CANDIDATE_ONLY);
    expect(store.list()).toHaveLength(1);
    expect(existsSync(tempDbPath)).toBe(true);
  });

  it("fails closed when file-backed mode is requested but actor role is missing", () => {
    const store = createFileBackedDurableMemoryStore(tempDbPath);
    const result = buildMineruSystemChainRouteCandidate(
      store,
      validInput({
        authority: {
          productionPersistenceMode: "file-backed",
          fileBackedPersistenceRequested: true,
          // fileBackedPersistenceActorRole intentionally omitted
        },
      }),
    );

    expect(result.disposition).toBe(FAIL_CLOSED_FILE_BACKED_PERSISTENCE_ACTOR_ROLE_NOT_AUTHORIZED);
    expect(result.productionRouteAuthorized).toBe(false);
    expect(result.systemChainCandidateReady).toBe(false);
    expect(result.persistenceMode).toBe("rejected");
    expect(result.routeResult).toBeNull();
    expect(store.list()).toHaveLength(0);
    expect(existsSync(tempDbPath)).toBe(false);
  });

  it("fails closed when file-backed mode is requested but actor role is unauthorized (AI_AGENT)", () => {
    const store = createFileBackedDurableMemoryStore(tempDbPath);
    const result = buildMineruSystemChainRouteCandidate(
      store,
      validInput({
        authority: {
          productionPersistenceMode: "file-backed",
          fileBackedPersistenceRequested: true,
          fileBackedPersistenceActorRole: "AI_AGENT",
        },
      }),
    );

    expect(result.disposition).toBe(FAIL_CLOSED_FILE_BACKED_PERSISTENCE_ACTOR_ROLE_NOT_AUTHORIZED);
    expect(result.productionRouteAuthorized).toBe(false);
    expect(result.systemChainCandidateReady).toBe(false);
    expect(result.persistenceMode).toBe("rejected");
    expect(result.routeResult).toBeNull();
    expect(store.list()).toHaveLength(0);
    expect(existsSync(tempDbPath)).toBe(false);
  });

  it("fails closed when file-backed mode is NOT requested but persistenceMode is set to file-backed", () => {
    const store = createFileBackedDurableMemoryStore(tempDbPath);
    const result = buildMineruSystemChainRouteCandidate(
      store,
      validInput({
        authority: {
          productionPersistenceMode: "file-backed",
          fileBackedPersistenceRequested: false,
          fileBackedPersistenceActorRole: "OPERATOR",
        },
      }),
    );

    expect(result.disposition).toBe("FAIL_CLOSED_FILE_BACKED_PERSISTENCE_NOT_REQUESTED");
    expect(result.productionRouteAuthorized).toBe(false);
    expect(result.systemChainCandidateReady).toBe(false);
    expect(result.persistenceMode).toBe("rejected");
    expect(result.routeResult).toBeNull();
    expect(store.list()).toHaveLength(0);
    expect(existsSync(tempDbPath)).toBe(false);
  });
});
