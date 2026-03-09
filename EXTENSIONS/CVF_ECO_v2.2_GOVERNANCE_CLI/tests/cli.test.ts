import { describe, it, expect } from "vitest";
import { GovernanceCLI } from "../src/cli";

describe("GovernanceCLI", () => {
  const cli = new GovernanceCLI();

  describe("run", () => {
    it("runs help with no args", () => {
      const result = cli.run([]);
      expect(result.success).toBe(true);
      expect(result.message).toContain("Commands:");
    });

    it("runs version command", () => {
      const result = cli.run(["version"]);
      expect(result.success).toBe(true);
      expect(result.message).toContain("2.2.0");
    });

    it("runs status command", () => {
      const result = cli.run(["status"]);
      expect(result.success).toBe(true);
      expect(result.message).toContain("OPERATIONAL");
    });

    it("evaluates action with flags", () => {
      const result = cli.run(["evaluate", "--domain", "finance", "--action", "transfer", "--target", "vendor"]);
      expect(result.success).toBe(true);
      expect(result.message).toContain("finance");
      expect(result.message).toContain("transfer");
    });

    it("evaluates with = syntax", () => {
      const result = cli.run(["evaluate", "--domain=code_security", "--action=execute"]);
      expect(result.success).toBe(true);
      expect(result.message).toContain("code_security");
    });

    it("blocks dangerous actions", () => {
      const result = cli.run(["evaluate", "--domain", "infrastructure", "--action", "execute"]);
      expect(result.exitCode).toBe(2);
      expect(result.message).toContain("BLOCK");
    });

    it("manages sessions", () => {
      const result = cli.run(["session", "start", "--agent", "test-bot"]);
      expect(result.success).toBe(true);
      expect(result.message).toContain("started");
    });

    it("generates reports", () => {
      const result = cli.run(["report", "--format", "text"]);
      expect(result.success).toBe(true);
    });

    it("queries audit log", () => {
      const result = cli.run(["audit", "--count"]);
      expect(result.success).toBe(true);
    });
  });

  describe("end-to-end CLI workflow", () => {
    it("simulates full governance workflow", () => {
      const statusResult = cli.run(["status"]);
      expect(statusResult.success).toBe(true);

      const evalSafe = cli.run(["evaluate", "--domain", "general", "--action", "read"]);
      expect(evalSafe.message).toContain("ALLOW");

      const evalDangerous = cli.run(["evaluate", "--domain", "infrastructure", "--action", "deploy"]);
      expect(evalDangerous.message).toContain("R3");

      const reportResult = cli.run(["report", "--format", "markdown"]);
      expect(reportResult.success).toBe(true);

      const helpResult = cli.run(["help", "evaluate"]);
      expect(helpResult.message).toContain("Usage:");
    });
  });
});
