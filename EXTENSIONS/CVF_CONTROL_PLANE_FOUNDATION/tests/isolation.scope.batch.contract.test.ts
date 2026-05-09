import { describe, expect, it } from "vitest";
import {
  IsolationScopeBatchContract,
  createIsolationScopeBatchContract,
  type IsolationScopeBatch,
} from "../src/isolation.scope.batch.contract";
import { TrustIsolationBoundaryContract } from "../src/trust.isolation.boundary.contract";
import type { IsolationScopeRequest } from "../src/trust.isolation.boundary.contract";

// --- Helpers ---

const FIXED_NOW = "2026-03-30T00:00:00.000Z";
const fixed = () => FIXED_NOW;

function makeBoundary() {
  return new TrustIsolationBoundaryContract({ now: fixed });
}

function makeContract() {
  return createIsolationScopeBatchContract({ now: fixed });
}

function makeHardBlockRequest(overrides: Partial<IsolationScopeRequest> = {}): IsolationScopeRequest {
  return {
    scopeClass: "WORKSPACE",
    subjectId: "ws-001",
    requestedOperation: "write:file",
    riskLevel: "R1",
    ...overrides,
  };
}

function makeEscalateRequest(overrides: Partial<IsolationScopeRequest> = {}): IsolationScopeRequest {
  return {
    scopeClass: "AGENT",
    subjectId: "agent-001",
    requestedOperation: "execute:policy",
    riskLevel: "R2",
    ...overrides,
  };
}

function makePassRequest(overrides: Partial<IsolationScopeRequest> = {}): IsolationScopeRequest {
  return {
    scopeClass: "CAPABILITY",
    subjectId: "cap-001",
    requestedOperation: "read:knowledge",
    riskLevel: "R1",
    ...overrides,
  };
}

// --- empty batch ---

