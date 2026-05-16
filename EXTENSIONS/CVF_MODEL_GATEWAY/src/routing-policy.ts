import type { GatewayPolicyContext } from "./gateway-policy";
import type { ProviderRecord } from "./provider-registry";
import { ProviderHealthMonitor } from "./provider-health";
import { ProviderRegistry } from "./provider-registry";
import { QuotaLedger, type QuotaDecision } from "./quota-ledger";

export interface RoutingRequest {
  traceId: string;
  policy?: GatewayPolicyContext;
  requestedModelId?: string;
  preferredProviderId?: string;
  estimatedTokens?: number;
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
    }
  | {
      status: "denied" | "requires_approval" | "no_candidate";
      traceId: string;
      reason: string;
    };

export class RoutingPolicyEngine {
  constructor(
    private readonly registry: ProviderRegistry,
    private readonly health: ProviderHealthMonitor,
    private readonly quota: QuotaLedger,
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

    for (const provider of providers) {
      if (!this.health.isUsable(provider.id)) {
        continue;
      }
      const model = request.requestedModelId
        ? provider.models.find((candidate) => candidate.id === request.requestedModelId)
        : provider.models[0];
      if (!model) {
        continue;
      }
      const quota = this.quota.canUse({
        providerId: provider.id,
        modelId: model.id,
        estimatedTokens: request.estimatedTokens,
      });
      if (!quota.allowed) {
        continue;
      }
      return {
        status: "selected",
        traceId: request.traceId,
        providerId: provider.id,
        modelId: model.id,
        reason: "policy_health_quota_selected",
        provider,
        quota,
      };
    }

    return { status: "no_candidate", traceId: request.traceId, reason: "no_provider_passed_policy_health_quota" };
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
}
