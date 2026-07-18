import { describe, expect, it } from "vitest";
import {
  createInProcessDurableMemoryStore,
} from "../src/durable-memory-store";
import type { MineruDurableStoreInvocationInput } from "../src/mineru-durable-store-invocation";
import {
  releaseMineruMemoryRagRouteCandidate,
  MEMORY_RAG_ROUTE_RELEASE_NOT_PRODUCTION_AUTHORIZED_BY_T22,
  MINERU_MEMORY_RAG_ROUTE_RELEASE_IMPLEMENTED_BOUNDED_CANDIDATE,
  MINERU_MEMORY_RAG_ROUTE_RELEASE_VERSION,
} from "../src/mineru-memory-rag-route-release";
import type {
  MineruMemoryOwnerAuthorization,
  MineruMemoryRagRouteReleaseInput,
} from "../src/mineru-memory-rag-route-release";

// ---------------------------------------------------------------------------
// Builders for a valid adapter payload and a valid memory-owner authorization
// ---------------------------------------------------------------------------

function validAdapterPayload(
  overrides: Partial<MineruDurableStoreInvocationInput> = {},
): MineruDurableStoreInvocationInput {
  return {
    adapterCandidateId: "durable-memory-write-adapter:t22-abc123",
    adapterDisposition: "DURABLE_MEMORY_WRITE_ADAPTER_IMPLEMENTATION_CANDIDATE_READY",
    adapterVersion: "cvf.mineruDurableMemoryWriteAdapterCandidate.r28t18.v1",
    actorAuthorized: true,
    actorRole: "OPERATOR",
    canReinject: false,
    claimBoundary: "T22 test route-release candidate scope; no production route release",
    durableStoreInvocationDisposition: "DURABLE_STORE_INVOCATION_NOT_AUTHORIZED_BY_T18",
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
    summary: "T22 route release candidate for write-input abc (tier skill, actor OPERATOR, provenance 0.92)",
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

function validInput(
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("releaseMineruMemoryRagRouteCandidate", () => {
  // ---- successful bounded in-process route release ----

  it("releases a bounded in-process candidate through the T20 helper when authorization and payload are valid", () => {
    const store = createInProcessDurableMemoryStore();
    const input = validInput();

    const result = releaseMineruMemoryRagRouteCandidate(store, input);

    expect(result.disposition).toBe(
      MINERU_MEMORY_RAG_ROUTE_RELEASE_IMPLEMENTED_BOUNDED_CANDIDATE,
    );
    expect(result.releaseVersion).toBe(MINERU_MEMORY_RAG_ROUTE_RELEASE_VERSION);
    expect(result.productionRouteAuthorized).toBe(false);
    expect(result.invocationResult).not.toBeNull();
    expect(result.invocationResult!.memoryWriteAuthorized).toBe(false);
    expect(result.invocationResult!.durableStoreReceipt).not.toBeNull();
    expect(result.invocationResult!.durableStoreReceipt!.decision).toBe("allowed");
    expect(result.invocationResult!.durableStoreReceipt!.summaryOnly).toBe(true);
    expect(result.invocationResult!.durableStoreReceipt!.canReinject).toBe(false);
    expect(result.invocationResult!.durableStoreReceipt!.rawMemoryReleased).toBe(false);
    expect(result.preventedReason).toBeNull();
  });

  it("releases a bounded in-process candidate for long-term tier with GOVERNOR actor", () => {
    const store = createInProcessDurableMemoryStore();
    const input = validInput({
      authorization: { actorRole: "GOVERNOR", targetDurableTier: "long-term" },
      adapterPayload: {
        actorRole: "GOVERNOR",
        targetDurableTier: "long-term",
        summary: "T22 long-term route release candidate with GOVERNOR actor",
      },
    });

    const result = releaseMineruMemoryRagRouteCandidate(store, input);

    expect(result.disposition).toBe(
      MINERU_MEMORY_RAG_ROUTE_RELEASE_IMPLEMENTED_BOUNDED_CANDIDATE,
    );
    expect(result.invocationResult!.durableStoreReceipt!.decision).toBe("allowed");
  });

  // ---- missing / invalid memory-owner authorization (fail-closed) ----

  it("fails closed when authorization policyDecision is not \"allow\"", () => {
    const store = createInProcessDurableMemoryStore();
    const input = validInput({ authorization: { policyDecision: "deny" } });

    const result = releaseMineruMemoryRagRouteCandidate(store, input);

    expect(result.disposition).toBe("FAIL_CLOSED_AUTHORIZATION_POLICY_DENIED");
    expect(result.productionRouteAuthorized).toBe(false);
    expect(result.invocationResult).toBeNull();
    expect(result.preventedReason).toContain("policyDecision");
  });

  it("fails closed when authorization actorAuthorized is false", () => {
    const store = createInProcessDurableMemoryStore();
    const input = validInput({ authorization: { actorAuthorized: false } });

    const result = releaseMineruMemoryRagRouteCandidate(store, input);

    expect(result.disposition).toBe(
      "FAIL_CLOSED_AUTHORIZATION_ACTOR_NOT_AUTHORIZED",
    );
    expect(result.invocationResult).toBeNull();
  });

  it("fails closed when authorization actorRole does not match the adapter payload actorRole", () => {
    const store = createInProcessDurableMemoryStore();
    const input = validInput({ authorization: { actorRole: "BUILDER" } });

    const result = releaseMineruMemoryRagRouteCandidate(store, input);

    expect(result.disposition).toBe(
      "FAIL_CLOSED_AUTHORIZATION_ACTOR_ROLE_MISMATCH",
    );
    expect(result.invocationResult).toBeNull();
  });

  it("fails closed when authorization targetDurableTier does not match the adapter payload targetDurableTier", () => {
    const store = createInProcessDurableMemoryStore();
    const input = validInput({ authorization: { targetDurableTier: "long-term" } });

    const result = releaseMineruMemoryRagRouteCandidate(store, input);

    expect(result.disposition).toBe(
      "FAIL_CLOSED_AUTHORIZATION_TARGET_TIER_MISMATCH",
    );
    expect(result.invocationResult).toBeNull();
  });

  // ---- low provenance fail-closed ----

  it("fails closed when authorization provenanceScore is below the minimum threshold", () => {
    const store = createInProcessDurableMemoryStore();
    const input = validInput({ authorization: { provenanceScore: 0.5 } });

    const result = releaseMineruMemoryRagRouteCandidate(store, input);

    expect(result.disposition).toBe("FAIL_CLOSED_AUTHORIZATION_LOW_PROVENANCE");
    expect(result.invocationResult).toBeNull();
  });

  it("fails closed when authorization provenanceScore is not a finite number", () => {
    const store = createInProcessDurableMemoryStore();
    const input = validInput({
      authorization: { provenanceScore: Number.NaN },
    });

    const result = releaseMineruMemoryRagRouteCandidate(store, input);

    expect(result.disposition).toBe("FAIL_CLOSED_AUTHORIZATION_LOW_PROVENANCE");
    expect(result.invocationResult).toBeNull();
  });

  // ---- R27 prerequisite fail-closed cases ----

  it("fails closed when the R27 receipt prerequisite is missing", () => {
    const store = createInProcessDurableMemoryStore();
    const input = validInput({
      adapterPayload: { r27ReceiptPrerequisite: false },
    });

    const result = releaseMineruMemoryRagRouteCandidate(store, input);

    expect(result.disposition).toBe("FAIL_CLOSED_R27_RECEIPT_MISSING");
    expect(result.invocationResult).toBeNull();
  });

  it("fails closed when the R27 quality prerequisite is missing", () => {
    const store = createInProcessDurableMemoryStore();
    const input = validInput({
      adapterPayload: { r27QualityPrerequisite: false },
    });

    const result = releaseMineruMemoryRagRouteCandidate(store, input);

    expect(result.disposition).toBe("FAIL_CLOSED_R27_QUALITY_MISSING");
    expect(result.invocationResult).toBeNull();
  });

  it("fails closed when the R27 source pointer prerequisite is missing", () => {
    const store = createInProcessDurableMemoryStore();
    const input = validInput({
      adapterPayload: { r27SourcePointerPrerequisite: false },
    });

    const result = releaseMineruMemoryRagRouteCandidate(store, input);

    expect(result.disposition).toBe("FAIL_CLOSED_R27_SOURCE_POINTER_MISSING");
    expect(result.invocationResult).toBeNull();
  });

  it("fails closed when the R27 downstream use prerequisite is missing", () => {
    const store = createInProcessDurableMemoryStore();
    const input = validInput({
      adapterPayload: { r27DownstreamUsePrerequisite: false },
    });

    const result = releaseMineruMemoryRagRouteCandidate(store, input);

    expect(result.disposition).toBe("FAIL_CLOSED_R27_DOWNSTREAM_USE_MISSING");
    expect(result.invocationResult).toBeNull();
  });

  it("fails closed when the R27 claim boundary prerequisite is missing", () => {
    const store = createInProcessDurableMemoryStore();
    const input = validInput({
      adapterPayload: { r27ClaimBoundaryPrerequisite: false },
    });

    const result = releaseMineruMemoryRagRouteCandidate(store, input);

    expect(result.disposition).toBe("FAIL_CLOSED_R27_CLAIM_BOUNDARY_MISSING");
    expect(result.invocationResult).toBeNull();
  });

  // ---- private-output / non-reinjection invariant fail-closed cases ----

  it("fails closed when outputContentRead is flipped to true (private-output invariant)", () => {
    const store = createInProcessDurableMemoryStore();
    const input = validInput({
      adapterPayload: { outputContentRead: true },
    });

    const result = releaseMineruMemoryRagRouteCandidate(store, input);

    expect(result.disposition).toBe("FAIL_CLOSED_OUTPUT_CONTENT_READ");
    expect(result.invocationResult).toBeNull();
  });

  it("fails closed when rawMemoryReleased is flipped to true", () => {
    const store = createInProcessDurableMemoryStore();
    const input = validInput({
      adapterPayload: { rawMemoryReleased: true },
    });

    const result = releaseMineruMemoryRagRouteCandidate(store, input);

    expect(result.disposition).toBe("FAIL_CLOSED_RAW_MEMORY_RELEASED");
    expect(result.invocationResult).toBeNull();
  });

  it("fails closed when canReinject is flipped to true", () => {
    const store = createInProcessDurableMemoryStore();
    const input = validInput({
      adapterPayload: { canReinject: true },
    });

    const result = releaseMineruMemoryRagRouteCandidate(store, input);

    expect(result.disposition).toBe("FAIL_CLOSED_REINJECTION_ENABLED");
    expect(result.invocationResult).toBeNull();
  });

  it("fails closed when summaryOnly is flipped to false", () => {
    const store = createInProcessDurableMemoryStore();
    const input = validInput({
      adapterPayload: { summaryOnly: false },
    });

    const result = releaseMineruMemoryRagRouteCandidate(store, input);

    expect(result.disposition).toBe("FAIL_CLOSED_SUMMARY_ONLY_FALSE");
    expect(result.invocationResult).toBeNull();
  });

  // ---- store-level denial still surfaces through T22 without bypassing T20 ----

  it("surfaces a store-level policy denial from the T20 helper without bypassing it", () => {
    const store = createInProcessDurableMemoryStore();
    const input = validInput({
      adapterPayload: { actorAuthorized: false },
    });

    const result = releaseMineruMemoryRagRouteCandidate(store, input);

    expect(result.disposition).toContain("STORE_DENIED");
    expect(result.invocationResult).not.toBeNull();
    expect(result.invocationResult!.durableStoreReceipt!.decision).toBe("denied");
  });

  // ---- no production persistence / retrieval / vectorization / reinjection ----

  it("never authorizes production route release and never exposes reinjection, retrieval, or vectorization behavior", () => {
    const store = createInProcessDurableMemoryStore();
    const input = validInput();

    const result = releaseMineruMemoryRagRouteCandidate(store, input);

    expect(result.productionRouteAuthorized).toBe(false);
    expect(MEMORY_RAG_ROUTE_RELEASE_NOT_PRODUCTION_AUTHORIZED_BY_T22).toBe(
      "MEMORY_RAG_ROUTE_RELEASE_NOT_PRODUCTION_AUTHORIZED_BY_T22",
    );
    expect(result.invocationResult!.memoryWriteAuthorized).toBe(false);
    expect(result.invocationResult!.durableStoreReceipt!.canReinject).toBe(false);
    expect(result.invocationResult!.durableStoreReceipt!.rawMemoryReleased).toBe(false);
    // in-process store only; no file-backed persistence path is invoked
    expect(store.list().length).toBeGreaterThan(0);
  });
});
