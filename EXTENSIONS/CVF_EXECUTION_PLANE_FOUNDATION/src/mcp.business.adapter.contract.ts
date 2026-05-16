import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

export type MCPBusinessRiskClass =
  | "READ_ONLY"
  | "LOW_RISK_WRITE"
  | "HIGH_RISK_WRITE"
  | "DESTRUCTIVE"
  | "SYSTEM_CONFIG";

export type MCPBusinessMutationType = "none" | "create" | "update" | "delete" | "system_config";
export type MCPBusinessTransport = "stdio" | "http" | "cloudflare_worker" | "remote_mcp";
export type MCPBusinessApprovalDecision = "allow" | "allow_with_receipt" | "requires_approval" | "deny";
export type MCPBusinessResultStatus = "success" | "failed" | "rejected";

export interface MCPBusinessToolContract {
  toolId: string;
  domain: string;
  action: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  defaultRisk: MCPBusinessRiskClass;
  mutationType: MCPBusinessMutationType;
  requiresApproval: boolean;
  auditRequired: boolean;
  allowedTransports: MCPBusinessTransport[];
  businessEntity?: string;
}

export interface MCPBusinessToolInvocationRequest {
  requestId: string;
  operatorId: string;
  toolId: string;
  action: string;
  input: Record<string, unknown>;
  transport: MCPBusinessTransport;
  approvalReference?: string;
  approvalReason?: string;
}

export interface MCPBusinessApprovalGateResult {
  gateId: string;
  evaluatedAt: string;
  toolId: string;
  riskClass: MCPBusinessRiskClass;
  approvalDecision: MCPBusinessApprovalDecision;
  approvalRequired: boolean;
  reason: string;
  gateHash: string;
}

export interface MCPBusinessTransportDecision {
  transportId: string;
  evaluatedAt: string;
  toolId: string;
  transport: MCPBusinessTransport;
  allowed: boolean;
  reason: string;
  transportHash: string;
}

export interface MCPBusinessExecutionReceipt {
  receiptId: string;
  requestId: string;
  toolId: string;
  action: string;
  riskClass: MCPBusinessRiskClass;
  approvalDecision: MCPBusinessApprovalDecision;
  inputHash: string;
  outputHash?: string;
  businessEntity?: string;
  mutationType: MCPBusinessMutationType;
  timestamp: string;
  operatorId: string;
  transport: MCPBusinessTransport;
  resultStatus: MCPBusinessResultStatus;
  reason: string;
}

export interface MCPBusinessAdapterResult {
  resultId: string;
  status: MCPBusinessResultStatus;
  tool?: MCPBusinessToolContract;
  approval: MCPBusinessApprovalGateResult;
  transport: MCPBusinessTransportDecision;
  receipt: MCPBusinessExecutionReceipt;
  output?: unknown;
  warnings: string[];
}

export interface MCPBusinessAdapterContractDependencies {
  now?: () => string;
}

export class MCPBusinessAdapterContract {
  private readonly now: () => string;
  private readonly registry = new Map<string, MCPBusinessToolContract>();

