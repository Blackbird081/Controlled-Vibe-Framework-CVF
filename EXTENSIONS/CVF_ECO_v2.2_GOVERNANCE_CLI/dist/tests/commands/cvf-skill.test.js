"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const node_os_1 = require("node:os");
const node_path_1 = require("node:path");
const vitest_1 = require("vitest");
const command_registry_1 = require("../../src/command.registry");
function skillIndexPath() {
    const dir = (0, node_fs_1.mkdtempSync)((0, node_path_1.join)((0, node_os_1.tmpdir)(), "cvf-skill-index-"));
    const path = (0, node_path_1.join)(dir, "skills-index.json");
    (0, node_fs_1.writeFileSync)(path, JSON.stringify({
        categories: [{ id: "ops", skills: [{ id: "skill-a", title: "Skill A", domain: "ops", riskLevel: "R1" }] }],
    }));
    return path;
}
(0, vitest_1.describe)("cvf skill", () => {
    (0, vitest_1.it)("registers the skill command", () => {
        (0, vitest_1.expect)(new command_registry_1.CommandRegistry().getHandler("skill")).toBeDefined();
    });
    (0, vitest_1.it)("lists skills from a read-only index", () => {
        const input = skillIndexPath();
        try {
            const result = new command_registry_1.CommandRegistry().execute({ command: "skill", positional: ["list"], flags: { input } });
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.message).toContain("skill-a");
        }
        finally {
            (0, node_fs_1.rmSync)((0, node_path_1.dirname)(input), { recursive: true, force: true });
        }
    });
    (0, vitest_1.it)("shows one skill by id", () => {
        const input = skillIndexPath();
        try {
            const result = new command_registry_1.CommandRegistry().execute({ command: "skill", positional: ["show", "skill-a"], flags: { input } });
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.message).toContain("Skill A");
        }
        finally {
            (0, node_fs_1.rmSync)((0, node_path_1.dirname)(input), { recursive: true, force: true });
        }
    });
    (0, vitest_1.it)("lists certified product outcome runtime plans", () => {
        const result = new command_registry_1.CommandRegistry().execute({
            command: "skill",
            positional: ["list"],
            flags: { certified: true },
        });
        (0, vitest_1.expect)(result.success).toBe(true);
        (0, vitest_1.expect)(result.message).toContain("product_brief");
        (0, vitest_1.expect)(result.message).toContain("app_builder_complete");
        (0, vitest_1.expect)(result.data).toMatchObject({ plans: vitest_1.expect.any(Array) });
    });
    (0, vitest_1.it)("shows a certified product outcome runtime plan as JSON", () => {
        const result = new command_registry_1.CommandRegistry().execute({
            command: "skill",
            positional: ["plan", "product_brief"],
            flags: { json: true },
        });
        (0, vitest_1.expect)(result.success).toBe(true);
        const plan = JSON.parse(result.message);
        (0, vitest_1.expect)(plan).toMatchObject({
            skillPackId: "product_brief",
            templateId: "app_builder_complete",
            routeOwner: "cvf-web /api/execute",
        });
        (0, vitest_1.expect)(plan.receiptSchemaPath).toContain("receipt.schema.json");
    });
    (0, vitest_1.it)("returns a clear error for a missing skill", () => {
        const input = skillIndexPath();
        try {
            const result = new command_registry_1.CommandRegistry().execute({ command: "skill", positional: ["show", "missing"], flags: { input } });
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("Skill not found");
        }
        finally {
            (0, node_fs_1.rmSync)((0, node_path_1.dirname)(input), { recursive: true, force: true });
        }
    });
});
