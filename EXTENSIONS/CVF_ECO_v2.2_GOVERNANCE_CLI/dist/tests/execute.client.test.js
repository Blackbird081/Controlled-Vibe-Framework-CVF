"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const cli_1 = require("../src/cli");
const execute_client_1 = require("../src/execute.client");
(0, vitest_1.describe)("execute client", () => {
    (0, vitest_1.it)("builds execute route URL from a server endpoint", () => {
        (0, vitest_1.expect)((0, execute_client_1.buildExecuteUrl)("http://localhost:3000")).toBe("http://localhost:3000/api/execute");
        (0, vitest_1.expect)((0, execute_client_1.buildExecuteUrl)("http://localhost:3000/api/execute")).toBe("http://localhost:3000/api/execute");
    });
    (0, vitest_1.it)("builds a route-compatible execute payload", () => {
        const payload = (0, execute_client_1.buildExecutePayload)({
            command: "execute",
            flags: {
                template: "app_builder_complete",
                role: "BUILDER",
                input: "{\"appName\":\"TaskFlow\"}",
            },
            positional: [],
        });
        (0, vitest_1.expect)(payload.templateId).toBe("app_builder_complete");
        (0, vitest_1.expect)(payload.templateName).toBe("app_builder_complete");
        (0, vitest_1.expect)(payload.requestedRole).toBe("BUILDER");
        (0, vitest_1.expect)(payload.inputs).toEqual({ appName: "TaskFlow" });
        (0, vitest_1.expect)(payload.intent).toContain("app_builder_complete");
    });
    (0, vitest_1.it)("passes stream true when --stream is set", () => {
        const payload = (0, execute_client_1.buildExecutePayload)({
            command: "execute",
            flags: {
                template: "documentation",
                role: "BUILDER",
                stream: true,
            },
            positional: [],
        });
        (0, vitest_1.expect)(payload.stream).toBe(true);
    });
    (0, vitest_1.it)("adds service-token signature headers without exposing token in output", () => {
        const headers = (0, execute_client_1.buildServiceHeaders)("secret-token", "{\"x\":1}", 12345);
        (0, vitest_1.expect)(headers["x-cvf-service-token"]).toBe("secret-token");
        (0, vitest_1.expect)(headers["x-cvf-service-timestamp"]).toBe("12345");
        (0, vitest_1.expect)(headers["x-cvf-service-signature"]).toHaveLength(64);
    });
    (0, vitest_1.it)("returns receipt JSON from a mocked execute route", async () => {
        const result = await (0, execute_client_1.executeGovernedTemplateCommand)({
            command: "execute",
            flags: {
                template: "app_builder_complete",
                role: "BUILDER",
                endpoint: "http://localhost:3000",
                input: "{\"appName\":\"TaskFlow\"}",
            },
            positional: [],
        }, async (url, init) => {
            (0, vitest_1.expect)(url).toBe("http://localhost:3000/api/execute");
            (0, vitest_1.expect)(JSON.parse(init.body)).toMatchObject({
                templateId: "app_builder_complete",
                templateName: "app_builder_complete",
                requestedRole: "BUILDER",
            });
            return {
                ok: true,
                status: 200,
                async text() {
                    return JSON.stringify({
                        success: true,
                        governanceEvidenceReceipt: { receiptId: "receipt-1" },
                        workflowId: "workflow.product.create_product_brief.v1",
                        stepTraces: [
                            { stepId: "step-1-intake-validation", label: "Intake validation" },
                            { stepId: "step-3-provider-call", label: "Provider call" },
                            { stepId: "step-5-receipt-emit", label: "Receipt emit" },
                        ],
                        rolePermission: { allowed: true, role: "BUILDER" },
                    });
                },
            };
        });
        (0, vitest_1.expect)(result.success).toBe(true);
        (0, vitest_1.expect)(() => JSON.parse(result.message)).not.toThrow();
        (0, vitest_1.expect)(JSON.parse(result.message)).toMatchObject({
            templateId: "app_builder_complete",
            requestedRole: "BUILDER",
            workflowId: "workflow.product.create_product_brief.v1",
        });
    });
    (0, vitest_1.it)("sends stream true in the execute POST body", async () => {
        const result = await (0, execute_client_1.executeGovernedTemplateCommand)({
            command: "execute",
            flags: {
                template: "documentation",
                role: "BUILDER",
                endpoint: "http://localhost:3000",
                stream: true,
            },
            positional: [],
        }, async (_url, init) => {
            (0, vitest_1.expect)(JSON.parse(init.body)).toMatchObject({
                templateId: "documentation",
                requestedRole: "BUILDER",
                stream: true,
            });
            return {
                ok: true,
                status: 200,
                async text() {
                    return JSON.stringify({
                        success: true,
                        governanceEvidenceReceipt: { receiptId: "receipt-stream-1" },
                        workflowId: "workflow.documentation.generate_sop.v1",
                        stepTraces: [],
                        rolePermission: { allowed: true, role: "BUILDER" },
                    });
                },
            };
        });
        (0, vitest_1.expect)(result.success).toBe(true);
    });
    (0, vitest_1.it)("supports the async GovernanceCLI runner", async () => {
        const cli = new cli_1.GovernanceCLI();
        const result = await cli.runAsync(["execute"]);
        (0, vitest_1.expect)(result.success).toBe(false);
        (0, vitest_1.expect)(result.message).toContain("--template");
    });
    (0, vitest_1.it)("dry-run returns payload shape without making HTTP call", async () => {
        const result = await (0, execute_client_1.executeGovernedTemplateCommand)({ command: "execute", flags: { template: "documentation", role: "BUILDER", "dry-run": true }, positional: [] }, async () => {
            throw new Error("dry-run should not call fetch");
        });
        const output = JSON.parse(result.message);
        (0, vitest_1.expect)(result.success).toBe(true);
        (0, vitest_1.expect)(output.dryRun).toBe(true);
        (0, vitest_1.expect)(output.templateId).toBe("documentation");
        (0, vitest_1.expect)(Array.isArray(output.payloadShape)).toBe(true);
        (0, vitest_1.expect)(output.headerKeys.includes("x-cvf-service-token")).toBe(false);
    });
    (0, vitest_1.it)("buildDryRunOutput redacts service-token headers", () => {
        const payload = (0, execute_client_1.buildExecutePayload)({ command: "execute", flags: { template: "documentation", role: "BUILDER" }, positional: [] });
        const output = (0, execute_client_1.buildDryRunOutput)(payload, (0, execute_client_1.buildServiceHeaders)("secret-token", JSON.stringify(payload), 12345));
        (0, vitest_1.expect)(output.headerKeys).toContain("x-cvf-service-timestamp");
        (0, vitest_1.expect)(output.headerKeys).not.toContain("x-cvf-service-token");
        (0, vitest_1.expect)(output.headerKeys).not.toContain("x-cvf-service-signature");
    });
    (0, vitest_1.it)("appendExecuteReceipt writes a valid JSONL line", async () => {
        const { mkdtempSync, readFileSync, rmSync } = await Promise.resolve().then(() => __importStar(require("node:fs")));
        const { join } = await Promise.resolve().then(() => __importStar(require("node:path")));
        const tmpDir = mkdtempSync("cvf-receipt-test-");
        const receiptPath = join(tmpDir, "evidence", "test-receipts.jsonl");
        (0, execute_client_1.appendExecuteReceipt)({
            templateId: "documentation",
            requestedRole: "BUILDER",
            workflowId: "wf-001",
            receiptBinding: "rb-001",
        }, receiptPath);
        const line = JSON.parse(readFileSync(receiptPath, "utf8").trim());
        (0, vitest_1.expect)(line.templateId).toBe("documentation");
        (0, vitest_1.expect)(line.requestedRole).toBe("BUILDER");
        (0, vitest_1.expect)(typeof line.timestamp).toBe("string");
        rmSync(tmpDir, { recursive: true });
    });
});
