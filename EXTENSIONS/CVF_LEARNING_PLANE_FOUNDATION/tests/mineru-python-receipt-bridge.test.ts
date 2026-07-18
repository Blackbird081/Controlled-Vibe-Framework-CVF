import { describe, expect, it } from "vitest";
import {
  mapMineruPythonReceiptFixtureToDurableStoreInvocationInput,
  MINERU_PYTHON_RECEIPT_BRIDGE_FAIL_CLOSED,
  MINERU_PYTHON_RECEIPT_BRIDGE_PROOF_FIXTURE_ONLY,
  MINERU_PYTHON_RECEIPT_BRIDGE_VERSION,
  PYTHON_RECEIPT_BRIDGE_PROOF_NOT_PRODUCTION_WIRED_BY_R34_T1,
  type MineruPythonReceiptBridgeFixture,
} from "../src/mineru-python-receipt-bridge";
import {
  buildMineruInternalSystemChainHarnessInput,
  runMineruInternalSystemChainHarness,
  MINERU_INTERNAL_SYSTEM_CHAIN_HARNESS_PASS_BOUNDED,
} from "../src/mineru-internal-system-chain-harness";
import { invokeMineruDurableStoreWrite } from "../src/mineru-durable-store-invocation";
import { createInProcessDurableMemoryStore } from "../src/durable-memory-store";

// ---------------------------------------------------------------------------
// Builder for a well-formed Python-receipt-writer-shaped fixture
// ---------------------------------------------------------------------------

