import { describe, it, expect } from "vitest";
import { CommandRegistry } from "../src/command.registry";

describe("CommandRegistry", () => {
  const registry = new CommandRegistry();

  describe("built-in commands", () => {
    it("has 14 built-in commands", () => {
      const commands = registry.listCommands();
      expect(commands.length).toBe(14);
    });

    it("includes all expected commands", () => {
      const names = registry.listCommands().map((c) => c.name);
      expect(names).toContain("help");
      expect(names).toContain("version");
      expect(names).toContain("execute");
      expect(names).toContain("run");
      expect(names).toContain("skill");
      expect(names).toContain("receipt");
      expect(names).toContain("trace");
      expect(names).toContain("provider");
      expect(names).toContain("benchmark");
      expect(names).toContain("status");
      expect(names).toContain("evaluate");
      expect(names).toContain("session");
      expect(names).toContain("report");
      expect(names).toContain("audit");
    });
  });

  describe("help command", () => {
    it("shows all commands", () => {
      const result = registry.execute({ command: "help", flags: {}, positional: [] });
      expect(result.success).toBe(true);
      expect(result.message).toContain("Commands:");
    });

    it("shows specific command help", () => {
      const result = registry.execute({ command: "help", flags: {}, positional: ["evaluate"] });
      expect(result.success).toBe(true);
      expect(result.message).toContain("evaluate");
      expect(result.message).toContain("Usage:");
    });

    it("errors for unknown command help", () => {
      const result = registry.execute({ command: "help", flags: {}, positional: ["nonexistent"] });
      expect(result.success).toBe(false);
    });
  });

  describe("version command", () => {
    it("returns version string", () => {
      const result = registry.execute({ command: "version", flags: {}, positional: [] });
      expect(result.success).toBe(true);
      expect(result.message).toContain("2.2.0");
    });
  });

  describe("status command", () => {
    it("returns operational status", () => {
      const result = registry.execute({ command: "status", flags: {}, positional: [] });
      expect(result.success).toBe(true);
      expect(result.message).toContain("OPERATIONAL");
    });
  });

  describe("evaluate command", () => {
    it("evaluates low-risk action", () => {
      const result = registry.execute({
        command: "evaluate",
        flags: { domain: "general", action: "read", target: "file" },
        positional: [],
      });
      expect(result.success).toBe(true);
      expect(result.message).toContain("ALLOW");
      expect(result.exitCode).toBe(0);
    });

    it("evaluates high-risk action", () => {
      const result = registry.execute({
        command: "evaluate",
        flags: { domain: "infrastructure", action: "execute", target: "server" },
        positional: [],
      });
      expect(result.success).toBe(true);
      expect(result.message).toContain("BLOCK");
      expect(result.exitCode).toBe(2);
    });

    it("evaluates with amount", () => {
      const result = registry.execute({
        command: "evaluate",
        flags: { domain: "finance", action: "transfer", target: "vendor", amount: "15000" },
        positional: [],
      });
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty("riskScore");
    });
  });

  describe("execute command", () => {
    it("shows execute help through the sync runner", () => {
      const result = registry.execute({
        command: "execute",
        flags: { help: true },
        positional: [],
      });
      expect(result.success).toBe(true);
      expect(result.message).toContain("cvf execute");
    });

    it("requires the async runner for HTTP execution", () => {
      const result = registry.execute({
        command: "execute",
        flags: { template: "app_builder_complete", role: "BUILDER" },
        positional: [],
      });
      expect(result.success).toBe(false);
      expect(result.message).toContain("runAsync");
    });
  });

  describe("benchmark command", () => {
    it("requires the governance sub-command", () => {
      const result = registry.execute({
        command: "benchmark",
        flags: {},
        positional: [],
      });
      expect(result.success).toBe(false);
      expect(result.message).toContain("benchmark governance");
    });
  });

  describe("session command", () => {
    it("starts session", () => {
      const result = registry.execute({
        command: "session",
        flags: { agent: "bot-1" },
        positional: ["start"],
      });
      expect(result.success).toBe(true);
      expect(result.message).toContain("started");
    });

    it("ends session", () => {
      const result = registry.execute({
        command: "session",
        flags: {},
        positional: ["end"],
      });
      expect(result.success).toBe(true);
    });

    it("lists sessions", () => {
      const result = registry.execute({
        command: "session",
        flags: {},
        positional: ["list"],
      });
      expect(result.success).toBe(true);
    });

    it("errors on unknown sub-command", () => {
      const result = registry.execute({
        command: "session",
        flags: {},
        positional: ["unknown"],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("report command", () => {
    it("generates report", () => {
      const result = registry.execute({
        command: "report",
        flags: { format: "markdown", title: "My Report" },
        positional: [],
      });
      expect(result.success).toBe(true);
      expect(result.message).toContain("markdown");
    });
  });

  describe("audit command", () => {
    it("queries audit log", () => {
      const result = registry.execute({
        command: "audit",
        flags: { session: "SES-001" },
        positional: [],
      });
      expect(result.success).toBe(true);
    });

    it("supports count flag", () => {
      const result = registry.execute({
        command: "audit",
        flags: { count: true },
        positional: [],
      });
      expect(result.success).toBe(true);
      expect(result.message).toContain("entries");
    });
  });
});
