import { describe, it, expect } from "vitest";
import {
  ReputationSignalBatchContract,
  createReputationSignalBatchContract,
} from "../src/reputation.signal.batch.contract";
import type { ReputationSignal } from "../src/reputation.signal.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeSignal(
  overrides: Partial<ReputationSignal> = {},
): ReputationSignal {
  return {
    signalId: "sig-001",
    computedAt: "2026-03-29T00:00:00.000Z",
    agentId: "agent-001",
    compositeReputationScore: 85,
    reputationClass: "TRUSTED",
    dimensions: {
      truthContribution: 36,
      feedbackContribution: 30,
      evaluationContribution: 15,
      governanceContribution: 10,
    },
    rationale: "test rationale",
    reputationHash: "hash-001",
    ...overrides,
  };
}

const FIXED_NOW = "2026-03-29T12:00:00.000Z";

function makeContract() {
  return new ReputationSignalBatchContract({ now: () => FIXED_NOW });
}

// ─── Empty batch ──────────────────────────────────────────────────────────────

describe("ReputationSignalBatchContract — empty batch", () => {
  it("returns totalSignals 0 for empty input", () => {
    const result = makeContract().batch([]);
    expect(result.totalSignals).toBe(0);
  });

  it("returns all class counts 0 for empty input", () => {
    const result = makeContract().batch([]);
    expect(result.trustedCount).toBe(0);
    expect(result.reliableCount).toBe(0);
    expect(result.provisionalCount).toBe(0);
    expect(result.untrustedCount).toBe(0);
  });

  it("returns averageScore 0 for empty batch", () => {
    const result = makeContract().batch([]);
    expect(result.averageScore).toBe(0);
  });

  it("returns a non-empty batchHash for empty batch", () => {
    const result = makeContract().batch([]);
    expect(typeof result.batchHash).toBe("string");
    expect(result.batchHash.length).toBeGreaterThan(0);
  });

  it("returns a non-empty batchId for empty batch", () => {
    const result = makeContract().batch([]);
    expect(typeof result.batchId).toBe("string");
    expect(result.batchId.length).toBeGreaterThan(0);
  });
});

// ─── Class counts ─────────────────────────────────────────────────────────────

describe("ReputationSignalBatchContract — class counts", () => {
  it("counts TRUSTED signals correctly", () => {
    const signals = [
      makeSignal({ reputationHash: "h1", reputationClass: "TRUSTED" }),
      makeSignal({ reputationHash: "h2", reputationClass: "TRUSTED" }),
      makeSignal({ reputationHash: "h3", reputationClass: "RELIABLE" }),
    ];
    const result = makeContract().batch(signals);
    expect(result.trustedCount).toBe(2);
  });

  it("counts RELIABLE signals correctly", () => {
    const signals = [
      makeSignal({ reputationHash: "h1", reputationClass: "RELIABLE" }),
      makeSignal({ reputationHash: "h2", reputationClass: "TRUSTED" }),
    ];
    const result = makeContract().batch(signals);
    expect(result.reliableCount).toBe(1);
  });

  it("counts PROVISIONAL signals correctly", () => {
    const signals = [
      makeSignal({ reputationHash: "h1", reputationClass: "PROVISIONAL" }),
      makeSignal({ reputationHash: "h2", reputationClass: "PROVISIONAL" }),
      makeSignal({ reputationHash: "h3", reputationClass: "PROVISIONAL" }),
    ];
    const result = makeContract().batch(signals);
    expect(result.provisionalCount).toBe(3);
  });

  it("counts UNTRUSTED signals correctly", () => {
    const signals = [
      makeSignal({ reputationHash: "h1", reputationClass: "UNTRUSTED" }),
    ];
    const result = makeContract().batch(signals);
    expect(result.untrustedCount).toBe(1);
  });

  it("counts all four classes in a mixed batch", () => {
    const signals = [
      makeSignal({ reputationHash: "h1", reputationClass: "TRUSTED" }),
      makeSignal({ reputationHash: "h2", reputationClass: "RELIABLE" }),
      makeSignal({ reputationHash: "h3", reputationClass: "PROVISIONAL" }),
      makeSignal({ reputationHash: "h4", reputationClass: "UNTRUSTED" }),
    ];
    const result = makeContract().batch(signals);
    expect(result.trustedCount).toBe(1);
    expect(result.reliableCount).toBe(1);
    expect(result.provisionalCount).toBe(1);
    expect(result.untrustedCount).toBe(1);
    expect(result.totalSignals).toBe(4);
  });
});

