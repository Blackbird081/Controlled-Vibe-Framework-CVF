import { describe, expect, it } from "vitest";
import {
  GatewayPIIDetectionLogBatchContract,
  createGatewayPIIDetectionLogBatchContract,
  type GatewayPIIDetectionLogBatch,
} from "../src/gateway.pii.detection.log.batch.contract";
import { GatewayPIIDetectionLogContract } from "../src/gateway.pii.detection.log.contract";
import { GatewayPIIDetectionContract } from "../src/gateway.pii.detection.contract";
import type { GatewayPIIDetectionResult } from "../src/gateway.pii.detection.contract";

// --- Helpers ---

const FIXED_NOW = "2026-04-05T00:00:00.000Z";
const fixed = () => FIXED_NOW;

function makeLogContract() {
  return new GatewayPIIDetectionLogContract({ now: fixed });
}

function makeContract() {
  return createGatewayPIIDetectionLogBatchContract({ now: fixed });
}

function makeDetectionContract() {
  return new GatewayPIIDetectionContract({ now: fixed });
}

function makeCleanResults(count: number): GatewayPIIDetectionResult[] {
  const detect = makeDetectionContract();
  return Array.from({ length: count }, (_, i) =>
    detect.detect({ tenantId: `tenant-clean-${i}`, signal: "no pii here" }),
  );
}

function makeEmailResults(count: number): GatewayPIIDetectionResult[] {
  const detect = makeDetectionContract();
  return Array.from({ length: count }, (_, i) =>
    detect.detect({
      tenantId: `tenant-email-${i}`,
      signal: `user${i}@example.com`,
    }),
  );
}

function makeSSNResults(count: number): GatewayPIIDetectionResult[] {
  const detect = makeDetectionContract();
  return Array.from({ length: count }, (_, i) =>
    detect.detect({
      tenantId: `tenant-ssn-${i}`,
      signal: `ssn: 123-45-678${i % 10}`,
    }),
  );
}

function makeCreditCardResults(count: number): GatewayPIIDetectionResult[] {
  const detect = makeDetectionContract();
  return Array.from({ length: count }, (_, i) =>
    detect.detect({
      tenantId: `tenant-cc-${i}`,
      signal: `card: 1234 5678 9012 345${i % 10}`,
    }),
  );
}

function makePhoneResults(count: number): GatewayPIIDetectionResult[] {
  const detect = makeDetectionContract();
  return Array.from({ length: count }, (_, i) =>
    detect.detect({
      tenantId: `tenant-phone-${i}`,
      signal: `phone: 555-123-456${i % 10}`,
    }),
  );
}

// --- empty batch ---

describe("GatewayPIIDetectionLogBatchContract.batch — empty", () => {
  it("returns null overallDominantPIIType for empty entries array", () => {
    const contract = makeContract();
    const result = contract.batch([], makeLogContract());
    expect(result.overallDominantPIIType).toBeNull();
  });

  it("batchId and batchHash are non-empty strings for empty input", () => {
    const contract = makeContract();
    const result = contract.batch([], makeLogContract());
    expect(typeof result.batchId).toBe("string");
    expect(result.batchId.length).toBeGreaterThan(0);
    expect(typeof result.batchHash).toBe("string");
    expect(result.batchHash.length).toBeGreaterThan(0);
  });

  it("batchId !== batchHash for empty input", () => {
    const contract = makeContract();
    const result = contract.batch([], makeLogContract());
    expect(result.batchId).not.toBe(result.batchHash);
  });

  it("createdAt is injected from now()", () => {
    const contract = makeContract();
    const result = contract.batch([], makeLogContract());
    expect(result.createdAt).toBe(FIXED_NOW);
  });
});

// --- counts ---

describe("GatewayPIIDetectionLogBatchContract.batch — counts", () => {
  it("totalLogs equals number of entries", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makeCleanResults(1), makeEmailResults(1)],
      makeLogContract(),
    );
    expect(result.totalLogs).toBe(2);
  });

  it("totalScanned is sum of log.totalScanned across all logs", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makeCleanResults(3), makeEmailResults(2)],
      makeLogContract(),
    );
    expect(result.totalScanned).toBe(5);
  });

  it("piiDetectedCount is sum of log.piiDetectedCount across all logs", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makeEmailResults(2), makeEmailResults(3)],
      makeLogContract(),
    );
    expect(result.piiDetectedCount).toBe(5);
  });

  it("cleanCount is sum of log.cleanCount across all logs", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makeCleanResults(2), makeCleanResults(3)],
      makeLogContract(),
    );
    expect(result.cleanCount).toBe(5);
  });

  it("piiDetectedCount + cleanCount equals totalScanned", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makeEmailResults(2), makeCleanResults(3)],
      makeLogContract(),
    );
    expect(result.piiDetectedCount + result.cleanCount).toBe(result.totalScanned);
  });

  it("all counts are zero for empty entries", () => {
    const contract = makeContract();
    const result = contract.batch([], makeLogContract());
    expect(result.totalLogs).toBe(0);
    expect(result.totalScanned).toBe(0);
    expect(result.piiDetectedCount).toBe(0);
    expect(result.cleanCount).toBe(0);
  });
});

// --- overallDominantPIIType ---

