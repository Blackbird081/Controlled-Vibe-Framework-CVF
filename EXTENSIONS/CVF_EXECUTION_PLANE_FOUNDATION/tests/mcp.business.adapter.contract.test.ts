import { describe, expect, it } from "vitest";

import {
  MCPBusinessAdapterContract,
  createMCPBusinessAdapterContract,
  type MCPBusinessCallerSuppliedApprovalEvidence,
  type MCPBusinessToolContract,
  type MCPBusinessToolInvocationRequest,
} from "../src/mcp.business.adapter.contract";

const FIXED_NOW = "2026-05-16T12:00:00.000Z";
const fixedNow = () => FIXED_NOW;

function makeApprovalEvidence(
  overrides: Partial<MCPBusinessCallerSuppliedApprovalEvidence> = {},
): MCPBusinessCallerSuppliedApprovalEvidence {
  return {
    approvalReference: "approval-1",
    boundRequestId: "request-1",
    decision: "APPROVE",
    issuedAt: "2026-05-16T11:00:00.000Z",
    expiresAt: "2026-05-16T13:00:00.000Z",
    consumed: false,
    ...overrides,
  };
}

function makeApprovalEvidenceWithMissingExpiry(): unknown {
  const { expiresAt: _expiresAt, ...evidence } = makeApprovalEvidence();
  return evidence;
}

function makeTool(overrides: Partial<MCPBusinessToolContract> = {}): MCPBusinessToolContract {
  return {
    toolId: "business.orders.read",
    domain: "orders",
    action: "read",
    inputSchema: { type: "object" },
    outputSchema: { type: "object" },
    defaultRisk: "READ_ONLY",
    mutationType: "none",
    requiresApproval: false,
    auditRequired: true,
    allowedTransports: ["stdio", "http"],
    businessEntity: "order",
    ...overrides,
  };
}

function makeRequest(overrides: Partial<MCPBusinessToolInvocationRequest> = {}): MCPBusinessToolInvocationRequest {
  return {
    requestId: "request-1",
    operatorId: "operator-1",
    toolId: "business.orders.read",
    action: "read",
    input: { orderId: "ord-1" },
    transport: "http",
    ...overrides,
  };
}

describe("MCPBusinessAdapterContract registry and risk", () => {
  it("registers and lists business MCP tool contracts", () => {
    const contract = createMCPBusinessAdapterContract({ now: fixedNow });

    contract.registerTool(makeTool());

    expect(contract.getTool("business.orders.read")?.domain).toBe("orders");
    expect(contract.listTools()).toHaveLength(1);
  });

  it("classifies delete mutations as destructive even when default risk is lower", () => {
    const contract = createMCPBusinessAdapterContract({ now: fixedNow });
    const tool = makeTool({
      toolId: "business.orders.delete",
      action: "delete",
      defaultRisk: "LOW_RISK_WRITE",
      mutationType: "delete",
    });

    expect(contract.classifyRisk(tool)).toBe("DESTRUCTIVE");
  });

  it("treats unregistered tools as system config risk and denies them", () => {
    const contract = createMCPBusinessAdapterContract({ now: fixedNow });

    const result = contract.execute(makeRequest({ toolId: "unknown.tool" }), { ok: true });

    expect(result.status).toBe("rejected");
    expect(result.approval.approvalDecision).toBe("deny");
    expect(result.receipt.riskClass).toBe("SYSTEM_CONFIG");
    expect(result.warnings[0]).toContain("tool is not registered");
  });
});

