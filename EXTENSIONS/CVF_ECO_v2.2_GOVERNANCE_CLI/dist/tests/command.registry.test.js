"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const command_registry_1 = require("../src/command.registry");
(0, vitest_1.describe)("CommandRegistry", () => {
    const registry = new command_registry_1.CommandRegistry();
    (0, vitest_1.describe)("built-in commands", () => {
        (0, vitest_1.it)("has 14 built-in commands", () => {
            const commands = registry.listCommands();
            (0, vitest_1.expect)(commands.length).toBe(14);
        });
        (0, vitest_1.it)("includes all expected commands", () => {
            const names = registry.listCommands().map((c) => c.name);
            (0, vitest_1.expect)(names).toContain("help");
            (0, vitest_1.expect)(names).toContain("version");
            (0, vitest_1.expect)(names).toContain("execute");
            (0, vitest_1.expect)(names).toContain("run");
            (0, vitest_1.expect)(names).toContain("skill");
            (0, vitest_1.expect)(names).toContain("receipt");
            (0, vitest_1.expect)(names).toContain("trace");
            (0, vitest_1.expect)(names).toContain("provider");
            (0, vitest_1.expect)(names).toContain("benchmark");
            (0, vitest_1.expect)(names).toContain("status");
            (0, vitest_1.expect)(names).toContain("evaluate");
            (0, vitest_1.expect)(names).toContain("session");
            (0, vitest_1.expect)(names).toContain("report");
            (0, vitest_1.expect)(names).toContain("audit");
        });
    });
    (0, vitest_1.describe)("help command", () => {
        (0, vitest_1.it)("shows all commands", () => {
            const result = registry.execute({ command: "help", flags: {}, positional: [] });
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.message).toContain("Commands:");
        });
        (0, vitest_1.it)("shows specific command help", () => {
            const result = registry.execute({ command: "help", flags: {}, positional: ["evaluate"] });
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.message).toContain("evaluate");
            (0, vitest_1.expect)(result.message).toContain("Usage:");
        });
        (0, vitest_1.it)("errors for unknown command help", () => {
            const result = registry.execute({ command: "help", flags: {}, positional: ["nonexistent"] });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
    });
    (0, vitest_1.describe)("version command", () => {
        (0, vitest_1.it)("returns version string", () => {
            const result = registry.execute({ command: "version", flags: {}, positional: [] });
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.message).toContain("2.2.0");
        });
    });
    (0, vitest_1.describe)("status command", () => {
        (0, vitest_1.it)("returns operational status", () => {
            const result = registry.execute({ command: "status", flags: {}, positional: [] });
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.message).toContain("OPERATIONAL");
        });
    });
    (0, vitest_1.describe)("evaluate command", () => {
        (0, vitest_1.it)("evaluates low-risk action", () => {
            const result = registry.execute({
                command: "evaluate",
                flags: { domain: "general", action: "read", target: "file" },
                positional: [],
            });
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.message).toContain("ALLOW");
            (0, vitest_1.expect)(result.exitCode).toBe(0);
        });
        (0, vitest_1.it)("evaluates high-risk action", () => {
            const result = registry.execute({
                command: "evaluate",
                flags: { domain: "infrastructure", action: "execute", target: "server" },
                positional: [],
            });
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.message).toContain("BLOCK");
            (0, vitest_1.expect)(result.exitCode).toBe(2);
        });
        (0, vitest_1.it)("evaluates with amount", () => {
            const result = registry.execute({
                command: "evaluate",
                flags: { domain: "finance", action: "transfer", target: "vendor", amount: "15000" },
                positional: [],
            });
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.data).toHaveProperty("riskScore");
        });
    });
    (0, vitest_1.describe)("execute command", () => {
        (0, vitest_1.it)("shows execute help through the sync runner", () => {
            const result = registry.execute({
                command: "execute",
                flags: { help: true },
                positional: [],
            });
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.message).toContain("cvf execute");
        });
        (0, vitest_1.it)("requires the async runner for HTTP execution", () => {
            const result = registry.execute({
                command: "execute",
                flags: { template: "app_builder_complete", role: "BUILDER" },
                positional: [],
            });
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("runAsync");
        });
    });
    (0, vitest_1.describe)("benchmark command", () => {
        (0, vitest_1.it)("requires the governance sub-command", () => {
            const result = registry.execute({
                command: "benchmark",
                flags: {},
                positional: [],
            });
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("benchmark governance");
        });
    });
    (0, vitest_1.describe)("session command", () => {
        (0, vitest_1.it)("starts session", () => {
            const result = registry.execute({
                command: "session",
                flags: { agent: "bot-1" },
                positional: ["start"],
            });
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.message).toContain("started");
        });
        (0, vitest_1.it)("ends session", () => {
            const result = registry.execute({
                command: "session",
                flags: {},
                positional: ["end"],
            });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)("lists sessions", () => {
            const result = registry.execute({
                command: "session",
                flags: {},
                positional: ["list"],
            });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)("errors on unknown sub-command", () => {
            const result = registry.execute({
                command: "session",
                flags: {},
                positional: ["unknown"],
            });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
    });
    (0, vitest_1.describe)("report command", () => {
        (0, vitest_1.it)("generates report", () => {
            const result = registry.execute({
                command: "report",
                flags: { format: "markdown", title: "My Report" },
                positional: [],
            });
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.message).toContain("markdown");
        });
    });
    (0, vitest_1.describe)("audit command", () => {
        (0, vitest_1.it)("queries audit log", () => {
            const result = registry.execute({
                command: "audit",
                flags: { session: "SES-001" },
                positional: [],
            });
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.data).toMatchObject({ entries: 0 });
        });
        (0, vitest_1.it)("supports count flag", () => {
            const result = registry.execute({
                command: "audit",
                flags: { count: true },
                positional: [],
            });
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.message).toContain("entries");
        });
        (0, vitest_1.it)("shows canonical cvf audit usage", () => {
            const result = registry.execute({
                command: "help",
                flags: {},
                positional: ["audit"],
            });
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.message).toContain("cvf audit");
            (0, vitest_1.expect)(result.message).toContain("--input <audit.jsonl>");
        });
    });
});