describe("GatewayPIIDetectionLogBatchContract.batch — overallDominantPIIType", () => {
  it("returns null when no PII detected in any log", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makeCleanResults(2), makeCleanResults(3)],
      makeLogContract(),
    );
    expect(result.overallDominantPIIType).toBeNull();
  });

  it("returns SSN when SSN is the only PII type", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makeSSNResults(1)],
      makeLogContract(),
    );
    expect(result.overallDominantPIIType).toBe("SSN");
  });

  it("returns EMAIL when EMAIL is the only PII type", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makeEmailResults(1)],
      makeLogContract(),
    );
    expect(result.overallDominantPIIType).toBe("EMAIL");
  });

  it("returns PHONE when PHONE is the only PII type", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makePhoneResults(1)],
      makeLogContract(),
    );
    expect(result.overallDominantPIIType).toBe("PHONE");
  });

  it("returns SSN over EMAIL (SSN severity > EMAIL severity)", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makeSSNResults(1), makeEmailResults(1)],
      makeLogContract(),
    );
    expect(result.overallDominantPIIType).toBe("SSN");
  });

  it("returns CREDIT_CARD over EMAIL (CREDIT_CARD severity > EMAIL severity)", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makeCreditCardResults(1), makeEmailResults(1)],
      makeLogContract(),
    );
    expect(result.overallDominantPIIType).toBe("CREDIT_CARD");
  });

  it("returns SSN over CREDIT_CARD (SSN severity > CREDIT_CARD severity)", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makeCreditCardResults(1), makeSSNResults(1)],
      makeLogContract(),
    );
    expect(result.overallDominantPIIType).toBe("SSN");
  });
});

// --- determinism ---

describe("GatewayPIIDetectionLogBatchContract.batch — determinism", () => {
  it("produces identical batchHash for identical entries", () => {
    const entries = [makeEmailResults(2)];
    const c1 = makeContract();
    const c2 = makeContract();
    expect(c1.batch(entries, makeLogContract()).batchHash).toBe(
      c2.batch(entries, makeLogContract()).batchHash,
    );
  });

  it("produces identical batchId for identical entries", () => {
    const entries = [makeSSNResults(1)];
    const c1 = makeContract();
    const c2 = makeContract();
    expect(c1.batch(entries, makeLogContract()).batchId).toBe(
      c2.batch(entries, makeLogContract()).batchId,
    );
  });

  it("produces different batchHash for different entries", () => {
    const contract = makeContract();
    const b1 = contract.batch([makeEmailResults(1)], makeLogContract());
    const b2 = contract.batch([makeSSNResults(1)], makeLogContract());
    expect(b1.batchHash).not.toBe(b2.batchHash);
  });

  it("produces different batchHash when createdAt differs", () => {
    const entries = [makeEmailResults(1)];
    const c1 = createGatewayPIIDetectionLogBatchContract({
      now: () => "2026-04-05T00:00:00.000Z",
    });
    const c2 = createGatewayPIIDetectionLogBatchContract({
      now: () => "2026-04-05T01:00:00.000Z",
    });
    expect(c1.batch(entries, makeLogContract()).batchHash).not.toBe(
      c2.batch(entries, makeLogContract()).batchHash,
    );
  });

  it("batchId !== batchHash for non-empty input", () => {
    const contract = makeContract();
    const result = contract.batch([makeEmailResults(1)], makeLogContract());
    expect(result.batchId).not.toBe(result.batchHash);
  });
});

// --- factory function ---

describe("createGatewayPIIDetectionLogBatchContract", () => {
  it("returns a GatewayPIIDetectionLogBatchContract instance", () => {
    const contract = createGatewayPIIDetectionLogBatchContract({ now: fixed });
    expect(contract).toBeInstanceOf(GatewayPIIDetectionLogBatchContract);
  });

  it("works without dependency injection (real now)", () => {
    const contract = createGatewayPIIDetectionLogBatchContract();
    const result = contract.batch([], makeLogContract());
    expect(result.overallDominantPIIType).toBeNull();
    expect(typeof result.createdAt).toBe("string");
  });
});

// --- output shape ---

describe("GatewayPIIDetectionLogBatchContract.batch — output shape", () => {
  it("returns all required fields for a non-empty batch", () => {
    const contract = makeContract();
    const result = contract.batch([makeEmailResults(1)], makeLogContract());
    const keys: Array<keyof GatewayPIIDetectionLogBatch> = [
      "batchId",
      "batchHash",
      "createdAt",
      "totalLogs",
      "totalScanned",
      "piiDetectedCount",
      "cleanCount",
      "overallDominantPIIType",
      "logs",
    ];
    for (const key of keys) {
      expect(result).toHaveProperty(key);
    }
  });

  it("logs array length equals totalLogs", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makeEmailResults(1), makeCleanResults(2)],
      makeLogContract(),
    );
    expect(result.logs).toHaveLength(result.totalLogs);
  });

  it("piiDetectedCount + cleanCount equals totalScanned for mixed batch", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makeSSNResults(2), makeCleanResults(3), makeEmailResults(1)],
      makeLogContract(),
    );
    expect(result.piiDetectedCount + result.cleanCount).toBe(result.totalScanned);
  });
});
