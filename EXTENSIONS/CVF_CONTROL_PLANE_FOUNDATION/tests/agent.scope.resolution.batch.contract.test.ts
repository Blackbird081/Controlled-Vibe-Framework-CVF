import { describe, expect, it } from "vitest";
import {
  AgentScopeResolutionBatchContract,
  createAgentScopeResolutionBatchContract,
  type AgentScopeResolutionBatch,
} from "../src/agent.scope.resolution.batch.contract";
import type { AgentScopeResolution } from "../src/agent.definition.boundary.contract";

// --- Helpers ---

const FIXED_NOW = "2026-03-30T00:00:00.000Z";
const fixed = () => FIXED_NOW;

function makeContract() {
  return createAgentScopeResolutionBatchContract({ now: fixed });
}

function makeResolution(
  status: AgentScopeResolution["status"],
  overrides: Partial<AgentScopeResolution> = {},
): AgentScopeResolution {
  const base = status === "RESOLVED" ? "resolved" : status === "EMPTY_SCOPE" ? "empty" : "undeclared";
  return {
    resolutionId: `id-${base}-${Math.random().toString(36).slice(2)}`,
    resolvedAt: FIXED_NOW,
    agentId: "agent-001",
    status,
    resolvedCapabilities: ["read:knowledge"],
    resolvedDomains: ["operations"],
    reason: `reason for ${status}`,
    resolutionHash: `hash-${base}-${Math.random().toString(36).slice(2)}`,
    ...overrides,
  };
}

// --- empty batch ---

describe("AgentScopeResolutionBatchContract.batch — empty", () => {
  it("returns zero counts and EMPTY dominantStatus for empty array", () => {
    const contract = makeContract();
    const result = contract.batch([]);
    expect(result.totalResults).toBe(0);
    expect(result.resolvedCount).toBe(0);
    expect(result.emptyScopeCount).toBe(0);
    expect(result.undeclaredAgentCount).toBe(0);
    expect(result.dominantStatus).toBe("EMPTY");
  });

  it("batchId and batchHash are non-empty strings for empty input", () => {
    const contract = makeContract();
    const result = contract.batch([]);
    expect(typeof result.batchId).toBe("string");
    expect(result.batchId.length).toBeGreaterThan(0);
    expect(typeof result.batchHash).toBe("string");
    expect(result.batchHash.length).toBeGreaterThan(0);
  });

  it("batchId !== batchHash for empty input", () => {
    const contract = makeContract();
    const result = contract.batch([]);
    expect(result.batchId).not.toBe(result.batchHash);
  });

  it("createdAt is injected from now()", () => {
    const contract = makeContract();
    const result = contract.batch([]);
    expect(result.createdAt).toBe(FIXED_NOW);
  });
});

// --- count accuracy ---

describe("AgentScopeResolutionBatchContract.batch — counts", () => {
  it("counts RESOLVED results correctly", () => {
    const contract = makeContract();
    const results = [
      makeResolution("RESOLVED"),
      makeResolution("RESOLVED"),
      makeResolution("EMPTY_SCOPE"),
    ];
    const batch = contract.batch(results);
    expect(batch.resolvedCount).toBe(2);
    expect(batch.emptyScopeCount).toBe(1);
    expect(batch.undeclaredAgentCount).toBe(0);
    expect(batch.totalResults).toBe(3);
  });

  it("counts EMPTY_SCOPE results correctly", () => {
    const contract = makeContract();
    const results = [
      makeResolution("EMPTY_SCOPE"),
      makeResolution("EMPTY_SCOPE"),
      makeResolution("UNDECLARED_AGENT"),
    ];
    const batch = contract.batch(results);
    expect(batch.resolvedCount).toBe(0);
    expect(batch.emptyScopeCount).toBe(2);
    expect(batch.undeclaredAgentCount).toBe(1);
    expect(batch.totalResults).toBe(3);
  });

  it("counts UNDECLARED_AGENT results correctly", () => {
    const contract = makeContract();
    const results = [
      makeResolution("UNDECLARED_AGENT"),
      makeResolution("UNDECLARED_AGENT"),
      makeResolution("UNDECLARED_AGENT"),
    ];
    const batch = contract.batch(results);
    expect(batch.resolvedCount).toBe(0);
    expect(batch.emptyScopeCount).toBe(0);
    expect(batch.undeclaredAgentCount).toBe(3);
    expect(batch.totalResults).toBe(3);
  });

  it("counts all three statuses correctly in a mixed batch", () => {
    const contract = makeContract();
    const results = [
      makeResolution("RESOLVED"),
      makeResolution("EMPTY_SCOPE"),
      makeResolution("UNDECLARED_AGENT"),
      makeResolution("RESOLVED"),
      makeResolution("EMPTY_SCOPE"),
    ];
    const batch = contract.batch(results);
    expect(batch.resolvedCount).toBe(2);
    expect(batch.emptyScopeCount).toBe(2);
    expect(batch.undeclaredAgentCount).toBe(1);
    expect(batch.totalResults).toBe(5);
  });
});

