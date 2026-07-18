import type { GatewayPolicyContext } from "./gateway-policy";
import type { ProviderMethodName } from "./provider-method-contract";
import type { ProviderRecord } from "./provider-registry";
import { FallbackPolicy, type FallbackAttempt } from "./fallback-policy";
import { ProviderHealthMonitor } from "./provider-health";
import { ProviderRegistry } from "./provider-registry";
import { QuotaLedger, type QuotaDecision } from "./quota-ledger";
import {
  collectAppliedRoutingPolicies,
  runRoutingPolicyPipeline,
  type RoutingStageDecision,
} from "./routing-policy-pipeline";

export interface RoutingRequest {
  traceId: string;
  policy?: GatewayPolicyContext;
  requestedModelId?: string;
  preferredProviderId?: string;
  estimatedTokens?: number;
  executionStage?: string;
  complexityScore?: number;
  riskScore?: number;
  requiredCapabilities?: ProviderMethodName[];
  costBudget?: number;
  latencyBudgetMs?: number;
}

export type RoutingDecision =
  | {
      status: "selected";
      traceId: string;
      providerId: string;
      modelId: string;
      reason: string;
      provider: ProviderRecord;
      quota: QuotaDecision;
      fallbackChain?: Array<{ providerId: string; modelId: string }>;
    }
  | {
      status: "denied" | "requires_approval" | "no_candidate";
      traceId: string;
      reason: string;
    };

export const ROUTING_POLICY_CONTRACT_VERSION = "phase2b-routing-policy-1" as const;

export interface RoutingPolicyContractSnapshot {
  version: typeof ROUTING_POLICY_CONTRACT_VERSION;
  source: "model-gateway:routing-policy";
  traceId: string;
  status: RoutingDecision["status"];
  reason: string;
  selectedProviderId?: string;
  selectedModelId?: string;
  policyResult?: GatewayPolicyContext["policyResult"];
  appliedPolicies?: string[];
  fallbackChainLength?: number;
}

export function buildRoutingPolicyContractSnapshot(
  request: RoutingRequest,
  decision: RoutingDecision,
): RoutingPolicyContractSnapshot {
  return {
    version: ROUTING_POLICY_CONTRACT_VERSION,
    source: "model-gateway:routing-policy",
    traceId: decision.traceId,
    status: decision.status,
    reason: decision.reason,
    selectedProviderId: decision.status === "selected" ? decision.providerId : undefined,
    selectedModelId: decision.status === "selected" ? decision.modelId : undefined,
    policyResult: request.policy?.policyResult,
    appliedPolicies: collectAppliedRoutingPolicies(request).length
      ? collectAppliedRoutingPolicies(request)
      : undefined,
    fallbackChainLength: decision.status === "selected" && decision.fallbackChain
      ? decision.fallbackChain.length
      : undefined,
  };
}

export class RoutingPolicyEngine {
  constructor(
    private readonly registry: ProviderRegistry,
    private readonly health: ProviderHealthMonitor,
    private readonly quota: QuotaLedger,
    private readonly fallback: FallbackPolicy = new FallbackPolicy(),
  ) {}

  decide(request: RoutingRequest): RoutingDecision {
    if (!request.policy) {
      return { status: "denied", traceId: request.traceId, reason: "missing_policy_context" };
    }
    if (request.policy.policyResult === "deny") {
      return { status: "denied", traceId: request.traceId, reason: request.policy.reason ?? "policy_denied" };
    }
    if (request.policy.policyResult === "requires_approval") {
      return {
        status: "requires_approval",
        traceId: request.traceId,
        reason: request.policy.reason ?? "policy_requires_approval",
      };
    }

    const policy = request.policy;
    const providers = this.orderedProviders(request).filter((provider) => {
      return this.registry.isRoutable(provider.id, {
        allowedProviderIds: policy.allowedProviderIds,
        blockedProviderIds: policy.blockedProviderIds,
        allowExperimental: policy.allowExperimentalProviders,
      });
    });
    const pipeline = runRoutingPolicyPipeline({
      policy,
      providers,
      requestedModelId: request.requestedModelId,
      executionStage: request.executionStage,
      complexityScore: request.complexityScore,
      riskScore: request.riskScore,
      requiredCapabilities: request.requiredCapabilities,
      costBudget: request.costBudget,
      latencyBudgetMs: request.latencyBudgetMs,
      estimatedTokens: request.estimatedTokens,
    });
    if (!pipeline.candidates.length) {
      return { status: "no_candidate", traceId: request.traceId, reason: "no_provider_passed_routing_policy_pipeline" };
    }

    const attempts: FallbackAttempt[] = [];
    const fallbackChain: Array<{ providerId: string; modelId: string }> = [];
    for (const candidate of pipeline.candidates) {
      const provider = candidate.provider;
      const modelId = candidate.modelId;
      if (!this.health.isUsable(provider.id)) {
        this.recordFallbackAttempt(attempts, fallbackChain, provider.id, modelId, "provider_unusable");
        continue;
      }
      const model = provider.models.find((candidateModel) => candidateModel.id === modelId);
      if (!model) {
        continue;
      }
      const quota = this.quota.canUse({
        providerId: provider.id,
        modelId: model.id,
        estimatedTokens: request.estimatedTokens,
      });
      if (!quota.allowed) {
        this.recordFallbackAttempt(attempts, fallbackChain, provider.id, model.id, quota.reason);
        continue;
      }
      if (fallbackChain.length) {
        fallbackChain.push({ providerId: provider.id, modelId: model.id });
      }
      return {
        status: "selected",
        traceId: request.traceId,
        providerId: provider.id,
        modelId: model.id,
        reason: "policy_health_quota_selected",
        provider,
        quota,
        fallbackChain: fallbackChain.length ? fallbackChain : undefined,
      };
    }

    return { status: "no_candidate", traceId: request.traceId, reason: "no_provider_passed_policy_health_quota" };
  }

  decideWithSnapshot(request: RoutingRequest): {
    decision: RoutingDecision;
    snapshot: RoutingPolicyContractSnapshot;
  } {
    const decision = this.decide(request);
    return {
      decision,
      snapshot: buildRoutingPolicyContractSnapshot(request, decision),
    };
  }

  private orderedProviders(request: RoutingRequest): ProviderRecord[] {
    const all = this.registry.listAll();
    if (!request.preferredProviderId) {
      return all;
    }
    return [
      ...all.filter((provider) => provider.id === request.preferredProviderId),
      ...all.filter((provider) => provider.id !== request.preferredProviderId),
    ];
  }

  private recordFallbackAttempt(
    attempts: FallbackAttempt[],
    fallbackChain: Array<{ providerId: string; modelId: string }>,
    providerId: string,
    modelId: string,
    reason: string,
  ): void {
    attempts.push(this.fallback.createAttempt(providerId, modelId, reason));
    const decision = this.fallback.decide(attempts);
    if (decision.shouldFallback) {
      fallbackChain.push({ providerId, modelId });
    }
  }
}

export type { RoutingStageDecision };
