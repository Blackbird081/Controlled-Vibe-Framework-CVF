export const MEMORY_EVENT_HOOKS_VERSION = "cvf.memoryEventHooks.w2.v1";

export type MemoryEventHookType =
  | "session_start"
  | "user_prompt_submit"
  | "pre_tool_use"
  | "post_tool_use"
  | "post_tool_use_failure"
  | "subagent_start"
  | "subagent_stop"
  | "approval_request"
  | "approval_result"
  | "execution_result"
  | "session_end"
  | "memory_retrieval_request"
  | "memory_context_packaged";

export type DisallowedMemoryEventHookType =
  | "direct_terminal_history_capture"
  | "direct_clipboard_capture"
  | "unapproved_file_scraping"
  | "browser_history_capture"
  | "private_credential_capture"
  | "agent_private_reasoning_capture";

export type MemoryEventHookPolicyDecision =
  | "allow"
  | "allow_limited"
  | "deny"
  | "require_human_approval";

export type MemoryEventHookDecision =
  | "allow_capture"
  | "allow_context_read"
  | "allow_redacted_capture"
  | "deny"
  | "require_human_approval";

export interface MemoryEventHookInput {
  eventId: string;
  sessionId: string;
  actorId: string;
  projectId: string;
  eventType: MemoryEventHookType | DisallowedMemoryEventHookType;
  riskLevel: "R0" | "R1" | "R2" | "R3";
  policyDecision?: MemoryEventHookPolicyDecision;
  domainScope?: string;
  phaseScope?: string;
  toolName?: string;
  memoryIds?: readonly string[];
  containsSensitiveData?: boolean;
}

export interface MemoryEventHookReceipt {
  contractVersion: typeof MEMORY_EVENT_HOOKS_VERSION;
  eventId: string;
  eventType: MemoryEventHookType | DisallowedMemoryEventHookType;
  decision: MemoryEventHookDecision;
  reason: string;
  memoryIds: readonly string[];
  auditReceiptRequired: true;
  rawMemoryReleased: false;
  canReinject: false;
}

export interface MemoryEventHookEvaluation {
  contractVersion: typeof MEMORY_EVENT_HOOKS_VERSION;
  eventId: string;
  decision: MemoryEventHookDecision;
  allowed: boolean;
  reason: string;
  receipt: MemoryEventHookReceipt;
}

export const APPROVED_MEMORY_EVENT_HOOKS: readonly MemoryEventHookType[] = [
  "session_start",
  "user_prompt_submit",
  "pre_tool_use",
  "post_tool_use",
  "post_tool_use_failure",
  "subagent_start",
  "subagent_stop",
  "approval_request",
  "approval_result",
  "execution_result",
  "session_end",
  "memory_retrieval_request",
  "memory_context_packaged",
];

export const DISALLOWED_MEMORY_EVENT_HOOKS: readonly DisallowedMemoryEventHookType[] = [
  "direct_terminal_history_capture",
  "direct_clipboard_capture",
  "unapproved_file_scraping",
  "browser_history_capture",
  "private_credential_capture",
  "agent_private_reasoning_capture",
];

const REQUIRED_STRING_FIELDS = [
  "eventId",
  "sessionId",
  "actorId",
  "projectId",
] as const;

function buildEvaluation(
  input: MemoryEventHookInput,
  decision: MemoryEventHookDecision,
  reason: string,
): MemoryEventHookEvaluation {
  return {
    contractVersion: MEMORY_EVENT_HOOKS_VERSION,
    eventId: input.eventId,
    decision,
    allowed: decision === "allow_capture" ||
      decision === "allow_context_read" ||
      decision === "allow_redacted_capture",
    reason,
    receipt: {
      contractVersion: MEMORY_EVENT_HOOKS_VERSION,
      eventId: input.eventId,
      eventType: input.eventType,
      decision,
      reason,
      memoryIds: [...(input.memoryIds ?? [])],
      auditReceiptRequired: true,
      rawMemoryReleased: false,
      canReinject: false,
    },
  };
}

export function evaluateMemoryEventHook(
  input: MemoryEventHookInput,
): MemoryEventHookEvaluation {
  for (const field of REQUIRED_STRING_FIELDS) {
    if (input[field].trim().length === 0) {
      return buildEvaluation(input, "deny", `missing_required_${field}`);
    }
  }

  if (DISALLOWED_MEMORY_EVENT_HOOKS.includes(input.eventType as DisallowedMemoryEventHookType)) {
    return buildEvaluation(input, "deny", "memory_event_hook_not_approved");
  }

  if (!APPROVED_MEMORY_EVENT_HOOKS.includes(input.eventType as MemoryEventHookType)) {
    return buildEvaluation(input, "deny", "memory_event_hook_unknown");
  }

  if (input.policyDecision === "deny") {
    return buildEvaluation(input, "deny", "policy_gate_denied_memory_event");
  }

  if (input.policyDecision === "require_human_approval" || input.riskLevel === "R3") {
    return buildEvaluation(input, "require_human_approval", "memory_event_requires_human_review");
  }

  if (input.containsSensitiveData === true) {
    return buildEvaluation(input, "allow_redacted_capture", "privacy_filter_required");
  }

  if (input.eventType === "memory_retrieval_request" ||
    input.eventType === "memory_context_packaged") {
    if ((input.memoryIds ?? []).length === 0) {
      return buildEvaluation(input, "deny", "memory_ids_required_for_context_event");
    }
    return buildEvaluation(input, "allow_context_read", "memory_context_event_authorized");
  }

  return buildEvaluation(input, "allow_capture", "memory_event_capture_authorized");
}
