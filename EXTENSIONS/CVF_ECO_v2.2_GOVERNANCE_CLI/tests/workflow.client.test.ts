import { describe, it, expect, vi } from "vitest";
import {
  executeWorkflowChain,
  CLI_WORKFLOW_TEMPLATES,
  WORKFLOW_CHAIN_CONTRACT,
  WorkflowChainResult,
} from "../src/workflow.client";
import type { FetchLike } from "../src/execute.client";

function makeMockFetch(outputText = "agent output"): FetchLike {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    text: async () =>
      JSON.stringify({
        success: true,
        governanceEvidenceReceipt: {
          receiptId: "rcpt-test-001",
          decision: "ALLOW",
          output: outputText,
        },
      }),
  });
}

function makeFailFetch(status = 500): FetchLike {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    text: async () => JSON.stringify({ success: false, error: "provider error" }),
  });
}

describe("executeWorkflowChain", () => {
  it("returns correct contract version", async () => {
    const result = await executeWorkflowChain("fullCycle", "{}", {
      endpoint: "http://localhost:3000",
      receipt: false,
      verbose: false,
      fetchFn: makeMockFetch("step output"),
    });
    expect(result.contractVersion).toBe(WORKFLOW_CHAIN_CONTRACT);
  });

  it("runs all steps for fullCycle template", async () => {
    const fetch = makeMockFetch("step output");
    const result = await executeWorkflowChain("fullCycle", "{}", {
      endpoint: "http://localhost:3000",
      receipt: true,
      verbose: false,
      fetchFn: fetch,
    });
    expect(result.success).toBe(true);
    expect(result.steps.length).toBe(CLI_WORKFLOW_TEMPLATES.fullCycle.length);
    expect(result.totalSteps).toBe(CLI_WORKFLOW_TEMPLATES.fullCycle.length);
  });

  it("chains output of step N as input to step N+1", async () => {
    let callCount = 0;
    const fetch: FetchLike = vi.fn().mockImplementation(async (_url, init) => {
      callCount++;
      const body = JSON.parse(init.body as string) as { intent?: string };
      const outputForStep = `output-step-${callCount}`;
      return {
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            success: true,
            governanceEvidenceReceipt: { receiptId: `rcpt-${callCount}`, decision: "ALLOW", output: outputForStep },
          }),
      };
    });

    const result = await executeWorkflowChain("buildReview", '{"intent":"start"}', {
      endpoint: "http://localhost:3000",
      receipt: true,
      verbose: false,
      fetchFn: fetch,
    });

    expect(result.success).toBe(true);
    expect(result.steps.length).toBe(2);
    // Step 2 input should be step 1 output
    expect(result.steps[1].input).toBe("output-step-1");
    expect(result.finalOutput).toBe("output-step-2");
  });

  it("each step has receipt when receipt flag is true", async () => {
    const result = await executeWorkflowChain("quickBuild", "{}", {
      endpoint: "http://localhost:3000",
      receipt: true,
      verbose: false,
      fetchFn: makeMockFetch("my output"),
    });
    expect(result.success).toBe(true);
    expect(result.steps[0].receipt).toBeDefined();
    expect((result.steps[0].receipt as { decision: string }).decision).toBe("ALLOW");
  });

  it("stops and returns failure when a step fails", async () => {
    const result = await executeWorkflowChain("buildReview", "{}", {
      endpoint: "http://localhost:3000",
      receipt: false,
      verbose: false,
      fetchFn: makeFailFetch(500),
    });
    expect(result.success).toBe(false);
    expect(result.steps.length).toBe(1);
    expect(result.steps[0].success).toBe(false);
    expect(result.error).toContain("failed");
  });

  it("returns error for unknown template key", async () => {
    const result = await executeWorkflowChain("nonExistent", "{}", {
      endpoint: "http://localhost:3000",
      receipt: false,
      verbose: false,
      fetchFn: makeMockFetch(),
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("Unknown workflow template");
    expect(result.steps.length).toBe(0);
  });

  it("uses per-role provider from providers map", async () => {
    const capturedBodies: string[] = [];
    const fetch: FetchLike = vi.fn().mockImplementation(async (_url, init) => {
      capturedBodies.push(init.body as string);
      return {
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({ success: true, governanceEvidenceReceipt: { output: "ok" } }),
      };
    });

    await executeWorkflowChain("quickBuild", "{}", {
      endpoint: "http://localhost:3000",
      receipt: false,
      verbose: false,
      providers: { ai_agent: "deepseek" },
      fetchFn: fetch,
    });

    // The payload for the AI_AGENT step should have provider=deepseek
    expect(capturedBodies.length).toBeGreaterThan(0);
    const body = JSON.parse(capturedBodies[0]) as { provider?: string };
    expect(body.provider).toBe("deepseek");
  });

  it("CLI_WORKFLOW_TEMPLATES has expected keys", () => {
    expect(CLI_WORKFLOW_TEMPLATES).toHaveProperty("fullCycle");
    expect(CLI_WORKFLOW_TEMPLATES).toHaveProperty("designOnly");
    expect(CLI_WORKFLOW_TEMPLATES).toHaveProperty("buildReview");
    expect(CLI_WORKFLOW_TEMPLATES).toHaveProperty("quickBuild");
    expect(CLI_WORKFLOW_TEMPLATES.fullCycle.length).toBe(4);
    expect(CLI_WORKFLOW_TEMPLATES.buildReview.length).toBe(2);
  });
});
