import { describe, it, expect, beforeEach } from "vitest";
import { TemplateEngine, resetTemplateCounters } from "../src/template.engine";

describe("TemplateEngine", () => {
  let engine: TemplateEngine;

  beforeEach(() => {
    engine = new TemplateEngine();
    resetTemplateCounters();
  });

  describe("listTemplates", () => {
    it("returns 4 built-in templates", () => {
      const templates = engine.listTemplates();
      expect(templates.length).toBe(4);
    });

    it("includes financial_governance template", () => {
      const t = engine.getTemplate("financial_governance");
      expect(t).toBeDefined();
      expect(t!.domain).toBe("finance");
    });

    it("includes data_privacy template", () => {
      const t = engine.getTemplate("data_privacy");
      expect(t).toBeDefined();
      expect(t!.domain).toBe("privacy");
    });

    it("includes code_quality template", () => {
      const t = engine.getTemplate("code_quality");
      expect(t).toBeDefined();
      expect(t!.domain).toBe("quality");
    });

    it("includes budget_resource template", () => {
      const t = engine.getTemplate("budget_resource");
      expect(t).toBeDefined();
      expect(t!.domain).toBe("budget");
    });
  });

  describe("instantiate", () => {
    it("creates PolicyDocument from template with defaults", () => {
      const doc = engine.instantiate("financial_governance");

      expect(doc.id).toMatch(/^TD-/);
      expect(doc.name).toBe("Financial Governance");
      expect(doc.status).toBe("active");
      expect(doc.rules.length).toBe(3);
      expect(doc.metadata.templateId).toBe("financial_governance");
    });

    it("overrides parameters when provided", () => {
      const doc = engine.instantiate("financial_governance", {
        max_daily_spend: 1000,
        currency: "EUR",
      });

      const withdrawRule = doc.rules.find((r) => r.actionTrigger === "WITHDRAW_FUNDS");
      expect(withdrawRule!.constraints.max_value).toBe(1000);
      expect(withdrawRule!.constraints.currency).toBe("EUR");
    });

    it("uses default values when params not provided", () => {
      const doc = engine.instantiate("financial_governance");

      const withdrawRule = doc.rules.find((r) => r.actionTrigger === "WITHDRAW_FUNDS");
      expect(withdrawRule!.constraints.max_value).toBe(5000);
      expect(withdrawRule!.constraints.currency).toBe("USD");
    });

    it("throws for unknown template", () => {
      expect(() => engine.instantiate("nonexistent")).toThrow("Template not found");
    });

    it("assigns unique rule IDs", () => {
      const doc = engine.instantiate("financial_governance");
      const ids = doc.rules.map((r) => r.id);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });
  });

  describe("registerTemplate", () => {
    it("registers and instantiates custom template", () => {
      engine.registerTemplate({
        id: "custom_test",
        name: "Custom Test",
        description: "Test template",
        domain: "general",
        rules: [
          {
            intentDomain: "general",
            actionTrigger: "TEST_ACTION",
            constraints: { limit: "${test_limit}" },
            enforcement: "LOG_ONLY",
            description: "Test rule",
          },
        ],
        parameters: [
          { name: "test_limit", type: "number", defaultValue: 42, description: "Test limit" },
        ],
      });

      const doc = engine.instantiate("custom_test");
      expect(doc.rules[0].constraints.limit).toBe(42);
    });
  });
});
