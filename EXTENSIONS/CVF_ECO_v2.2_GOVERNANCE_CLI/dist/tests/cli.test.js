"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const cli_1 = require("../src/cli");
(0, vitest_1.describe)("GovernanceCLI", () => {
    const cli = new cli_1.GovernanceCLI();
    (0, vitest_1.describe)("run", () => {
        (0, vitest_1.it)("runs help with no args", () => {
            const result = cli.run([]);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.message).toContain("Commands:");
        });
        (0, vitest_1.it)("runs version command", () => {
            const result = cli.run(["version"]);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.message).toContain("2.2.0");
            (0, vitest_1.expect)(result.message).toContain("cvf");
        });
        (0, vitest_1.it)("runs status command", () => {
            const result = cli.run(["status"]);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.message).toContain("OPERATIONAL");
        });
        (0, vitest_1.it)("evaluates action with flags", () => {
            const result = cli.run(["evaluate", "--domain", "finance", "--action", "transfer", "--target", "vendor"]);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.message).toContain("finance");
            (0, vitest_1.expect)(result.message).toContain("transfer");
        });
        (0, vitest_1.it)("evaluates with = syntax", () => {
            const result = cli.run(["evaluate", "--domain=code_security", "--action=execute"]);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.message).toContain("code_security");
        });
        (0, vitest_1.it)("shows execute help", () => {
            const result = cli.run(["execute", "--help"]);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.message).toContain("cvf execute");
        });
        (0, vitest_1.it)("blocks dangerous actions", () => {
            const result = cli.run(["evaluate", "--domain", "infrastructure", "--action", "execute"]);
            (0, vitest_1.expect)(result.exitCode).toBe(2);
            (0, vitest_1.expect)(result.message).toContain("BLOCK");
        });
        (0, vitest_1.it)("manages sessions", () => {
            const result = cli.run(["session", "start", "--agent", "test-bot"]);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.message).toContain("started");
        });
        (0, vitest_1.it)("generates reports", () => {
            const result = cli.run(["report", "--format", "text"]);
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)("queries audit log", () => {
            const result = cli.run(["audit", "--count"]);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.message).toContain("Audit entries");
        });
    });
    (0, vitest_1.describe)("end-to-end CLI workflow", () => {
        (0, vitest_1.it)("simulates full governance workflow", () => {
            const statusResult = cli.run(["status"]);
            (0, vitest_1.expect)(statusResult.success).toBe(true);
            const evalSafe = cli.run(["evaluate", "--domain", "general", "--action", "read"]);
            (0, vitest_1.expect)(evalSafe.message).toContain("ALLOW");
            const evalDangerous = cli.run(["evaluate", "--domain", "infrastructure", "--action", "deploy"]);
            (0, vitest_1.expect)(evalDangerous.message).toContain("R3");
            const reportResult = cli.run(["report", "--format", "markdown"]);
            (0, vitest_1.expect)(reportResult.success).toBe(true);
            const helpResult = cli.run(["help", "evaluate"]);
            (0, vitest_1.expect)(helpResult.message).toContain("Usage:");
        });
    });
});
