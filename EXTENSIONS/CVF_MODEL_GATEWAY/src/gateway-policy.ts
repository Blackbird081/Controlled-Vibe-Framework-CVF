export type GatewayPolicyResult = "allow" | "deny" | "requires_approval";

export interface GatewayPolicyContext {
  traceId: string;
  policyResult: GatewayPolicyResult;
  operatorId?: string;
  workspaceId?: string;
  dataClassification?: "public" | "internal" | "confidential" | "restricted";
  requestRiskClass?: "low" | "medium" | "high" | "critical";
  allowedProviderIds?: string[];
  blockedProviderIds?: string[];
  allowExperimentalProviders?: boolean;
  reason?: string;
}

export function isPolicyAllowed(context: GatewayPolicyContext | undefined): boolean {
  return context?.policyResult === "allow";
}
