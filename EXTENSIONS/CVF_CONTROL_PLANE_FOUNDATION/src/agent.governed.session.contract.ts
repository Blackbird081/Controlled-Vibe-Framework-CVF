import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { AgentDefinitionRecord } from "./agent.definition.boundary.contract";

export type AgentGovernedRiskLevel = "low" | "medium" | "high" | "critical";
export type AgentPolicyDecision = "allow" | "allow_with_constraints" | "require_approval" | "deny";
export type AgentExecutionStatus = "completed" | "failed" | "denied" | "approval_required" | "partially_completed";
export type AgentOutputType = "plan" | "patch" | "report" | "test_result" | "documentation" | "handoff";
export type AgentValidationResult = "passed" | "failed" | "skipped" | "pending";

export interface AgentToolAccessProfile {
  shell: boolean;
  network: boolean;
  testRunner: boolean;
  packageManager: boolean;
  database: boolean;
  deployment: boolean;
  secrets: boolean;
}

export interface AgentFileAccessProfile {
  read: string[];
  write: string[];
  deny: string[];
}

export interface AgentExecutionLimits {
  maxFilesChanged: number;
  maxCommands: number;
  requiresApprovalAboveRisk: AgentGovernedRiskLevel;
}

export interface AgentPermissionProfile {
  profileId: string;
  description: string;
  fileAccess: AgentFileAccessProfile;
  toolAccess: AgentToolAccessProfile;
  executionLimits: AgentExecutionLimits;
  audit: {
    commandLogRequired: boolean;
    fileDiffRequired: boolean;
    receiptRequired: boolean;
  };
}

export interface AgentGovernedActionRequest {
  sessionId: string;
  taskId: string;
  phase: string;
  requestedCapability: string;
  requestedAction: string;
  actionType: string;
  riskLevel: AgentGovernedRiskLevel;
  agent?: AgentDefinitionRecord;
  permissionProfile?: AgentPermissionProfile;
  filesRead: string[];
  filesChanged: string[];
  toolsRequested: (keyof AgentToolAccessProfile)[];
  commandCount: number;
  approvalReference?: string;
  contextPackageId?: string;
}

export interface AgentGovernedActionDecision {
  decisionId: string;
  decidedAt: string;
  sessionId: string;
  taskId: string;
  agentId?: string;
  riskLevel: AgentGovernedRiskLevel;
  policyDecision: AgentPolicyDecision;
  finalStatus: AgentExecutionStatus;
  approvalRequired: boolean;
  reasons: string[];
  deniedPaths: string[];
  deniedTools: string[];
  constraints: string[];
  decisionHash: string;
}

export interface AgentHandoffFileTouch {
  path: string;
  changeType: "read" | "created" | "modified" | "deleted";
  summary: string;
}

export interface AgentHandoffRisk {
  riskId: string;
  severity: AgentGovernedRiskLevel;
  description: string;
  recommendedAction: string;
}

export interface AgentHandoffInput {
  handoffId: string;
  sourceAgentId: string;
  targetAgentId: string;
  taskId: string;
  phase: string;
  taskSummary: string;
  currentState: string;
  actionsCompleted: string[];
  filesTouched: AgentHandoffFileTouch[];
  risksFound: AgentHandoffRisk[];
  nextRequiredAction: string;
  auditReference: {
    receiptId: string;
    traceId?: string;
  };
  policyState?: {
    policyDecision: AgentPolicyDecision;
    approvalRequired: boolean;
  };
}

export interface AgentHandoffValidation {
  validationId: string;
  validatedAt: string;
  handoffId: string;
  valid: boolean;
  reasons: string[];
  requiresApprovalStop: boolean;
  validationHash: string;
}

export interface AgentExecutionReceiptInput {
  decision: AgentGovernedActionDecision;
  outputType: AgentOutputType;
  outputSummary: string;
  outputHash?: string;
  validationRequired: boolean;
  validationResult: AgentValidationResult;
  providerName?: string;
  modelName?: string;
  tokenEstimate?: number;
  costEstimate?: number;
  handoff?: AgentHandoffValidation;
}

export interface AgentExecutionAuditReceipt {
  receiptId: string;
  traceId: string;
  sessionId: string;
  taskId: string;
  createdAt: string;
  agentId?: string;
  agentRole?: string;
  permissionProfile?: string;
  phase: string;
  actionType: string;
  requestedAction: string;
  riskLevel: AgentGovernedRiskLevel;
  policyDecision: AgentPolicyDecision;
  approvalRequired: boolean;
  approvalReference?: string;
  inputHash: string;
  contextPackageId?: string;
  filesRead: string[];
  filesChanged: string[];
  deniedPaths: string[];
  toolsRequested: string[];
  toolsDenied: string[];
  providerName?: string;
  modelName?: string;
  tokenEstimate?: number;
  costEstimate?: number;
  validationRequired: boolean;
  validationResult: AgentValidationResult;
  handoffId?: string;
  outputType: AgentOutputType;
  outputHash: string;
  summary: string;
}