function validPythonFixture(
  overrides: Partial<MineruPythonReceiptBridgeFixture> = {},
): MineruPythonReceiptBridgeFixture {
  return {
    adapterCandidateId: "durable-memory-write-adapter:r34-t1-bridge",
    adapterDisposition: "DURABLE_MEMORY_WRITE_ADAPTER_IMPLEMENTATION_CANDIDATE_READY",
    adapterVersion: "cvf.mineruDurableMemoryWriteAdapterCandidate.r28t18.v1",
    actorAuthorized: true,
    actorRole: "OPERATOR",
    canReinject: false,
    claimBoundary:
      "R34-T1 bridge-proof fixture; no production release or private output read",
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
      "R34-T1 Python-receipt-writer-shaped fixture for bridge proof (tier skill, actor OPERATOR, provenance 0.92)",
    summaryOnly: true,
    targetDurableTier: "skill",
    writeInputCandidateId: "r34-t1-bridge",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("mapMineruPythonReceiptFixtureToDurableStoreInvocationInput", () => {
  // ---- successful fixture-to-interface mapping ----

  it("maps a well-formed Python-shaped fixture into the target TypeScript interface field-for-field", () => {
    const fixture = validPythonFixture();

    const result = mapMineruPythonReceiptFixtureToDurableStoreInvocationInput(fixture);

    expect(result.disposition).toBe(MINERU_PYTHON_RECEIPT_BRIDGE_PROOF_FIXTURE_ONLY);
    expect(result.bridgeVersion).toBe(MINERU_PYTHON_RECEIPT_BRIDGE_VERSION);
    expect(result.productionWired).toBe(false);
    expect(result.heldToken).toBe(
      PYTHON_RECEIPT_BRIDGE_PROOF_NOT_PRODUCTION_WIRED_BY_R34_T1,
    );
    expect(result.preventedReason).toBeNull();
    expect(result.mappedInput).not.toBeNull();

    // field-for-field equality against the source fixture
    expect(result.mappedInput).toEqual({
      adapterCandidateId: fixture.adapterCandidateId,
      adapterDisposition: fixture.adapterDisposition,
      adapterVersion: fixture.adapterVersion,
      actorAuthorized: fixture.actorAuthorized,
      actorRole: fixture.actorRole,
      canReinject: fixture.canReinject,
      claimBoundary: fixture.claimBoundary,
      durableStoreInvocationDisposition: fixture.durableStoreInvocationDisposition,
      memoryWriteAuthorized: fixture.memoryWriteAuthorized,
      outputContentRead: fixture.outputContentRead,
      policyDecision: fixture.policyDecision,
      provenanceScore: fixture.provenanceScore,
      r27ClaimBoundaryPrerequisite: fixture.r27ClaimBoundaryPrerequisite,
      r27DownstreamUsePrerequisite: fixture.r27DownstreamUsePrerequisite,
      r27QualityPrerequisite: fixture.r27QualityPrerequisite,
      r27ReceiptPrerequisite: fixture.r27ReceiptPrerequisite,
      r27SourcePointerPrerequisite: fixture.r27SourcePointerPrerequisite,
      rawMemoryReleased: fixture.rawMemoryReleased,
      summary: fixture.summary,
      summaryOnly: fixture.summaryOnly,
      targetDurableTier: fixture.targetDurableTier,
      writeInputCandidateId: fixture.writeInputCandidateId,
    });
  });

  it("maps a long-term-tier GOVERNOR fixture with the same field-for-field fidelity", () => {
    const fixture = validPythonFixture({
      actorRole: "GOVERNOR",
      targetDurableTier: "long-term",
      summary: "R34-T1 long-term tier fixture with GOVERNOR actor",
    });

    const result = mapMineruPythonReceiptFixtureToDurableStoreInvocationInput(fixture);

    expect(result.disposition).toBe(MINERU_PYTHON_RECEIPT_BRIDGE_PROOF_FIXTURE_ONLY);
    expect(result.mappedInput!.actorRole).toBe("GOVERNOR");
    expect(result.mappedInput!.targetDurableTier).toBe("long-term");
  });

  // ---- negative / malformed-fixture fail-closed cases ----

  it("fails closed when a required string field is missing (empty string)", () => {
    const fixture = validPythonFixture({ adapterCandidateId: "" });

    const result = mapMineruPythonReceiptFixtureToDurableStoreInvocationInput(fixture);

    expect(result.disposition).toBe(MINERU_PYTHON_RECEIPT_BRIDGE_FAIL_CLOSED);
    expect(result.mappedInput).toBeNull();
    expect(result.preventedReason).toContain("adapterCandidateId");
  });

  it("fails closed when a required boolean field has the wrong type", () => {
    const fixture = validPythonFixture({
      actorAuthorized: "true" as unknown as boolean,
    });

    const result = mapMineruPythonReceiptFixtureToDurableStoreInvocationInput(fixture);

    expect(result.disposition).toBe(MINERU_PYTHON_RECEIPT_BRIDGE_FAIL_CLOSED);
    expect(result.mappedInput).toBeNull();
    expect(result.preventedReason).toContain("actorAuthorized");
  });

  it("fails closed when provenanceScore is missing (undefined)", () => {
    const fixture = validPythonFixture({
      provenanceScore: undefined as unknown as number,
    });

    const result = mapMineruPythonReceiptFixtureToDurableStoreInvocationInput(fixture);

    expect(result.disposition).toBe(MINERU_PYTHON_RECEIPT_BRIDGE_FAIL_CLOSED);
    expect(result.mappedInput).toBeNull();
    expect(result.preventedReason).toContain("provenanceScore");
  });

  it("fails closed when provenanceScore is a non-finite number", () => {
    const fixture = validPythonFixture({ provenanceScore: Number.NaN });

    const result = mapMineruPythonReceiptFixtureToDurableStoreInvocationInput(fixture);

    expect(result.disposition).toBe(MINERU_PYTHON_RECEIPT_BRIDGE_FAIL_CLOSED);
    expect(result.mappedInput).toBeNull();
    expect(result.preventedReason).toContain("provenanceScore");
  });

  it("fails closed when multiple required fields are missing at once and reports all of them", () => {
    const fixture = validPythonFixture({
      summary: "",
      r27ReceiptPrerequisite: undefined as unknown as boolean,
    });

    const result = mapMineruPythonReceiptFixtureToDurableStoreInvocationInput(fixture);

    expect(result.disposition).toBe(MINERU_PYTHON_RECEIPT_BRIDGE_FAIL_CLOSED);
    expect(result.mappedInput).toBeNull();
    expect(result.preventedReason).toContain("summary");
    expect(result.preventedReason).toContain("r27ReceiptPrerequisite");
  });

  it("fails closed when a private-output or memory-release invariant is unsafe", () => {
    const fixture = validPythonFixture({
      canReinject: true,
      memoryWriteAuthorized: true,
      outputContentRead: true,
      rawMemoryReleased: true,
      summaryOnly: false,
    });

    const result = mapMineruPythonReceiptFixtureToDurableStoreInvocationInput(fixture);

    expect(result.disposition).toBe(MINERU_PYTHON_RECEIPT_BRIDGE_FAIL_CLOSED);
    expect(result.mappedInput).toBeNull();
    expect(result.preventedReason).toContain("canReinject");
    expect(result.preventedReason).toContain("memoryWriteAuthorized");
    expect(result.preventedReason).toContain("outputContentRead");
    expect(result.preventedReason).toContain("rawMemoryReleased");
    expect(result.preventedReason).toContain("summaryOnly");
  });

  it("fails closed when the fixture is null", () => {
    const result = mapMineruPythonReceiptFixtureToDurableStoreInvocationInput(
      null as unknown as MineruPythonReceiptBridgeFixture,
    );

    expect(result.disposition).toBe(MINERU_PYTHON_RECEIPT_BRIDGE_FAIL_CLOSED);
    expect(result.mappedInput).toBeNull();
  });

  // ---- proof that the mapped object is accepted by the existing T20/harness chain ----

  it("produces a mapped object accepted as a structurally valid MineruDurableStoreInvocationInput by the T20 helper", () => {
    const fixture = validPythonFixture();
    const bridged = mapMineruPythonReceiptFixtureToDurableStoreInvocationInput(fixture);
    expect(bridged.mappedInput).not.toBeNull();

    const store = createInProcessDurableMemoryStore();
    const invocationResult = invokeMineruDurableStoreWrite(store, bridged.mappedInput!);

    expect(invocationResult.disposition).toBe(
      "MINERU_DURABLE_STORE_INVOCATION_IMPLEMENTED",
    );
    expect(invocationResult.memoryWriteAuthorized).toBe(false);
    expect(invocationResult.durableStoreReceipt).not.toBeNull();
    expect(invocationResult.durableStoreReceipt!.decision).toBe("allowed");
  });

  it("produces a mapped object that the R33 internal harness chain accepts end-to-end", () => {
    const fixture = validPythonFixture({ writeInputCandidateId: "r34-t1-harness" });
    const bridged = mapMineruPythonReceiptFixtureToDurableStoreInvocationInput(fixture);
    expect(bridged.mappedInput).not.toBeNull();

    const harnessInput = buildMineruInternalSystemChainHarnessInput({
      adapterPayload: bridged.mappedInput!,
    });
    const harnessResult = runMineruInternalSystemChainHarness(harnessInput);

    expect(harnessResult.disposition).toBe(
      MINERU_INTERNAL_SYSTEM_CHAIN_HARNESS_PASS_BOUNDED,
    );
    expect(harnessResult.productionRouteAuthorized).toBe(false);
    expect(harnessResult.fileBackedPersistenceUsed).toBe(false);
    expect(harnessResult.mineruRuntimeExecuted).toBe(false);
    expect(harnessResult.privateOutputContentRead).toBe(false);
  });

  // ---- confirmation of no I/O boundary crossing ----

  it("performs no process, file, or network I/O; disposition and hold token are pure in-memory constants", () => {
    expect(MINERU_PYTHON_RECEIPT_BRIDGE_PROOF_FIXTURE_ONLY).toBe(
      "MINERU_PYTHON_RECEIPT_BRIDGE_PROOF_FIXTURE_ONLY",
    );
    expect(PYTHON_RECEIPT_BRIDGE_PROOF_NOT_PRODUCTION_WIRED_BY_R34_T1).toBe(
      "PYTHON_RECEIPT_BRIDGE_PROOF_NOT_PRODUCTION_WIRED_BY_R34_T1",
    );

    const fixture = validPythonFixture();
    const result = mapMineruPythonReceiptFixtureToDurableStoreInvocationInput(fixture);

    expect(result.productionWired).toBe(false);
  });
});
