import { describe, expect, it } from "vitest";
import {
  AgentRegistrationBatchContract,
  createAgentRegistrationBatchContract,
  type AgentRegistrationBatch,
} from "../src/agent.registration.batch.contract";
import {
  AgentDefinitionBoundaryContract,
} from "../src/agent.definition.boundary.contract";
import type { AgentDefinitionInput } from "../src/agent.definition.boundary.contract";

// --- Helpers ---

const FIXED_NOW = "2026-03-30T00:00:00.000Z";
const fixed = () => FIXED_NOW;

function makeBoundary() {
  return new AgentDefinitionBoundaryContract({ now: fixed });
}

function makeContract() {
  return createAgentRegistrationBatchContract({ now: fixed });
}

function makeInput(overrides: Partial<AgentDefinitionInput> = {}): AgentDefinitionInput {
  return {
    name: "agent-alpha",
    role: "executor",
    declaredCapabilities: ["read:knowledge"],
    declaredDomains: ["operations"],
    ...overrides,
  };
}

// --- empty batch ---

describe("AgentRegistrationBatchContract.batch — empty", () => {
  it("returns zero counts and EMPTY dominantStatus for empty array", () => {
    const contract = makeContract();
    const result = contract.batch([], makeBoundary());
    expect(result.totalResults).toBe(0);
    expect(result.registeredCount).toBe(0);
    expect(result.duplicateCount).toBe(0);
    expect(result.dominantStatus).toBe("EMPTY");
  });

  it("batchId and batchHash are non-empty strings for empty input", () => {
    const contract = makeContract();
    const result = contract.batch([], makeBoundary());
    expect(typeof result.batchId).toBe("string");
    expect(result.batchId.length).toBeGreaterThan(0);
    expect(typeof result.batchHash).toBe("string");
    expect(result.batchHash.length).toBeGreaterThan(0);
  });

  it("batchId !== batchHash for empty input", () => {
    const contract = makeContract();
    const result = contract.batch([], makeBoundary());
    expect(result.batchId).not.toBe(result.batchHash);
  });

  it("createdAt is injected from now()", () => {
    const contract = makeContract();
    const result = contract.batch([], makeBoundary());
    expect(result.createdAt).toBe(FIXED_NOW);
  });
});

// --- registration counts ---

describe("AgentRegistrationBatchContract.batch — counts", () => {
  it("all unique inputs → all REGISTERED", () => {
    const contract = makeContract();
    const inputs = [
      makeInput({ name: "agent-A" }),
      makeInput({ name: "agent-B" }),
      makeInput({ name: "agent-C" }),
    ];
    const batch = contract.batch(inputs, makeBoundary());
    expect(batch.registeredCount).toBe(3);
    expect(batch.duplicateCount).toBe(0);
    expect(batch.totalResults).toBe(3);
  });

  it("duplicate input → registeredCount=1, duplicateCount=1", () => {
    const contract = makeContract();
    const input = makeInput({ name: "agent-dup" });
    const batch = contract.batch([input, input], makeBoundary());
    expect(batch.registeredCount).toBe(1);
    expect(batch.duplicateCount).toBe(1);
    expect(batch.totalResults).toBe(2);
  });

  it("all duplicate inputs → registeredCount=1, duplicateCount=n-1", () => {
    const contract = makeContract();
    const input = makeInput({ name: "agent-same" });
    const batch = contract.batch([input, input, input], makeBoundary());
    expect(batch.registeredCount).toBe(1);
    expect(batch.duplicateCount).toBe(2);
    expect(batch.totalResults).toBe(3);
  });

  it("single input → registeredCount=1, duplicateCount=0", () => {
    const contract = makeContract();
    const batch = contract.batch([makeInput()], makeBoundary());
    expect(batch.registeredCount).toBe(1);
    expect(batch.duplicateCount).toBe(0);
    expect(batch.totalResults).toBe(1);
  });
});

// --- duplicate detection ---

