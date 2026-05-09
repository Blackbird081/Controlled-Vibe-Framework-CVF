import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type TrustDomainClass = "FULL_RUNTIME" | "LIGHTWEIGHT_SDK";
export type IsolationScopeClass = "WORKSPACE" | "AGENT" | "CAPABILITY";
export type IsolationEnforcementMode = "HARD_BLOCK" | "ESCALATE" | "PASS";
export type TrustPropagationMode = "DIRECT" | "GRAPH_GATED" | "BLOCKED";
export type TrustBoundaryStatus = "WITHIN_BOUNDARY" | "BOUNDARY_BREACH" | "GOVERNANCE_GATE_REQUIRED";
export type RiskLevel = "R0" | "R1" | "R2" | "R3";

// Trust domain selection criteria.
// Full Safety Runtime (CVF_v1.7.1_SAFETY_RUNTIME) is required when policy simulation,
// risk evaluation, or R2/R3 risk level is present.
// Lightweight SDK (CVF_ECO_v2.0_AGENT_GUARD_SDK) is eligible for embedded R0/R1 consumers.
export interface TrustDomainCriteria {
  requiresPolicySimulation: boolean;
  requiresRiskEvaluation: boolean;
  isEmbeddedConsumer: boolean;
  riskLevel: RiskLevel;
}

export interface TrustDomainDeclaration {
  declarationId: string;
  evaluatedAt: string;
  criteria: TrustDomainCriteria;
  resolvedDomain: TrustDomainClass;
  rationale: string;
  declarationHash: string;
}

// Isolation scope — unified interface for workspace, agent, and capability isolation.
export interface IsolationScopeRequest {
  scopeClass: IsolationScopeClass;
  subjectId: string;
  requestedOperation: string;
  riskLevel?: RiskLevel;
}

export interface IsolationScopeResult {
  resultId: string;
  evaluatedAt: string;
  scopeClass: IsolationScopeClass;
  subjectId: string;
  requestedOperation: string;
  enforcementMode: IsolationEnforcementMode;
  boundaryStatus: TrustBoundaryStatus;
  reason: string;
  resultHash: string;
}

// Trust propagation gate — determines whether trust may propagate between two subjects.
export interface TrustPropagationRequest {
  sourceId: string;
  targetId: string;
  propagationContext: string; // e.g. "cross-plane", "agent-to-agent", "consumer-pipeline"
  requiresGovernanceApproval?: boolean;
}

export interface TrustPropagationDecision {
  decisionId: string;
  evaluatedAt: string;
  sourceId: string;
  targetId: string;
  mode: TrustPropagationMode;
  reason: string;
  decisionHash: string;
}

export interface TrustIsolationBoundaryContractDependencies {
  now?: () => string;
}

// --- Helpers ---

function buildFullRuntimeRationale(criteria: TrustDomainCriteria): string {
  const reasons: string[] = [];
  if (criteria.requiresPolicySimulation) reasons.push("policy simulation required");
  if (criteria.requiresRiskEvaluation) reasons.push("risk evaluation required");
  if (criteria.riskLevel === "R2" || criteria.riskLevel === "R3") {
    reasons.push(`risk level ${criteria.riskLevel} mandates full governance runtime`);
  }
  return `Full Safety Runtime required: ${reasons.join("; ")}`;
}

function resolveIsolation(request: IsolationScopeRequest): {
  enforcementMode: IsolationEnforcementMode;
  boundaryStatus: TrustBoundaryStatus;
  reason: string;
} {
  const riskLevel: RiskLevel = request.riskLevel ?? "R1";

  if (request.scopeClass === "WORKSPACE") {
    const isWriteOp =
      request.requestedOperation.includes("write") ||
      request.requestedOperation.includes("modify") ||
      request.requestedOperation.includes("delete");
    if (isWriteOp) {
      return {
        enforcementMode: "HARD_BLOCK",
        boundaryStatus: "BOUNDARY_BREACH",
        reason: "Workspace isolation: cross-workspace write/modify/delete is hard-blocked; CVF root is maintenance-only",
      };
    }
    return {
      enforcementMode: "PASS",
      boundaryStatus: "WITHIN_BOUNDARY",
      reason: "Workspace isolation: read-only cross-workspace access is within boundary",
    };
  }

  if (riskLevel === "R3") {
    return {
      enforcementMode: "HARD_BLOCK",
      boundaryStatus: "BOUNDARY_BREACH",
      reason: `${request.scopeClass} isolation: R3 operations are hard-blocked pending human review`,
    };
  }
  if (riskLevel === "R2") {
    return {
      enforcementMode: "ESCALATE",
      boundaryStatus: "GOVERNANCE_GATE_REQUIRED",
      reason: `${request.scopeClass} isolation: R2 operations require governance approval before proceeding`,
    };
  }
  return {
    enforcementMode: "PASS",
    boundaryStatus: "WITHIN_BOUNDARY",
    reason: `${request.scopeClass} isolation: R0/R1 operation is within boundary`,
  };
}