  constructor(dependencies: MCPBusinessAdapterContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  registerTool(contract: MCPBusinessToolContract): MCPBusinessToolContract {
    const normalized = {
      ...contract,
      allowedTransports: [...contract.allowedTransports],
    };
    this.registry.set(contract.toolId, normalized);
    return { ...normalized, allowedTransports: [...normalized.allowedTransports] };
  }

  getTool(toolId: string): MCPBusinessToolContract | undefined {
    const tool = this.registry.get(toolId);
    return tool ? { ...tool, allowedTransports: [...tool.allowedTransports] } : undefined;
  }

  listTools(): MCPBusinessToolContract[] {
    return [...this.registry.values()].map((tool) => ({
      ...tool,
      allowedTransports: [...tool.allowedTransports],
    }));
  }

  classifyRisk(tool: MCPBusinessToolContract | undefined): MCPBusinessRiskClass {
    if (!tool) return "SYSTEM_CONFIG";
    if (tool.defaultRisk === "READ_ONLY" && tool.mutationType !== "none") return "LOW_RISK_WRITE";
    if (tool.mutationType === "delete") return "DESTRUCTIVE";
    if (tool.mutationType === "system_config") return "SYSTEM_CONFIG";
    return tool.defaultRisk;
  }

  evaluateApproval(
    request: MCPBusinessToolInvocationRequest,
    tool: MCPBusinessToolContract | undefined,
  ): MCPBusinessApprovalGateResult {
    const evaluatedAt = this.now();
    const riskClass = this.classifyRisk(tool);
    const { approvalDecision, approvalRequired, reason } =
      this.deriveApprovalDecision(request, tool, riskClass);
    const gateHash = computeDeterministicHash(
      "cvf-mcp-business-approval-gate",
      evaluatedAt,
      request.requestId,
      request.toolId,
      riskClass,
      approvalDecision,
      reason,
    );

    return {
      gateId: computeDeterministicHash("cvf-mcp-business-approval-gate-id", gateHash, evaluatedAt),
      evaluatedAt,
      toolId: request.toolId,
      riskClass,
      approvalDecision,
      approvalRequired,
      reason,
      gateHash,
    };
  }

  evaluateTransport(
    request: MCPBusinessToolInvocationRequest,
    tool: MCPBusinessToolContract | undefined,
  ): MCPBusinessTransportDecision {
    const evaluatedAt = this.now();
    const allowed = tool?.allowedTransports.includes(request.transport) === true;
    const reason = !tool
      ? "tool is not registered"
      : allowed
        ? "transport is allowed by tool contract"
        : "transport is not allowed by tool contract";
    const transportHash = computeDeterministicHash(
      "cvf-mcp-business-transport",
      evaluatedAt,
      request.requestId,
      request.toolId,
      request.transport,
      String(allowed),
      reason,
    );

    return {
      transportId: computeDeterministicHash("cvf-mcp-business-transport-id", transportHash, evaluatedAt),
      evaluatedAt,
      toolId: request.toolId,
      transport: request.transport,
      allowed,
      reason,
      transportHash,
    };
  }

  execute(
    request: MCPBusinessToolInvocationRequest,
    output: unknown,
    resultStatus: MCPBusinessResultStatus = "success",
  ): MCPBusinessAdapterResult {
    const tool = this.getTool(request.toolId);
    const approval = this.evaluateApproval(request, tool);
    const transport = this.evaluateTransport(request, tool);
    const rejected = approval.approvalDecision === "deny"
      || approval.approvalDecision === "requires_approval"
      || !transport.allowed;
    const status: MCPBusinessResultStatus = rejected ? "rejected" : resultStatus;
    const reason = rejected
      ? [approval.reason, transport.reason].filter(Boolean).join("; ")
      : "business MCP invocation passed contract, approval, and transport policy";
    const receipt = this.createReceipt(request, tool, approval, status, reason, rejected ? undefined : output);
    const resultId = computeDeterministicHash(
      "cvf-mcp-business-adapter-result",
      receipt.receiptId,
      approval.gateHash,
      transport.transportHash,
      status,
    );

    return {
      resultId,
      status,
      tool,
      approval,
      transport,
      receipt,
      output: rejected ? undefined : output,
      warnings: rejected ? [reason] : [],
    };
  }

  private deriveApprovalDecision(
    request: MCPBusinessToolInvocationRequest,
    tool: MCPBusinessToolContract | undefined,
    riskClass: MCPBusinessRiskClass,
  ): { approvalDecision: MCPBusinessApprovalDecision; approvalRequired: boolean; reason: string } {
    if (!tool) {
      return { approvalDecision: "deny", approvalRequired: false, reason: "tool is not registered" };
    }
    if (!tool.auditRequired) {
      return { approvalDecision: "deny", approvalRequired: false, reason: "tool contract must require audit receipt" };
    }
    if (request.action !== tool.action) {
      return { approvalDecision: "deny", approvalRequired: false, reason: "requested action does not match tool contract" };
    }
    if (riskClass === "READ_ONLY") {
      return { approvalDecision: "allow", approvalRequired: false, reason: "read-only business tool allowed" };
    }
    if (riskClass === "LOW_RISK_WRITE" && !tool.requiresApproval) {
      return { approvalDecision: "allow_with_receipt", approvalRequired: false, reason: "low-risk write allowed with receipt" };
    }
    if (riskClass === "HIGH_RISK_WRITE") {
      if (!request.approvalReference) {
        return { approvalDecision: "requires_approval", approvalRequired: true, reason: "high-risk business mutation requires approval" };
      }
      return { approvalDecision: "allow_with_receipt", approvalRequired: true, reason: "high-risk business mutation approved" };
    }
    if (riskClass === "DESTRUCTIVE") {
      if (!request.approvalReference || !request.approvalReason) {
        return { approvalDecision: "requires_approval", approvalRequired: true, reason: "destructive business mutation requires approval and reason" };
      }
      return { approvalDecision: "allow_with_receipt", approvalRequired: true, reason: "destructive business mutation explicitly approved" };
    }
    if (!request.approvalReference) {
      return { approvalDecision: "requires_approval", approvalRequired: true, reason: "system configuration tool requires admin approval" };
    }
    return { approvalDecision: "allow_with_receipt", approvalRequired: true, reason: "system configuration tool approved" };
  }

  private createReceipt(
    request: MCPBusinessToolInvocationRequest,
    tool: MCPBusinessToolContract | undefined,
    approval: MCPBusinessApprovalGateResult,
    resultStatus: MCPBusinessResultStatus,
    reason: string,
    output: unknown,
  ): MCPBusinessExecutionReceipt {
    const timestamp = this.now();
    const inputHash = hashPayload("input", request.input);
    const outputHash = output === undefined ? undefined : hashPayload("output", output);
    const mutationType = tool?.mutationType ?? "system_config";
    const seed = [
      timestamp,
      request.requestId,
      request.toolId,
      approval.gateHash,
      inputHash,
      outputHash ?? "no-output",
      resultStatus,
    ].join(":");

    return {
      receiptId: computeDeterministicHash("cvf-mcp-business-receipt-id", seed),
      requestId: request.requestId,
      toolId: request.toolId,
      action: request.action,
      riskClass: approval.riskClass,
      approvalDecision: approval.approvalDecision,
      inputHash,
      outputHash,
      businessEntity: tool?.businessEntity,
      mutationType,
      timestamp,
      operatorId: request.operatorId,
      transport: request.transport,
      resultStatus,
      reason,
    };
  }
}

export function createMCPBusinessAdapterContract(
  dependencies?: MCPBusinessAdapterContractDependencies,
): MCPBusinessAdapterContract {
  return new MCPBusinessAdapterContract(dependencies);
}

function hashPayload(label: string, value: unknown): string {
  return computeDeterministicHash("cvf-mcp-business-payload", label, stableStringify(value));
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
