import { describe, it, expect, beforeEach } from "vitest";
import { CodeSecurityGuard } from "../src/code.security.guard";
import { GuardRequest } from "../src/types";

describe("CodeSecurityGuard", () => {
  let guard: CodeSecurityGuard;

  beforeEach(() => {
    guard = new CodeSecurityGuard();
  });

  function makeRequest(overrides: Partial<GuardRequest> = {}): GuardRequest {
    return {
      domain: "code_security",
      action: "execute",
      target: "system",
      params: {},
      ...overrides,
    };
  }

  describe("blocked commands", () => {
    it("blocks rm -rf command", () => {
      const result = guard.evaluate(makeRequest({
        params: { command: "rm -rf /tmp/data" },
      }));
      expect(result.verdict).toBe("BLOCK");
      expect(result.violations.some((v) => v.rule === "BLOCKED_COMMAND")).toBe(true);
    });

    it("blocks drop table command", () => {
      const result = guard.evaluate(makeRequest({
        params: { command: "DROP TABLE users;" },
      }));
      expect(result.verdict).toBe("BLOCK");
    });

    it("allows safe commands", () => {
      const result = guard.evaluate(makeRequest({
        params: { command: "ls -la" },
      }));
      expect(result.verdict).toBe("ALLOW");
    });
  });

  describe("blocked code patterns", () => {
    it("escalates code with eval()", () => {
      const result = guard.evaluate(makeRequest({
        params: { code: 'const x = eval("dangerous code")' },
      }));
      expect(result.verdict).toBe("ESCALATE");
      expect(result.violations.some((v) => v.rule === "BLOCKED_PATTERN")).toBe(true);
    });

    it("escalates code with child_process", () => {
      const result = guard.evaluate(makeRequest({
        params: { code: 'const cp = require("child_process")' },
      }));
      expect(result.verdict).toBe("ESCALATE");
    });

    it("allows clean code", () => {
      const result = guard.evaluate(makeRequest({
        params: { code: 'const sum = (a, b) => a + b;' },
      }));
      expect(result.verdict).toBe("ALLOW");
    });
  });

  describe("package manager enforcement", () => {
    it("allows npm installs", () => {
      const result = guard.evaluate(makeRequest({
        action: "install",
        params: { packageManager: "npm" },
      }));
      expect(result.verdict).toBe("ALLOW");
    });

    it("warns for unauthorized package managers", () => {
      const result = guard.evaluate(makeRequest({
        action: "install",
        params: { packageManager: "unknown_pm" },
      }));
      expect(result.violations.some((v) => v.rule === "UNAUTHORIZED_PACKAGE_MANAGER")).toBe(true);
    });
  });

  describe("deployment code review", () => {
    it("escalates deploy without code review", () => {
      const result = guard.evaluate(makeRequest({
        action: "deploy",
        params: { codeReviewed: false },
      }));
      expect(result.verdict).toBe("ESCALATE");
      expect(result.violations.some((v) => v.rule === "CODE_REVIEW_REQUIRED")).toBe(true);
    });

    it("allows deploy with code review", () => {
      const result = guard.evaluate(makeRequest({
        action: "deploy",
        params: { codeReviewed: true },
      }));
      expect(result.verdict).toBe("ALLOW");
    });
  });

  describe("sudo warning", () => {
    it("warns about sudo commands", () => {
      const result = guard.evaluate(makeRequest({
        params: { command: "sudo apt update" },
      }));
      expect(result.warnings.some((w) => w.includes("sudo"))).toBe(true);
    });
  });

  describe("metadata", () => {
    it("includes analysis metadata", () => {
      const result = guard.evaluate(makeRequest({
        params: { command: "ls", code: "const x = 1;" },
      }));
      expect(result.metadata).toHaveProperty("commandAnalyzed", true);
      expect(result.metadata).toHaveProperty("codeAnalyzed", true);
    });
  });
});
