import { describe, expect, it } from "vitest";
import {
  buildMineruInternalSystemChainHarnessInput,
  MINERU_INTERNAL_SYSTEM_CHAIN_HARNESS_FAIL_CLOSED,
  MINERU_INTERNAL_SYSTEM_CHAIN_HARNESS_PASS_BOUNDED,
  MINERU_INTERNAL_SYSTEM_CHAIN_HARNESS_VERSION,
  PYTHON_RECEIPT_BRIDGE_NOT_WIRED_BY_R33,
  runMineruInternalSystemChainHarness,
} from "../src/mineru-internal-system-chain-harness";
import { createInProcessDurableMemoryStore } from "../src/durable-memory-store";

describe("runMineruInternalSystemChainHarness", () => {
  it("passes the bounded in-process T25/T22/T20 chain without production claims", () => {
    const result = runMineruInternalSystemChainHarness();

    expect(result.disposition).toBe(
      MINERU_INTERNAL_SYSTEM_CHAIN_HARNESS_PASS_BOUNDED,
    );
    expect(result.harnessVersion).toBe(
      MINERU_INTERNAL_SYSTEM_CHAIN_HARNESS_VERSION,
    );
    expect(result.pythonReceiptBridgeStatus).toBe(
      PYTHON_RECEIPT_BRIDGE_NOT_WIRED_BY_R33,
    );
    expect(result.productionRouteAuthorized).toBe(false);
    expect(result.fileBackedPersistenceUsed).toBe(false);
    expect(result.mineruRuntimeExecuted).toBe(false);
    expect(result.privateOutputContentRead).toBe(false);
    expect(result.retrievalUsed).toBe(false);
    expect(result.vectorizationUsed).toBe(false);
    expect(result.providerLiveProofUsed).toBe(false);
    expect(result.publicRuntimeClaimed).toBe(false);
    expect(result.storeRecordCount).toBe(1);
    expect(result.routeCandidateResult.productionRouteAuthorized).toBe(false);
    expect(
      result.routeCandidateResult.routeResult!.invocationResult!
        .memoryWriteAuthorized,
    ).toBe(false);
  });

  it("fails closed when private/generated output content read is requested", () => {
    const result = runMineruInternalSystemChainHarness(
      buildMineruInternalSystemChainHarnessInput({
        authority: { privateOutputContentRead: true },
      }),
    );

    expect(result.disposition).toBe(
      MINERU_INTERNAL_SYSTEM_CHAIN_HARNESS_FAIL_CLOSED,
    );
    expect(result.sourceDisposition).toBe(
      "FAIL_CLOSED_PRIVATE_OUTPUT_CONTENT_READ",
    );
    expect(result.storeRecordCount).toBe(0);
  });

  it("fails closed when file-backed production persistence is requested", () => {
    const result = runMineruInternalSystemChainHarness(
      buildMineruInternalSystemChainHarnessInput({
        authority: { fileBackedPersistenceRequested: true },
      }),
    );

    expect(result.disposition).toBe(
      MINERU_INTERNAL_SYSTEM_CHAIN_HARNESS_FAIL_CLOSED,
    );
    expect(result.sourceDisposition).toBe(
      "FAIL_CLOSED_FILE_BACKED_PERSISTENCE_REQUESTED",
    );
    expect(result.fileBackedPersistenceUsed).toBe(false);
    expect(result.storeRecordCount).toBe(0);
  });

  it("surfaces underlying T22 prerequisite failure without system readiness", () => {
    const result = runMineruInternalSystemChainHarness(
      buildMineruInternalSystemChainHarnessInput({
        adapterPayload: { r27QualityPrerequisite: false },
      }),
    );

    expect(result.disposition).toBe(
      MINERU_INTERNAL_SYSTEM_CHAIN_HARNESS_FAIL_CLOSED,
    );
    expect(result.sourceDisposition).toContain("T22_ROUTE_CANDIDATE_NOT_ACCEPTED");
    expect(result.routeCandidateResult.systemChainCandidateReady).toBe(false);
    expect(result.storeRecordCount).toBe(0);
  });

  it("uses the caller-provided in-process store without constructing a file-backed store", () => {
    const store = createInProcessDurableMemoryStore({
      now: () => 1770000000001,
    });

    const result = runMineruInternalSystemChainHarness(undefined, { store });

    expect(result.disposition).toBe(
      MINERU_INTERNAL_SYSTEM_CHAIN_HARNESS_PASS_BOUNDED,
    );
    expect(store.list()).toHaveLength(1);
    expect(result.fileBackedPersistenceUsed).toBe(false);
  });
});
