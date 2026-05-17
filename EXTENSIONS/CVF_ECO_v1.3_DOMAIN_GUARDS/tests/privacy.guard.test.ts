import { describe, it, expect } from "vitest";
import { PrivacyGuard } from "../src/privacy.guard";
import { GuardRequest } from "../src/types";

describe("PrivacyGuard", () => {
  const guard = new PrivacyGuard({
    blockedExternalDomains: ["evil.com"],
  });

  function makeRequest(overrides: Partial<GuardRequest> = {}): GuardRequest {
    return {
      domain: "privacy",
      action: "export",
      target: "analytics_system",
      params: { fields: [], scope: "internal", anonymized: false },
      ...overrides,
    };
  }

  describe("PII protection", () => {
    it("blocks unanonymized PII export", () => {
      const result = guard.evaluate(makeRequest({
        params: { fields: ["email", "phone"], scope: "internal", anonymized: false },
      }));
      expect(result.verdict).toBe("BLOCK");
      expect(result.violations.some((v) => v.rule === "PII_EXPOSURE")).toBe(true);
    });

    it("allows anonymized PII export to internal scope", () => {
      const result = guard.evaluate(makeRequest({
        params: { fields: ["email", "phone"], scope: "internal", anonymized: true },
      }));
      expect(result.verdict).toBe("ALLOW");
    });

    it("allows non-PII fields without anonymization", () => {
      const result = guard.evaluate(makeRequest({
        params: { fields: ["country", "language"], scope: "internal", anonymized: false },
      }));
      expect(result.verdict).toBe("ALLOW");
    });
  });

  describe("scope enforcement", () => {
    it("blocks external scope by default", () => {
      const result = guard.evaluate(makeRequest({
        params: { fields: [], scope: "external", anonymized: true },
      }));
      expect(result.violations.some((v) => v.rule === "SCOPE_VIOLATION")).toBe(true);
    });

    it("allows internal scope", () => {
      const result = guard.evaluate(makeRequest({
        params: { fields: [], scope: "internal", anonymized: true },
      }));
      expect(result.verdict).toBe("ALLOW");
    });
  });

  describe("blocked domains", () => {
    it("blocks transfer to blocked external domain", () => {
      const result = guard.evaluate(makeRequest({
        target: "evil.com/api",
        params: { fields: [], scope: "internal", anonymized: true },
      }));
      expect(result.violations.some((v) => v.rule === "BLOCKED_DOMAIN")).toBe(true);
    });
  });

  describe("retention limits", () => {
    it("flags excessive retention", () => {
      const result = guard.evaluate(makeRequest({
        params: { fields: [], scope: "internal", anonymized: true, retentionDays: 365 },
      }));
      expect(result.violations.some((v) => v.rule === "RETENTION_EXCEEDED")).toBe(true);
    });

    it("allows retention within limits", () => {
      const result = guard.evaluate(makeRequest({
        params: { fields: [], scope: "internal", anonymized: true, retentionDays: 30 },
      }));
      expect(result.violations.some((v) => v.rule === "RETENTION_EXCEEDED")).toBe(false);
    });
  });

  describe("metadata", () => {
    it("includes PII detection metadata", () => {
      const result = guard.evaluate(makeRequest({
        params: { fields: ["email", "name"], scope: "internal", anonymized: true },
      }));
      expect(result.metadata).toHaveProperty("piiFieldsDetected");
      expect(result.metadata).toHaveProperty("scope");
      expect(result.metadata).toHaveProperty("anonymized");
    });
  });
});
