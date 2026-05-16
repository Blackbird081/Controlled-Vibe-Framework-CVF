import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

export type ToolTraceDecision = "allow" | "deny" | "requires_approval";
export type ToolTraceStatus = "blocked" | "pending" | "running" | "success" | "error";
export type ToolTraceRiskLevel = "low" | "medium" | "high" | "critical";
export type ToolTracePermissionLevel = "none" | "read" | "write" | "execute" | "admin";
export type ToolTraceDomain =
  | "filesystem"
  | "shell"
  | "network"
  | "browser"
  | "mcp"
  | "memory"
  | "scheduler"
  | "provider"
  | "clipboard"
  | "environment";

export type ToolTraceEventType =
  | "tool_call"
  | "policy_check"
  | "tool_start"
  | "tool_end"
  | "tool_error"
  | "tool_blocked"
  | "audit_receipt";

export interface ToolTracePermissionRequest {
  domain: ToolTraceDomain;
  requestedLevel: ToolTracePermissionLevel;
  target: string;
  reason: string;
}

export interface ToolTracePolicyDecision {
  decision: ToolTraceDecision;
  policyId: string;
  reason: string;
  allowedPermissions?: ToolTracePermissionRequest[];
  requiresSandbox?: boolean;
  approvalId?: string;
  expiresAt?: string;
}

export interface ToolCallTraceRequest {
  sessionId: string;
  agentId: string;
  toolName: string;
  toolKind: "local" | "mcp" | "provider" | "browser" | "scheduler";
  arguments: Record<string, unknown>;
  riskLevel: ToolTraceRiskLevel;
  permissionRequest: ToolTracePermissionRequest;
  correlationId?: string;
}

export interface ToolCallTraceEvent {
  eventId: string;
  traceId: string;
  eventType: ToolTraceEventType;
  sessionId: string;
  agentId: string;
  toolName: string;
  occurredAt: string;
  riskLevel: ToolTraceRiskLevel;
  status: ToolTraceStatus;
  decision: ToolTraceDecision;
  metadata: Record<string, unknown>;
}

export interface ToolTraceAuditReceipt {
  auditReceiptId: string;
  traceId: string;
  sourceEventIds: string[];
  sessionId: string;
  agentId: string;
  toolName: string;
  riskLevel: ToolTraceRiskLevel;
  policyDecision: ToolTraceDecision;
  status: ToolTraceStatus;
  sandboxRequired: boolean;
  permissionDomain: ToolTraceDomain;
  permissionLevel: ToolTracePermissionLevel;
  summary: string;
  argumentsHash: string;
  resultHash?: string;
  errorHash?: string;
  createdAt: string;
}

export interface ToolCallTraceRecord {
  traceId: string;
  sessionId: string;
  agentId: string;
  toolName: string;
  toolKind: ToolCallTraceRequest["toolKind"];
  riskLevel: ToolTraceRiskLevel;
  status: ToolTraceStatus;
  decision: ToolTraceDecision;
  argumentsHash: string;
  redactedArguments: Record<string, unknown>;
  permissionRequest: ToolTracePermissionRequest;
  sandboxRequired: boolean;
  policyId: string;
  policyReason: string;
  events: ToolCallTraceEvent[];
  receipt?: ToolTraceAuditReceipt;
}

export interface ToolCallTraceContractDependencies {
  now?: () => string;
  idPrefix?: string;
}

const SENSITIVE_KEY_PATTERN = /(api[_-]?key|token|secret|password|credential|authorization|cookie|session[_-]?key)/i;
const REDACTED = "[REDACTED]";

export class ToolCallTraceContract {
  private readonly now: () => string;
  private readonly idPrefix: string;
  private readonly traces = new Map<string, ToolCallTraceRecord>();

  constructor(dependencies: ToolCallTraceContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.idPrefix = dependencies.idPrefix ?? "cvf-tool-trace";
  }

