import { describe, it, expect } from "vitest";
import { IntentParser } from "../src/intent.parser";

describe("IntentParser (S1: Semantic Layer)", () => {
  const parser = new IntentParser();

  describe("domain detection", () => {
    it("detects finance domain from spending language", () => {
      const result = parser.parse("Never let Agent spend over $50/day on ads");
      expect(result.domain).toBe("finance");
    });

    it("detects privacy domain from personal data language", () => {
      const result = parser.parse("Do not share customer email addresses externally");
      expect(result.domain).toBe("privacy");
    });

    it("detects code_security domain from execution language", () => {
      const result = parser.parse("Block any attempt to execute shell commands");
      expect(result.domain).toBe("code_security");
    });

    it("detects communication domain from messaging language", () => {
      const result = parser.parse("Send weekly reports via email to the team");
      expect(result.domain).toBe("communication");
    });

    it("falls back to general for ambiguous input", () => {
      const result = parser.parse("Summarize the document for review");
      expect(result.domain).toBe("general");
    });
  });

  describe("limit extraction", () => {
    it("extracts dollar amount with daily period", () => {
      const result = parser.parse("Never spend more than $50/day");
      expect(result.limits).toHaveProperty("max_per_day", 50);
    });

    it("extracts dollar amount with hourly period", () => {
      const result = parser.parse("Limit cost to $100/hour");
      expect(result.limits).toHaveProperty("max_per_hour", 100);
    });

    it("extracts plain amount without period", () => {
      const result = parser.parse("Budget must not exceed $5000");
      expect(result.limits).toHaveProperty("max_amount", 5000);
    });

    it("sets hard_limit flag on negation keywords", () => {
      const result = parser.parse("Never spend more than $50/day");
      expect(result.limits).toHaveProperty("hard_limit", true);
    });

    it("extracts count-based limits", () => {
      const result = parser.parse("Maximum 10 requests per session");
      expect(result.limits).toHaveProperty("max_count", 10);
    });
  });

  describe("approval detection", () => {
    it("detects approval requirement from 'ask me'", () => {
      const result = parser.parse("Don't send emails without asking me first");
      expect(result.requireApproval).toBe(true);
    });

    it("detects approval requirement from 'approval'", () => {
      const result = parser.parse("All purchases require approval");
      expect(result.requireApproval).toBe(true);
    });

    it("returns false when no approval keywords present", () => {
      const result = parser.parse("Log all database queries");
      expect(result.requireApproval).toBe(false);
    });
  });

  describe("confidence scoring", () => {
    it("gives high confidence for clear intents with domain + action + limits", () => {
      const result = parser.parse("Never let Agent spend over $50/day on ads");
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
    });

    it("gives lower confidence for vague intents", () => {
      const result = parser.parse("Be careful with things");
      expect(result.confidence).toBeLessThan(0.7);
    });
  });

  describe("rawVibe preservation", () => {
    it("preserves the original vibe text", () => {
      const vibe = "Never let Agent spend over $50/day on ads without asking me";
      const result = parser.parse(vibe);
      expect(result.rawVibe).toBe(vibe);
    });
  });
});
