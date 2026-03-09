import { describe, it, expect, beforeEach } from "vitest";
import { SchemaMapper, resetRuleCounter } from "../src/schema.mapper";
import { IntentResult } from "../src/types";

describe("SchemaMapper (S2: Schematic Layer)", () => {
  const mapper = new SchemaMapper();

  beforeEach(() => {
    resetRuleCounter();
  });

  function makeIntent(overrides: Partial<IntentResult> = {}): IntentResult {
    return {
      domain: "finance",
      action: "payment",
      object: "ads",
      limits: {},
      requireApproval: false,
      confidence: 0.9,
      rawVibe: "test vibe",
      ...overrides,
    };
  }

  describe("limit-based rules", () => {
    it("creates threshold rule from daily limit", () => {
      const intent = makeIntent({ limits: { max_per_day: 50 } });
      const rules = mapper.mapToRules(intent);

      expect(rules.length).toBeGreaterThanOrEqual(1);
      expect(rules[0].condition).toContain("max_per_day");
      expect(rules[0].parameters).toHaveProperty("max_per_day", 50);
    });

    it("escalates to HARD_BLOCK when hard_limit is true", () => {
      const intent = makeIntent({
        limits: { max_per_day: 50, hard_limit: true },
      });
      const rules = mapper.mapToRules(intent);

      const limitRule = rules.find((r) => r.condition.includes("max_per_day"));
      expect(limitRule?.enforcement).toBe("HARD_BLOCK");
    });

    it("uses HUMAN_IN_THE_LOOP for finance without hard_limit", () => {
      const intent = makeIntent({ limits: { max_per_day: 50 } });
      const rules = mapper.mapToRules(intent);

      const limitRule = rules.find((r) => r.condition.includes("max_per_day"));
      expect(limitRule?.enforcement).toBe("HUMAN_IN_THE_LOOP");
    });
  });

  describe("approval rules", () => {
    it("creates approval rule when requireApproval is true", () => {
      const intent = makeIntent({ requireApproval: true });
      const rules = mapper.mapToRules(intent);

      const approvalRule = rules.find((r) =>
        r.condition.includes("requires_approval")
      );
      expect(approvalRule).toBeDefined();
      expect(approvalRule?.enforcement).toBe("HUMAN_IN_THE_LOOP");
    });
  });

  describe("baseline rules", () => {
    it("creates baseline rule when no limits or approval", () => {
      const intent = makeIntent();
      const rules = mapper.mapToRules(intent);

      expect(rules.length).toBe(1);
      expect(rules[0].condition).toContain("governed");
    });
  });

  describe("risk escalation", () => {
    it("escalates risk for code_security domain", () => {
      const intent = makeIntent({
        domain: "code_security",
        action: "execute",
        limits: { max_count: 5 },
      });
      const rules = mapper.mapToRules(intent);
      expect(rules[0].riskLevel).toBe("R3");
    });

    it("keeps low risk for general domain", () => {
      const intent = makeIntent({
        domain: "general",
        action: "summarize",
      });
      const rules = mapper.mapToRules(intent);
      expect(rules[0].riskLevel).toBe("R0");
    });
  });

  describe("rule IDs", () => {
    it("generates unique sequential rule IDs", () => {
      const intent = makeIntent({
        limits: { max_per_day: 50, max_amount: 1000 },
        requireApproval: true,
      });
      const rules = mapper.mapToRules(intent);

      const ids = rules.map((r) => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});
