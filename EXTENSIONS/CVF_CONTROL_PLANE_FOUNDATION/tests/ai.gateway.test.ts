/**
 * CPF AI Gateway — Dedicated Tests (W6-T30)
 * ===========================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   AIGatewayContract.process:
 *     - empty rawSignal → normalizedSignal=""; privacyReport.filtered=false; warning about empty signal
 *     - empty rawSignal → signalType propagated or defaults to "vibe"
 *     - non-empty rawSignal → normalizedSignal = filtered/trimmed value
 *     - signalType propagated for all 4 types (vibe, command, query, event)
 *     - signalType defaults to "vibe" when not provided
 *     - sessionId / agentId / consumerId propagated from request
 *     - rawSignal preserved (original, not replaced by normalized)
 *     - envMetadata defaults: platform="cvf", phase="INTAKE", riskLevel="R1", locale="en"
 *     - envMetadata uses provided envContext values
 *     - PII masking: email address → [PII_EMAIL]
 *     - PII masking: phone number → [PII_PHONE]
 *     - secrets masking: "password=secret123" → [SECRET_MASKED]
 *     - clean signal (no PII/secrets) → privacyReport.filtered=false, maskedTokenCount=0
 *     - warnings include masked-token count when maskedTokenCount > 0
 *     - warnings include short-signal warning when normalizedSignal.length < 10
 *     - processedAt set to injected now()
 *     - gatewayHash deterministic for same inputs and timestamp
 *     - gatewayId = derived from gatewayHash (truthy)
 *     - custom applyPrivacyFilter override respected
 *     - factory createAIGatewayContract returns working instance
 */

import { describe, it, expect } from "vitest";

import {
  AIGatewayContract,
  createAIGatewayContract,
} from "../src/ai.gateway.contract";
import type { GatewaySignalRequest } from "../src/ai.gateway.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T08:00:00.000Z";
const fixedNow = () => FIXED_NOW;

function makeRequest(overrides: Partial<GatewaySignalRequest> = {}): GatewaySignalRequest {
  return {
    rawSignal: "build a feature for the platform",
    ...overrides,
  };
}

// ─── AIGatewayContract.process ────────────────────────────────────────────────

