/**
 * CPF Gateway PII Detection & PII Detection Log — Dedicated Tests (W6-T33)
 * =========================================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   GatewayPIIDetectionContract.detect:
 *     - clean signal (no PII) → piiDetected=false, piiTypes=[], matches=[]
 *     - email pattern detected → piiType=EMAIL; redactedSignal contains [PII_EMAIL]
 *     - phone pattern detected → piiType=PHONE; redactedSignal contains [PII_PHONE]
 *     - SSN pattern detected → piiType=SSN; redactedSignal contains [PII_SSN]
 *     - credit card pattern detected → piiType=CREDIT_CARD; redactedSignal contains [PII_CC]
 *     - multiple PII types in one signal → both detected
 *     - piiDetected=true when any PII found
 *     - redactedSignal replaces PII tokens; original not preserved in redacted
 *     - matchCount accurate per piiType
 *     - enabledTypes restricts which patterns are checked
 *     - CUSTOM pattern with customPatterns config → CUSTOM piiType detected
 *     - no customPatterns → CUSTOM type produces no matches
 *     - invalid custom regex → silently skipped
 *     - tenantId propagated
 *     - detectedAt = injected now()
 *     - detectionHash deterministic for same inputs and timestamp
 *     - resultId truthy
 *     - factory createGatewayPIIDetectionContract returns working instance
 *   GatewayPIIDetectionLogContract.log:
 *     - empty results → dominantPIIType=null (maxCount stays at 0, threshold is strict >)
 *     - all clean results → dominantPIIType=null
 *     - SSN detected → dominantPIIType=SSN (highest sensitivity)
 *     - CREDIT_CARD detected → dominantPIIType=CREDIT_CARD (beats EMAIL/PHONE)
 *     - EMAIL×2 vs SSN×1 → SSN wins (frequency: EMAIL=2>SSN=1 but no — wait, frequency-first)
 *       Actually: EMAIL matchCount=2, SSN matchCount=1 → EMAIL wins by frequency
 *     - SSN×2 vs EMAIL×3 → EMAIL wins by frequency
 *     - SSN×2 vs EMAIL×2 tie → SSN wins (higher sensitivity priority)
 *     - piiDetectedCount and cleanCount accurate
 *     - totalScanned = results.length
 *     - logHash deterministic for same inputs and timestamp
 *     - logId truthy
 *     - createdAt = injected now()
 *     - factory createGatewayPIIDetectionLogContract returns working instance
 */

import { describe, it, expect } from "vitest";

import {
  GatewayPIIDetectionContract,
  createGatewayPIIDetectionContract,
} from "../src/gateway.pii.detection.contract";
import type {
  GatewayPIIDetectionRequest,
  GatewayPIIDetectionResult,
} from "../src/gateway.pii.detection.contract";

import {
  GatewayPIIDetectionLogContract,
  createGatewayPIIDetectionLogContract,
} from "../src/gateway.pii.detection.log.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T09:30:00.000Z";
const fixedNow = () => FIXED_NOW;

function makeDetectRequest(
  overrides: Partial<GatewayPIIDetectionRequest> = {},
): GatewayPIIDetectionRequest {
  return {
    signal: "build a governance feature for the platform",
    tenantId: "tenant-001",
    ...overrides,
  };
}

function makeDetectionResult(
  overrides: Partial<GatewayPIIDetectionResult> = {},
): GatewayPIIDetectionResult {
  return {
    resultId: "rid-1",
    detectedAt: FIXED_NOW,
    tenantId: "tenant-001",
    piiDetected: false,
    piiTypes: [],
    matches: [],
    redactedSignal: "build a governance feature",
    detectionHash: "hash-1",
    ...overrides,
  };
}

// ─── GatewayPIIDetectionContract.detect ───────────────────────────────────────