  openCall(request: ToolCallTraceRequest, policy?: ToolTracePolicyDecision): ToolCallTraceRecord {
    const openedAt = this.now();
    const effectivePolicy = policy ?? this.defaultDenyPolicy(request);
    const argumentsHash = hashPayload("arguments", request.arguments);
    const traceId = this.makeId("trace", openedAt, request.sessionId, request.agentId, request.toolName, argumentsHash);
    const sandboxRequired = this.requiresSandbox(request, effectivePolicy);
    const initialStatus: ToolTraceStatus = effectivePolicy.decision === "allow" ? "pending" : "blocked";

    const baseRecord: ToolCallTraceRecord = {
      traceId,
      sessionId: request.sessionId,
      agentId: request.agentId,
      toolName: request.toolName,
      toolKind: request.toolKind,
      riskLevel: request.riskLevel,
      status: initialStatus,
      decision: effectivePolicy.decision,
      argumentsHash,
      redactedArguments: redactRecord(request.arguments),
      permissionRequest: request.permissionRequest,
      sandboxRequired,
      policyId: effectivePolicy.policyId,
      policyReason: effectivePolicy.reason,
      events: [],
    };

    baseRecord.events.push(
      this.buildEvent(baseRecord, "tool_call", initialStatus, {
        toolKind: request.toolKind,
        argumentsHash,
        redactedArguments: baseRecord.redactedArguments,
        correlationId: request.correlationId ?? null,
      }),
      this.buildEvent(baseRecord, "policy_check", initialStatus, {
        policyId: effectivePolicy.policyId,
        policyReason: effectivePolicy.reason,
        approvalId: effectivePolicy.approvalId ?? null,
        expiresAt: effectivePolicy.expiresAt ?? null,
        sandboxRequired,
        permissionRequest: request.permissionRequest,
      }),
    );

    if (effectivePolicy.decision !== "allow") {
      baseRecord.events.push(
        this.buildEvent(baseRecord, "tool_blocked", "blocked", {
          blockReason: effectivePolicy.reason,
          decision: effectivePolicy.decision,
        }),
      );
      baseRecord.receipt = this.buildReceipt(baseRecord, "blocked", {
        summary: this.summaryFor(baseRecord, "blocked"),
      });
      baseRecord.events.push(this.receiptEvent(baseRecord, baseRecord.receipt));
    }

    this.traces.set(traceId, baseRecord);
    return cloneTraceRecord(baseRecord);
  }

  start(traceId: string): ToolCallTraceRecord {
    const record = this.requireMutableTrace(traceId);
    if (record.decision !== "allow") {
      throw new Error(`tool trace ${traceId} cannot start because policy decision is ${record.decision}`);
    }
    if (record.status !== "pending") {
      throw new Error(`tool trace ${traceId} cannot start from status ${record.status}`);
    }

    record.status = "running";
    record.events.push(this.buildEvent(record, "tool_start", "running", {
      sandboxRequired: record.sandboxRequired,
      permissionDomain: record.permissionRequest.domain,
      permissionLevel: record.permissionRequest.requestedLevel,
    }));

    return cloneTraceRecord(record);
  }

  complete(traceId: string, result: unknown): ToolCallTraceRecord {
    const record = this.requireMutableTrace(traceId);
    if (record.status !== "running") {
      throw new Error(`tool trace ${traceId} cannot complete from status ${record.status}`);
    }

    record.status = "success";
    const resultHash = hashPayload("result", result);
    record.events.push(this.buildEvent(record, "tool_end", "success", {
      resultHash,
      redactedResult: redactValue(result),
    }));
    record.receipt = this.buildReceipt(record, "success", {
      resultHash,
      summary: this.summaryFor(record, "success"),
    });
    record.events.push(this.receiptEvent(record, record.receipt));

    return cloneTraceRecord(record);
  }

  fail(traceId: string, error: unknown): ToolCallTraceRecord {
    const record = this.requireMutableTrace(traceId);
    if (record.status !== "running") {
      throw new Error(`tool trace ${traceId} cannot fail from status ${record.status}`);
    }

    record.status = "error";
    const errorHash = hashPayload("error", error);
    record.events.push(this.buildEvent(record, "tool_error", "error", {
      errorHash,
      redactedError: redactValue(error),
    }));
    record.receipt = this.buildReceipt(record, "error", {
      errorHash,
      summary: this.summaryFor(record, "error"),
    });
    record.events.push(this.receiptEvent(record, record.receipt));

    return cloneTraceRecord(record);
  }

  getTrace(traceId: string): ToolCallTraceRecord | undefined {
    const record = this.traces.get(traceId);
    return record ? cloneTraceRecord(record) : undefined;
  }

  listEvents(traceId: string): ToolCallTraceEvent[] {
    return this.requireMutableTrace(traceId).events.map(cloneEvent);
  }

  private defaultDenyPolicy(request: ToolCallTraceRequest): ToolTracePolicyDecision {
    return {
      decision: "deny",
      policyId: "cvf-default-deny",
      reason: `No explicit policy decision supplied for ${request.toolName}; local execution is deny-by-default.`,
    };
  }