describe("MCPBusinessAdapterContract approval and transport", () => {
  it("allows read-only business tools through an allowed transport", () => {
    const contract = createMCPBusinessAdapterContract({ now: fixedNow });
    contract.registerTool(makeTool());

    const result = contract.execute(makeRequest(), { orderId: "ord-1", status: "paid" });

    expect(result.status).toBe("success");
    expect(result.approval.approvalDecision).toBe("allow");
    expect(result.transport.allowed).toBe(true);
    expect(result.receipt.outputHash).toBeDefined();
    expect(result.output).toEqual({ orderId: "ord-1", status: "paid" });
  });

  it("requires approval for high-risk business writes", () => {
    const contract = createMCPBusinessAdapterContract({ now: fixedNow });
    contract.registerTool(makeTool({
      toolId: "business.inventory.adjust",
      domain: "inventory",
      action: "adjust",
      defaultRisk: "HIGH_RISK_WRITE",
      mutationType: "update",
      requiresApproval: true,
      businessEntity: "inventory",
    }));

    const result = contract.execute(
      makeRequest({
        toolId: "business.inventory.adjust",
        action: "adjust",
        input: { sku: "sku-1", delta: -10 },
      }),
      { ok: true },
    );

    expect(result.status).toBe("rejected");
    expect(result.approval.approvalDecision).toBe("requires_approval");
    expect(result.receipt.resultStatus).toBe("rejected");
    expect(result.output).toBeUndefined();
  });

  it("allows approved high-risk writes with receipt", () => {
    const contract = createMCPBusinessAdapterContract({ now: fixedNow });
    contract.registerTool(makeTool({
      toolId: "business.inventory.adjust",
      domain: "inventory",
      action: "adjust",
      defaultRisk: "HIGH_RISK_WRITE",
      mutationType: "update",
      requiresApproval: true,
      businessEntity: "inventory",
    }));

    const result = contract.execute(
      makeRequest({
        toolId: "business.inventory.adjust",
        action: "adjust",
        input: { sku: "sku-1", delta: -10 },
        approvalReference: "approval-1",
        approvalEvidence: makeApprovalEvidence(),
      }),
      { ok: true },
    );

    expect(result.status).toBe("success");
    expect(result.approval.approvalDecision).toBe("allow_with_receipt");
    expect(result.receipt.approvalDecision).toBe("allow_with_receipt");
  });

  it("requires explicit reason for destructive mutations", () => {
    const contract = createMCPBusinessAdapterContract({ now: fixedNow });
    contract.registerTool(makeTool({
      toolId: "business.orders.delete",
      action: "delete",
      defaultRisk: "DESTRUCTIVE",
      mutationType: "delete",
      requiresApproval: true,
    }));

    const rejected = contract.execute(
      makeRequest({
        toolId: "business.orders.delete",
        action: "delete",
        approvalReference: "approval-1",
      }),
      { ok: true },
    );
    const approved = contract.execute(
      makeRequest({
        toolId: "business.orders.delete",
        action: "delete",
        approvalReference: "approval-1",
        approvalReason: "duplicate order cleanup approved by owner",
        approvalEvidence: makeApprovalEvidence(),
      }),
      { ok: true },
    );

    expect(rejected.status).toBe("rejected");
    expect(rejected.approval.reason).toContain("requires approval and reason");
    expect(approved.status).toBe("success");
  });

  it.each([
    ["bare reference", undefined],
    ["mismatched approval reference", makeApprovalEvidence({ approvalReference: "approval-2" })],
    ["mismatched request", makeApprovalEvidence({ boundRequestId: "request-2" })],
    ["non-approved decision", makeApprovalEvidence({ decision: "DENY" })],
    ["expired interval", makeApprovalEvidence({ expiresAt: FIXED_NOW })],
    ["future interval", makeApprovalEvidence({ issuedAt: "2026-05-16T12:00:00.001Z" })],
    ["reversed interval", makeApprovalEvidence({ issuedAt: "2026-05-16T14:00:00.000Z" })],
    ["malformed issued timestamp", makeApprovalEvidence({ issuedAt: "not-a-time" })],
    ["malformed expiry timestamp", makeApprovalEvidence({ expiresAt: "2026-05-16" })],
    ["invalid calendar timestamp", makeApprovalEvidence({ issuedAt: "2026-02-30T11:00:00.000Z" })],
    ["consumed evidence", makeApprovalEvidence({ consumed: true })],
  ])("fails closed for %s on an approval-required write", (_name, approvalEvidence) => {
    const contract = createMCPBusinessAdapterContract({ now: fixedNow });
    contract.registerTool(makeTool({
      toolId: "business.inventory.adjust",
      action: "adjust",
      defaultRisk: "HIGH_RISK_WRITE",
      mutationType: "update",
      requiresApproval: true,
    }));

    const result = contract.execute(makeRequest({
      toolId: "business.inventory.adjust",
      action: "adjust",
      approvalReference: "approval-1",
      approvalEvidence,
    }), { ok: true });

    expect(result.status).toBe("rejected");
    expect(result.approval.approvalDecision).toBe("requires_approval");
    expect(result.approval.reason).toContain("valid bound approval evidence");
  });

  it.each([
    ["missing field", makeApprovalEvidenceWithMissingExpiry()],
    ["unknown field", { ...makeApprovalEvidence(), extra: "metadata" }],
    ["non-object evidence", "approval-metadata"],
  ])("fails closed for %s", (_name, approvalEvidence) => {
    const contract = createMCPBusinessAdapterContract({ now: fixedNow });
    contract.registerTool(makeTool({
      toolId: "business.inventory.adjust",
      action: "adjust",
      defaultRisk: "HIGH_RISK_WRITE",
      mutationType: "update",
      requiresApproval: true,
    }));
    const result = contract.execute(makeRequest({
      toolId: "business.inventory.adjust",
      action: "adjust",
      approvalReference: "approval-1",
      approvalEvidence: approvalEvidence as MCPBusinessCallerSuppliedApprovalEvidence,
    }), { ok: true });
    expect(result.status).toBe("rejected");
    expect(result.approval.approvalDecision).toBe("requires_approval");
  });

  it.each([
    ["approval reference", {
      requestId: "request-1",
      approvalReference: "api-key-placeholder",
      approvalEvidence: makeApprovalEvidence({ approvalReference: "api-key-placeholder" }),
    }],
    ["bound request identifier", {
      requestId: "token-placeholder",
      approvalReference: "approval-1",
      approvalEvidence: makeApprovalEvidence({ boundRequestId: "token-placeholder" }),
    }],
  ])("rejects a secret-like %s even when its binding matches", (_name, identifierOverrides) => {
    const contract = createMCPBusinessAdapterContract({ now: fixedNow });
    contract.registerTool(makeTool({
      toolId: "business.inventory.adjust",
      action: "adjust",
      defaultRisk: "HIGH_RISK_WRITE",
      mutationType: "update",
      requiresApproval: true,
    }));
    const result = contract.execute(makeRequest({
      toolId: "business.inventory.adjust",
      action: "adjust",
      ...identifierOverrides,
    }), { ok: true });
    expect(result.status).toBe("rejected");
    expect(result.approval.approvalDecision).toBe("requires_approval");
  });

  it.each([
    ["destructive", makeTool({
      toolId: "business.orders.delete",
      action: "delete",
      defaultRisk: "DESTRUCTIVE",
      mutationType: "delete",
      requiresApproval: true,
    }), { toolId: "business.orders.delete", action: "delete", approvalReason: "approved cleanup" }],
    ["system configuration", makeTool({
      toolId: "business.system.configure",
      action: "configure",
      defaultRisk: "SYSTEM_CONFIG",
      mutationType: "system_config",
      requiresApproval: true,
    }), { toolId: "business.system.configure", action: "configure" }],
  ])("rejects invalid bound evidence on the %s branch", (_name, tool, requestOverride) => {
    const contract = createMCPBusinessAdapterContract({ now: fixedNow });
    contract.registerTool(tool);
    const result = contract.execute(makeRequest({
      ...requestOverride,
      approvalReference: "approval-1",
      approvalEvidence: makeApprovalEvidence({ boundRequestId: "wrong-request" }),
    }), { ok: true });
    expect(result.status).toBe("rejected");
    expect(result.approval.approvalDecision).toBe("requires_approval");
  });

  it("preserves approval-not-required behavior without supplied evidence", () => {
    const contract = createMCPBusinessAdapterContract({ now: fixedNow });
    contract.registerTool(makeTool({
      toolId: "business.orders.annotate",
      action: "annotate",
      defaultRisk: "LOW_RISK_WRITE",
      mutationType: "update",
      requiresApproval: false,
    }));
    const result = contract.execute(makeRequest({
      toolId: "business.orders.annotate",
      action: "annotate",
    }), { ok: true });
    expect(result.status).toBe("success");
    expect(result.approval.approvalDecision).toBe("allow_with_receipt");
  });

  it("accepts valid bound evidence on the system-configuration branch", () => {
    const contract = createMCPBusinessAdapterContract({ now: fixedNow });
    contract.registerTool(makeTool({
      toolId: "business.system.configure",
      action: "configure",
      defaultRisk: "SYSTEM_CONFIG",
      mutationType: "system_config",
      requiresApproval: true,
    }));
    const result = contract.execute(makeRequest({
      toolId: "business.system.configure",
      action: "configure",
      approvalReference: "approval-1",
      approvalEvidence: makeApprovalEvidence(),
    }), { ok: true });
    expect(result.status).toBe("success");
    expect(result.approval.approvalDecision).toBe("allow_with_receipt");
  });

  it("returns identical approval decisions and hashes for identical supplied evidence", () => {
    const contract = createMCPBusinessAdapterContract({ now: fixedNow });
    const tool = makeTool({
      toolId: "business.inventory.adjust",
      action: "adjust",
      defaultRisk: "HIGH_RISK_WRITE",
      mutationType: "update",
      requiresApproval: true,
    });
    contract.registerTool(tool);
    const request = makeRequest({
      toolId: tool.toolId,
      action: tool.action,
      approvalReference: "approval-1",
      approvalEvidence: makeApprovalEvidence(),
    });
    const first = contract.evaluateApproval(request, tool);
    const second = contract.evaluateApproval(request, tool);
    expect(second).toEqual(first);
  });

  it("rejects transport not declared in the tool contract", () => {
    const contract = createMCPBusinessAdapterContract({ now: fixedNow });
    contract.registerTool(makeTool({ allowedTransports: ["stdio"] }));

    const result = contract.execute(makeRequest({ transport: "remote_mcp" }), { ok: true });

    expect(result.status).toBe("rejected");
    expect(result.transport.allowed).toBe(false);
    expect(result.receipt.reason).toContain("transport is not allowed");
  });
});

describe("MCPBusinessAdapterContract receipts", () => {
  it("creates deterministic receipts for identical governed invocations", () => {
    const contract = createMCPBusinessAdapterContract({ now: fixedNow });
    contract.registerTool(makeTool());

    const r1 = contract.execute(makeRequest(), { ok: true });
    const r2 = contract.execute(makeRequest(), { ok: true });

    expect(r1.receipt.receiptId).toBe(r2.receipt.receiptId);
    expect(r1.resultId).toBe(r2.resultId);
    expect(r1.receipt.inputHash).toBeTruthy();
    expect(r1.receipt.timestamp).toBe(FIXED_NOW);
  });

  it("factory returns a working contract", () => {
    const contract = createMCPBusinessAdapterContract({ now: fixedNow });
    expect(contract).toBeInstanceOf(MCPBusinessAdapterContract);
  });
});