// --- dominant status ---

describe("AgentScopeResolutionBatchContract.batch — dominantStatus", () => {
  it("returns RESOLVED when it has the highest count", () => {
    const contract = makeContract();
    const results = [
      makeResolution("RESOLVED"),
      makeResolution("RESOLVED"),
      makeResolution("EMPTY_SCOPE"),
    ];
    expect(contract.batch(results).dominantStatus).toBe("RESOLVED");
  });

  it("returns EMPTY_SCOPE when it has the highest count", () => {
    const contract = makeContract();
    const results = [
      makeResolution("EMPTY_SCOPE"),
      makeResolution("EMPTY_SCOPE"),
      makeResolution("RESOLVED"),
    ];
    expect(contract.batch(results).dominantStatus).toBe("EMPTY_SCOPE");
  });

  it("returns UNDECLARED_AGENT when it has the highest count", () => {
    const contract = makeContract();
    const results = [
      makeResolution("UNDECLARED_AGENT"),
      makeResolution("UNDECLARED_AGENT"),
      makeResolution("RESOLVED"),
    ];
    expect(contract.batch(results).dominantStatus).toBe("UNDECLARED_AGENT");
  });

  it("returns RESOLVED on tie with EMPTY_SCOPE (precedence rule)", () => {
    const contract = makeContract();
    const results = [
      makeResolution("RESOLVED"),
      makeResolution("EMPTY_SCOPE"),
    ];
    expect(contract.batch(results).dominantStatus).toBe("RESOLVED");
  });

  it("returns RESOLVED on tie with UNDECLARED_AGENT (precedence rule)", () => {
    const contract = makeContract();
    const results = [
      makeResolution("RESOLVED"),
      makeResolution("UNDECLARED_AGENT"),
    ];
    expect(contract.batch(results).dominantStatus).toBe("RESOLVED");
  });

  it("returns EMPTY_SCOPE on tie with UNDECLARED_AGENT (precedence rule)", () => {
    const contract = makeContract();
    const results = [
      makeResolution("EMPTY_SCOPE"),
      makeResolution("UNDECLARED_AGENT"),
    ];
    expect(contract.batch(results).dominantStatus).toBe("EMPTY_SCOPE");
  });

  it("returns RESOLVED on three-way tie (highest precedence)", () => {
    const contract = makeContract();
    const results = [
      makeResolution("RESOLVED"),
      makeResolution("EMPTY_SCOPE"),
      makeResolution("UNDECLARED_AGENT"),
    ];
    expect(contract.batch(results).dominantStatus).toBe("RESOLVED");
  });

  it("returns RESOLVED for batch with only RESOLVED results", () => {
    const contract = makeContract();
    const results = [makeResolution("RESOLVED"), makeResolution("RESOLVED")];
    expect(contract.batch(results).dominantStatus).toBe("RESOLVED");
  });
});

// --- determinism ---

