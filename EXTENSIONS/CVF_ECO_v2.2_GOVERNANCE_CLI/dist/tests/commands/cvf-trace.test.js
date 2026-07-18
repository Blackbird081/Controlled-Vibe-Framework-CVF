"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const node_os_1 = require("node:os");
const node_path_1 = require("node:path");
const vitest_1 = require("vitest");
const command_registry_1 = require("../../src/command.registry");
function tracePath() {
    const dir = (0, node_fs_1.mkdtempSync)((0, node_path_1.join)((0, node_os_1.tmpdir)(), "cvf-trace-"));
    const path = (0, node_path_1.join)(dir, "trace.jsonl");
    (0, node_fs_1.writeFileSync)(path, [
        JSON.stringify({ sessionId: "ses-1", eventType: "execution_requested" }),
        JSON.stringify({ sessionId: "ses-2", eventType: "receipt_emitted" }),
    ].join("\n"));
    return path;
}
(0, vitest_1.describe)("cvf trace", () => {
    (0, vitest_1.it)("registers the trace command", () => {
        (0, vitest_1.expect)(new command_registry_1.CommandRegistry().getHandler("trace")).toBeDefined();
    });
    (0, vitest_1.it)("dumps JSONL trace entries", () => {
        const input = tracePath();
        try {
            const result = new command_registry_1.CommandRegistry().execute({ command: "trace", positional: ["dump"], flags: { input } });
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.message).toContain("execution_requested");
        }
        finally {
            (0, node_fs_1.rmSync)((0, node_path_1.dirname)(input), { recursive: true, force: true });
        }
    });
    (0, vitest_1.it)("filters trace entries by session", () => {
        const input = tracePath();
        try {
            const result = new command_registry_1.CommandRegistry().execute({ command: "trace", positional: ["dump"], flags: { input, session: "ses-2" } });
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.message).toContain("ses-2");
            (0, vitest_1.expect)(result.message).not.toContain("ses-1");
        }
        finally {
            (0, node_fs_1.rmSync)((0, node_path_1.dirname)(input), { recursive: true, force: true });
        }
    });
    (0, vitest_1.it)("returns a clear error for missing input", () => {
        const result = new command_registry_1.CommandRegistry().execute({ command: "trace", positional: ["dump"], flags: { input: "missing.jsonl" } });
        (0, vitest_1.expect)(result.success).toBe(false);
        (0, vitest_1.expect)(result.message).toContain("not found");
    });
});