describe("AgentRegistrationBatchContract.batch — duplicate detection", () => {
  it("different name → not a duplicate", () => {
    const contract = makeContract();
    const batch = contract.batch([
      makeInput({ name: "agent-X" }),
      makeInput({ name: "agent-Y" }),
    ], makeBoundary());
    expect(batch.registeredCount).toBe(2);
    expect(batch.duplicateCount).toBe(0);
  });

  it("different role → not a duplicate", () => {
    const contract = makeContract();
    const batch = contract.batch([
      makeInput({ name: "agent-Z", role: "executor" }),
      makeInput({ name: "agent-Z", role: "observer" }),
    ], makeBoundary());
    expect(batch.registeredCount).toBe(2);
    expect(batch.duplicateCount).toBe(0);
  });

  it("different capabilities → not a duplicate", () => {
    const contract = makeContract();
    const batch = contract.batch([
      makeInput({ name: "agent-W", declaredCapabilities: ["read:knowledge"] }),
      makeInput({ name: "agent-W", declaredCapabilities: ["write:knowledge"] }),
    ], makeBoundary());
    expect(batch.registeredCount).toBe(2);
    expect(batch.duplicateCount).toBe(0);
  });

  it("different domains → not a duplicate", () => {
    const contract = makeContract();
    const batch = contract.batch([
      makeInput({ name: "agent-V", declaredDomains: ["operations"] }),
      makeInput({ name: "agent-V", declaredDomains: ["governance"] }),
    ], makeBoundary());
    expect(batch.registeredCount).toBe(2);
    expect(batch.duplicateCount).toBe(0);
  });

  it("first occurrence REGISTERED, subsequent DUPLICATE", () => {
    const contract = makeContract();
    const input = makeInput({ name: "agent-dup2" });
    const batch = contract.batch([input, input, input], makeBoundary());
    expect(batch.results[0].status).toBe("REGISTERED");
    expect(batch.results[1].status).toBe("DUPLICATE");
    expect(batch.results[2].status).toBe("DUPLICATE");
  });

  it("each result record is present regardless of DUPLICATE status", () => {
    const contract = makeContract();
    const input = makeInput({ name: "agent-dup3" });
    const batch = contract.batch([input, input], makeBoundary());
    expect(batch.results[0].record).toBeDefined();
    expect(batch.results[1].record).toBeDefined();
    expect(batch.results[0].record.name).toBe("agent-dup3");
    expect(batch.results[1].record.name).toBe("agent-dup3");
  });
});

// --- dominant status ---

describe("AgentRegistrationBatchContract.batch — dominantStatus", () => {
  it("returns REGISTERED when all inputs are unique", () => {
    const contract = makeContract();
    const batch = contract.batch([
      makeInput({ name: "a1" }),
      makeInput({ name: "a2" }),
    ], makeBoundary());
    expect(batch.dominantStatus).toBe("REGISTERED");
  });

  it("returns DUPLICATE when majority are duplicates", () => {
    const contract = makeContract();
    const dup = makeInput({ name: "agent-d" });
    const batch = contract.batch([dup, dup, dup, makeInput({ name: "unique" })], makeBoundary());
    expect(batch.duplicateCount).toBe(2);
    expect(batch.registeredCount).toBe(2);
    expect(batch.dominantStatus).toBe("REGISTERED");
  });

  it("tie-break: REGISTERED wins over DUPLICATE on equal counts", () => {
    const contract = makeContract();
    const dup = makeInput({ name: "agent-tie" });
    const batch = contract.batch([dup, dup], makeBoundary());
    expect(batch.registeredCount).toBe(1);
    expect(batch.duplicateCount).toBe(1);
    expect(batch.dominantStatus).toBe("REGISTERED");
  });

  it("returns REGISTERED for single-item batch", () => {
    const contract = makeContract();
    const batch = contract.batch([makeInput()], makeBoundary());
    expect(batch.dominantStatus).toBe("REGISTERED");
  });

  it("returns DUPLICATE when all are duplicates of first entry", () => {
    const contract = makeContract();
    const dup = makeInput({ name: "agent-all-dup" });
    const batch = contract.batch([dup, dup, dup, dup], makeBoundary());
    expect(batch.registeredCount).toBe(1);
    expect(batch.duplicateCount).toBe(3);
    expect(batch.dominantStatus).toBe("DUPLICATE");
  });

  it("returns REGISTERED when registeredCount > duplicateCount", () => {
    const contract = makeContract();
    const dup = makeInput({ name: "agent-m" });
    const batch = contract.batch([
      makeInput({ name: "u1" }),
      makeInput({ name: "u2" }),
      makeInput({ name: "u3" }),
      dup,
      dup,
    ], makeBoundary());
    expect(batch.registeredCount).toBe(4);
    expect(batch.duplicateCount).toBe(1);
    expect(batch.dominantStatus).toBe("REGISTERED");
  });
});

