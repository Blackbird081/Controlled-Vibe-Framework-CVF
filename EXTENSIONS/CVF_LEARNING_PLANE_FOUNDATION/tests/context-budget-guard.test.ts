import { describe, expect, it } from "vitest";
import {
  CONTEXT_BUDGET_GUARD_VERSION,
  checkContextBudgetGuard,
  checkContextBudgetGuardForTaskClass,
} from "../src/index";

describe("CVF Learning Plane Foundation", () => {
  // ─── CBG-1 — Context Budget Guard ────────────────────────────────────────

  describe("CBG-1 — checkContextBudgetGuard", () => {
    it("returns PASS when estimatedTokens is 0 (no estimate available)", () => {
      const result = checkContextBudgetGuard("BUILDER", 0);
      expect(result.disposition).toBe("PASS");
      expect(result.withinBudget).toBe(true);
      expect(result.escalationReason).toBeNull();
    });

    it("returns PASS when estimatedTokens is within budget", () => {
      const result = checkContextBudgetGuard("BUILDER", 4_000);
      expect(result.disposition).toBe("PASS");
      expect(result.withinBudget).toBe(true);
      expect(result.taskClass).toBe("implementation");
      expect(result.budgetTokens).toBe(8_000);
    });

    it("returns PASS when estimatedTokens exactly equals budget", () => {
      const result = checkContextBudgetGuard("BUILDER", 8_000);
      expect(result.disposition).toBe("PASS");
      expect(result.withinBudget).toBe(true);
    });

    it("returns ESCALATE when estimatedTokens exceeds budget", () => {
      const result = checkContextBudgetGuard("BUILDER", 10_000);
      expect(result.disposition).toBe("ESCALATE");
      expect(result.withinBudget).toBe(false);
      expect(result.escalationReason).not.toBeNull();
      expect(result.escalationReason).toContain("10000");
      expect(result.escalationReason).toContain("8000");
    });

    it("resolves OPERATOR role to orchestration task class", () => {
      const result = checkContextBudgetGuard("OPERATOR", 3_000);
      expect(result.taskClass).toBe("orchestration");
      expect(result.budgetTokens).toBe(4_000);
      expect(result.disposition).toBe("PASS");
    });

    it("returns ESCALATE for OPERATOR role over orchestration budget", () => {
      const result = checkContextBudgetGuard("OPERATOR", 5_000);
      expect(result.disposition).toBe("ESCALATE");
      expect(result.taskClass).toBe("orchestration");
    });

    it("resolves REVIEWER role to review task class", () => {
      const result = checkContextBudgetGuard("REVIEWER", 2_000);
      expect(result.taskClass).toBe("review");
      expect(result.budgetTokens).toBe(6_000);
      expect(result.disposition).toBe("PASS");
    });

    it("resolves unknown role to general task class", () => {
      const result = checkContextBudgetGuard("UNKNOWN_ROLE", 1_000);
      expect(result.taskClass).toBe("general");
      expect(result.budgetTokens).toBe(4_000);
    });

    it("always sets runtimeExecutionAuthorized to false", () => {
      const pass = checkContextBudgetGuard("BUILDER", 100);
      const escalate = checkContextBudgetGuard("BUILDER", 100_000);
      expect(pass.runtimeExecutionAuthorized).toBe(false);
      expect(escalate.runtimeExecutionAuthorized).toBe(false);
    });

    it("contractVersion matches CONTEXT_BUDGET_GUARD_VERSION", () => {
      const result = checkContextBudgetGuard("BUILDER", 0);
      expect(result.contractVersion).toBe(CONTEXT_BUDGET_GUARD_VERSION);
      expect(result.contractVersion).toBe("cvf.contextBudgetGuard.cbg1.v1");
    });

    it("advisoryNote is non-empty for both PASS and ESCALATE", () => {
      const pass = checkContextBudgetGuard("BUILDER", 100);
      const escalate = checkContextBudgetGuard("BUILDER", 100_000);
      expect(pass.advisoryNote.length).toBeGreaterThan(0);
      expect(escalate.advisoryNote.length).toBeGreaterThan(0);
    });
  });

  describe("CBG-1 — checkContextBudgetGuardForTaskClass", () => {
    it("returns PASS for implementation class within budget", () => {
      const result = checkContextBudgetGuardForTaskClass("implementation", 5_000);
      expect(result.disposition).toBe("PASS");
      expect(result.taskClass).toBe("implementation");
      expect(result.budgetTokens).toBe(8_000);
    });

    it("returns ESCALATE for review class over budget", () => {
      const result = checkContextBudgetGuardForTaskClass("review", 7_000);
      expect(result.disposition).toBe("ESCALATE");
      expect(result.taskClass).toBe("review");
      expect(result.escalationReason).not.toBeNull();
    });

    it("returns PASS for intake class with 0 estimate", () => {
      const result = checkContextBudgetGuardForTaskClass("intake", 0);
      expect(result.disposition).toBe("PASS");
      expect(result.withinBudget).toBe(true);
    });

    it("estimatedTokens is reflected in result", () => {
      const result = checkContextBudgetGuardForTaskClass("closure", 1_500);
      expect(result.estimatedTokens).toBe(1_500);
    });
  });
});
