import { describe, it, expect } from "vitest";
import { GuardModule } from "../src/guard.module";
import { AgentAction } from "../src/types";

describe("GuardModule", () => {
  const guard = new GuardModule();

  function makeAction(overrides: Partial<AgentAction> = {}): AgentAction {
    return {
      agentId: "agent-1",
      action: "payment",
      target: "vendor",
      domain: "finance",
      params: { amount: 100, hasInvoice: true },
      ...overrides,
    };
  }

  describe("finance rules", () => {
    it("allows small transactions with invoice", () => {
      const result = guard.evaluate(makeAction());
      expect(result.verdict).toBe("ALLOW");
    });

    it("blocks transactions over max limit", () => {
      const result = guard.evaluate(makeAction({ params: { amount: 6000 } }));
      expect(result.verdict).toBe("BLOCK");
      expect(result.violations.some((v) => v.rule === "FIN_MAX_TRANSACTION")).toBe(true);
    });

    it("escalates missing invoice for high amounts", () => {
      const result = guard.evaluate(makeAction({ params: { amount: 1000 } }));
      expect(result.verdict).toBe("ESCALATE");
      expect(result.violations.some((v) => v.rule === "FIN_INVOICE_REQUIRED")).toBe(true);
    });

    it("blocks payments to blocked recipients", () => {
      const result = guard.evaluate(makeAction({
        target: "scam_vendor",
        params: { amount: 100, hasInvoice: true, blockedRecipients: ["scam_vendor"] },
      }));
      expect(result.verdict).toBe("BLOCK");
    });
  });

  describe("privacy rules", () => {
    it("blocks unanonymized PII export", () => {
      const result = guard.evaluate(makeAction({
        domain: "privacy",
        action: "export",
        params: { fields: ["email", "phone"], anonymized: false, scope: "internal" },
      }));
      expect(result.verdict).toBe("BLOCK");
      expect(result.violations.some((v) => v.rule === "PRIV_PII_EXPOSURE")).toBe(true);
    });

    it("allows anonymized PII export", () => {
      const result = guard.evaluate(makeAction({
        domain: "privacy",
        action: "export",
        params: { fields: ["email"], anonymized: true, scope: "internal" },
      }));
      expect(result.verdict).toBe("ALLOW");
    });

    it("blocks external scope", () => {
      const result = guard.evaluate(makeAction({
        domain: "privacy",
        action: "export",
        params: { fields: [], anonymized: true, scope: "external" },
      }));
      expect(result.verdict).toBe("BLOCK");
    });
  });

  describe("code_security rules", () => {
    it("blocks rm -rf commands", () => {
      const result = guard.evaluate(makeAction({
        domain: "code_security",
        action: "execute",
        params: { command: "rm -rf /data" },
      }));
      expect(result.verdict).toBe("BLOCK");
    });

    it("escalates eval() code patterns", () => {
      const result = guard.evaluate(makeAction({
        domain: "code_security",
        action: "execute",
        params: { code: 'eval("malicious")' },
      }));
      expect(result.verdict).toBe("ESCALATE");
    });

    it("escalates deploy without code review", () => {
      const result = guard.evaluate(makeAction({
        domain: "code_security",
        action: "deploy",
        params: { codeReviewed: false },
      }));
      expect(result.verdict).toBe("ESCALATE");
    });

    it("allows deploy with code review", () => {
      const result = guard.evaluate(makeAction({
        domain: "code_security",
        action: "deploy",
        params: { codeReviewed: true },
      }));
      expect(result.verdict).toBe("ALLOW");
    });

    it("allows safe commands", () => {
      const result = guard.evaluate(makeAction({
        domain: "code_security",
        action: "execute",
        params: { command: "ls -la" },
      }));
      expect(result.verdict).toBe("ALLOW");
    });
  });

  describe("custom rules", () => {
    it("supports adding custom rules", () => {
      const customGuard = new GuardModule();
      customGuard.addRule({
        id: "CUSTOM_RULE",
        domain: "general",
        check: () => ({ pass: false, message: "Custom block", severity: "critical" }),
      });
      expect(customGuard.getRuleCount()).toBe(9);
    });
  });
});
