"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const command_registry_1 = require("../../src/command.registry");
(0, vitest_1.describe)("cvf run", () => {
    (0, vitest_1.it)("registers the run command", () => {
        (0, vitest_1.expect)(new command_registry_1.CommandRegistry().getHandler("run")).toBeDefined();
    });
    (0, vitest_1.it)("delegates help to execute", () => {
        const result = new command_registry_1.CommandRegistry().execute({ command: "run", positional: [], flags: { help: true } });
        (0, vitest_1.expect)(result.success).toBe(true);
        (0, vitest_1.expect)(result.message).toContain("cvf execute");
    });
    (0, vitest_1.it)("forwards positional template to the execute alias", () => {
        const result = new command_registry_1.CommandRegistry().execute({
            command: "run",
            positional: ["documentation"],
            flags: { role: "BUILDER" },
        });
        (0, vitest_1.expect)(result.success).toBe(false);
        (0, vitest_1.expect)(result.message).toContain("runAsync");
    });
    (0, vitest_1.it)("does not execute network I/O through the sync path", () => {
        const result = new command_registry_1.CommandRegistry().execute({
            command: "run",
            positional: ["documentation"],
            flags: { role: "BUILDER" },
        });
        (0, vitest_1.expect)(result.exitCode).toBe(1);
    });
});
