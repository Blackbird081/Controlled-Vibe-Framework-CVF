import { describe, expect, it } from "vitest";
import {
  DeclareTrustDomainBatchContract,
  createDeclareTrustDomainBatchContract,
  type DeclareTrustDomainBatch,
} from "../src/declare.trust.domain.batch.contract";
import { TrustIsolationBoundaryContract } from "../src/trust.isolation.boundary.contract";
import type { TrustDomainCriteria } from "../src/trust.isolation.boundary.contract";

// --- Helpers ---

const FIXED_NOW = "2026-04-01T00:00:00.000Z";
const fixed = () => FIXED_NOW;

function makeBoundary() {
  return new TrustIsolationBoundaryContract({ now: fixed });
}

function makeContract() {
  return createDeclareTrustDomainBatchContract({ now: fixed });
}

function makeFullRuntimeCriteria(
  overrides: Partial<TrustDomainCriteria> = {},
): TrustDomainCriteria {
  return {
    requiresPolicySimulation: true,
    requiresRiskEvaluation: false,
    isEmbeddedConsumer: false,
    riskLevel: "R1",
    ...overrides,
  };
}

function makeLightweightSdkCriteria(
  overrides: Partial<TrustDomainCriteria> = {},
): TrustDomainCriteria {
  return {
    requiresPolicySimulation: false,
    requiresRiskEvaluation: false,
    isEmbeddedConsumer: true,
    riskLevel: "R0",
    ...overrides,
  };
}

// --- empty batch ---

