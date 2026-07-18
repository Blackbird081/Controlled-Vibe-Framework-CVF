import {
  evaluateMemoryEventHook,
  type MemoryEventHookEvaluation,
  type MemoryEventHookPolicyDecision,
} from "./memory-event-hooks";
import {
  packageMemoryContext,
  type MemoryContextBlock,
  type MemoryContextItem,
} from "./memory-context-packager";
import {
  evaluateMemoryGatewayRequest,
  type MemoryGatewayDecision,
  type MemoryGatewayPolicyDecision,
  type MemoryGatewayRiskLevel,
} from "./controlled-memory-gateway";
import {
  evaluateRetrievalRequest,
  type MemoryRetrievalCandidate,
  type MemoryRetrievalMethod,
  type MemoryRetrievalPolicyOptions,
  type MemoryRetrievalResult,
} from "./memory-retrieval-policy";
import type { RuntimeMemoryActorRole } from "./runtime-memory-hierarchy";

export const MEMORY_RUNTIME_WORKFLOW_CHAIN_VERSION =
  "cvf.memoryRuntimeWorkflowChain.mkg5.t1.v1";

export type MemoryRuntimeWorkflowStatus = "packaged" | "denied" | "deferred";

export interface MemoryRuntimeWorkflowInput {
  operationId: string;
  sessionId: string;
  projectId: string;
  actorId: string;
  actorRole: RuntimeMemoryActorRole;
  scope: string;
  memoryScope?: "session" | "project" | "organization" | "global";
  riskLevel: MemoryGatewayRiskLevel;
  query: string;
  retrievalMethod?: MemoryRetrievalMethod;
  tokenBudget: number;
  candidates: readonly MemoryRetrievalCandidate[];
  policyDecision?: MemoryGatewayPolicyDecision;
  containsSensitiveData?: boolean;
  maxResults?: number;
}

export interface MemoryRuntimeWorkflowResult {
  contractVersion: typeof MEMORY_RUNTIME_WORKFLOW_CHAIN_VERSION;
  status: MemoryRuntimeWorkflowStatus;
  reason: string;
  retrievalEvent: MemoryEventHookEvaluation;
  gatewayDecision: MemoryGatewayDecision;
  retrievalResult?: MemoryRetrievalResult;
  contextBlock?: MemoryContextBlock;
  contextEvent?: MemoryEventHookEvaluation;
  sourceMemoryIds: readonly string[];
  excludedMemory: readonly { id: string; reason: string }[];
  rawMemoryReleased: false;
  canReinject: false;
}

function estimateSummaryTokens(summary: string): number {
  return Math.max(1, Math.ceil(summary.trim().split(/\s+/).filter(Boolean).length * 1.4));
}

function toContextItem(candidate: MemoryRetrievalCandidate): MemoryContextItem {
  return {
    id: candidate.id,
    summary: candidate.summary,
    scope: candidate.scope,
    constraints: [
      "summary_only",
      "no_raw_memory_release",
      "no_prompt_reinjection_authorized",
    ],
    tokenEstimate: estimateSummaryTokens(candidate.summary),
  };
}

function candidateIds(candidates: readonly MemoryRetrievalCandidate[]): string[] {
  return candidates.map((candidate) => candidate.id);
}

function toEventPolicyDecision(
  decision: MemoryGatewayPolicyDecision | undefined,
): MemoryEventHookPolicyDecision {
  if (decision === "deny") return "deny";
  if (decision === "require_human_approval") return "require_human_approval";
  if (decision === "allow_limited") return "allow_limited";
  return "allow";
}

