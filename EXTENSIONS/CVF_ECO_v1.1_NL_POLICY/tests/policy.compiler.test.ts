import { describe, it, expect, beforeEach } from "vitest";
import { PolicyCompiler, resetCompilerCounters } from "../src/policy.compiler";

describe("PolicyCompiler", () => {
  const compiler = new PolicyCompiler();

  beforeEach(() => {
    resetCompilerCounters();
  });

  describe("compile", () => {
    it("compiles multi-sentence vibe into PolicyDocument", () => {
      const doc = compiler.compile(
        "Never let any agent spend more than $500/day. All external data transfers require my approval."
      );

      expect(doc.id).toMatch(/^PD-/);
      expect(doc.version).toBe(1);
      expect(doc.status).toBe("draft");
      expect(doc.rules.length).toBe(2);
      expect(doc.sourceVibes).toHaveLength(1);
    });

    it("uses custom name when provided", () => {
      const doc = compiler.compile("Block shell commands", "Security Policy");
      expect(doc.name).toBe("Security Policy");
    });

    it("generates name from vibe text when not provided", () => {
      const doc = compiler.compile("Never spend more than $100/day on ads");
      expect(doc.name).toBeTruthy();
      expect(doc.name.length).toBeGreaterThan(0);
    });

    it("sets metadata correctly", () => {
      const doc = compiler.compile("Block all external transfers");
      expect(doc.metadata.author).toBe("nl-policy-compiler");
      expect(doc.metadata.scope).toBe("global");
      expect(doc.metadata.tags.length).toBeGreaterThan(0);
    });

    it("includes timestamps", () => {
      const before = Date.now();
      const doc = compiler.compile("Log all database queries");
      const after = Date.now();

      expect(doc.createdAt).toBeGreaterThanOrEqual(before);
      expect(doc.createdAt).toBeLessThanOrEqual(after);
      expect(doc.updatedAt).toBe(doc.createdAt);
    });
  });

  describe("compileSentence", () => {
    it("detects finance domain", () => {
      const rule = compiler.compileSentence("Never spend more than $500/day");
      expect(rule).not.toBeNull();
      expect(rule!.intentDomain).toBe("finance");
    });

    it("detects privacy domain", () => {
      const rule = compiler.compileSentence("Do not share customer email data externally");
      expect(rule).not.toBeNull();
      expect(rule!.intentDomain).toBe("privacy");
    });

    it("detects HARD_BLOCK enforcement from 'never'", () => {
      const rule = compiler.compileSentence("Never allow external transfers");
      expect(rule!.enforcement).toBe("HARD_BLOCK");
    });

    it("detects HUMAN_IN_THE_LOOP from 'require approval'", () => {
      const rule = compiler.compileSentence("All payments require approval from manager");
      expect(rule!.enforcement).toBe("HUMAN_IN_THE_LOOP");
    });

    it("detects LOG_ONLY from 'log'", () => {
      const rule = compiler.compileSentence("Log all database read operations");
      expect(rule!.enforcement).toBe("LOG_ONLY");
    });

    it("extracts dollar amount constraints", () => {
      const rule = compiler.compileSentence("Never spend more than $500/day");
      expect(rule!.constraints).toHaveProperty("max_per_day", 500);
    });

    it("extracts count constraints", () => {
      const rule = compiler.compileSentence("Maximum 10 requests per session");
      expect(rule!.constraints).toHaveProperty("max_count", 10);
    });

    it("returns null for very short sentences", () => {
      const rule = compiler.compileSentence("hi");
      expect(rule).toBeNull();
    });
  });

  describe("rule IDs", () => {
    it("generates unique sequential rule IDs", () => {
      const doc = compiler.compile(
        "Never spend over $100. Block all shell commands. Log every query."
      );
      const ids = doc.rules.map((r) => r.id);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });
  });
});
