import { describe, it, expect, beforeEach } from "vitest";
import { FinanceGuard } from "../src/finance.guard";
import { GuardRequest } from "../src/types";

describe("FinanceGuard", () => {
  let guard: FinanceGuard;

  beforeEach(() => {
    guard = new FinanceGuard({
      maxTransactionAmount: 5000,
      dailyLimit: 20000,
      requireInvoiceAbove: 500,
      blockedRecipients: ["scam_vendor"],
    });
  });

  function makeRequest(overrides: Partial<GuardRequest> = {}): GuardRequest {
    return {
      domain: "finance",
      action: "payment",
      target: "vendor_a",
      params: { amount: 100 },
      ...overrides,
    };
  }

  describe("transaction limits", () => {
    it("allows transactions under max limit", () => {
      const result = guard.evaluate(makeRequest({ params: { amount: 1000 } }));
      expect(result.verdict).toBe("ESCALATE");
    });

    it("blocks transactions over max limit", () => {
      const result = guard.evaluate(makeRequest({ params: { amount: 6000 } }));
      expect(result.verdict).toBe("BLOCK");
      expect(result.violations.some((v) => v.rule === "MAX_TRANSACTION")).toBe(true);
    });

    it("allows small transactions freely", () => {
      const result = guard.evaluate(makeRequest({ params: { amount: 100, hasInvoice: true } }));
      expect(result.verdict).toBe("ALLOW");
    });
  });

  describe("daily limit", () => {
    it("blocks when daily limit would be exceeded", () => {
      guard.evaluate(makeRequest({ params: { amount: 4000, hasInvoice: true } }));
      guard.evaluate(makeRequest({ params: { amount: 4000, hasInvoice: true } }));
      guard.evaluate(makeRequest({ params: { amount: 4000, hasInvoice: true } }));
      guard.evaluate(makeRequest({ params: { amount: 4000, hasInvoice: true } }));
      guard.evaluate(makeRequest({ params: { amount: 4000, hasInvoice: true } }));

      const result = guard.evaluate(makeRequest({ params: { amount: 4000, hasInvoice: true } }));
      expect(result.verdict).toBe("BLOCK");
      expect(result.violations.some((v) => v.rule === "DAILY_LIMIT")).toBe(true);
    });

    it("resets daily total", () => {
      guard.evaluate(makeRequest({ params: { amount: 4000, hasInvoice: true } }));
      guard.resetDaily();
      expect(guard.getDailyTotal()).toBe(0);
    });
  });

  describe("invoice requirement", () => {
    it("requires invoice for amounts above threshold", () => {
      const result = guard.evaluate(makeRequest({ params: { amount: 1000 } }));
      expect(result.violations.some((v) => v.rule === "INVOICE_REQUIRED")).toBe(true);
    });

    it("accepts with invoice", () => {
      const result = guard.evaluate(makeRequest({ params: { amount: 1000, hasInvoice: true } }));
      expect(result.violations.some((v) => v.rule === "INVOICE_REQUIRED")).toBe(false);
    });

    it("does not require invoice below threshold", () => {
      const result = guard.evaluate(makeRequest({ params: { amount: 200 } }));
      expect(result.violations.some((v) => v.rule === "INVOICE_REQUIRED")).toBe(false);
    });
  });

  describe("blocked recipients", () => {
    it("blocks payments to blocked recipients", () => {
      const result = guard.evaluate(makeRequest({ target: "scam_vendor", params: { amount: 100 } }));
      expect(result.verdict).toBe("BLOCK");
      expect(result.violations.some((v) => v.rule === "BLOCKED_RECIPIENT")).toBe(true);
    });
  });

  describe("warnings", () => {
    it("warns when approaching max transaction limit", () => {
      const result = guard.evaluate(makeRequest({ params: { amount: 4500, hasInvoice: true } }));
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe("metadata", () => {
    it("includes amount and daily total in metadata", () => {
      const result = guard.evaluate(makeRequest({ params: { amount: 200, hasInvoice: true } }));
      expect(result.metadata).toHaveProperty("amount", 200);
      expect(result.metadata).toHaveProperty("dailyTotal");
      expect(result.metadata).toHaveProperty("dailyRemaining");
    });
  });
});