describe("AIGatewayContract.process", () => {
  const contract = new AIGatewayContract({ now: fixedNow });

  describe("empty rawSignal", () => {
    it("normalizedSignal = '' for empty rawSignal", () => {
      expect(contract.process(makeRequest({ rawSignal: "" })).normalizedSignal).toBe("");
    });

    it("privacyReport.filtered = false for empty rawSignal", () => {
      expect(contract.process(makeRequest({ rawSignal: "" })).privacyReport.filtered).toBe(false);
    });

    it("warnings include 'empty signal' message", () => {
      const result = contract.process(makeRequest({ rawSignal: "" }));
      expect(result.warnings.some((w) => w.includes("empty signal"))).toBe(true);
    });

    it("signalType propagated for empty signal request", () => {
      const result = contract.process(makeRequest({ rawSignal: "", signalType: "event" }));
      expect(result.signalType).toBe("event");
    });
  });

  describe("normalizedSignal", () => {
    it("normalizedSignal = trimmed rawSignal when no PII/secrets", () => {
      const result = contract.process(makeRequest({ rawSignal: "  build a feature  " }));
      expect(result.normalizedSignal).toBe("build a feature");
    });

    it("rawSignal preserved (original, not trimmed)", () => {
      const result = contract.process(makeRequest({ rawSignal: "  build a feature  " }));
      expect(result.rawSignal).toBe("  build a feature  ");
    });
  });

  describe("signalType", () => {
    it("defaults to 'vibe' when not provided", () => {
      expect(contract.process(makeRequest()).signalType).toBe("vibe");
    });

    it("'command' type propagated", () => {
      expect(contract.process(makeRequest({ signalType: "command" })).signalType).toBe("command");
    });

    it("'query' type propagated", () => {
      expect(contract.process(makeRequest({ signalType: "query" })).signalType).toBe("query");
    });

    it("'event' type propagated", () => {
      expect(contract.process(makeRequest({ signalType: "event" })).signalType).toBe("event");
    });
  });

  describe("optional fields propagated", () => {
    it("sessionId propagated from request", () => {
      const result = contract.process(makeRequest({ sessionId: "sess-1" }));
      expect(result.sessionId).toBe("sess-1");
    });

    it("agentId propagated from request", () => {
      const result = contract.process(makeRequest({ agentId: "agent-42" }));
      expect(result.agentId).toBe("agent-42");
    });

    it("consumerId propagated from request", () => {
      const result = contract.process(makeRequest({ consumerId: "cons-9" }));
      expect(result.consumerId).toBe("cons-9");
    });
  });

  describe("envMetadata", () => {
    it("defaults: platform=cvf, phase=INTAKE, riskLevel=R1, locale=en", () => {
      const { envMetadata } = contract.process(makeRequest());
      expect(envMetadata.platform).toBe("cvf");
      expect(envMetadata.phase).toBe("INTAKE");
      expect(envMetadata.riskLevel).toBe("R1");
      expect(envMetadata.locale).toBe("en");
      expect(envMetadata.tags).toEqual([]);
    });

    it("uses provided envContext values", () => {
      const result = contract.process(makeRequest({
        envContext: { platform: "test-platform", phase: "BUILD", riskLevel: "R3", locale: "vi", tags: ["a"] },
      }));
      expect(result.envMetadata.platform).toBe("test-platform");
      expect(result.envMetadata.phase).toBe("BUILD");
      expect(result.envMetadata.riskLevel).toBe("R3");
      expect(result.envMetadata.locale).toBe("vi");
      expect(result.envMetadata.tags).toEqual(["a"]);
    });
  });

  describe("privacy filtering", () => {
    it("email address in rawSignal → masked to [PII_EMAIL]", () => {
      const result = contract.process(makeRequest({ rawSignal: "contact user@example.com about this" }));
      expect(result.normalizedSignal).toContain("[PII_EMAIL]");
      expect(result.normalizedSignal).not.toContain("user@example.com");
    });

    it("phone number in rawSignal → masked to [PII_PHONE]", () => {
      const result = contract.process(makeRequest({ rawSignal: "call 555-123-4567 for info" }));
      expect(result.normalizedSignal).toContain("[PII_PHONE]");
    });

    it("password= in rawSignal → masked to [SECRET_MASKED]", () => {
      const result = contract.process(makeRequest({ rawSignal: "password=mysecretpass123" }));
      expect(result.normalizedSignal).toContain("[SECRET_MASKED]");
    });

    it("clean signal → privacyReport.filtered=false, maskedTokenCount=0", () => {
      const result = contract.process(makeRequest({ rawSignal: "build a governance feature" }));
      expect(result.privacyReport.filtered).toBe(false);
      expect(result.privacyReport.maskedTokenCount).toBe(0);
    });

    it("PII masked → privacyReport.filtered=true, maskedTokenCount > 0", () => {
      const result = contract.process(makeRequest({ rawSignal: "email me at test@test.com" }));
      expect(result.privacyReport.filtered).toBe(true);
      expect(result.privacyReport.maskedTokenCount).toBeGreaterThan(0);
    });
  });

  describe("warnings", () => {
    it("masked tokens → warning includes masked-token count", () => {
      const result = contract.process(makeRequest({ rawSignal: "email test@test.com about it" }));
      expect(result.warnings.some((w) => w.includes("masked"))).toBe(true);
    });

    it("very short normalized signal (< 10 chars) → short-signal warning", () => {
      const result = contract.process(makeRequest({ rawSignal: "build" }));
      expect(result.warnings.some((w) => w.includes("very short"))).toBe(true);
    });

    it("long clean signal → no warnings", () => {
      const result = contract.process(makeRequest({ rawSignal: "build a complete governance compliant system" }));
      expect(result.warnings).toHaveLength(0);
    });
  });

  it("processedAt set to injected now()", () => {
    expect(contract.process(makeRequest()).processedAt).toBe(FIXED_NOW);
  });

  it("gatewayHash deterministic for same inputs and timestamp", () => {
    const req = makeRequest({ consumerId: "u1" });
    const r1 = contract.process(req);
    const r2 = contract.process(req);
    expect(r1.gatewayHash).toBe(r2.gatewayHash);
  });

  it("gatewayId is truthy", () => {
    expect(contract.process(makeRequest()).gatewayId.length).toBeGreaterThan(0);
  });

  it("custom applyPrivacyFilter override respected", () => {
    const custom = new AIGatewayContract({
      now: fixedNow,
      applyPrivacyFilter: (signal) => ({
        filtered: "FILTERED_SIGNAL",
        report: { filtered: true, maskedTokenCount: 99, appliedPatterns: ["[CUSTOM]"] },
      }),
    });
    const result = custom.process(makeRequest({ rawSignal: "any signal" }));
    expect(result.normalizedSignal).toBe("FILTERED_SIGNAL");
    expect(result.privacyReport.maskedTokenCount).toBe(99);
  });

  it("factory createAIGatewayContract returns working instance", () => {
    const c = createAIGatewayContract({ now: fixedNow });
    const result = c.process(makeRequest());
    expect(result.processedAt).toBe(FIXED_NOW);
    expect(result.signalType).toBe("vibe");
  });
});