describe("AgentScopeResolutionBatchContract.batch — determinism", () => {
  it("produces identical batchHash for identical inputs", () => {
    const r1 = makeResolution("RESOLVED", { resolutionHash: "hash-A" });
    const r2 = makeResolution("EMPTY_SCOPE", { resolutionHash: "hash-B" });
    const c1 = makeContract();
    const c2 = makeContract();
    const b1 = c1.batch([r1, r2]);
    const b2 = c2.batch([r1, r2]);
    expect(b1.batchHash).toBe(b2.batchHash);
  });

  it("produces identical batchId for identical inputs", () => {
    const r1 = makeResolution("RESOLVED", { resolutionHash: "hash-A" });
    const c1 = makeContract();
    const c2 = makeContract();
    expect(c1.batch([r1]).batchId).toBe(c2.batch([r1]).batchId);
  });

  it("batchId !== batchHash for non-empty inputs", () => {
    const contract = makeContract();
    const result = contract.batch([makeResolution("RESOLVED", { resolutionHash: "hash-X" })]);
    expect(result.batchId).not.toBe(result.batchHash);
  });

  it("produces different batchHash for different resolutionHash values", () => {
    const contract = makeContract();
    const r1 = makeResolution("RESOLVED", { resolutionHash: "hash-AAA" });
    const r2 = makeResolution("RESOLVED", { resolutionHash: "hash-BBB" });
    const b1 = contract.batch([r1]);
    const b2 = contract.batch([r2]);
    expect(b1.batchHash).not.toBe(b2.batchHash);
  });

  it("produces different batchHash when createdAt differs", () => {
    const r = makeResolution("RESOLVED", { resolutionHash: "hash-SAME" });
    const c1 = createAgentScopeResolutionBatchContract({ now: () => "2026-03-30T00:00:00.000Z" });
    const c2 = createAgentScopeResolutionBatchContract({ now: () => "2026-03-30T01:00:00.000Z" });
    const b1 = c1.batch([r]);
    const b2 = c2.batch([r]);
    expect(b1.batchHash).not.toBe(b2.batchHash);
  });
});

// --- factory function ---

describe("createAgentScopeResolutionBatchContract", () => {
  it("returns an AgentScopeResolutionBatchContract instance", () => {
    const contract = createAgentScopeResolutionBatchContract({ now: fixed });
    expect(contract).toBeInstanceOf(AgentScopeResolutionBatchContract);
  });

  it("works without dependency injection (real now)", () => {
    const contract = createAgentScopeResolutionBatchContract();
    const result = contract.batch([]);
    expect(result.dominantStatus).toBe("EMPTY");
    expect(typeof result.createdAt).toBe("string");
  });
});

// --- output shape ---

describe("AgentScopeResolutionBatchContract.batch — output shape", () => {
  it("returns all required fields for a non-empty batch", () => {
    const contract = makeContract();
    const result = contract.batch([makeResolution("RESOLVED", { resolutionHash: "hash-shape" })]);
    const keys: Array<keyof AgentScopeResolutionBatch> = [
      "batchId",
      "batchHash",
      "createdAt",
      "totalResults",
      "resolvedCount",
      "emptyScopeCount",
      "undeclaredAgentCount",
      "dominantStatus",
    ];
    for (const key of keys) {
      expect(result).toHaveProperty(key);
    }
  });

  it("totalResults equals input array length", () => {
    const contract = makeContract();
    const inputs = [
      makeResolution("RESOLVED"),
      makeResolution("EMPTY_SCOPE"),
      makeResolution("UNDECLARED_AGENT"),
      makeResolution("RESOLVED"),
    ];
    expect(contract.batch(inputs).totalResults).toBe(4);
  });

  it("resolvedCount + emptyScopeCount + undeclaredAgentCount === totalResults", () => {
    const contract = makeContract();
    const inputs = [
      makeResolution("RESOLVED"),
      makeResolution("RESOLVED"),
      makeResolution("EMPTY_SCOPE"),
      makeResolution("UNDECLARED_AGENT"),
    ];
    const batch = contract.batch(inputs);
    expect(batch.resolvedCount + batch.emptyScopeCount + batch.undeclaredAgentCount).toBe(
      batch.totalResults,
    );
  });
});
