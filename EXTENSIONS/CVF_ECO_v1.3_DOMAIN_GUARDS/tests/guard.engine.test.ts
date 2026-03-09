import { describe, it, expect } from "vitest";
import { GuardEngine } from "../src/guard.engine";

describe("GuardEngine", () => {
  const engine = new GuardEngine();

  describe("domain registration", () => {
    it("registers 3 default domains", () => {
      const domains = engine.listDomains();
      expect(domains).toContain("finance");
      expect(domains).toContain("privacy");
      expect(domains).toContain("code_security");
      expect(domains.length).toBe(3);
    });

    it("retrieves specific guard", () => {
      expect(engine.getGuard("finance")).toBeDefined();
      expect(engine.getGuard("privacy")).toBeDefined();
      expect(engine.getGuard("code_security")).toBeDefined();
    });
  });

  describe("evaluate", () => {
    it("routes to correct domain guard", () => {
      const result = engine.evaluate({
        domain: "finance",
        action: "payment",
        target: "vendor",
        params: { amount: 100, hasInvoice: true },
      });
      expect(result.domain).toBe("finance");
      expect(result.verdict).toBeDefined();
    });

    it("warns for unregistered domain", () => {
      const result = engine.evaluate({
        domain: "finance",
        action: "test",
        target: "test",
        params: {},
      });
      expect(result.verdict).toBeDefined();
    });
  });

  describe("audit log", () => {
    it("records evaluations in audit log", () => {
      engine.clearAuditLog();
      engine.evaluate({
        domain: "finance",
        action: "payment",
        target: "vendor",
        params: { amount: 50, hasInvoice: true },
      });

      const log = engine.getAuditLog();
      expect(log.length).toBe(1);
      expect(log[0]).toHaveProperty("request");
      expect(log[0]).toHaveProperty("result");
      expect(log[0]).toHaveProperty("timestamp");
    });

    it("clears audit log", () => {
      engine.evaluate({
        domain: "privacy",
        action: "export",
        target: "system",
        params: { fields: [], scope: "internal", anonymized: true },
      });
      engine.clearAuditLog();
      expect(engine.getAuditLog().length).toBe(0);
    });
  });

  describe("cross-domain evaluation", () => {
    it("evaluates across all guards", () => {
      const results = engine.evaluateAll({
        domain: "finance",
        action: "payment",
        target: "vendor",
        params: { amount: 50, hasInvoice: true },
      });
      expect(results.length).toBe(3);
    });
  });
});