describe("DeclareTrustDomainBatchContract.batch — empty", () => {
  it("returns zero counts and EMPTY dominantResolvedDomain for empty array", () => {
    const contract = makeContract();
    const result = contract.batch([], makeBoundary());
    expect(result.totalDeclarations).toBe(0);
    expect(result.fullRuntimeCount).toBe(0);
    expect(result.lightweightSdkCount).toBe(0);
    expect(result.dominantResolvedDomain).toBe("EMPTY");
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

describe("DeclareTrustDomainBatchContract.batch — counts", () => {
  it("counts FULL_RUNTIME declarations correctly", () => {
    const contract = makeContract();
    const criteriaList = [
      makeFullRuntimeCriteria({ riskLevel: "R2" }),
      makeFullRuntimeCriteria({ requiresRiskEvaluation: true }),
      makeLightweightSdkCriteria(),
    ];
    const batch = contract.batch(criteriaList, makeBoundary());
    expect(batch.fullRuntimeCount).toBe(2);
    expect(batch.lightweightSdkCount).toBe(1);
    expect(batch.totalDeclarations).toBe(3);
  });

  it("counts LIGHTWEIGHT_SDK declarations correctly", () => {
    const contract = makeContract();
    const criteriaList = [
      makeLightweightSdkCriteria({ riskLevel: "R1" }),
      makeLightweightSdkCriteria({ isEmbeddedConsumer: false }),
      makeFullRuntimeCriteria(),
    ];
    const batch = contract.batch(criteriaList, makeBoundary());
    expect(batch.lightweightSdkCount).toBe(2);
    expect(batch.fullRuntimeCount).toBe(1);
    expect(batch.totalDeclarations).toBe(3);
  });

  it("counts all FULL_RUNTIME in homogeneous batch", () => {
    const contract = makeContract();
    const criteriaList = [
      makeFullRuntimeCriteria({ riskLevel: "R3" }),
      makeFullRuntimeCriteria({ requiresPolicySimulation: true, requiresRiskEvaluation: true }),
      makeFullRuntimeCriteria({ riskLevel: "R2" }),
    ];
    const batch = contract.batch(criteriaList, makeBoundary());
    expect(batch.fullRuntimeCount).toBe(3);
    expect(batch.lightweightSdkCount).toBe(0);
    expect(batch.totalDeclarations).toBe(3);
  });

  it("totalDeclarations equals input criteria array length", () => {
    const contract = makeContract();
    const criteriaList = [
      makeFullRuntimeCriteria(),
      makeLightweightSdkCriteria(),
      makeFullRuntimeCriteria({ riskLevel: "R2" }),
      makeLightweightSdkCriteria({ riskLevel: "R0" }),
    ];
    expect(contract.batch(criteriaList, makeBoundary()).totalDeclarations).toBe(4);
  });
});

// --- dominant resolved domain ---

describe("DeclareTrustDomainBatchContract.batch — dominantResolvedDomain", () => {
  it("returns FULL_RUNTIME when it has the highest count", () => {
    const contract = makeContract();
    const criteriaList = [
      makeFullRuntimeCriteria({ requiresRiskEvaluation: true }),
      makeFullRuntimeCriteria({ riskLevel: "R2" }),
      makeLightweightSdkCriteria(),
    ];
    expect(contract.batch(criteriaList, makeBoundary()).dominantResolvedDomain).toBe("FULL_RUNTIME");
  });

  it("returns LIGHTWEIGHT_SDK when it has the highest count", () => {
    const contract = makeContract();
    const criteriaList = [
      makeLightweightSdkCriteria({ riskLevel: "R0" }),
      makeLightweightSdkCriteria({ riskLevel: "R1" }),
      makeFullRuntimeCriteria(),
    ];
    expect(contract.batch(criteriaList, makeBoundary()).dominantResolvedDomain).toBe("LIGHTWEIGHT_SDK");
  });

  it("returns FULL_RUNTIME on tie (precedence rule: FULL_RUNTIME > LIGHTWEIGHT_SDK)", () => {
    const contract = makeContract();
    const criteriaList = [makeFullRuntimeCriteria(), makeLightweightSdkCriteria()];
    expect(contract.batch(criteriaList, makeBoundary()).dominantResolvedDomain).toBe("FULL_RUNTIME");
  });

  it("returns FULL_RUNTIME for batch with only FULL_RUNTIME declarations", () => {
    const contract = makeContract();
    const criteriaList = [
      makeFullRuntimeCriteria({ riskLevel: "R2" }),
      makeFullRuntimeCriteria({ requiresPolicySimulation: true }),
    ];
    expect(contract.batch(criteriaList, makeBoundary()).dominantResolvedDomain).toBe("FULL_RUNTIME");
  });

  it("returns LIGHTWEIGHT_SDK for batch with only LIGHTWEIGHT_SDK declarations", () => {
    const contract = makeContract();
    const criteriaList = [
      makeLightweightSdkCriteria(),
      makeLightweightSdkCriteria({ riskLevel: "R1" }),
    ];
    expect(contract.batch(criteriaList, makeBoundary()).dominantResolvedDomain).toBe("LIGHTWEIGHT_SDK");
  });

  it("returns FULL_RUNTIME for single FULL_RUNTIME declaration", () => {
    const contract = makeContract();
    expect(
      contract.batch([makeFullRuntimeCriteria()], makeBoundary()).dominantResolvedDomain,
    ).toBe("FULL_RUNTIME");
  });

  it("returns LIGHTWEIGHT_SDK for single LIGHTWEIGHT_SDK declaration", () => {
    const contract = makeContract();
    expect(
      contract.batch([makeLightweightSdkCriteria()], makeBoundary()).dominantResolvedDomain,
    ).toBe("LIGHTWEIGHT_SDK");
  });

  it("returns FULL_RUNTIME when 1 FULL_RUNTIME vs many LIGHTWEIGHT_SDK (tie broken by count wins)", () => {
    const contract = makeContract();
    const criteriaList = [
      makeFullRuntimeCriteria(),
      makeLightweightSdkCriteria({ riskLevel: "R0" }),
      makeLightweightSdkCriteria({ riskLevel: "R1" }),
      makeLightweightSdkCriteria({ isEmbeddedConsumer: false }),
    ];
    expect(contract.batch(criteriaList, makeBoundary()).dominantResolvedDomain).toBe("LIGHTWEIGHT_SDK");
  });
});

// --- determinism ---

describe("DeclareTrustDomainBatchContract.batch — determinism", () => {
  it("produces identical batchHash for identical criteria", () => {
    const criteria = makeFullRuntimeCriteria();
    const c1 = makeContract();
    const c2 = makeContract();
    const b1 = c1.batch([criteria], makeBoundary());
    const b2 = c2.batch([criteria], makeBoundary());
    expect(b1.batchHash).toBe(b2.batchHash);
  });

  it("produces identical batchId for identical criteria", () => {
    const criteria = makeLightweightSdkCriteria();
    const c1 = makeContract();
    const c2 = makeContract();
    expect(c1.batch([criteria], makeBoundary()).batchId).toBe(c2.batch([criteria], makeBoundary()).batchId);
  });

  it("batchId !== batchHash for non-empty input", () => {
    const contract = makeContract();
    const result = contract.batch([makeFullRuntimeCriteria()], makeBoundary());
    expect(result.batchId).not.toBe(result.batchHash);
  });

  it("produces different batchHash for different criteria", () => {
    const contract = makeContract();
    const b1 = contract.batch([makeFullRuntimeCriteria({ riskLevel: "R2" })], makeBoundary());
    const b2 = contract.batch([makeLightweightSdkCriteria({ riskLevel: "R0" })], makeBoundary());
    expect(b1.batchHash).not.toBe(b2.batchHash);
  });

  it("produces different batchHash when createdAt differs", () => {
    const criteria = makeFullRuntimeCriteria();
    const c1 = createDeclareTrustDomainBatchContract({ now: () => "2026-04-01T00:00:00.000Z" });
    const c2 = createDeclareTrustDomainBatchContract({ now: () => "2026-04-01T01:00:00.000Z" });
    const b1 = c1.batch([criteria], makeBoundary());
    const b2 = c2.batch([criteria], makeBoundary());
    expect(b1.batchHash).not.toBe(b2.batchHash);
  });
});

// --- factory function ---

describe("createDeclareTrustDomainBatchContract", () => {
  it("returns a DeclareTrustDomainBatchContract instance", () => {
    const contract = createDeclareTrustDomainBatchContract({ now: fixed });
    expect(contract).toBeInstanceOf(DeclareTrustDomainBatchContract);
  });

  it("works without dependency injection (real now)", () => {
    const contract = createDeclareTrustDomainBatchContract();
    const result = contract.batch([], makeBoundary());
    expect(result.dominantResolvedDomain).toBe("EMPTY");
    expect(typeof result.createdAt).toBe("string");
  });
});

// --- output shape ---

describe("DeclareTrustDomainBatchContract.batch — output shape", () => {
  it("returns all required fields for a non-empty batch", () => {
    const contract = makeContract();
    const result = contract.batch([makeFullRuntimeCriteria()], makeBoundary());
    const keys: Array<keyof DeclareTrustDomainBatch> = [
      "batchId",
      "batchHash",
      "createdAt",
      "totalDeclarations",
      "fullRuntimeCount",
      "lightweightSdkCount",
      "dominantResolvedDomain",
      "declarations",
    ];
    for (const key of keys) {
      expect(result).toHaveProperty(key);
    }
  });

  it("fullRuntimeCount + lightweightSdkCount === totalDeclarations", () => {
    const contract = makeContract();
    const criteriaList = [
      makeFullRuntimeCriteria(),
      makeLightweightSdkCriteria(),
      makeFullRuntimeCriteria({ riskLevel: "R3" }),
      makeLightweightSdkCriteria({ riskLevel: "R1" }),
    ];
    const batch = contract.batch(criteriaList, makeBoundary());
    expect(batch.fullRuntimeCount + batch.lightweightSdkCount).toBe(batch.totalDeclarations);
  });

  it("declarations array length equals totalDeclarations", () => {
    const contract = makeContract();
    const criteriaList = [makeFullRuntimeCriteria(), makeLightweightSdkCriteria(), makeFullRuntimeCriteria()];
    const batch = contract.batch(criteriaList, makeBoundary());
    expect(batch.declarations).toHaveLength(batch.totalDeclarations);
  });
});
