import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CVFCanonicalGateway,
  CVF_CANONICAL_RUNTIME_COMMANDS,
  stripCvfGatewayPrefix,
} from "../src/canonical.gateway";

describe("CVFCanonicalGateway", () => {
  it("declares the canonical runtime command surface", () => {
    expect(CVF_CANONICAL_RUNTIME_COMMANDS).toEqual([
      "run",
      "audit",
      "execute",
      "skill",
      "receipt",
      "trace",
      "provider",
    ]);

    const inspection = new CVFCanonicalGateway().inspect();
    expect(inspection).toMatchObject({
      name: "cvf",
      legacyPrefix: "cvf-guard",
      routeOwner: "cvf-web /api/execute",
      providerOwner: "existing provider registries",
      receiptEnvelopeChanged: false,
    });
  });

  it("accepts canonical and legacy argv prefixes", () => {
    expect(stripCvfGatewayPrefix(["cvf", "status"])).toEqual(["status"]);
    expect(stripCvfGatewayPrefix(["cvf-guard", "status"])).toEqual(["status"]);
    expect(stripCvfGatewayPrefix(["status"])).toEqual(["status"]);
  });

  it("runs help through the canonical cvf gateway", () => {
    const result = new CVFCanonicalGateway().run(["cvf", "help"]);

    expect(result.success).toBe(true);
    expect(result.message).toContain("CVF Canonical CLI Runtime Gateway");
    expect(result.message).toContain("execute");
    expect(result.message).toContain("provider");
  });

  it("keeps cvf-guard as a legacy prefix alias", () => {
    const result = new CVFCanonicalGateway().run(["cvf-guard", "status"]);

    expect(result.success).toBe(true);
    expect(result.message).toContain("cvf v2.2.0");
    expect(result.message).toContain("OPERATIONAL");
  });

  it("runs cvf run dry-run through the existing execute path without HTTP I/O", async () => {
    const result = await new CVFCanonicalGateway().runAsync([
      "cvf",
      "run",
      "documentation",
      "--role",
      "BUILDER",
      "--dry-run",
    ]);

    expect(result.success).toBe(true);
    const payload = JSON.parse(result.message);
    expect(payload).toMatchObject({
      dryRun: true,
      templateId: "documentation",
      requestedRole: "BUILDER",
    });
    expect(payload.endpoint).toBe("[not sent]");
  });

  it("resolves certified product outcomes before cvf run delegation", async () => {
    const result = await new CVFCanonicalGateway().runAsync([
      "cvf",
      "run",
      "product_brief",
      "--role",
      "BUILDER",
      "--dry-run",
    ]);

    expect(result.success).toBe(true);
    const payload = JSON.parse(result.message);
    expect(payload).toMatchObject({
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

  it("runs canonical cvf audit against supplied JSONL input", () => {
    const tmpDir = mkdtempSync("cvf-canonical-audit-");
    const auditPath = join(tmpDir, "audit.jsonl");
    writeFileSync(
      auditPath,
      [
        JSON.stringify({ sessionId: "SES-001", verdict: "ALLOW" }),
        JSON.stringify({ sessionId: "SES-002", verdict: "BLOCK" }),
      ].join("\n"),
      "utf8",
    );

    try {
      const result = new CVFCanonicalGateway().run([
        "cvf",
        "audit",
        "--input",
        auditPath,
        "--session",
        "SES-001",
        "--count",
      ]);

      expect(result.success).toBe(true);
      expect(result.message).toContain("Audit entries: 1");
      expect(result.data).toMatchObject({ entries: 1 });
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