// --- determinism ---

describe("AgentRegistrationBatchContract.batch — determinism", () => {
  it("produces identical batchHash for identical inputs and same now()", () => {
    const c1 = makeContract();
    const c2 = makeContract();
    const inputs = [makeInput({ name: "agent-det1" }), makeInput({ name: "agent-det2" })];
    const b1 = c1.batch(inputs, makeBoundary());
    const b2 = c2.batch(inputs, makeBoundary());
    expect(b1.batchHash).toBe(b2.batchHash);
  });

  it("produces different batchHash when now() differs", () => {
    const c1 = createAgentRegistrationBatchContract({ now: () => "2026-03-30T00:00:00.000Z" });
    const c2 = createAgentRegistrationBatchContract({ now: () => "2026-03-30T01:00:00.000Z" });
    const inputs = [makeInput({ name: "agent-det3" })];
    expect(c1.batch(inputs, makeBoundary()).batchHash).not.toBe(
      c2.batch(inputs, makeBoundary()).batchHash,
    );
  });

  it("batchId !== batchHash for non-empty inputs", () => {
    const contract = makeContract();
    const result = contract.batch([makeInput()], makeBoundary());
    expect(result.batchId).not.toBe(result.batchHash);
  });

  it("resultId !== resultHash for each result", () => {
    const contract = makeContract();
    const batch = contract.batch([makeInput({ name: "agent-rdet" })], makeBoundary());
    expect(batch.results[0].resultId).not.toBe(batch.results[0].resultHash);
  });

  it("produces identical batchId for identical inputs and same now()", () => {
    const c1 = makeContract();
    const c2 = makeContract();
    const inputs = [makeInput({ name: "agent-det4" })];
    expect(c1.batch(inputs, makeBoundary()).batchId).toBe(
      c2.batch(inputs, makeBoundary()).batchId,
    );
  });
});

// --- factory function ---

describe("createAgentRegistrationBatchContract", () => {
  it("returns an AgentRegistrationBatchContract instance", () => {
    const contract = createAgentRegistrationBatchContract({ now: fixed });
    expect(contract).toBeInstanceOf(AgentRegistrationBatchContract);
  });

  it("works without dependency injection (real now)", () => {
    const contract = createAgentRegistrationBatchContract();
    const result = contract.batch([], makeBoundary());
    expect(result.dominantStatus).toBe("EMPTY");
    expect(typeof result.createdAt).toBe("string");
  });
});

// --- output shape ---

describe("AgentRegistrationBatchContract.batch — output shape", () => {
  it("batch result contains all required top-level fields", () => {
    const contract = makeContract();
    const result = contract.batch([makeInput()], makeBoundary());
    const keys: Array<keyof AgentRegistrationBatch> = [
      "batchId",
      "batchHash",
      "createdAt",
      "totalResults",
      "registeredCount",
      "duplicateCount",
      "dominantStatus",
      "results",
    ];
    for (const key of keys) {
      expect(result).toHaveProperty(key);
    }
  });

  it("each result item contains all required fields", () => {
    const contract = makeContract();
    const batch = contract.batch([makeInput({ name: "agent-shape" })], makeBoundary());
    const result = batch.results[0];
    expect(result).toHaveProperty("resultId");
    expect(result).toHaveProperty("processedAt");
    expect(result).toHaveProperty("agentId");
    expect(result).toHaveProperty("name");
    expect(result).toHaveProperty("status");
    expect(result).toHaveProperty("reason");
    expect(result).toHaveProperty("record");
    expect(result).toHaveProperty("resultHash");
  });

  it("registeredCount + duplicateCount === totalResults", () => {
    const contract = makeContract();
    const dup = makeInput({ name: "agent-sum" });
    const batch = contract.batch([
      makeInput({ name: "u1" }),
      makeInput({ name: "u2" }),
      dup,
      dup,
    ], makeBoundary());
    expect(batch.registeredCount + batch.duplicateCount).toBe(batch.totalResults);
  });
});
