import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  R46_BOUNDED_LIVE_SYSTEM_CHAIN_PROOF_PASS,
  runMineruBoundedLiveSystemChainProof,
} from "../src/mineru-bounded-live-system-chain-proof";
import {
  MINERU_SYSTEM_CHAIN_ROUTE_CANDIDATE_ACCEPTED,
  PRODUCTION_MEMORY_RAG_ROUTE_NOT_RELEASED_BY_T25_CANDIDATE_ONLY,
} from "../src/mineru-system-chain-route-candidate";

const tempStorePath = join(__dirname, "fixtures", "tmp-r46-system-chain-proof.json");

function cleanup(): void {
  if (existsSync(tempStorePath)) {
    rmSync(tempStorePath);
  }
}

afterEach(cleanup);

describe("MSEA-R46 MinerU bounded live system-chain proof harness", () => {
  it("writes and reads back summary-only MinerU metadata through file-backed durable memory", () => {
    cleanup();

    const result = runMineruBoundedLiveSystemChainProof({
      storePath: tempStorePath,
      now: () => 1770000000000,
    });

    expect(result.disposition).toBe(R46_BOUNDED_LIVE_SYSTEM_CHAIN_PROOF_PASS);
    expect(result.sourceDisposition).toBe(
      MINERU_SYSTEM_CHAIN_ROUTE_CANDIDATE_ACCEPTED,
    );
    expect(result.productionRouteAuthorized).toBe(false);
    expect(result.fileBackedPersistenceUsed).toBe(true);
    expect(result.mineruRuntimeExecuted).toBe(false);
    expect(result.privateOutputContentRead).toBe(false);
    expect(result.retrievalUsed).toBe(false);
    expect(result.vectorizationUsed).toBe(false);
    expect(result.providerLiveProofUsed).toBe(false);
    expect(result.publicRuntimeClaimed).toBe(false);
    expect(result.heldToken).toBe(
      PRODUCTION_MEMORY_RAG_ROUTE_NOT_RELEASED_BY_T25_CANDIDATE_ONLY,
    );
    expect(result.storeFileExists).toBe(true);
    expect(result.writeReceipt?.decision).toBe("allowed");
    expect(result.writeReceipt?.durablePersistence).toBe(true);
    expect(result.writeReceipt?.crossSession).toBe(true);
    expect(result.writeReceipt?.summaryOnly).toBe(true);
    expect(result.writeReceipt?.canReinject).toBe(false);
    expect(result.writeReceipt?.rawMemoryReleased).toBe(false);
    expect(result.readReceipt.decision).toBe("allowed");
    expect(result.readReceipt.summaryOnly).toBe(true);
    expect(result.readReceipt.canReinject).toBe(false);
    expect(result.readReceipt.rawMemoryReleased).toBe(false);
    expect(result.readBackRecordCount).toBe(1);
    expect(result.recordSummarySha256).toMatch(/^[a-f0-9]{64}$/);
    expect(result.recordSummaryLength).toBeGreaterThan(0);
  });
});
