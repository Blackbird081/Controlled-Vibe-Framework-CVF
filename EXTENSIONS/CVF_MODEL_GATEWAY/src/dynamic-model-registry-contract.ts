import type { ProviderHealthState } from "./provider-health";
import type { ProviderMethodName } from "./provider-method-contract";
import type { ProviderStatus } from "./provider-registry";

export const DYNAMIC_MODEL_REGISTRY_CONTRACT_VERSION = "cvf.dynamicModelRegistry.v1" as const;

export type ModelTier = "frontier" | "standard" | "economy" | "experimental";

export interface DynamicModelRecord {
  providerId: string;
  modelId: string;
  tier: ModelTier;
  supportedMethods: ProviderMethodName[];
  status: ProviderStatus;
  maxContextTokens?: number;
  costPerInputToken?: number;
  costPerOutputToken?: number;
  latencyClass?: "low" | "medium" | "high";
  rateLimit?: { requestsPerMinute: number; tokensPerMinute?: number };
  healthState?: ProviderHealthState;
}

export interface FindOptimalQuery {
  requiredMethod: ProviderMethodName;
  preferredTier?: ModelTier;
  maxCostPerInputToken?: number;
  latencyClass?: "low" | "medium" | "high";
  allowExperimental?: boolean;
  allowedProviderIds?: string[];
  blockedProviderIds?: string[];
}

export interface DynamicModelRegistryContract {
  getModel(providerId: string, modelId: string): DynamicModelRecord | undefined;
  findOptimal(query: FindOptimalQuery): DynamicModelRecord[];
  listRoutable(options?: { allowExperimental?: boolean }): DynamicModelRecord[];
}
