"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const arg_parser_1 = require("../src/arg.parser");
(0, vitest_1.describe)("ArgParser", () => {
    const parser = new arg_parser_1.ArgParser();
    (0, vitest_1.describe)("command extraction", () => {
        (0, vitest_1.it)("parses command from first argument", () => {
            const result = parser.parse(["evaluate", "--domain", "finance"]);
            (0, vitest_1.expect)(result.command).toBe("evaluate");
        });
        (0, vitest_1.it)("defaults to help for empty args", () => {
            const result = parser.parse([]);
            (0, vitest_1.expect)(result.command).toBe("help");
        });
        (0, vitest_1.it)("defaults to help for unknown command", () => {
            const result = parser.parse(["unknown_cmd"]);
            (0, vitest_1.expect)(result.command).toBe("help");
        });
        (0, vitest_1.it)("recognizes all valid commands", () => {
            for (const cmd of parser.getValidCommands()) {
                const result = parser.parse([cmd]);
                (0, vitest_1.expect)(result.command).toBe(cmd);
            }
        });
    });
    (0, vitest_1.describe)("flag parsing", () => {
        (0, vitest_1.it)("parses --key value flags", () => {
            const result = parser.parse(["evaluate", "--domain", "finance", "--action", "transfer"]);
            (0, vitest_1.expect)(result.flags.domain).toBe("finance");
            (0, vitest_1.expect)(result.flags.action).toBe("transfer");
        });
        (0, vitest_1.it)("parses --key=value flags", () => {
            const result = parser.parse(["evaluate", "--domain=finance"]);
            (0, vitest_1.expect)(result.flags.domain).toBe("finance");
        });
        (0, vitest_1.it)("parses short -k value flags", () => {
            const result = parser.parse(["evaluate", "-d", "finance"]);
            (0, vitest_1.expect)(result.flags.d).toBe("finance");
        });
        (0, vitest_1.it)("parses boolean flags", () => {
            const result = parser.parse(["audit", "--count"]);
            (0, vitest_1.expect)(result.flags.count).toBe(true);
        });
        (0, vitest_1.it)("parses execute --stream as a boolean flag", () => {
            const result = parser.parse(["execute", "--stream", "--template", "documentation"]);
            (0, vitest_1.expect)(result.flags.stream).toBe(true);
            (0, vitest_1.expect)(result.flags.template).toBe("documentation");
        });
    });
    (0, vitest_1.describe)("positional arguments", () => {
        (0, vitest_1.it)("captures positional args after command", () => {
            const result = parser.parse(["session", "start"]);
            (0, vitest_1.expect)(result.positional).toContain("start");
        });
        (0, vitest_1.it)("mixes positional and flags", () => {
            const result = parser.parse(["session", "start", "--agent", "bot-1"]);
            (0, vitest_1.expect)(result.positional).toContain("start");
            (0, vitest_1.expect)(result.flags.agent).toBe("bot-1");
        });
    });
    (0, vitest_1.describe)("validation", () => {
        (0, vitest_1.it)("validates known commands", () => {
            (0, vitest_1.expect)(parser.isValidCommand("evaluate")).toBe(true);
            (0, vitest_1.expect)(parser.isValidCommand("execute")).toBe(true);
            (0, vitest_1.expect)(parser.isValidCommand("session")).toBe(true);
            (0, vitest_1.expect)(parser.isValidCommand("help")).toBe(true);
        });
        (0, vitest_1.it)("rejects unknown commands", () => {
            (0, vitest_1.expect)(parser.isValidCommand("foo")).toBe(false);
        });
    });
});
