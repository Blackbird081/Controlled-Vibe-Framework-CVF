export const CONTROLLED_MEMORY_GATEWAY_PHASE2_VERSION =
  "cvf.controlledMemoryGateway.phase2a.v1";

export type MemoryGatewayOperation =
  | "remember"
  | "observe"
  | "retrieve"
  | "reinforce"
  | "decay"
  | "forget"
  | "summarize"
  | "reinject"
  | "contradiction_check";

export type MemoryGatewayPolicyDecision =
  | "allow"
  | "allow_limited"
  | "allow_redacted"
  | "allow_summary_only"
  | "deny"
  | "require_human_approval";

export type MemoryGatewayRiskLevel = "R0" | "R1" | "R2" | "R3";

export interface MemoryGatewayRequest {
  operationId: string;
  operation: MemoryGatewayOperation;
  actorId: string;
  projectId: string;
  sessionId: string;
  memoryScope: "session" | "project" | "organization" | "global";
  riskLevel: MemoryGatewayRiskLevel;
  policyDecision: MemoryGatewayPolicyDecision;
  containsSensitiveData?: boolean;
  canReinject?: boolean;
  memoryIds?: readonly string[];
  query?: string;
}

export interface MemoryGatewayDecision {
  contractVersion: typeof CONTROLLED_MEMORY_GATEWAY_PHASE2_VERSION;
  operationId: string;
  operation: MemoryGatewayOperation;
  decision: MemoryGatewayPolicyDecision;
  allowed: boolean;
  reason: string;
  memoryIdsAffected: readonly string[];
  auditReceiptRequired: true;
  canReinject: boolean;
  rawMemoryReleased: false;
}

const REQUIRED_STRING_FIELDS = [
  "operationId",
  "actorId",
  "projectId",
  "sessionId",
] as const;

const MEMORY_ID_OPERATIONS: MemoryGatewayOperation[] = [
  "retrieve",
  "reinforce",
  "decay",
  "forget",
  "summarize",
  "reinject",
  "contradiction_check",
];

function baseDecision(
  request: MemoryGatewayRequest,
  decision: MemoryGatewayPolicyDecision,
  reason: string,
): MemoryGatewayDecision {
  return {
    contractVersion: CONTROLLED_MEMORY_GATEWAY_PHASE2_VERSION,
    operationId: request.operationId,
    operation: request.operation,
    decision,
    allowed: decision === "allow" || decision === "allow_limited" ||
      decision === "allow_redacted" || decision === "allow_summary_only",
    reason,
    memoryIdsAffected: [...(request.memoryIds ?? [])],
    auditReceiptRequired: true,
    canReinject: request.operation === "reinject" &&
      decision === "allow_summary_only" &&
      request.canReinject === true,
    rawMemoryReleased: false,
  };
}

export function evaluateMemoryGatewayRequest(
  request: MemoryGatewayRequest,
): MemoryGatewayDecision {
  for (const field of REQUIRED_STRING_FIELDS) {
    if (request[field].trim().length === 0) {
      return baseDecision(request, "deny", `missing_required_${field}`);
    }
  }

  if (request.memoryScope === "global") {
    return baseDecision(request, "deny", "global_memory_scope_not_authorized");
  }

  if (request.containsSensitiveData === true) {
    return baseDecision(request, "allow_redacted", "privacy_filter_required");
  }

  if (request.policyDecision === "deny" ||
    request.policyDecision === "require_human_approval") {
    return baseDecision(request, request.policyDecision, "policy_gate_controls_memory_operation");
  }

  if (MEMORY_ID_OPERATIONS.includes(request.operation) &&
    (request.memoryIds ?? []).length === 0) {
    return baseDecision(request, "deny", "memory_ids_required_for_operation");
  }

  if (request.operation === "reinject") {
    if (request.canReinject !== true) {
      return baseDecision(request, "deny", "memory_reinjection_not_authorized");
    }
    return baseDecision(request, "allow_summary_only", "summary_only_reinjection_authorized");
  }

  if (request.riskLevel === "R3") {
    return baseDecision(request, "require_human_approval", "high_risk_memory_requires_review");
  }

  return baseDecision(request, request.policyDecision, "controlled_memory_operation_authorized");
}
