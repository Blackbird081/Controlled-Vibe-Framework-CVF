import { describe, it, expect, beforeEach } from "vitest";
import { ConstraintGenerator, resetConstraintCounter } from "../src/constraint.generator";
import { GovernanceRule } from "../src/types";

describe("ConstraintGenerator (S3: Strict Layer)", () => {
  const generator = new ConstraintGenerator();

  beforeEach(() => {
    resetConstraintCounter();
  });

  function makeRule(overrides: Partial<GovernanceRule> = {}): GovernanceRule {
    return {
      id: "GR-0001",
      domain: "finance",
      enforcement: "HARD_BLOCK",
      condition: "payment.max_per_day <= 50",
      parameters: { max_per_day: 50, action: "payment", object: "ads" },
      riskLevel: "R2",
      ...overrides,
    };
  }

  describe("constraint generation", () => {
    it("creates threshold constraint from numeric parameter", () => {
      const rules = [makeRule()];
      const constraints = generator.generate(rules);

      const threshold = constraints.find((c) => c.type === "threshold");
      expect(threshold).toBeDefined();
      expect(threshold?.field).toBe("max_per_day");
      expect(threshold?.value).toBe(50);
    });

    it("creates approval_gate constraint from approval rule", () => {
      const rules = [
        makeRule({
          id: "GR-0002",
          enforcement: "HUMAN_IN_THE_LOOP",
          condition: "payment.requires_approval == true",
          parameters: {
            action: "payment",
            object: "ads",
            approval_type: "human_confirmation",
          },
        }),
      ];
      const constraints = generator.generate(rules);

      const gate = constraints.find((c) => c.type === "approval_gate");
      expect(gate).toBeDefined();
      expect(gate?.enforcement).toBe("HUMAN_IN_THE_LOOP");
    });

    it("marks HARD_BLOCK constraints as injectable", () => {
      const rules = [makeRule({ enforcement: "HARD_BLOCK" })];
      const constraints = generator.generate(rules);

      for (const c of constraints) {
        expect(c.injectable).toBe(true);
      }
    });

    it("links constraints back to rule IDs", () => {
      const rules = [makeRule({ id: "GR-TEST-001" })];
      const constraints = generator.generate(rules);

      for (const c of constraints) {
        expect(c.ruleId).toBe("GR-TEST-001");
      }
    });
  });

  describe("multiple rules", () => {
    it("generates constraints for each rule independently", () => {
      const rules = [
        makeRule({
          id: "GR-0001",
          parameters: { max_per_day: 50, action: "payment", object: "ads" },
        }),
        makeRule({
          id: "GR-0002",
          parameters: { max_amount: 1000, action: "transfer", object: "funds" },
        }),
      ];
      const constraints = generator.generate(rules);

      const rule1Constraints = constraints.filter((c) => c.ruleId === "GR-0001");
      const rule2Constraints = constraints.filter((c) => c.ruleId === "GR-0002");

      expect(rule1Constraints.length).toBeGreaterThan(0);
      expect(rule2Constraints.length).toBeGreaterThan(0);
    });
  });

  describe("constraint IDs", () => {
    it("generates unique sequential constraint IDs", () => {
      const rules = [
        makeRule({ parameters: { max_per_day: 50, max_amount: 1000, action: "p", object: "o" } }),
      ];
      const constraints = generator.generate(rules);

      const ids = constraints.map((c) => c.constraintId);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });
  });

  describe("fallback constraint", () => {
    it("creates governance_check constraint when rule has only action/object params", () => {
      const rules = [
        makeRule({
          parameters: { action: "read", object: "documents" },
        }),
      ];
      const constraints = generator.generate(rules);

      expect(constraints.length).toBe(1);
      expect(constraints[0].field).toBe("governance_check");
      expect(constraints[0].type).toBe("approval_gate");
    });
  });
});
