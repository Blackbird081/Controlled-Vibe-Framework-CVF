import { describe, it, expect } from "vitest";
import {
  GatewayPIIDetectionBatchContract,
  createGatewayPIIDetectionBatchContract,
} from "../src/gateway.pii.detection.batch.contract";
import { GatewayPIIDetectionContract } from "../src/gateway.pii.detection.contract";
import type { GatewayPIIDetectionRequest } from "../src/gateway.pii.detection.contract";

// --- Helpers ---

const FIXED_TS = "2026-04-01T00:00:00.000Z";

function makeContract(): GatewayPIIDetectionContract {
  return new GatewayPIIDetectionContract({ now: () => FIXED_TS });
}

function makeBatch(): GatewayPIIDetectionBatchContract {
  return new GatewayPIIDetectionBatchContract({ now: () => FIXED_TS });
}

function emailRequest(tenantId = "t1"): GatewayPIIDetectionRequest {
  return { signal: "contact user@example.com for info", tenantId };
}

function phoneRequest(tenantId = "t1"): GatewayPIIDetectionRequest {
  return { signal: "call 555-123-4567 today", tenantId };
}

function ssnRequest(tenantId = "t1"): GatewayPIIDetectionRequest {
  return { signal: "SSN is 123-45-6789", tenantId };
}

function creditCardRequest(tenantId = "t1"): GatewayPIIDetectionRequest {
  return { signal: "card 4111-1111-1111-1111", tenantId };
}

function cleanRequest(tenantId = "t1"): GatewayPIIDetectionRequest {
  return { signal: "hello world, no sensitive data here", tenantId };
}

function customRequest(tenantId = "t1"): GatewayPIIDetectionRequest {
  return {
    signal: "MYTOKEN-abc123 is secret",
    tenantId,
    config: {
      enabledTypes: ["CUSTOM"],
      customPatterns: [{ pattern: "MYTOKEN-[a-z0-9]+", label: "[CUSTOM_TOKEN]" }],
    },
  };
}

// --- Tests ---

describe("GatewayPIIDetectionBatchContract — empty batch", () => {
  it("returns totalRequests 0 for empty batch", () => {
    const result = makeBatch().batch([], makeContract());
    expect(result.totalRequests).toBe(0);
  });

  it("returns dominantPiiType NONE for empty batch", () => {
    const result = makeBatch().batch([], makeContract());
    expect(result.dominantPiiType).toBe("NONE");
  });

  it("returns all PII counts 0 for empty batch", () => {
    const result = makeBatch().batch([], makeContract());
    expect(result.emailCount).toBe(0);
    expect(result.phoneCount).toBe(0);
    expect(result.ssnCount).toBe(0);
    expect(result.creditCardCount).toBe(0);
    expect(result.customCount).toBe(0);
    expect(result.totalDetected).toBe(0);
    expect(result.totalClean).toBe(0);
  });
});

describe("GatewayPIIDetectionBatchContract — single signal detection", () => {
  it("increments emailCount for an email signal", () => {
    const result = makeBatch().batch([emailRequest()], makeContract());
    expect(result.emailCount).toBe(1);
    expect(result.phoneCount).toBe(0);
    expect(result.ssnCount).toBe(0);
    expect(result.creditCardCount).toBe(0);
  });

  it("increments phoneCount for a phone signal", () => {
    const result = makeBatch().batch([phoneRequest()], makeContract());
    expect(result.phoneCount).toBe(1);
    expect(result.emailCount).toBe(0);
    expect(result.ssnCount).toBe(0);
    expect(result.creditCardCount).toBe(0);
  });

  it("increments ssnCount for an SSN signal", () => {
    const result = makeBatch().batch([ssnRequest()], makeContract());
    expect(result.ssnCount).toBe(1);
    expect(result.emailCount).toBe(0);
    expect(result.phoneCount).toBe(0);
    expect(result.creditCardCount).toBe(0);
  });

  it("increments creditCardCount for a credit card signal", () => {
    const result = makeBatch().batch([creditCardRequest()], makeContract());
    expect(result.creditCardCount).toBe(1);
    expect(result.emailCount).toBe(0);
    expect(result.phoneCount).toBe(0);
    expect(result.ssnCount).toBe(0);
  });

  it("increments customCount for a custom pattern signal", () => {
    const result = makeBatch().batch([customRequest()], makeContract());
    expect(result.customCount).toBe(1);
    expect(result.emailCount).toBe(0);
    expect(result.phoneCount).toBe(0);
    expect(result.ssnCount).toBe(0);
    expect(result.creditCardCount).toBe(0);
  });
});

describe("GatewayPIIDetectionBatchContract — count accuracy", () => {
  it("correctly counts multiple email signals", () => {
    const result = makeBatch().batch(
      [emailRequest("t1"), emailRequest("t2"), phoneRequest("t3")],
      makeContract(),
    );
    expect(result.emailCount).toBe(2);
    expect(result.phoneCount).toBe(1);
  });

  it("correctly counts all PII types in mixed batch", () => {
    const result = makeBatch().batch(
      [emailRequest(), phoneRequest(), ssnRequest(), creditCardRequest(), cleanRequest()],
      makeContract(),
    );
    expect(result.emailCount).toBe(1);
    expect(result.phoneCount).toBe(1);
    expect(result.ssnCount).toBe(1);
    expect(result.creditCardCount).toBe(1);
    expect(result.customCount).toBe(0);
  });

  it("returns totalClean=1 and totalDetected=0 for clean signal", () => {
    const result = makeBatch().batch([cleanRequest()], makeContract());
    expect(result.totalClean).toBe(1);
    expect(result.totalDetected).toBe(0);
  });

  it("totalDetected + totalClean equals totalRequests", () => {
    const requests = [emailRequest(), cleanRequest(), ssnRequest(), cleanRequest()];
    const result = makeBatch().batch(requests, makeContract());
    expect(result.totalDetected + result.totalClean).toBe(result.totalRequests);
    expect(result.totalRequests).toBe(4);
  });

  it("totalDetected counts only piiDetected results", () => {
    const result = makeBatch().batch(
      [emailRequest(), cleanRequest(), phoneRequest()],
      makeContract(),
    );
    expect(result.totalDetected).toBe(2);
    expect(result.totalClean).toBe(1);
  });
});

