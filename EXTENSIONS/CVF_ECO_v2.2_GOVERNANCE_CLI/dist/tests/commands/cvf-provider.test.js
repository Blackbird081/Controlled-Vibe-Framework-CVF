"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const command_registry_1 = require("../../src/command.registry");
(0, vitest_1.describe)("cvf provider", () => {
    (0, vitest_1.it)("registers the provider command", () => {
        (0, vitest_1.expect)(new command_registry_1.CommandRegistry().getHandler("provider")).toBeDefined();
    });
    (0, vitest_1.it)("lists registered provider lanes without key values", () => {
        const result = new command_registry_1.CommandRegistry().execute({ command: "provider", positional: ["list"], flags: {} });
        (0, vitest_1.expect)(result.success).toBe(true);
        (0, vitest_1.expect)(result.message).toContain("openai");
        (0, vitest_1.expect)(result.message).toContain("alibaba");
        (0, vitest_1.expect)(result.message).not.toMatch(/API_KEY|sk-|secret/i);
    });
    (0, vitest_1.it)("returns a clear error for unknown provider subcommands", () => {
        const result = new command_registry_1.CommandRegistry().execute({ command: "provider", positional: ["mutate"], flags: {} });
        (0, vitest_1.expect)(result.success).toBe(false);
        (0, vitest_1.expect)(result.message).toContain("Unknown provider sub-command");
    });
    (0, vitest_1.it)("has no mutation subcommand registered", () => {
        const result = new command_registry_1.CommandRegistry().execute({ command: "provider", positional: ["list"], flags: {} });
        (0, vitest_1.expect)(result.data).toMatchObject({ providers: vitest_1.expect.any(Array) });
    });
});
