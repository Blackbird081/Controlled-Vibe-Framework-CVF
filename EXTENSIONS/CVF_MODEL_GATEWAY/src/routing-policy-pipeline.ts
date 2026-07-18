import type { GatewayPolicyContext } from "./gateway-policy";
import type { ProviderMethodName } from "./provider-method-contract";
import type { ProviderRecord } from "./provider-registry";
import { PROVIDER_CAPABILITY_REGISTRY } from "./provider-capability-registry";
import { normalizeProviderMethodName } from "./provider-method-gate";

export interface RoutingCandidate {
  provider: ProviderRecord;
  modelId: string;
}

export interface RoutingStageDecision {
  stage: string;
  candidates: ProviderRecord[];
  reason: string;
}

export interface RoutingPolicyPipelineRequest {
  policy: GatewayPolicyContext;
  providers: ProviderRecord[];
  requestedModelId?: string;
  executionStage?: string;
  complexityScore?: number;
  riskScore?: number;
  requiredCapabilities?: ProviderMethodName[];
  costBudget?: number;
  latencyBudgetMs?: number;
  estimatedTokens?: number;
}

export interface RoutingPolicyPipelineResult {
  candidates: RoutingCandidate[];
  stageDecisions: RoutingStageDecision[];
  appliedPolicies: string[];
}

const RISK_RANK: Record<ProviderRecord["riskClass"], number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export function collectAppliedRoutingPolicies(request: {
  executionStage?: string;
  complexityScore?: number;
  riskScore?: number;
  requiredCapabilities?: ProviderMethodName[];
  costBudget?: number;
  latencyBudgetMs?: number;
}): string[] {
  const policies: string[] = [];
  if (request.requiredCapabilities?.length) {
    policies.push("capability");
  }
  if (request.executionStage) {
    policies.push("stage");
  }
  if (request.complexityScore !== undefined) {
    policies.push("complexity");
  }
  if (request.riskScore !== undefined) {
    policies.push("risk");
  }
  if (request.costBudget !== undefined) {
    policies.push("cost");
  }
  if (request.latencyBudgetMs !== undefined) {
    policies.push("latency");
  }
  return policies;
}

export function runRoutingPolicyPipeline(
  request: RoutingPolicyPipelineRequest,
): RoutingPolicyPipelineResult {
  const stageDecisions: RoutingStageDecision[] = [];
  const appliedPolicies = collectAppliedRoutingPolicies(request);
  let candidates = buildInitialCandidates(request.providers, request);

  candidates = applyProviderStage(
    stageDecisions,
    "capability",
    candidates,
    request.requiredCapabilities?.length
      ? candidates.filter((candidate) =>
          modelSupportsRequiredCapabilities(
            candidate.provider.id,
            candidate.modelId,
            request.requiredCapabilities,
          ),
        )
      : candidates,
    request.requiredCapabilities?.length ? "required_capabilities_applied" : "no_required_capabilities",
  );

  candidates = applyProviderStage(
    stageDecisions,
    "stage",
    candidates,
    candidates,
    request.executionStage ? `execution_stage_recorded:${request.executionStage}` : "no_execution_stage",
  );

  candidates = applyProviderStage(
    stageDecisions,
    "complexity",
    candidates,
    orderByComplexity(candidates, request.complexityScore),
    request.complexityScore !== undefined ? "complexity_order_applied" : "no_complexity_score",
  );

  candidates = applyProviderStage(
    stageDecisions,
    "risk",
    candidates,
    filterByRisk(candidates, request),
    shouldApplyRiskPolicy(request) ? "risk_filter_applied" : "no_risk_constraint",
  );

  candidates = applyProviderStage(
    stageDecisions,
    "cost",
    candidates,
    filterByCostBudget(candidates, request),
    request.costBudget !== undefined ? "cost_budget_applied" : "no_cost_budget",
  );

  return {
    candidates,
    stageDecisions,
    appliedPolicies,
  };
}

