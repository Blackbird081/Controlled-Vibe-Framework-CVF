"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const vitest_1 = require("vitest");
const canonical_gateway_1 = require("../src/canonical.gateway");
(0, vitest_1.describe)("CVFCanonicalGateway", () => {
    (0, vitest_1.it)("declares the canonical runtime command surface", () => {
        (0, vitest_1.expect)(canonical_gateway_1.CVF_CANONICAL_RUNTIME_COMMANDS).toEqual([
            "run",
            "audit",
            "execute",
            "skill",
            "receipt",
            "trace",
            "provider",
        ]);
        const inspection = new canonical_gateway_1.CVFCanonicalGateway().inspect();
        (0, vitest_1.expect)(inspection).toMatchObject({
            name: "cvf",
            legacyPrefix: "cvf-guard",
            routeOwner: "cvf-web /api/execute",
            providerOwner: "existing provider registries",
            receiptEnvelopeChanged: false,
        });
    });
    (0, vitest_1.it)("accepts canonical and legacy argv prefixes", () => {
        (0, vitest_1.expect)((0, canonical_gateway_1.stripCvfGatewayPrefix)(["cvf", "status"])).toEqual(["status"]);
        (0, vitest_1.expect)((0, canonical_gateway_1.stripCvfGatewayPrefix)(["cvf-guard", "status"])).toEqual(["status"]);
        (0, vitest_1.expect)((0, canonical_gateway_1.stripCvfGatewayPrefix)(["status"])).toEqual(["status"]);
    });
    (0, vitest_1.it)("runs help through the canonical cvf gateway", () => {
        const result = new canonical_gateway_1.CVFCanonicalGateway().run(["cvf", "help"]);
        (0, vitest_1.expect)(result.success).toBe(true);
        (0, vitest_1.expect)(result.message).toContain("CVF Canonical CLI Runtime Gateway");
        (0, vitest_1.expect)(result.message).toContain("execute");
        (0, vitest_1.expect)(result.message).toContain("provider");
    });
    (0, vitest_1.it)("keeps cvf-guard as a legacy prefix alias", () => {
        const result = new canonical_gateway_1.CVFCanonicalGateway().run(["cvf-guard", "status"]);
        (0, vitest_1.expect)(result.success).toBe(true);
        (0, vitest_1.expect)(result.message).toContain("cvf v2.2.0");
        (0, vitest_1.expect)(result.message).toContain("OPERATIONAL");
    });
    (0, vitest_1.it)("runs cvf run dry-run through the existing execute path without HTTP I/O", async () => {
        const result = await new canonical_gateway_1.CVFCanonicalGateway().runAsync([
            "cvf",
            "run",
            "documentation",
            "--role",
            "BUILDER",
            "--dry-run",
        ]);
        (0, vitest_1.expect)(result.success).toBe(true);
        const payload = JSON.parse(result.message);
        (0, vitest_1.expect)(payload).toMatchObject({
            dryRun: true,
            templateId: "documentation",
            requestedRole: "BUILDER",
        });
        (0, vitest_1.expect)(payload.endpoint).toBe("[not sent]");
    });
    (0, vitest_1.it)("resolves certified product outcomes before cvf run delegation", async () => {
        const result = await new canonical_gateway_1.CVFCanonicalGateway().runAsync([
            "cvf",
            "run",
            "product_brief",
            "--role",
            "BUILDER",
            "--dry-run",
        ]);
        (0, vitest_1.expect)(result.success).toBe(true);
        const payload = JSON.parse(result.message);
        (0, vitest_1.expect)(payload).toMatchObject({
            dryRun: true,
            templateId: "app_builder_complete",
            requestedRole: "BUILDER",
            productOutcomeRuntime: {
                skillPackId: "product_brief",
                outcomeKey: "product_brief",
                templateId: "app_builder_complete",
            },
        });
    });
    (0, vitest_1.it)("runs canonical cvf audit against supplied JSONL input", () => {
        const tmpDir = (0, node_fs_1.mkdtempSync)("cvf-canonical-audit-");
        const auditPath = (0, node_path_1.join)(tmpDir, "audit.jsonl");
        (0, node_fs_1.writeFileSync)(auditPath, [
            JSON.stringify({ sessionId: "SES-001", verdict: "ALLOW" }),
            JSON.stringify({ sessionId: "SES-002", verdict: "BLOCK" }),
        ].join("\n"), "utf8");
        try {
            const result = new canonical_gateway_1.CVFCanonicalGateway().run([
                "cvf",
                "audit",
                "--input",
                auditPath,
                "--session",
                "SES-001",
                "--count",
            ]);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.message).toContain("Audit entries: 1");
            (0, vitest_1.expect)(result.data).toMatchObject({ entries: 1 });
        }
        finally {
            (0, node_fs_1.rmSync)(tmpDir, { recursive: true, force: true });
        }
    });
});