describe("IsolationScopeBatchContract.batch — empty", () => {
  it("returns zero counts and EMPTY dominantEnforcementMode for empty array", () => {
    const contract = makeContract();
    const result = contract.batch([], makeBoundary());
    expect(result.totalResults).toBe(0);
    expect(result.hardBlockCount).toBe(0);
    expect(result.escalateCount).toBe(0);
    expect(result.passCount).toBe(0);
    expect(result.dominantEnforcementMode).toBe("EMPTY");
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

// --- count accuracy ---

describe("IsolationScopeBatchContract.batch — counts", () => {
  it("counts HARD_BLOCK results correctly", () => {
    const contract = makeContract();
    const requests = [
      makeHardBlockRequest({ subjectId: "ws-A" }),
      makeHardBlockRequest({ subjectId: "ws-B" }),
      makePassRequest(),
    ];
    const batch = contract.batch(requests, makeBoundary());
    expect(batch.hardBlockCount).toBe(2);
    expect(batch.passCount).toBe(1);
    expect(batch.escalateCount).toBe(0);
    expect(batch.totalResults).toBe(3);
  });

  it("counts ESCALATE results correctly", () => {
    const contract = makeContract();
    const requests = [
      makeEscalateRequest({ subjectId: "agent-A" }),
      makeEscalateRequest({ subjectId: "agent-B" }),
      makeHardBlockRequest(),
    ];
    const batch = contract.batch(requests, makeBoundary());
    expect(batch.escalateCount).toBe(2);
    expect(batch.hardBlockCount).toBe(1);
    expect(batch.passCount).toBe(0);
    expect(batch.totalResults).toBe(3);
  });

  it("counts PASS results correctly", () => {
    const contract = makeContract();
    const requests = [
      makePassRequest({ subjectId: "cap-A" }),
      makePassRequest({ subjectId: "cap-B" }),
      makePassRequest({ subjectId: "cap-C" }),
    ];
    const batch = contract.batch(requests, makeBoundary());
    expect(batch.passCount).toBe(3);
    expect(batch.hardBlockCount).toBe(0);
    expect(batch.escalateCount).toBe(0);
    expect(batch.totalResults).toBe(3);
  });

  it("counts all three modes correctly in a mixed batch", () => {
    const contract = makeContract();
    const requests = [
      makeHardBlockRequest({ subjectId: "ws-X" }),
      makeEscalateRequest({ subjectId: "agent-X" }),
      makePassRequest({ subjectId: "cap-X" }),
      makeHardBlockRequest({ subjectId: "ws-Y" }),
      makeEscalateRequest({ subjectId: "agent-Y" }),
    ];
    const batch = contract.batch(requests, makeBoundary());
    expect(batch.hardBlockCount).toBe(2);
    expect(batch.escalateCount).toBe(2);
    expect(batch.passCount).toBe(1);
    expect(batch.totalResults).toBe(5);
  });
});

// --- dominant enforcement mode ---

describe("IsolationScopeBatchContract.batch — dominantEnforcementMode", () => {
  it("returns HARD_BLOCK when it has the highest count", () => {
    const contract = makeContract();
    const requests = [
      makeHardBlockRequest({ subjectId: "ws-A" }),
      makeHardBlockRequest({ subjectId: "ws-B" }),
      makeEscalateRequest(),
    ];
    expect(contract.batch(requests, makeBoundary()).dominantEnforcementMode).toBe("HARD_BLOCK");
  });

  it("returns ESCALATE when it has the highest count", () => {
    const contract = makeContract();
    const requests = [
      makeEscalateRequest({ subjectId: "agent-A" }),
      makeEscalateRequest({ subjectId: "agent-B" }),
      makePassRequest(),
    ];
    expect(contract.batch(requests, makeBoundary()).dominantEnforcementMode).toBe("ESCALATE");
  });

  it("returns PASS when it has the highest count", () => {
    const contract = makeContract();
    const requests = [
      makePassRequest({ subjectId: "cap-A" }),
      makePassRequest({ subjectId: "cap-B" }),
      makeEscalateRequest(),
    ];
    expect(contract.batch(requests, makeBoundary()).dominantEnforcementMode).toBe("PASS");
  });

  it("returns HARD_BLOCK on tie with ESCALATE (precedence rule)", () => {
    const contract = makeContract();
    const requests = [makeHardBlockRequest(), makeEscalateRequest()];
    expect(contract.batch(requests, makeBoundary()).dominantEnforcementMode).toBe("HARD_BLOCK");
  });

  it("returns HARD_BLOCK on tie with PASS (precedence rule)", () => {
    const contract = makeContract();
    const requests = [makeHardBlockRequest(), makePassRequest()];
    expect(contract.batch(requests, makeBoundary()).dominantEnforcementMode).toBe("HARD_BLOCK");
  });

  it("returns ESCALATE on tie with PASS (precedence rule)", () => {
    const contract = makeContract();
    const requests = [makeEscalateRequest(), makePassRequest()];
    expect(contract.batch(requests, makeBoundary()).dominantEnforcementMode).toBe("ESCALATE");
  });

  it("returns HARD_BLOCK on three-way tie (highest precedence)", () => {
    const contract = makeContract();
    const requests = [makeHardBlockRequest(), makeEscalateRequest(), makePassRequest()];
    expect(contract.batch(requests, makeBoundary()).dominantEnforcementMode).toBe("HARD_BLOCK");
  });

  it("returns HARD_BLOCK for batch with only HARD_BLOCK results", () => {
    const contract = makeContract();
    const requests = [
      makeHardBlockRequest({ subjectId: "ws-A" }),
      makeHardBlockRequest({ subjectId: "ws-B" }),
    ];
    expect(contract.batch(requests, makeBoundary()).dominantEnforcementMode).toBe("HARD_BLOCK");
  });
});

// --- determinism ---

describe("IsolationScopeBatchContract.batch — determinism", () => {
  it("produces identical batchHash for identical requests", () => {
    const req = makePassRequest();
    const c1 = makeContract();
    const c2 = makeContract();
    const b1 = c1.batch([req], makeBoundary());
    const b2 = c2.batch([req], makeBoundary());
    expect(b1.batchHash).toBe(b2.batchHash);
  });

  it("produces identical batchId for identical requests", () => {
    const req = makeHardBlockRequest();
    const c1 = makeContract();
    const c2 = makeContract();
    expect(c1.batch([req], makeBoundary()).batchId).toBe(c2.batch([req], makeBoundary()).batchId);
  });

  it("batchId !== batchHash for non-empty input", () => {
    const contract = makeContract();
    const result = contract.batch([makePassRequest()], makeBoundary());
    expect(result.batchId).not.toBe(result.batchHash);
  });

  it("produces different batchHash for different requests", () => {
    const contract = makeContract();
    const b1 = contract.batch([makeHardBlockRequest({ subjectId: "ws-AAA" })], makeBoundary());
    const b2 = contract.batch([makePassRequest({ subjectId: "cap-BBB" })], makeBoundary());
    expect(b1.batchHash).not.toBe(b2.batchHash);
  });

  it("produces different batchHash when createdAt differs", () => {
    const req = makePassRequest();
    const c1 = createIsolationScopeBatchContract({ now: () => "2026-03-30T00:00:00.000Z" });
    const c2 = createIsolationScopeBatchContract({ now: () => "2026-03-30T01:00:00.000Z" });
    const b1 = c1.batch([req], makeBoundary());
    const b2 = c2.batch([req], makeBoundary());
    expect(b1.batchHash).not.toBe(b2.batchHash);
  });
});

// --- factory function ---

describe("createIsolationScopeBatchContract", () => {
  it("returns an IsolationScopeBatchContract instance", () => {
    const contract = createIsolationScopeBatchContract({ now: fixed });
    expect(contract).toBeInstanceOf(IsolationScopeBatchContract);
  });

  it("works without dependency injection (real now)", () => {
    const contract = createIsolationScopeBatchContract();
    const result = contract.batch([], makeBoundary());
    expect(result.dominantEnforcementMode).toBe("EMPTY");
    expect(typeof result.createdAt).toBe("string");
  });
});

// --- output shape ---

describe("IsolationScopeBatchContract.batch — output shape", () => {
  it("returns all required fields for a non-empty batch", () => {
    const contract = makeContract();
    const result = contract.batch([makePassRequest()], makeBoundary());
    const keys: Array<keyof IsolationScopeBatch> = [
      "batchId",
      "batchHash",
      "createdAt",
      "totalResults",
      "hardBlockCount",
      "escalateCount",
      "passCount",
      "dominantEnforcementMode",
      "results",
    ];
    for (const key of keys) {
      expect(result).toHaveProperty(key);
    }
  });

  it("totalResults equals input array length", () => {
    const contract = makeContract();
    const requests = [
      makeHardBlockRequest(),
      makeEscalateRequest(),
      makePassRequest(),
      makePassRequest({ subjectId: "cap-002" }),
    ];
    expect(contract.batch(requests, makeBoundary()).totalResults).toBe(4);
  });

  it("hardBlockCount + escalateCount + passCount === totalResults", () => {
    const contract = makeContract();
    const requests = [
      makeHardBlockRequest({ subjectId: "ws-A" }),
      makeHardBlockRequest({ subjectId: "ws-B" }),
      makeEscalateRequest(),
      makePassRequest(),
    ];
    const batch = contract.batch(requests, makeBoundary());
    expect(batch.hardBlockCount + batch.escalateCount + batch.passCount).toBe(batch.totalResults);
  });
});
