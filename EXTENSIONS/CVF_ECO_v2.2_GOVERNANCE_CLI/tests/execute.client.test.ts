import { describe, expect, it } from "vitest";
import { GovernanceCLI } from "../src/cli";
import {
  buildExecutePayload,
  buildExecuteUrl,
  buildServiceHeaders,
  executeGovernedTemplateCommand,
} from "../src/execute.client";

describe("execute client", () => {
  it("builds execute route URL from a server endpoint", () => {
    expect(buildExecuteUrl("http://localhost:3000")).toBe("http://localhost:3000/api/execute");
    expect(buildExecuteUrl("http://localhost:3000/api/execute")).toBe("http://localhost:3000/api/execute");
  });

  it("builds a route-compatible execute payload", () => {
    const payload = buildExecutePayload({
      command: "execute",
      flags: {
        template: "app_builder_complete",
        role: "BUILDER",
        input: "{\"appName\":\"TaskFlow\"}",
      },
      positional: [],
    });

    expect(payload.templateId).toBe("app_builder_complete");
    expect(payload.templateName).toBe("app_builder_complete");
    expect(payload.requestedRole).toBe("BUILDER");
    expect(payload.inputs).toEqual({ appName: "TaskFlow" });
    expect(payload.intent).toContain("app_builder_complete");
  });

  it("adds service-token signature headers without exposing token in output", () => {
    const headers = buildServiceHeaders("secret-token", "{\"x\":1}", 12345);
    expect(headers["x-cvf-service-token"]).toBe("secret-token");
    expect(headers["x-cvf-service-timestamp"]).toBe("12345");
    expect(headers["x-cvf-service-signature"]).toHaveLength(64);
  });

  it("returns receipt JSON from a mocked execute route", async () => {
    const result = await executeGovernedTemplateCommand(
      {
        command: "execute",
        flags: {
          template: "app_builder_complete",
          role: "BUILDER",
          endpoint: "http://localhost:3000",
          input: "{\"appName\":\"TaskFlow\"}",
        },
        positional: [],
      },
      async (url, init) => {
        expect(url).toBe("http://localhost:3000/api/execute");
        expect(JSON.parse(init.body)).toMatchObject({
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
      },
    );

    expect(result.success).toBe(true);
    expect(() => JSON.parse(result.message)).not.toThrow();
    expect(JSON.parse(result.message)).toMatchObject({
      templateId: "app_builder_complete",
      requestedRole: "BUILDER",
      workflowId: "workflow.product.create_product_brief.v1",
    });
  });

  it("supports the async GovernanceCLI runner", async () => {
    const cli = new GovernanceCLI();
    const result = await cli.runAsync(["execute"]);
    expect(result.success).toBe(false);
    expect(result.message).toContain("--template");
  });
});