export function runMemoryRuntimeWorkflowChain(
  input: MemoryRuntimeWorkflowInput,
  options: MemoryRetrievalPolicyOptions = {},
): MemoryRuntimeWorkflowResult {
  const ids = candidateIds(input.candidates);
  const eventPolicyDecision = toEventPolicyDecision(input.policyDecision);
  const retrievalEvent = evaluateMemoryEventHook({
    eventId: `${input.operationId}:memory_retrieval_request`,
    sessionId: input.sessionId,
    actorId: input.actorId,
    projectId: input.projectId,
    eventType: "memory_retrieval_request",
    riskLevel: input.riskLevel,
    policyDecision: eventPolicyDecision,
    memoryIds: ids,
    containsSensitiveData: input.containsSensitiveData,
  });

  const gatewayDecision = evaluateMemoryGatewayRequest({
    operationId: input.operationId,
    operation: "retrieve",
    actorId: input.actorId,
    projectId: input.projectId,
    sessionId: input.sessionId,
    memoryScope: input.memoryScope ?? "project",
    riskLevel: input.riskLevel,
    policyDecision: eventPolicyDecision,
    containsSensitiveData: input.containsSensitiveData,
    memoryIds: ids,
    query: input.query,
  });

  if (!retrievalEvent.allowed || !gatewayDecision.allowed) {
    const reason = !retrievalEvent.allowed ? retrievalEvent.reason : gatewayDecision.reason;
    return {
      contractVersion: MEMORY_RUNTIME_WORKFLOW_CHAIN_VERSION,
      status: "denied",
      reason,
      retrievalEvent,
      gatewayDecision,
      sourceMemoryIds: [],
      excludedMemory: ids.map((id) => ({ id, reason })),
      rawMemoryReleased: false,
      canReinject: false,
    };
  }

  const retrievalResult = evaluateRetrievalRequest({
    method: input.retrievalMethod ?? "keyword",
    query: input.query,
    scope: input.scope,
    actorAuthorized: gatewayDecision.allowed,
    candidates: input.candidates,
    maxResults: input.maxResults,
  }, options);

  if (retrievalResult.status !== "allowed") {
    return {
      contractVersion: MEMORY_RUNTIME_WORKFLOW_CHAIN_VERSION,
      status: retrievalResult.status,
      reason: retrievalResult.reason,
      retrievalEvent,
      gatewayDecision,
      retrievalResult,
      sourceMemoryIds: [],
      excludedMemory: retrievalResult.excluded,
      rawMemoryReleased: false,
      canReinject: false,
    };
  }

  const contextBlock = packageMemoryContext({
    purpose: input.query,
    scope: input.scope,
    riskLevel: input.riskLevel,
    approvedMemory: retrievalResult.selected.map(toContextItem),
    excludedMemory: retrievalResult.excluded,
    policyDecision: gatewayDecision.decision,
    tokenBudget: input.tokenBudget,
  });

  const contextEvent = evaluateMemoryEventHook({
    eventId: `${input.operationId}:memory_context_packaged`,
    sessionId: input.sessionId,
    actorId: input.actorId,
    projectId: input.projectId,
    eventType: "memory_context_packaged",
    riskLevel: input.riskLevel,
    policyDecision: eventPolicyDecision,
    memoryIds: contextBlock.sourceMemoryIds,
  });

  if (!contextEvent.allowed) {
    return {
      contractVersion: MEMORY_RUNTIME_WORKFLOW_CHAIN_VERSION,
      status: "denied",
      reason: contextEvent.reason,
      retrievalEvent,
      gatewayDecision,
      retrievalResult,
      contextBlock,
      contextEvent,
      sourceMemoryIds: contextBlock.sourceMemoryIds,
      excludedMemory: contextBlock.excludedMemory,
      rawMemoryReleased: false,
      canReinject: false,
    };
  }

  return {
    contractVersion: MEMORY_RUNTIME_WORKFLOW_CHAIN_VERSION,
    status: "packaged",
    reason: "memory_runtime_workflow_chain_packaged",
    retrievalEvent,
    gatewayDecision,
    retrievalResult,
    contextBlock,
    contextEvent,
    sourceMemoryIds: contextBlock.sourceMemoryIds,
    excludedMemory: contextBlock.excludedMemory,
    rawMemoryReleased: false,
    canReinject: false,
  };
}