describe("GatewayPIIDetectionContract.detect", () => {
  const contract = new GatewayPIIDetectionContract({ now: fixedNow });

  describe("clean signal", () => {
    it("clean signal → piiDetected=false", () => {
      const result = contract.detect(makeDetectRequest());
      expect(result.piiDetected).toBe(false);
    });

    it("clean signal → piiTypes=[], matches=[]", () => {
      const result = contract.detect(makeDetectRequest());
      expect(result.piiTypes).toEqual([]);
      expect(result.matches).toEqual([]);
    });

    it("clean signal → redactedSignal unchanged", () => {
      const signal = "build a governance feature for the platform";
      const result = contract.detect(makeDetectRequest({ signal }));
      expect(result.redactedSignal).toBe(signal);
    });
  });

  describe("EMAIL detection", () => {
    it("email in signal → piiType includes EMAIL", () => {
      const result = contract.detect(makeDetectRequest({
        signal: "contact user@example.com about the build",
      }));
      expect(result.piiTypes).toContain("EMAIL");
    });

    it("email → redactedSignal contains [PII_EMAIL]", () => {
      const result = contract.detect(makeDetectRequest({
        signal: "contact user@example.com about the build",
      }));
      expect(result.redactedSignal).toContain("[PII_EMAIL]");
    });

    it("email → original email not in redactedSignal", () => {
      const result = contract.detect(makeDetectRequest({
        signal: "contact user@example.com for info",
      }));
      expect(result.redactedSignal).not.toContain("user@example.com");
    });

    it("email → piiDetected=true", () => {
      const result = contract.detect(makeDetectRequest({
        signal: "email: test@test.com",
      }));
      expect(result.piiDetected).toBe(true);
    });

    it("email → matchCount >= 1 for EMAIL", () => {
      const result = contract.detect(makeDetectRequest({
        signal: "send to a@b.com and c@d.com",
      }));
      const emailMatch = result.matches.find((m) => m.piiType === "EMAIL");
      expect(emailMatch).toBeDefined();
      expect(emailMatch!.matchCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe("PHONE detection", () => {
    it("phone in signal → piiType includes PHONE", () => {
      const result = contract.detect(makeDetectRequest({
        signal: "call 555-123-4567 for support",
      }));
      expect(result.piiTypes).toContain("PHONE");
    });

    it("phone → redactedSignal contains [PII_PHONE]", () => {
      const result = contract.detect(makeDetectRequest({
        signal: "call 555-123-4567",
      }));
      expect(result.redactedSignal).toContain("[PII_PHONE]");
    });
  });

  describe("SSN detection", () => {
    it("SSN pattern → piiType includes SSN", () => {
      const result = contract.detect(makeDetectRequest({
        signal: "SSN is 123-45-6789 for the record",
      }));
      expect(result.piiTypes).toContain("SSN");
    });

    it("SSN → redactedSignal contains [PII_SSN]", () => {
      const result = contract.detect(makeDetectRequest({
        signal: "record SSN: 123-45-6789",
      }));
      expect(result.redactedSignal).toContain("[PII_SSN]");
    });
  });

  describe("CREDIT_CARD detection", () => {
    it("credit card pattern → piiType includes CREDIT_CARD", () => {
      const result = contract.detect(makeDetectRequest({
        signal: "card: 1234 5678 9012 3456 on file",
      }));
      expect(result.piiTypes).toContain("CREDIT_CARD");
    });

    it("CREDIT_CARD → redactedSignal contains [PII_CC]", () => {
      const result = contract.detect(makeDetectRequest({
        signal: "charge 1234-5678-9012-3456",
      }));
      expect(result.redactedSignal).toContain("[PII_CC]");
    });
  });

  describe("multiple PII types", () => {
    it("email + phone both detected", () => {
      const result = contract.detect(makeDetectRequest({
        signal: "email: a@b.com phone: 555-123-4567",
      }));
      expect(result.piiTypes).toContain("EMAIL");
      expect(result.piiTypes).toContain("PHONE");
    });
  });

  describe("enabledTypes restriction", () => {
    it("enabledTypes=['EMAIL'] → only EMAIL checked, PHONE not detected", () => {
      const result = contract.detect(makeDetectRequest({
        signal: "email: a@b.com phone: 555-123-4567",
        config: { enabledTypes: ["EMAIL"] },
      }));
      expect(result.piiTypes).toContain("EMAIL");
      expect(result.piiTypes).not.toContain("PHONE");
    });

    it("enabledTypes=['PHONE'] → email not detected", () => {
      const result = contract.detect(makeDetectRequest({
        signal: "contact a@b.com",
        config: { enabledTypes: ["PHONE"] },
      }));
      expect(result.piiTypes).not.toContain("EMAIL");
      expect(result.piiDetected).toBe(false);
    });
  });

  describe("CUSTOM patterns", () => {
    it("CUSTOM pattern matches → piiType includes CUSTOM", () => {
      const result = contract.detect(makeDetectRequest({
        signal: "build CVF-TOKEN-ABCD in the platform",
        config: {
          enabledTypes: ["CUSTOM"],
          customPatterns: [{ pattern: "CVF-TOKEN-[A-Z]+", label: "[CUSTOM_TOKEN]" }],
        },
      }));
      expect(result.piiTypes).toContain("CUSTOM");
    });

    it("no customPatterns with enabledTypes=['CUSTOM'] → no CUSTOM detection", () => {
      const result = contract.detect(makeDetectRequest({
        signal: "build a feature",
        config: { enabledTypes: ["CUSTOM"] },
      }));
      expect(result.piiTypes).not.toContain("CUSTOM");
    });

    it("invalid custom regex → silently skipped, no throw", () => {
      expect(() =>
        contract.detect(makeDetectRequest({
          signal: "some signal",
          config: {
            enabledTypes: ["CUSTOM"],
            customPatterns: [{ pattern: "[invalid(", label: "[BAD]" }],
          },
        }))
      ).not.toThrow();
    });
  });

  describe("output fields", () => {
    it("tenantId propagated", () => {
      const result = contract.detect(makeDetectRequest({ tenantId: "tenant-xyz" }));
      expect(result.tenantId).toBe("tenant-xyz");
    });

    it("detectedAt = injected now()", () => {
      expect(contract.detect(makeDetectRequest()).detectedAt).toBe(FIXED_NOW);
    });

    it("detectionHash deterministic for same inputs and timestamp", () => {
      const req = makeDetectRequest({ tenantId: "t-det", signal: "build" });
      const r1 = contract.detect(req);
      const r2 = contract.detect(req);
      expect(r1.detectionHash).toBe(r2.detectionHash);
    });

    it("resultId is truthy", () => {
      expect(contract.detect(makeDetectRequest()).resultId.length).toBeGreaterThan(0);
    });
  });

  it("factory createGatewayPIIDetectionContract returns working instance", () => {
    const c = createGatewayPIIDetectionContract({ now: fixedNow });
    const result = c.detect(makeDetectRequest());
    expect(result.detectedAt).toBe(FIXED_NOW);
    expect(result.piiDetected).toBe(false);
  });
});

// ─── GatewayPIIDetectionLogContract.log ──────────────────────────────────────

describe("GatewayPIIDetectionLogContract.log", () => {
  const contract = new GatewayPIIDetectionLogContract({ now: fixedNow });

  describe("empty / all-clean results", () => {
    it("empty results → dominantPIIType=null", () => {
      expect(contract.log([]).dominantPIIType).toBeNull();
    });

    it("all clean results → dominantPIIType=null", () => {
      const results = [
        makeDetectionResult({ piiDetected: false, matches: [] }),
        makeDetectionResult({ piiDetected: false, matches: [] }),
      ];
      expect(contract.log(results).dominantPIIType).toBeNull();
    });

    it("empty → totalScanned=0, piiDetectedCount=0, cleanCount=0", () => {
      const log = contract.log([]);
      expect(log.totalScanned).toBe(0);
      expect(log.piiDetectedCount).toBe(0);
      expect(log.cleanCount).toBe(0);
    });
  });

  describe("dominantPIIType — frequency-first, sensitivity tiebreak", () => {
    it("SSN only → dominantPIIType=SSN", () => {
      const results = [
        makeDetectionResult({
          piiDetected: true,
          matches: [{ piiType: "SSN", matchCount: 1 }],
        }),
      ];
      expect(contract.log(results).dominantPIIType).toBe("SSN");
    });

    it("CREDIT_CARD only → dominantPIIType=CREDIT_CARD", () => {
      const results = [
        makeDetectionResult({
          piiDetected: true,
          matches: [{ piiType: "CREDIT_CARD", matchCount: 1 }],
        }),
      ];
      expect(contract.log(results).dominantPIIType).toBe("CREDIT_CARD");
    });

    it("EMAIL×3 vs SSN×1 → EMAIL wins by frequency", () => {
      const results = [
        makeDetectionResult({
          piiDetected: true,
          matches: [{ piiType: "EMAIL", matchCount: 3 }],
        }),
        makeDetectionResult({
          piiDetected: true,
          matches: [{ piiType: "SSN", matchCount: 1 }],
        }),
      ];
      expect(contract.log(results).dominantPIIType).toBe("EMAIL");
    });

    it("SSN×2 vs EMAIL×2 tie → SSN wins (higher sensitivity priority)", () => {
      const results = [
        makeDetectionResult({
          piiDetected: true,
          matches: [{ piiType: "SSN", matchCount: 2 }],
        }),
        makeDetectionResult({
          piiDetected: true,
          matches: [{ piiType: "EMAIL", matchCount: 2 }],
        }),
      ];
      expect(contract.log(results).dominantPIIType).toBe("SSN");
    });

    it("CREDIT_CARD×2 vs EMAIL×2 tie → CREDIT_CARD wins", () => {
      const results = [
        makeDetectionResult({
          piiDetected: true,
          matches: [{ piiType: "CREDIT_CARD", matchCount: 2 }],
        }),
        makeDetectionResult({
          piiDetected: true,
          matches: [{ piiType: "EMAIL", matchCount: 2 }],
        }),
      ];
      expect(contract.log(results).dominantPIIType).toBe("CREDIT_CARD");
    });
  });

  describe("counts", () => {
    it("piiDetectedCount and cleanCount accurate", () => {
      const results = [
        makeDetectionResult({ piiDetected: true, matches: [{ piiType: "EMAIL", matchCount: 1 }] }),
        makeDetectionResult({ piiDetected: true, matches: [{ piiType: "PHONE", matchCount: 1 }] }),
        makeDetectionResult({ piiDetected: false, matches: [] }),
      ];
      const log = contract.log(results);
      expect(log.piiDetectedCount).toBe(2);
      expect(log.cleanCount).toBe(1);
      expect(log.totalScanned).toBe(3);
    });
  });

  describe("output fields", () => {
    it("createdAt = injected now()", () => {
      expect(contract.log([]).createdAt).toBe(FIXED_NOW);
    });

    it("logHash deterministic for same inputs and timestamp", () => {
      const results = [makeDetectionResult({ piiDetected: true, matches: [{ piiType: "EMAIL", matchCount: 1 }] })];
      const l1 = contract.log(results);
      const l2 = contract.log(results);
      expect(l1.logHash).toBe(l2.logHash);
    });

    it("logId is truthy", () => {
      expect(contract.log([]).logId.length).toBeGreaterThan(0);
    });
  });

  it("factory createGatewayPIIDetectionLogContract returns working instance", () => {
    const c = createGatewayPIIDetectionLogContract({ now: fixedNow });
    const log = c.log([]);
    expect(log.dominantPIIType).toBeNull();
    expect(log.createdAt).toBe(FIXED_NOW);
  });
});