  private requiresSandbox(
    request: ToolCallTraceRequest,
    policy: ToolTracePolicyDecision,
  ): boolean {
    if (policy.requiresSandbox === true) return true;
    if (request.riskLevel === "high" || request.riskLevel === "critical") return true;
    if (request.permissionRequest.domain === "mcp" && request.permissionRequest.requestedLevel !== "read") return true;
    if (request.permissionRequest.domain === "shell" || request.permissionRequest.domain === "filesystem") {
      return request.permissionRequest.requestedLevel === "write"
        || request.permissionRequest.requestedLevel === "execute"
        || request.permissionRequest.requestedLevel === "admin";
    }
    return false;
  }

  private buildEvent(
    record: ToolCallTraceRecord,
    eventType: ToolTraceEventType,
    status: ToolTraceStatus,
    metadata: Record<string, unknown>,
  ): ToolCallTraceEvent {
    const occurredAt = this.now();
    return {
      eventId: this.makeId("event", occurredAt, record.traceId, eventType, String(record.events.length)),
      traceId: record.traceId,
      eventType,
      sessionId: record.sessionId,
      agentId: record.agentId,
      toolName: record.toolName,
      occurredAt,
      riskLevel: record.riskLevel,
      status,
      decision: record.decision,
      metadata: redactRecord(metadata),
    };
  }

  private receiptEvent(record: ToolCallTraceRecord, receipt: ToolTraceAuditReceipt): ToolCallTraceEvent {
    return this.buildEvent(record, "audit_receipt", receipt.status, {
      auditReceiptId: receipt.auditReceiptId,
      sourceEventIds: receipt.sourceEventIds,
      summary: receipt.summary,
    });
  }

  private buildReceipt(
    record: ToolCallTraceRecord,
    status: ToolTraceStatus,
    options: { summary: string; resultHash?: string; errorHash?: string },
  ): ToolTraceAuditReceipt {
    const createdAt = this.now();
    const sourceEventIds = record.events.map((event) => event.eventId);
    const auditReceiptId = this.makeId("receipt", createdAt, record.traceId, status, sourceEventIds.join(":"));

    return {
      auditReceiptId,
      traceId: record.traceId,
      sourceEventIds,
      sessionId: record.sessionId,
      agentId: record.agentId,
      toolName: record.toolName,
      riskLevel: record.riskLevel,
      policyDecision: record.decision,
      status,
      sandboxRequired: record.sandboxRequired,
      permissionDomain: record.permissionRequest.domain,
      permissionLevel: record.permissionRequest.requestedLevel,
      summary: options.summary,
      argumentsHash: record.argumentsHash,
      resultHash: options.resultHash,
      errorHash: options.errorHash,
      createdAt,
    };
  }

  private summaryFor(record: ToolCallTraceRecord, status: ToolTraceStatus): string {
    if (status === "blocked") {
      return `Tool ${record.toolName} blocked by ${record.policyId}: ${record.policyReason}`;
    }
    if (status === "success") {
      return `Tool ${record.toolName} completed with policy ${record.policyId}.`;
    }
    if (status === "error") {
      return `Tool ${record.toolName} failed under policy ${record.policyId}.`;
    }
    return `Tool ${record.toolName} recorded with status ${status}.`;
  }

  private requireMutableTrace(traceId: string): ToolCallTraceRecord {
    const record = this.traces.get(traceId);
    if (!record) {
      throw new Error(`tool trace ${traceId} was not found`);
    }
    return record;
  }

  private makeId(kind: string, ...parts: string[]): string {
    return `${this.idPrefix}-${kind}-${computeDeterministicHash(this.idPrefix, kind, ...parts)}`;
  }
}

export function createToolCallTraceContract(
  dependencies?: ToolCallTraceContractDependencies,
): ToolCallTraceContract {
  return new ToolCallTraceContract(dependencies);
}

function hashPayload(label: string, value: unknown): string {
  return computeDeterministicHash("cvf-tool-call-trace-payload", label, stableStringify(value));
}

function redactRecord(record: Record<string, unknown>): Record<string, unknown> {
  return redactValue(record) as Record<string, unknown>;
}

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        key,
        SENSITIVE_KEY_PATTERN.test(key) ? REDACTED : redactValue(nested),
      ]),
    );
  }
  return value;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}

function cloneTraceRecord(record: ToolCallTraceRecord): ToolCallTraceRecord {
  return {
    ...record,
    redactedArguments: cloneRecord(record.redactedArguments),
    permissionRequest: { ...record.permissionRequest },
    events: record.events.map(cloneEvent),
    receipt: record.receipt ? { ...record.receipt, sourceEventIds: [...record.receipt.sourceEventIds] } : undefined,
  };
}

function cloneEvent(event: ToolCallTraceEvent): ToolCallTraceEvent {
  return {
    ...event,
    metadata: cloneRecord(event.metadata),
  };
}

function cloneRecord<T extends Record<string, unknown>>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
