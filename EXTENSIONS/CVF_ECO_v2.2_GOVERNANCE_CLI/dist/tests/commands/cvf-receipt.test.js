"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const node_os_1 = require("node:os");
const node_path_1 = require("node:path");
const vitest_1 = require("vitest");
const command_registry_1 = require("../../src/command.registry");
function receiptPath() {
    const dir = (0, node_fs_1.mkdtempSync)((0, node_path_1.join)((0, node_os_1.tmpdir)(), "cvf-receipt-"));
    const path = (0, node_path_1.join)(dir, "receipts.jsonl");
    (0, node_fs_1.writeFileSync)(path, `${JSON.stringify({ receiptId: "rcpt-1", decision: "ALLOW" })}\n`);
    return path;
}
(0, vitest_1.describe)("cvf receipt", () => {
    (0, vitest_1.it)("registers the receipt command", () => {
        (0, vitest_1.expect)(new command_registry_1.CommandRegistry().getHandler("receipt")).toBeDefined();
    });
    (0, vitest_1.it)("shows a matching receipt", () => {
        const input = receiptPath();
        try {
            const result = new command_registry_1.CommandRegistry().execute({ command: "receipt", positional: ["show", "rcpt-1"], flags: { input } });
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.message).toContain("ALLOW");
        }
        finally {
            (0, node_fs_1.rmSync)((0, node_path_1.dirname)(input), { recursive: true, force: true });
        }
    });
    (0, vitest_1.it)("returns a clear error for a missing receipt", () => {
        const input = receiptPath();
        try {
            const result = new command_registry_1.CommandRegistry().execute({ command: "receipt", positional: ["show", "missing"], flags: { input } });
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("Receipt not found");
        }
        finally {
            (0, node_fs_1.rmSync)((0, node_path_1.dirname)(input), { recursive: true, force: true });
        }
    });
    (0, vitest_1.it)("does not mutate the receipt log", () => {
        const input = receiptPath();
        try {
            new command_registry_1.CommandRegistry().execute({ command: "receipt", positional: ["show", "rcpt-1"], flags: { input } });
            (0, vitest_1.expect)(readText(input).split(/\r?\n/).filter(Boolean)).toHaveLength(1);
        }
        finally {
            (0, node_fs_1.rmSync)((0, node_path_1.dirname)(input), { recursive: true, force: true });
        }
    });
});
function readText(path) {
    return (0, node_fs_1.readFileSync)(path, "utf8");
}