function resolvePropagation(request: TrustPropagationRequest): {
  mode: TrustPropagationMode;
  reason: string;
} {
  if (request.requiresGovernanceApproval) {
    return {
      mode: "GRAPH_GATED",
      reason: "Trust propagation gated: explicit governance approval required before propagating trust across this boundary",
    };
  }
  if (request.propagationContext === "cross-plane") {
    return {
      mode: "GRAPH_GATED",
      reason: "Trust propagation gated: cross-plane trust propagation always requires governance approval",
    };
  }
  if (
    request.propagationContext === "consumer-pipeline" ||
    request.propagationContext === "agent-to-agent"
  ) {
    return {
      mode: "DIRECT",
      reason: `Trust propagation direct: ${request.propagationContext} propagation is allowed within the same governance boundary`,
    };
  }
  return {
    mode: "BLOCKED",
    reason: `Trust propagation blocked: unknown context '${request.propagationContext}' is blocked by default`,
  };
}

// --- Contract ---

export class TrustIsolationBoundaryContract {
  private readonly now: () => string;

  constructor(dependencies: TrustIsolationBoundaryContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  declareTrustDomain(criteria: TrustDomainCriteria): TrustDomainDeclaration {
    const evaluatedAt = this.now();

    const requiresFullRuntime =
      criteria.requiresPolicySimulation ||
      criteria.requiresRiskEvaluation ||
      criteria.riskLevel === "R2" ||
      criteria.riskLevel === "R3";

    const resolvedDomain: TrustDomainClass = requiresFullRuntime
      ? "FULL_RUNTIME"
      : "LIGHTWEIGHT_SDK";

    const rationale = requiresFullRuntime
      ? buildFullRuntimeRationale(criteria)
      : "Lightweight SDK eligible: no policy simulation, no risk evaluation required, risk level R0/R1";

    const declarationHash = computeDeterministicHash(
      "w8-t1-cp1-trust-domain",
      evaluatedAt,
      `policy:${criteria.requiresPolicySimulation}`,
      `risk-eval:${criteria.requiresRiskEvaluation}`,
      `risk-level:${criteria.riskLevel}`,
      `embedded:${criteria.isEmbeddedConsumer}`,
    );

    const declarationId = computeDeterministicHash(
      "w8-t1-cp1-trust-domain-id",
      declarationHash,
      evaluatedAt,
    );

    return {
      declarationId,
      evaluatedAt,
      criteria,
      resolvedDomain,
      rationale,
      declarationHash,
    };
  }

  evaluateIsolationScope(request: IsolationScopeRequest): IsolationScopeResult {
    const evaluatedAt = this.now();
    const { enforcementMode, boundaryStatus, reason } = resolveIsolation(request);

    const resultHash = computeDeterministicHash(
      "w8-t1-cp1-isolation-scope",
      evaluatedAt,
      `scope:${request.scopeClass}`,
      `subject:${request.subjectId}`,
      `op:${request.requestedOperation}`,
      `risk:${request.riskLevel ?? "R1"}`,
      `enforcement:${enforcementMode}`,
    );

    const resultId = computeDeterministicHash(
      "w8-t1-cp1-isolation-id",
      resultHash,
      evaluatedAt,
    );

    return {
      resultId,
      evaluatedAt,
      scopeClass: request.scopeClass,
      subjectId: request.subjectId,
      requestedOperation: request.requestedOperation,
      enforcementMode,
      boundaryStatus,
      reason,
      resultHash,
    };
  }

  decideTrustPropagation(request: TrustPropagationRequest): TrustPropagationDecision {
    const evaluatedAt = this.now();
    const { mode, reason } = resolvePropagation(request);

    const decisionHash = computeDeterministicHash(
      "w8-t1-cp1-trust-propagation",
      evaluatedAt,
      `source:${request.sourceId}`,
      `target:${request.targetId}`,
      `context:${request.propagationContext}`,
      `gov:${request.requiresGovernanceApproval ?? false}`,
      `mode:${mode}`,
    );

    const decisionId = computeDeterministicHash(
      "w8-t1-cp1-trust-propagation-id",
      decisionHash,
      evaluatedAt,
    );

    return {
      decisionId,
      evaluatedAt,
      sourceId: request.sourceId,
      targetId: request.targetId,
      mode,
      reason,
      decisionHash,
    };
  }
}

export function createTrustIsolationBoundaryContract(
  dependencies?: TrustIsolationBoundaryContractDependencies,
): TrustIsolationBoundaryContract {
  return new TrustIsolationBoundaryContract(dependencies);
}
