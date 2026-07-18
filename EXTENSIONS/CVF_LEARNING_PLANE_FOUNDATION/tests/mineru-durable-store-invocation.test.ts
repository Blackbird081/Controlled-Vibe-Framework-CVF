import { describe, expect, it } from "vitest";
import {
  createInProcessDurableMemoryStore,
} from "../src/durable-memory-store";
import {
  invokeMineruDurableStoreWrite,
  MEMORY_WRITE_NOT_AUTHORIZED_BY_T20_INVOCATION_ONLY,
  MINERU_DURABLE_STORE_INVOCATION_IMPLEMENTED,
  MINERU_DURABLE_STORE_INVOCATION_VERSION,
} from "../src/mineru-durable-store-invocation";
import type { MineruDurableStoreInvocationInput } from "../src/mineru-durable-store-invocation";

// ---------------------------------------------------------------------------
// Builder for a valid adapter-payload-shaped input
// ---------------------------------------------------------------------------

function validInput(
  overrides: Partial<MineruDurableStoreInvocationInput> = {},
): MineruDurableStoreInvocationInput {
  return {
    adapterCandidateId: "durable-memory-write-adapter:abc123",
    adapterDisposition: "DURABLE_MEMORY_WRITE_ADAPTER_IMPLEMENTATION_CANDIDATE_READY",
    adapterVersion: "cvf.mineruDurableMemoryWriteAdapterCandidate.r28t18.v1",
    actorAuthorized: true,
    actorRole: "OPERATOR",
    canReinject: false,
    claimBoundary: "T20 test invocation-only scope; no memory/RAG route release",
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
    summary: "Durable memory write adapter candidate for write-input abc (tier skill, actor OPERATOR, provenance 0.92)",
    summaryOnly: true,
    targetDurableTier: "skill",
    writeInputCandidateId: "abc",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("invokeMineruDurableStoreWrite", () => {
  // ---- allowed writes (store-level succeeds) ----

  it("writes a valid adapter payload to the durable store and returns the receipt", () => {
    const store = createInProcessDurableMemoryStore();
    const input = validInput();

    const result = invokeMineruDurableStoreWrite(store, input);

    expect(result.disposition).toBe(MINERU_DURABLE_STORE_INVOCATION_IMPLEMENTED);
    expect(result.invocationVersion).toBe(MINERU_DURABLE_STORE_INVOCATION_VERSION);
    expect(result.memoryWriteAuthorized).toBe(false);
    expect(result.writeInputCandidateId).toBe("abc");
    expect(result.durableStoreReceipt).not.toBeNull();
    expect(result.durableStoreReceipt!.decision).toBe("allowed");
    expect(result.durableStoreReceipt!.summaryOnly).toBe(true);
    expect(result.durableStoreReceipt!.canReinject).toBe(false);
    expect(result.durableStoreReceipt!.rawMemoryReleased).toBe(false);
    expect(result.preventedReason).toBeNull();
  });

  it("uses long-term tier with GOVERNOR actor", () => {
    const store = createInProcessDurableMemoryStore();
    const input = validInput({
      targetDurableTier: "long-term",
      actorRole: "GOVERNOR",
      summary: "Long-term memory write with GOVERNOR",
    });

    const result = invokeMineruDurableStoreWrite(store, input);

    expect(result.disposition).toBe(MINERU_DURABLE_STORE_INVOCATION_IMPLEMENTED);
    expect(result.durableStoreReceipt!.decision).toBe("allowed");
  });

  it("persists the record in the store", () => {
    const store = createInProcessDurableMemoryStore();
    const input = validInput();

    invokeMineruDurableStoreWrite(store, input);

    const records = store.list();
    expect(records).toHaveLength(1);
    expect(records[0].summary).toBe(input.summary);
  });

  it("preserves memoryWriteAuthorized false even for allowed writes", () => {
    const store = createInProcessDurableMemoryStore();

    const result = invokeMineruDurableStoreWrite(store, validInput());

    expect(result.memoryWriteAuthorized).toBe(false);
    // the hold token is not injected into result directly but is
    // available as a constant:
    expect(MEMORY_WRITE_NOT_AUTHORIZED_BY_T20_INVOCATION_ONLY).toBe(
      "MEMORY_WRITE_NOT_AUTHORIZED_BY_T20_INVOCATION_ONLY",
    );
  });

  // ---- store-level denials (preserved, not bypassed) ----

  it("preserves durable store policy denial", () => {
    const store = createInProcessDurableMemoryStore();
    const input = validInput({ policyDecision: "deny" });

    const result = invokeMineruDurableStoreWrite(store, input);

    expect(result.disposition).toContain("STORE_DENIED");
    expect(result.durableStoreReceipt!.decision).toBe("denied");
    expect(result.durableStoreReceipt!.reason).toBe("durable_memory_policy_denied");
    expect(result.preventedReason).toBe("durable_memory_policy_denied");
  });

  it("preserves durable store actor-not-authorized denial", () => {
    const store = createInProcessDurableMemoryStore();
    const input = validInput({ actorAuthorized: false });

    const result = invokeMineruDurableStoreWrite(store, input);

    expect(result.disposition).toContain("STORE_DENIED");
    expect(result.durableStoreReceipt!.decision).toBe("denied");
    expect(result.durableStoreReceipt!.reason).toBe("durable_memory_policy_denied");
  });

  it("preserves durable store low provenance denial", () => {
    const store = createInProcessDurableMemoryStore();
    const input = validInput({ provenanceScore: 0.3 });

    const result = invokeMineruDurableStoreWrite(store, input);

    expect(result.durableStoreReceipt!.decision).toBe("denied");
    expect(result.durableStoreReceipt!.reason).toBe("low_provenance_score");
  });

  it("preserves invalid actor/tier denial from the runtime hierarchy", () => {
    const store = createInProcessDurableMemoryStore();
    // REVIEWER is not in skill write actors
    const input = validInput({ actorRole: "REVIEWER" });

    const result = invokeMineruDurableStoreWrite(store, input);

    expect(result.durableStoreReceipt!.decision).toBe("denied");
    expect(result.durableStoreReceipt!.reason).toBe("actor_not_allowed_for_memory_tier");
  });

  it("preserves non-durable tier denial", () => {
    const store = createInProcessDurableMemoryStore();
    // "working" is not a durable tier
    const input = validInput({ targetDurableTier: "working" });

    const result = invokeMineruDurableStoreWrite(store, input);

    expect(result.durableStoreReceipt!.decision).toBe("denied");
    expect(result.durableStoreReceipt!.reason).toBe("durable_memory_tier_not_authorized");
  });

  // ---- fail-closed: unsafe adapter payload before store invocation ----

  it("fails closed when outputContentRead is true", () => {
    const store = createInProcessDurableMemoryStore();
    const result = invokeMineruDurableStoreWrite(store, validInput({ outputContentRead: true }));

    expect(result.disposition).toBe("FAIL_CLOSED_OUTPUT_CONTENT_READ");
    expect(result.durableStoreReceipt).toBeNull();
    expect(store.list()).toHaveLength(0);
  });

  it("fails closed when rawMemoryReleased is true", () => {
    const store = createInProcessDurableMemoryStore();
    const result = invokeMineruDurableStoreWrite(store, validInput({ rawMemoryReleased: true }));

    expect(result.disposition).toBe("FAIL_CLOSED_RAW_MEMORY_RELEASED");
    expect(result.durableStoreReceipt).toBeNull();
  });

  it("fails closed when canReinject is true", () => {
    const store = createInProcessDurableMemoryStore();
    const result = invokeMineruDurableStoreWrite(store, validInput({ canReinject: true }));

    expect(result.disposition).toBe("FAIL_CLOSED_REINJECTION_ENABLED");
    expect(result.durableStoreReceipt).toBeNull();
  });

  it("fails closed when summaryOnly is false", () => {
    const store = createInProcessDurableMemoryStore();
    const result = invokeMineruDurableStoreWrite(store, validInput({ summaryOnly: false }));

    expect(result.disposition).toBe("FAIL_CLOSED_SUMMARY_ONLY_FALSE");
    expect(result.durableStoreReceipt).toBeNull();
  });

  it("fails closed when memoryWriteAuthorized is true", () => {
    const store = createInProcessDurableMemoryStore();
    const result = invokeMineruDurableStoreWrite(
      store,
      validInput({ memoryWriteAuthorized: true }),
    );

    expect(result.disposition).toBe("FAIL_CLOSED_MEMORY_WRITE_ALREADY_AUTHORIZED");
    expect(result.durableStoreReceipt).toBeNull();
  });

  // ---- fail-closed: missing R27 prerequisites ----

  it("fails closed when r27ReceiptPrerequisite is false", () => {
    const store = createInProcessDurableMemoryStore();
    const result = invokeMineruDurableStoreWrite(store, validInput({ r27ReceiptPrerequisite: false }));

    expect(result.disposition).toBe("FAIL_CLOSED_R27_RECEIPT_MISSING");
    expect(result.durableStoreReceipt).toBeNull();
  });

  it("fails closed when r27QualityPrerequisite is false", () => {
    const store = createInProcessDurableMemoryStore();
    const result = invokeMineruDurableStoreWrite(store, validInput({ r27QualityPrerequisite: false }));

    expect(result.disposition).toBe("FAIL_CLOSED_R27_QUALITY_MISSING");
    expect(result.durableStoreReceipt).toBeNull();
  });

  it("fails closed when r27SourcePointerPrerequisite is false", () => {
    const store = createInProcessDurableMemoryStore();
    const result = invokeMineruDurableStoreWrite(
      store,
      validInput({ r27SourcePointerPrerequisite: false }),
    );

    expect(result.disposition).toBe("FAIL_CLOSED_R27_SOURCE_POINTER_MISSING");
    expect(result.durableStoreReceipt).toBeNull();
  });

  it("fails closed when r27DownstreamUsePrerequisite is false", () => {
    const store = createInProcessDurableMemoryStore();
    const result = invokeMineruDurableStoreWrite(
      store,
      validInput({ r27DownstreamUsePrerequisite: false }),
    );

    expect(result.disposition).toBe("FAIL_CLOSED_R27_DOWNSTREAM_USE_MISSING");
    expect(result.durableStoreReceipt).toBeNull();
  });

  it("fails closed when r27ClaimBoundaryPrerequisite is false", () => {
    const store = createInProcessDurableMemoryStore();
    const result = invokeMineruDurableStoreWrite(
      store,
      validInput({ r27ClaimBoundaryPrerequisite: false }),
    );

    expect(result.disposition).toBe("FAIL_CLOSED_R27_CLAIM_BOUNDARY_MISSING");
    expect(result.durableStoreReceipt).toBeNull();
  });

  // ---- fail-closed: missing metadata ----

  it("fails closed when summary is empty", () => {
    const store = createInProcessDurableMemoryStore();
    const result = invokeMineruDurableStoreWrite(store, validInput({ summary: "" }));

    expect(result.disposition).toBe("FAIL_CLOSED_MISSING_SUMMARY");
    expect(result.durableStoreReceipt).toBeNull();
  });

  it("fails closed when summary is only whitespace", () => {
    const store = createInProcessDurableMemoryStore();
    const result = invokeMineruDurableStoreWrite(store, validInput({ summary: "   " }));

    expect(result.disposition).toBe("FAIL_CLOSED_MISSING_SUMMARY");
    expect(result.durableStoreReceipt).toBeNull();
  });

  it("fails closed when actorRole is empty", () => {
    const store = createInProcessDurableMemoryStore();
    const result = invokeMineruDurableStoreWrite(store, validInput({ actorRole: "" }));

    expect(result.disposition).toBe("FAIL_CLOSED_MISSING_ACTOR_ROLE");
    expect(result.durableStoreReceipt).toBeNull();
  });

  it("fails closed when targetDurableTier is empty", () => {
    const store = createInProcessDurableMemoryStore();
    const result = invokeMineruDurableStoreWrite(store, validInput({ targetDurableTier: "" }));

    expect(result.disposition).toBe("FAIL_CLOSED_MISSING_TARGET_TIER");
    expect(result.durableStoreReceipt).toBeNull();
  });

  it("fails closed when adapterCandidateId is empty", () => {
    const store = createInProcessDurableMemoryStore();
    const result = invokeMineruDurableStoreWrite(store, validInput({ adapterCandidateId: "" }));

    expect(result.disposition).toBe("FAIL_CLOSED_MISSING_ADAPTER_ID");
    expect(result.durableStoreReceipt).toBeNull();
  });

  // ---- fail-closed: unsafe metadata markers ----

  it("fails closed when summary contains raw-content markers", () => {
    const store = createInProcessDurableMemoryStore();
    const result = invokeMineruDurableStoreWrite(
      store,
      validInput({ summary: "summary with content: raw text block" }),
    );

    expect(result.disposition).toBe("FAIL_CLOSED_UNSAFE_SUMMARY_MARKER");
    expect(result.durableStoreReceipt).toBeNull();
  });

  it("fails closed when summary contains secret-like markers", () => {
    const store = createInProcessDurableMemoryStore();
    const result = invokeMineruDurableStoreWrite(
      store,
      validInput({ summary: "contains an api_key value" }),
    );

    expect(result.disposition).toBe("FAIL_CLOSED_UNSAFE_SUMMARY_MARKER");
    expect(result.durableStoreReceipt).toBeNull();
  });

  it("fails closed when summary contains camel-case secret-like markers", () => {
    const store = createInProcessDurableMemoryStore();
    const result = invokeMineruDurableStoreWrite(
      store,
      validInput({ summary: "contains an apiKey value" }),
    );

    expect(result.disposition).toBe("FAIL_CLOSED_UNSAFE_SUMMARY_MARKER");
    expect(result.durableStoreReceipt).toBeNull();
  });

  // ---- hold token preserved ----

  it("keeps memoryWriteAuthorized false in result shape", () => {
    const store = createInProcessDurableMemoryStore();

    const result = invokeMineruDurableStoreWrite(store, validInput());

    expect(result.memoryWriteAuthorized).toBe(false);
  });

  // ---- multiple writes ----

  it("allows multiple adapter payloads to the same store", () => {
    const store = createInProcessDurableMemoryStore();

    const r1 = invokeMineruDurableStoreWrite(store, validInput({ writeInputCandidateId: "a" }));
    const r2 = invokeMineruDurableStoreWrite(
      store,
      validInput({
        writeInputCandidateId: "b",
        adapterCandidateId: "durable-memory-write-adapter:def456",
      }),
    );

    expect(r1.disposition).toBe(MINERU_DURABLE_STORE_INVOCATION_IMPLEMENTED);
    expect(r2.disposition).toBe(MINERU_DURABLE_STORE_INVOCATION_IMPLEMENTED);
    expect(store.list()).toHaveLength(2);
  });
});