// ─── Average score ────────────────────────────────────────────────────────────

describe("ReputationSignalBatchContract — averageScore", () => {
  it("returns correct averageScore for single signal", () => {
    const signals = [makeSignal({ reputationHash: "h1", compositeReputationScore: 80 })];
    const result = makeContract().batch(signals);
    expect(result.averageScore).toBe(80);
  });

  it("returns rounded averageScore for multiple signals", () => {
    const signals = [
      makeSignal({ reputationHash: "h1", compositeReputationScore: 80 }),
      makeSignal({ reputationHash: "h2", compositeReputationScore: 61 }),
    ];
    const result = makeContract().batch(signals);
    expect(result.averageScore).toBe(71);
  });

  it("rounds averageScore correctly for fractional result", () => {
    const signals = [
      makeSignal({ reputationHash: "h1", compositeReputationScore: 80 }),
      makeSignal({ reputationHash: "h2", compositeReputationScore: 61 }),
      makeSignal({ reputationHash: "h3", compositeReputationScore: 40 }),
    ];
    const result = makeContract().batch(signals);
    expect(result.averageScore).toBe(Math.round((80 + 61 + 40) / 3));
  });

  it("returns 0 averageScore for all-zero scores", () => {
    const signals = [
      makeSignal({ reputationHash: "h1", compositeReputationScore: 0 }),
      makeSignal({ reputationHash: "h2", compositeReputationScore: 0 }),
    ];
    const result = makeContract().batch(signals);
    expect(result.averageScore).toBe(0);
  });
});

// ─── Determinism ──────────────────────────────────────────────────────────────

describe("ReputationSignalBatchContract — determinism", () => {
  it("produces identical batchHash for identical inputs", () => {
    const signals = [
      makeSignal({ reputationHash: "h1", reputationClass: "TRUSTED" }),
      makeSignal({ reputationHash: "h2", reputationClass: "RELIABLE" }),
    ];
    const r1 = makeContract().batch(signals);
    const r2 = makeContract().batch(signals);
    expect(r1.batchHash).toBe(r2.batchHash);
  });

  it("produces identical batchId for identical inputs", () => {
    const signals = [makeSignal({ reputationHash: "h1" })];
    const r1 = makeContract().batch(signals);
    const r2 = makeContract().batch(signals);
    expect(r1.batchId).toBe(r2.batchId);
  });

  it("batchId differs from batchHash", () => {
    const result = makeContract().batch([makeSignal({ reputationHash: "h1" })]);
    expect(result.batchId).not.toBe(result.batchHash);
  });

  it("different inputs produce different batchHash", () => {
    const r1 = makeContract().batch([makeSignal({ reputationHash: "h1" })]);
    const r2 = makeContract().batch([makeSignal({ reputationHash: "h2" })]);
    expect(r1.batchHash).not.toBe(r2.batchHash);
  });

  it("different timestamps produce different batchHash", () => {
    const signals = [makeSignal({ reputationHash: "h1" })];
    const c1 = new ReputationSignalBatchContract({ now: () => "2026-03-29T10:00:00.000Z" });
    const c2 = new ReputationSignalBatchContract({ now: () => "2026-03-29T11:00:00.000Z" });
    expect(c1.batch(signals).batchHash).not.toBe(c2.batch(signals).batchHash);
  });
});

// ─── createdAt ────────────────────────────────────────────────────────────────

describe("ReputationSignalBatchContract — createdAt", () => {
  it("uses injected timestamp", () => {
    const result = makeContract().batch([]);
    expect(result.createdAt).toBe(FIXED_NOW);
  });

  it("falls back to real timestamp when no dependency injected", () => {
    const contract = new ReputationSignalBatchContract();
    const before = new Date().toISOString();
    const result = contract.batch([]);
    const after = new Date().toISOString();
    expect(result.createdAt >= before).toBe(true);
    expect(result.createdAt <= after).toBe(true);
  });
});

// ─── Factory ──────────────────────────────────────────────────────────────────

describe("createReputationSignalBatchContract — factory", () => {
  it("returns a ReputationSignalBatchContract instance", () => {
    const contract = createReputationSignalBatchContract();
    expect(contract).toBeInstanceOf(ReputationSignalBatchContract);
  });

  it("factory result batches correctly", () => {
    const contract = createReputationSignalBatchContract({ now: () => FIXED_NOW });
    const result = contract.batch([makeSignal({ reputationHash: "h1" })]);
    expect(result.totalSignals).toBe(1);
  });
});