export interface AgentGovernedSessionContractDependencies {
  now?: () => string;
}

const RISK_ORDER: Record<AgentGovernedRiskLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

export class AgentGovernedSessionContract {
  private readonly now: () => string;

  constructor(dependencies: AgentGovernedSessionContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  evaluateAction(request: AgentGovernedActionRequest): AgentGovernedActionDecision {
    const decidedAt = this.now();
    const reasons: string[] = [];
    const constraints: string[] = [];
    const deniedPaths = this.findDeniedPaths(request);
    const deniedTools = this.findDeniedTools(request);

    if (!request.agent) reasons.push("agent is not registered");
    if (!request.permissionProfile) reasons.push("permission profile is missing");
    if (request.agent && !request.agent.declaredCapabilities.includes(request.requestedCapability)) {
      reasons.push("requested capability is outside agent registry scope");
    }
    if (deniedPaths.length > 0) reasons.push("requested file scope includes denied or unwritable paths");
    if (deniedTools.length > 0) reasons.push("requested tools exceed permission profile");
    if (request.permissionProfile && request.filesChanged.length > request.permissionProfile.executionLimits.maxFilesChanged) {
      reasons.push("changed file count exceeds permission profile limit");
    }
    if (request.permissionProfile && request.commandCount > request.permissionProfile.executionLimits.maxCommands) {
      reasons.push("command count exceeds permission profile limit");
    }
    if (request.permissionProfile?.audit.receiptRequired !== true) {
      reasons.push("agent execution receipt is required");
    }

    const approvalRequired = this.requiresApproval(request);
    if (approvalRequired) {
      constraints.push("approval required before execution may complete");
    }
    if (request.riskLevel === "high" || request.riskLevel === "critical") {
      constraints.push("validation evidence required");
    }

    const policyDecision = this.derivePolicyDecision(request, reasons, approvalRequired);
    const finalStatus = this.deriveFinalStatus(policyDecision);
    const decisionHash = computeDeterministicHash(
      "cvf-agent-governed-session-decision",
      decidedAt,
      request.sessionId,
      request.taskId,
      request.agent?.agentId ?? "unregistered",
      policyDecision,
      reasons.join("|"),
      constraints.join("|"),
    );

    return {
      decisionId: computeDeterministicHash("cvf-agent-governed-session-decision-id", decisionHash, decidedAt),
      decidedAt,
      sessionId: request.sessionId,
      taskId: request.taskId,
      agentId: request.agent?.agentId,
      riskLevel: request.riskLevel,
      policyDecision,
      finalStatus,
      approvalRequired,
      reasons,
      deniedPaths,
      deniedTools: deniedTools.map(String),
      constraints,
      decisionHash,
    };
  }

  validateHandoff(handoff: AgentHandoffInput): AgentHandoffValidation {
    const validatedAt = this.now();
    const reasons: string[] = [];

    if (!handoff.sourceAgentId) reasons.push("source agent is missing");
    if (!handoff.targetAgentId) reasons.push("target agent is missing");
    if (!handoff.taskSummary) reasons.push("task summary is missing");
    if (!Array.isArray(handoff.actionsCompleted)) reasons.push("actions completed must be an array");
    if (!Array.isArray(handoff.filesTouched)) reasons.push("files touched must be an array");
    if (!Array.isArray(handoff.risksFound)) reasons.push("risks found must be an array");
    if (!handoff.nextRequiredAction) reasons.push("next required action is missing");
    if (!handoff.auditReference?.receiptId) reasons.push("audit receipt reference is missing");

    const highRisk = handoff.risksFound.some((risk) => risk.severity === "high" || risk.severity === "critical");
    const requiresApprovalStop =
      highRisk && handoff.policyState?.policyDecision !== "require_approval";
    if (requiresApprovalStop) {
      reasons.push("high or critical handoff risk must stop for approval");
    }

    const valid = reasons.length === 0;
    const validationHash = computeDeterministicHash(
      "cvf-agent-governed-handoff-validation",
      validatedAt,
      handoff.handoffId,
      String(valid),
      reasons.join("|"),
    );

    return {
      validationId: computeDeterministicHash("cvf-agent-governed-handoff-validation-id", validationHash, validatedAt),
      validatedAt,
      handoffId: handoff.handoffId,
      valid,
      reasons,
      requiresApprovalStop,
      validationHash,
    };
  }

  createReceipt(
    request: AgentGovernedActionRequest,
    input: AgentExecutionReceiptInput,
  ): AgentExecutionAuditReceipt {
    const createdAt = this.now();
    const outputHash = input.outputHash ?? computeDeterministicHash(
      "cvf-agent-governed-output",
      input.outputType,
      input.outputSummary,
    );
    const inputHash = computeDeterministicHash(
      "cvf-agent-governed-input",
      request.sessionId,
      request.taskId,
      request.agent?.agentId ?? "unregistered",
      request.requestedCapability,
      request.filesRead.join("|"),
      request.filesChanged.join("|"),
      request.toolsRequested.map(String).join("|"),
    );
    const receiptSeed = [
      createdAt,
      input.decision.decisionHash,
      input.validationResult,
      input.handoff?.validationHash ?? "no-handoff",
      outputHash,
    ].join(":");

    return {
      receiptId: computeDeterministicHash("cvf-agent-execution-receipt-id", receiptSeed),
      traceId: computeDeterministicHash("cvf-agent-execution-trace-id", receiptSeed, request.sessionId),
      sessionId: request.sessionId,
      taskId: request.taskId,
      createdAt,
      agentId: request.agent?.agentId,
      agentRole: request.agent?.role,
      permissionProfile: request.permissionProfile?.profileId,
      phase: request.phase,
      actionType: request.actionType,
      requestedAction: request.requestedAction,
      riskLevel: request.riskLevel,
      policyDecision: input.decision.policyDecision,
      approvalRequired: input.decision.approvalRequired,
      approvalReference: request.approvalReference,
      inputHash,
      contextPackageId: request.contextPackageId,
      filesRead: [...request.filesRead],
      filesChanged: [...request.filesChanged],
      deniedPaths: [...input.decision.deniedPaths],
      toolsRequested: request.toolsRequested.map(String),
      toolsDenied: [...input.decision.deniedTools],
      providerName: input.providerName,
      modelName: input.modelName,
      tokenEstimate: input.tokenEstimate,
      costEstimate: input.costEstimate,
      validationRequired: input.validationRequired,
      validationResult: input.validationResult,
      handoffId: input.handoff?.handoffId,
      outputType: input.outputType,
      outputHash,
      summary: input.outputSummary,
    };
  }

  private derivePolicyDecision(
    request: AgentGovernedActionRequest,
    reasons: string[],
    approvalRequired: boolean,
  ): AgentPolicyDecision {
    if (reasons.length > 0) return "deny";
    if (approvalRequired && !request.approvalReference) return "require_approval";
    if (approvalRequired) return "allow_with_constraints";
    return "allow";
  }

  private deriveFinalStatus(decision: AgentPolicyDecision): AgentExecutionStatus {
    if (decision === "deny") return "denied";
    if (decision === "require_approval") return "approval_required";
    return "completed";
  }

  private requiresApproval(request: AgentGovernedActionRequest): boolean {
    if (request.riskLevel === "critical") return true;
    const threshold = request.permissionProfile?.executionLimits.requiresApprovalAboveRisk;
    if (!threshold) return false;
    return RISK_ORDER[request.riskLevel] > RISK_ORDER[threshold];
  }

  private findDeniedTools(request: AgentGovernedActionRequest): (keyof AgentToolAccessProfile)[] {
    if (!request.permissionProfile) return [...request.toolsRequested];
    return request.toolsRequested.filter((tool) => request.permissionProfile?.toolAccess[tool] !== true);
  }

  private findDeniedPaths(request: AgentGovernedActionRequest): string[] {
    if (!request.permissionProfile) return [...request.filesRead, ...request.filesChanged];
    const profile = request.permissionProfile.fileAccess;
    const denied = new Set<string>();

    for (const path of [...request.filesRead, ...request.filesChanged]) {
      if (profile.deny.some((pattern) => matchesPathPattern(path, pattern))) {
        denied.add(path);
      }
    }
    for (const path of request.filesChanged) {
      if (!profile.write.some((pattern) => matchesPathPattern(path, pattern))) {
        denied.add(path);
      }
    }

    return [...denied];
  }
}

export function createAgentGovernedSessionContract(
  dependencies?: AgentGovernedSessionContractDependencies,
): AgentGovernedSessionContract {
  return new AgentGovernedSessionContract(dependencies);
}

function matchesPathPattern(path: string, pattern: string): boolean {
  if (pattern === "**/*") return true;
  if (pattern.endsWith("/**")) {
    return path.startsWith(pattern.slice(0, -3));
  }
  if (pattern.startsWith("*.")) {
    return path.endsWith(pattern.slice(1));
  }
  return path === pattern;
}