export function selectCandidateModel(
  provider: ProviderRecord,
  request: Pick<RoutingPolicyPipelineRequest, "requestedModelId" | "requiredCapabilities">,
): string | undefined {
  if (request.requestedModelId) {
    const requested = provider.models.find((candidate) => candidate.id === request.requestedModelId);
    if (!requested) {
      return undefined;
    }
    return modelSupportsRequiredCapabilities(provider.id, requested.id, request.requiredCapabilities)
      ? requested.id
      : undefined;
  }

  if (request.requiredCapabilities?.length) {
    return provider.models.find((model) =>
      modelSupportsRequiredCapabilities(provider.id, model.id, request.requiredCapabilities),
    )?.id;
  }

  return provider.models[0]?.id;
}

export function modelSupportsRequiredCapabilities(
  providerId: string,
  modelId: string,
  requiredCapabilities: readonly ProviderMethodName[] | undefined,
): boolean {
  if (!requiredCapabilities?.length) {
    return true;
  }

  const providerCapability = PROVIDER_CAPABILITY_REGISTRY.find((entry) => entry.providerId === providerId);
  const modelCapability = providerCapability?.models.find((model) => model.modelId === modelId);
  if (!modelCapability) {
    return false;
  }

  const supported = modelCapability.supportedMethods.map((method) => normalizeProviderMethodName(method));
  return requiredCapabilities
    .map((method) => normalizeProviderMethodName(method))
    .every((method) => supported.includes(method));
}

function buildInitialCandidates(
  providers: ProviderRecord[],
  request: Pick<RoutingPolicyPipelineRequest, "requestedModelId" | "requiredCapabilities">,
): RoutingCandidate[] {
  return providers.flatMap((provider) => {
    const modelId = selectCandidateModel(provider, request);
    return modelId ? [{ provider, modelId }] : [];
  });
}

function applyProviderStage(
  stageDecisions: RoutingStageDecision[],
  stage: string,
  previous: RoutingCandidate[],
  next: RoutingCandidate[],
  reason: string,
): RoutingCandidate[] {
  stageDecisions.push({
    stage,
    candidates: next.map((candidate) => candidate.provider),
    reason,
  });
  return previous.length === next.length ? next : dedupeCandidates(next);
}

function orderByComplexity(
  candidates: RoutingCandidate[],
  complexityScore: number | undefined,
): RoutingCandidate[] {
  if (complexityScore === undefined || complexityScore < 0.75) {
    return candidates;
  }
  return [...candidates].sort((left, right) => {
    return RISK_RANK[left.provider.riskClass] - RISK_RANK[right.provider.riskClass];
  });
}

function filterByRisk(
  candidates: RoutingCandidate[],
  request: Pick<RoutingPolicyPipelineRequest, "policy" | "riskScore">,
): RoutingCandidate[] {
  if (!shouldApplyRiskPolicy(request)) {
    return candidates;
  }
  return candidates.filter((candidate) => RISK_RANK[candidate.provider.riskClass] <= RISK_RANK.medium);
}

function shouldApplyRiskPolicy(
  request: Pick<RoutingPolicyPipelineRequest, "policy" | "riskScore">,
): boolean {
  return (
    (request.riskScore !== undefined && request.riskScore >= 0.8) ||
    request.policy.requestRiskClass === "high" ||
    request.policy.requestRiskClass === "critical"
  );
}

function filterByCostBudget(
  candidates: RoutingCandidate[],
  request: Pick<RoutingPolicyPipelineRequest, "costBudget" | "estimatedTokens">,
): RoutingCandidate[] {
  if (request.costBudget === undefined) {
    return candidates;
  }
  return (request.estimatedTokens ?? 0) <= request.costBudget ? candidates : [];
}

function dedupeCandidates(candidates: RoutingCandidate[]): RoutingCandidate[] {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = `${candidate.provider.id}::${candidate.modelId}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