describe("GatewayPIIDetectionBatchContract — dominant PIIType resolution", () => {
  it("resolves SSN as dominant when ssnCount is highest", () => {
    const result = makeBatch().batch(
      [ssnRequest("t1"), ssnRequest("t2"), creditCardRequest("t3")],
      makeContract(),
    );
    expect(result.dominantPiiType).toBe("SSN");
  });

  it("resolves CREDIT_CARD as dominant when creditCardCount is highest", () => {
    const result = makeBatch().batch(
      [creditCardRequest("t1"), creditCardRequest("t2"), emailRequest("t3")],
      makeContract(),
    );
    expect(result.dominantPiiType).toBe("CREDIT_CARD");
  });

  it("resolves EMAIL as dominant when emailCount is highest", () => {
    const result = makeBatch().batch(
      [emailRequest("t1"), emailRequest("t2"), phoneRequest("t3")],
      makeContract(),
    );
    expect(result.dominantPiiType).toBe("EMAIL");
  });

  it("resolves PHONE as dominant when phoneCount is highest", () => {
    const result = makeBatch().batch(
      [phoneRequest("t1"), phoneRequest("t2"), emailRequest("t3")],
      makeContract(),
    );
    expect(result.dominantPiiType).toBe("PHONE");
  });

  it("SSN wins tie-break over CREDIT_CARD", () => {
    const result = makeBatch().batch(
      [ssnRequest("t1"), creditCardRequest("t2")],
      makeContract(),
    );
    expect(result.ssnCount).toBe(1);
    expect(result.creditCardCount).toBe(1);
    expect(result.dominantPiiType).toBe("SSN");
  });

  it("CREDIT_CARD wins tie-break over EMAIL", () => {
    const result = makeBatch().batch(
      [creditCardRequest("t1"), emailRequest("t2")],
      makeContract(),
    );
    expect(result.creditCardCount).toBe(1);
    expect(result.emailCount).toBe(1);
    expect(result.dominantPiiType).toBe("CREDIT_CARD");
  });

  it("EMAIL wins tie-break over PHONE", () => {
    const result = makeBatch().batch(
      [emailRequest("t1"), phoneRequest("t2")],
      makeContract(),
    );
    expect(result.emailCount).toBe(1);
    expect(result.phoneCount).toBe(1);
    expect(result.dominantPiiType).toBe("EMAIL");
  });

  it("returns dominantPiiType NONE when no PII is detected", () => {
    const result = makeBatch().batch(
      [cleanRequest("t1"), cleanRequest("t2")],
      makeContract(),
    );
    expect(result.totalDetected).toBe(0);
    expect(result.dominantPiiType).toBe("NONE");
  });
});

describe("GatewayPIIDetectionBatchContract — determinism", () => {
  it("produces identical batchHash for same requests and timestamp", () => {
    const requests = [emailRequest(), ssnRequest()];
    const r1 = makeBatch().batch(requests, makeContract());
    const r2 = makeBatch().batch(requests, makeContract());
    expect(r1.batchHash).toBe(r2.batchHash);
  });

  it("produces identical batchId for same requests and timestamp", () => {
    const requests = [phoneRequest(), creditCardRequest()];
    const r1 = makeBatch().batch(requests, makeContract());
    const r2 = makeBatch().batch(requests, makeContract());
    expect(r1.batchId).toBe(r2.batchId);
  });

  it("produces different batchHash when createdAt differs", () => {
    const requests = [emailRequest()];
    const b1 = new GatewayPIIDetectionBatchContract({ now: () => "2026-04-01T00:00:00.000Z" });
    const b2 = new GatewayPIIDetectionBatchContract({ now: () => "2026-04-01T01:00:00.000Z" });
    const r1 = b1.batch(requests, makeContract());
    const r2 = b2.batch(requests, makeContract());
    expect(r1.batchHash).not.toBe(r2.batchHash);
  });
});

describe("GatewayPIIDetectionBatchContract — output shape", () => {
  it("batchId and batchHash are distinct strings", () => {
    const result = makeBatch().batch([emailRequest()], makeContract());
    expect(typeof result.batchId).toBe("string");
    expect(typeof result.batchHash).toBe("string");
    expect(result.batchId).not.toBe(result.batchHash);
  });

  it("results array length matches number of requests", () => {
    const requests = [emailRequest(), ssnRequest(), cleanRequest()];
    const result = makeBatch().batch(requests, makeContract());
    expect(result.results).toHaveLength(3);
  });

  it("createdAt matches injected timestamp", () => {
    const result = makeBatch().batch([emailRequest()], makeContract());
    expect(result.createdAt).toBe(FIXED_TS);
  });
});

describe("GatewayPIIDetectionBatchContract — factory", () => {
  it("factory creates a GatewayPIIDetectionBatchContract instance", () => {
    const contract = createGatewayPIIDetectionBatchContract({ now: () => FIXED_TS });
    expect(contract).toBeInstanceOf(GatewayPIIDetectionBatchContract);
    const result = contract.batch([emailRequest()], makeContract());
    expect(result.emailCount).toBe(1);
  });
});
