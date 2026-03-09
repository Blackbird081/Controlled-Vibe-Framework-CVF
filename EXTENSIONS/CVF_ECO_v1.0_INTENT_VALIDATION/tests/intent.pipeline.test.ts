import { describe, it, expect, beforeEach } from "vitest";
import { IntentPipeline } from "../src/intent.pipeline";
import { resetRuleCounter } from "../src/schema.mapper";
import { resetConstraintCounter } from "../src/constraint.generator";

describe("IntentPipeline (End-to-End Triple-S)", () => {
  let pipeline: IntentPipeline;

  beforeEach(() => {
    pipeline = new IntentPipeline();
    resetRuleCounter();
    resetConstraintCounter();
  });

  describe("validation flow", () => {
    it("rejects empty input", () => {
      const result = pipeline.validate("");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Vibe input is empty");
    });

    it("rejects too-short input", () => {
      const result = pipeline.validate("hi");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Vibe input is too short (min 5 chars)");
    });

    it("returns pipelineVersion", () => {
      const result = pipeline.validate("Never spend more than $50/day on ads");
      expect(result.pipelineVersion).toBe("1.0.0");
    });

    it("includes timestamp", () => {
      const before = Date.now();
      const result = pipeline.validate("Never spend more than $50/day on ads");
      const after = Date.now();
      expect(result.timestamp).toBeGreaterThanOrEqual(before);
      expect(result.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe("finance scenario", () => {
    it("translates spending limit vibe into full pipeline output", () => {
      const result = pipeline.validate(
        "Never let Agent spend over $50/day on ads without asking me"
      );

      expect(result.valid).toBe(true);
      expect(result.intent.domain).toBe("finance");
      expect(result.intent.limits).toHaveProperty("max_per_day", 50);
      expect(result.intent.limits).toHaveProperty("hard_limit", true);
      expect(result.intent.requireApproval).toBe(true);

      expect(result.rules.length).toBeGreaterThanOrEqual(1);
      const hardRule = result.rules.find((r) => r.enforcement === "HARD_BLOCK");
      expect(hardRule).toBeDefined();

      expect(result.constraints.length).toBeGreaterThanOrEqual(1);
      const threshold = result.constraints.find((c) => c.type === "threshold");
      expect(threshold).toBeDefined();
      expect(threshold?.injectable).toBe(true);
    });
  });

  describe("privacy scenario", () => {
    it("translates data protection vibe into governance rules", () => {
      const result = pipeline.validate(
        "Do not share customer email addresses with external services"
      );

      expect(result.intent.domain).toBe("privacy");
      expect(result.rules.length).toBeGreaterThanOrEqual(1);
      expect(result.constraints.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("code security scenario", () => {
    it("translates execution restriction into hard block", () => {
      const result = pipeline.validate(
        "Block any attempt to execute shell commands or install packages"
      );

      expect(result.intent.domain).toBe("code_security");
      expect(result.rules.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("multi-domain scenario", () => {
    it("selects highest-risk domain when multiple match", () => {
      const result = pipeline.validate(
        "Never execute scripts that send customer data via email"
      );

      expect(["code_security", "privacy"]).toContain(result.intent.domain);
    });
  });

  describe("batch validation", () => {
    it("validates multiple vibes at once", () => {
      const results = pipeline.validateBatch([
        "Never spend more than $100/day",
        "Block shell command execution",
        "",
      ]);

      expect(results.length).toBe(3);
      expect(results[0].errors).toEqual([]);
      expect(results[0].valid).toBe(true);
      expect(results[1].errors).toEqual([]);
      expect(results[1].intent.action).not.toBe("unknown");
      expect(results[1].intent.confidence).toBeGreaterThanOrEqual(0.3);
      expect(results[1].valid).toBe(true);
      expect(results[2].valid).toBe(false);
    });
  });

  describe("general/ambiguous scenario", () => {
    it("handles vague input with low confidence", () => {
      const result = pipeline.validate("Be careful with everything");

      expect(result.intent.domain).toBe("general");
      expect(result.intent.confidence).toBeLessThan(0.7);
    });
  });
});
