import { describe, expect, it } from "vitest";
import {
  AgentDefinitionCapabilityBatchContract,
  createAgentDefinitionCapabilityBatchContract,
  type AgentDefinitionCapabilityBatch,
} from "../src/agent.definition.capability.batch.contract";
import type { CapabilityValidationResult } from "../src/agent.definition.boundary.contract";

// --- Helpers ---

const FIXED_NOW = "2026-03-30T00:00:00.000Z";
const fixed = () => FIXED_NOW;

function makeContract() {
  return createAgentDefinitionCapabilityBatchContract({ now: fixed });
}

function makeResult(
  status: CapabilityValidationResult["status"],
  overrides: Partial<CapabilityValidationResult> = {},
): CapabilityValidationResult {
  const base = status === "WITHIN_SCOPE" ? "within" : status === "OUT_OF_SCOPE" ? "out" : "undeclared";
  return {
    resultId: `id-${base}-${Math.random().toString(36).slice(2)}`,
    evaluatedAt: FIXED_NOW,
    agentId: "agent-001",
    capability: "read:knowledge",
    status,
    reason: `reason for ${status}`,
    resultHash: `hash-${base}-${Math.random().toString(36).slice(2)}`,
    ...overrides,
  };
}

// --- empty batch ---

describe("AgentDefinitionCapabilityBatchContract.batch — empty", () => {
  it("returns zero counts and EMPTY dominantStatus for empty array", () => {
    const contract = makeContract();
    const result = contract.batch([]);
    expect(result.totalResults).toBe(0);
    expect(result.withinScopeCount).toBe(0);
    expect(result.outOfScopeCount).toBe(0);
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

describe("AgentDefinitionCapabilityBatchContract.batch — counts", () => {
  it("counts WITHIN_SCOPE results correctly", () => {
    const contract = makeContract();
    const results = [
      makeResult("WITHIN_SCOPE"),
      makeResult("WITHIN_SCOPE"),
      makeResult("OUT_OF_SCOPE"),
    ];
    const batch = contract.batch(results);
    expect(batch.withinScopeCount).toBe(2);
    expect(batch.outOfScopeCount).toBe(1);
    expect(batch.undeclaredAgentCount).toBe(0);
    expect(batch.totalResults).toBe(3);
  });

  it("counts OUT_OF_SCOPE results correctly", () => {
    const contract = makeContract();
    const results = [
      makeResult("OUT_OF_SCOPE"),
      makeResult("OUT_OF_SCOPE"),
      makeResult("UNDECLARED_AGENT"),
    ];
    const batch = contract.batch(results);
    expect(batch.withinScopeCount).toBe(0);
    expect(batch.outOfScopeCount).toBe(2);
    expect(batch.undeclaredAgentCount).toBe(1);
    expect(batch.totalResults).toBe(3);
  });

  it("counts UNDECLARED_AGENT results correctly", () => {
    const contract = makeContract();
    const results = [
      makeResult("UNDECLARED_AGENT"),
      makeResult("UNDECLARED_AGENT"),
      makeResult("UNDECLARED_AGENT"),
    ];
    const batch = contract.batch(results);
    expect(batch.withinScopeCount).toBe(0);
    expect(batch.outOfScopeCount).toBe(0);
    expect(batch.undeclaredAgentCount).toBe(3);
    expect(batch.totalResults).toBe(3);
  });

  it("counts all three statuses correctly in a mixed batch", () => {
    const contract = makeContract();
    const results = [
      makeResult("WITHIN_SCOPE"),
      makeResult("OUT_OF_SCOPE"),
      makeResult("UNDECLARED_AGENT"),
      makeResult("WITHIN_SCOPE"),
      makeResult("OUT_OF_SCOPE"),
    ];
    const batch = contract.batch(results);
    expect(batch.withinScopeCount).toBe(2);
    expect(batch.outOfScopeCount).toBe(2);
    expect(batch.undeclaredAgentCount).toBe(1);
    expect(batch.totalResults).toBe(5);
  });
});

// --- dominant status ---

describe("AgentDefinitionCapabilityBatchContract.batch — dominantStatus", () => {
  it("returns WITHIN_SCOPE when it has the highest count", () => {
    const contract = makeContract();
    const results = [
      makeResult("WITHIN_SCOPE"),
      makeResult("WITHIN_SCOPE"),
      makeResult("OUT_OF_SCOPE"),
    ];
    expect(contract.batch(results).dominantStatus).toBe("WITHIN_SCOPE");
  });

  it("returns OUT_OF_SCOPE when it has the highest count", () => {
    const contract = makeContract();
    const results = [
      makeResult("OUT_OF_SCOPE"),
      makeResult("OUT_OF_SCOPE"),
      makeResult("WITHIN_SCOPE"),
    ];
    expect(contract.batch(results).dominantStatus).toBe("OUT_OF_SCOPE");
  });

  it("returns UNDECLARED_AGENT when it has the highest count", () => {
    const contract = makeContract();
    const results = [
      makeResult("UNDECLARED_AGENT"),
      makeResult("UNDECLARED_AGENT"),
      makeResult("WITHIN_SCOPE"),
    ];
    expect(contract.batch(results).dominantStatus).toBe("UNDECLARED_AGENT");
  });

  it("returns WITHIN_SCOPE on tie with OUT_OF_SCOPE (precedence rule)", () => {
    const contract = makeContract();
    const results = [
      makeResult("WITHIN_SCOPE"),
      makeResult("OUT_OF_SCOPE"),
    ];
    expect(contract.batch(results).dominantStatus).toBe("WITHIN_SCOPE");
  });

  it("returns WITHIN_SCOPE on tie with UNDECLARED_AGENT (precedence rule)", () => {
    const contract = makeContract();
    const results = [
      makeResult("WITHIN_SCOPE"),
      makeResult("UNDECLARED_AGENT"),
    ];
    expect(contract.batch(results).dominantStatus).toBe("WITHIN_SCOPE");
  });

  it("returns OUT_OF_SCOPE on tie with UNDECLARED_AGENT (precedence rule)", () => {
    const contract = makeContract();
    const results = [
      makeResult("OUT_OF_SCOPE"),
      makeResult("UNDECLARED_AGENT"),
    ];
    expect(contract.batch(results).dominantStatus).toBe("OUT_OF_SCOPE");
  });

  it("returns WITHIN_SCOPE on three-way tie (highest precedence)", () => {
    const contract = makeContract();
    const results = [
      makeResult("WITHIN_SCOPE"),
      makeResult("OUT_OF_SCOPE"),
      makeResult("UNDECLARED_AGENT"),
    ];
    expect(contract.batch(results).dominantStatus).toBe("WITHIN_SCOPE");
  });

  it("returns WITHIN_SCOPE for batch with only WITHIN_SCOPE results", () => {
    const contract = makeContract();
    const results = [makeResult("WITHIN_SCOPE"), makeResult("WITHIN_SCOPE")];
    expect(contract.batch(results).dominantStatus).toBe("WITHIN_SCOPE");
  });
});

// --- determinism ---

describe("AgentDefinitionCapabilityBatchContract.batch — determinism", () => {
  it("produces identical batchHash for identical inputs", () => {
    const r1 = makeResult("WITHIN_SCOPE", { resultHash: "hash-A" });
    const r2 = makeResult("OUT_OF_SCOPE", { resultHash: "hash-B" });
    const c1 = makeContract();
    const c2 = makeContract();
    const b1 = c1.batch([r1, r2]);
    const b2 = c2.batch([r1, r2]);
    expect(b1.batchHash).toBe(b2.batchHash);
  });

  it("produces identical batchId for identical inputs", () => {
    const r1 = makeResult("WITHIN_SCOPE", { resultHash: "hash-A" });
    const c1 = makeContract();
    const c2 = makeContract();
    expect(c1.batch([r1]).batchId).toBe(c2.batch([r1]).batchId);
  });

  it("batchId !== batchHash for non-empty inputs", () => {
    const contract = makeContract();
    const result = contract.batch([makeResult("WITHIN_SCOPE", { resultHash: "hash-X" })]);
    expect(result.batchId).not.toBe(result.batchHash);
  });

  it("produces different batchHash for different resultHash values", () => {
    const contract = makeContract();
    const r1 = makeResult("WITHIN_SCOPE", { resultHash: "hash-AAA" });
    const r2 = makeResult("WITHIN_SCOPE", { resultHash: "hash-BBB" });
    const b1 = contract.batch([r1]);
    const b2 = contract.batch([r2]);
    expect(b1.batchHash).not.toBe(b2.batchHash);
  });

  it("produces different batchHash when createdAt differs", () => {
    const r = makeResult("WITHIN_SCOPE", { resultHash: "hash-SAME" });
    const c1 = createAgentDefinitionCapabilityBatchContract({ now: () => "2026-03-30T00:00:00.000Z" });
    const c2 = createAgentDefinitionCapabilityBatchContract({ now: () => "2026-03-30T01:00:00.000Z" });
    const b1 = c1.batch([r]);
    const b2 = c2.batch([r]);
    expect(b1.batchHash).not.toBe(b2.batchHash);
  });
});

// --- factory function ---

describe("createAgentDefinitionCapabilityBatchContract", () => {
  it("returns an AgentDefinitionCapabilityBatchContract instance", () => {
    const contract = createAgentDefinitionCapabilityBatchContract({ now: fixed });
    expect(contract).toBeInstanceOf(AgentDefinitionCapabilityBatchContract);
  });

  it("works without dependency injection (real now)", () => {
    const contract = createAgentDefinitionCapabilityBatchContract();
    const result = contract.batch([]);
    expect(result.dominantStatus).toBe("EMPTY");
    expect(typeof result.createdAt).toBe("string");
  });
});

// --- output shape ---

describe("AgentDefinitionCapabilityBatchContract.batch — output shape", () => {
  it("returns all required fields for a non-empty batch", () => {
    const contract = makeContract();
    const result = contract.batch([makeResult("WITHIN_SCOPE", { resultHash: "hash-shape" })]);
    const keys: Array<keyof AgentDefinitionCapabilityBatch> = [
      "batchId",
      "batchHash",
      "createdAt",
      "totalResults",
      "withinScopeCount",
      "outOfScopeCount",
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
      makeResult("WITHIN_SCOPE"),
      makeResult("OUT_OF_SCOPE"),
      makeResult("UNDECLARED_AGENT"),
      makeResult("WITHIN_SCOPE"),
    ];
    expect(contract.batch(inputs).totalResults).toBe(4);
  });

  it("withinScopeCount + outOfScopeCount + undeclaredAgentCount === totalResults", () => {
    const contract = makeContract();
    const inputs = [
      makeResult("WITHIN_SCOPE"),
      makeResult("WITHIN_SCOPE"),
      makeResult("OUT_OF_SCOPE"),
      makeResult("UNDECLARED_AGENT"),
    ];
    const batch = contract.batch(inputs);
    expect(batch.withinScopeCount + batch.outOfScopeCount + batch.undeclaredAgentCount).toBe(
      batch.totalResults,
    );
  });
});
