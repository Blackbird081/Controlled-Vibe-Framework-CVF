import { describe, expect, it } from "vitest";

import {
  ToolCallTraceContract,
  createToolCallTraceContract,
} from "../src/tool.call.trace.contract";
import type {
  ToolCallTraceRequest,
  ToolTracePolicyDecision,
} from "../src/tool.call.trace.contract";

const FIXED_NOW = "2026-05-16T10:00:00.000Z";
const fixedNow = () => FIXED_NOW;

function makeRequest(overrides: Partial<ToolCallTraceRequest> = {}): ToolCallTraceRequest {
  return {
    sessionId: "session-1",
    agentId: "agent-1",
    toolName: "mcp.search",
    toolKind: "mcp",
    arguments: {
      query: "pricing research",
      apiKey: "secret-key-value",
      nested: {
        token: "nested-token-value",
        publicValue: "visible",
      },
    },
    riskLevel: "medium",
    permissionRequest: {
      domain: "mcp",
      requestedLevel: "read",
      target: "mcp.search",
      reason: "retrieve external context",
    },
    ...overrides,
  };
}

function allowPolicy(overrides: Partial<ToolTracePolicyDecision> = {}): ToolTracePolicyDecision {
  return {
    decision: "allow",
    policyId: "policy-allow-readonly-mcp",
    reason: "Registered MCP read-only tool is allowed.",
    ...overrides,
  };
}

describe("ToolCallTraceContract.openCall", () => {
  it("defaults to deny when no policy decision is supplied", () => {
    const contract = new ToolCallTraceContract({ now: fixedNow });

    const trace = contract.openCall(makeRequest());

    expect(trace.decision).toBe("deny");
    expect(trace.status).toBe("blocked");
    expect(trace.policyId).toBe("cvf-default-deny");
    expect(trace.events.map((event) => event.eventType)).toEqual([
      "tool_call",
      "policy_check",
      "tool_blocked",
      "audit_receipt",
    ]);
    expect(trace.receipt?.status).toBe("blocked");
  });

  it("blocks explicit deny decisions and emits a receipt", () => {
    const contract = new ToolCallTraceContract({ now: fixedNow });

    const trace = contract.openCall(makeRequest(), {
      decision: "deny",
      policyId: "policy-deny-secret-access",
      reason: "Tool requested a forbidden target.",
    });

    expect(trace.status).toBe("blocked");
    expect(trace.receipt?.policyDecision).toBe("deny");
    expect(trace.receipt?.summary).toContain("policy-deny-secret-access");
  });

  it("treats approval-required decisions as blocked before execution", () => {
    const contract = new ToolCallTraceContract({ now: fixedNow });

    const trace = contract.openCall(makeRequest(), {
      decision: "requires_approval",
      policyId: "policy-approval-shell",
      reason: "Human approval required.",
      approvalId: "approval-1",
    });

    expect(trace.status).toBe("blocked");
    expect(trace.receipt?.policyDecision).toBe("requires_approval");
    expect(() => contract.start(trace.traceId)).toThrow(/cannot start/);
  });

  it("redacts sensitive arguments while preserving a deterministic argument hash", () => {
    const contract = new ToolCallTraceContract({ now: fixedNow });
    const request = makeRequest();

    const traceA = contract.openCall(request, allowPolicy());
    const traceB = contract.openCall(request, allowPolicy());
    const serialized = JSON.stringify(traceA);

    expect(traceA.argumentsHash).toBe(traceB.argumentsHash);
    expect(traceA.redactedArguments.apiKey).toBe("[REDACTED]");
    expect((traceA.redactedArguments.nested as Record<string, unknown>).token).toBe("[REDACTED]");
    expect((traceA.redactedArguments.nested as Record<string, unknown>).publicValue).toBe("visible");
    expect(serialized).not.toContain("secret-key-value");
    expect(serialized).not.toContain("nested-token-value");
  });
});

describe("ToolCallTraceContract lifecycle", () => {
  it("records allow -> start -> success -> audit receipt lifecycle", () => {
    const contract = new ToolCallTraceContract({ now: fixedNow });
    const opened = contract.openCall(makeRequest(), allowPolicy());

    const running = contract.start(opened.traceId);
    const completed = contract.complete(opened.traceId, {
      summary: "result visible",
      password: "result-secret",
    });

    expect(running.status).toBe("running");
    expect(completed.status).toBe("success");
    expect(completed.receipt?.status).toBe("success");
    expect(completed.receipt?.resultHash).toBeDefined();
    expect(completed.events.map((event) => event.eventType)).toEqual([
      "tool_call",
      "policy_check",
      "tool_start",
      "tool_end",
      "audit_receipt",
    ]);
    expect(JSON.stringify(completed)).not.toContain("result-secret");
  });

  it("records tool errors as auditable failed traces", () => {
    const contract = new ToolCallTraceContract({ now: fixedNow });
    const opened = contract.openCall(makeRequest(), allowPolicy());

    contract.start(opened.traceId);
    const failed = contract.fail(opened.traceId, {
      message: "tool crashed",
      credential: "error-secret",
    });

    expect(failed.status).toBe("error");
    expect(failed.receipt?.status).toBe("error");
    expect(failed.receipt?.errorHash).toBeDefined();
    expect(failed.events.map((event) => event.eventType)).toEqual([
      "tool_call",
      "policy_check",
      "tool_start",
      "tool_error",
      "audit_receipt",
    ]);
    expect(JSON.stringify(failed)).not.toContain("error-secret");
  });

  it("requires sandbox for high-risk or mutating local actions", () => {
    const contract = new ToolCallTraceContract({ now: fixedNow });

    const highRisk = contract.openCall(
      makeRequest({
        toolName: "shell.exec",
        toolKind: "local",
        riskLevel: "high",
        permissionRequest: {
          domain: "shell",
          requestedLevel: "execute",
          target: "npm install",
          reason: "install dependency",
        },
      }),
      allowPolicy({ policyId: "policy-allow-sandboxed-shell" }),
    );

    expect(highRisk.sandboxRequired).toBe(true);
    expect(highRisk.receipt).toBeUndefined();
    const completed = contract.complete(contract.start(highRisk.traceId).traceId, { ok: true });
    expect(completed.receipt?.sandboxRequired).toBe(true);
  });

  it("factory returns a working contract", () => {
    const contract = createToolCallTraceContract({ now: fixedNow });

    const trace = contract.openCall(makeRequest(), allowPolicy());

    expect(trace.status).toBe("pending");
    expect(contract.getTrace(trace.traceId)?.traceId).toBe(trace.traceId);
    expect(contract.listEvents(trace.traceId)).toHaveLength(2);
  });
});
