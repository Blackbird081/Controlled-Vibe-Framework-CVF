import type { GatewayPolicyContext, GatewayPolicyResult } from "./gateway-policy";
import type { GatewayRiskClass } from "./provider-registry";

export interface GatewayReceiptInput {
  traceId: string;
  providerId?: string;
  requestedModelId?: string;
  selectedModelId?: string;
  decision: "selected" | "denied" | "requires_approval" | "fallback" | "no_candidate";
  reason: string;
  policy?: GatewayPolicyContext;
  providerRiskClass?: GatewayRiskClass;
  healthState?: string;
  quotaAllowed?: boolean;
  credentialKeyId?: string;
  credentialFingerprint?: string;
  validationState?: "not_run" | "passed" | "failed";
  fallbackFromProviderId?: string;
  fallbackFromModelId?: string;
  metadata?: Record<string, unknown>;
}

export interface GatewayReceipt {
  receiptId: string;
  traceId: string;
  createdAt: string;
  providerId?: string;
  requestedModelId?: string;
  selectedModelId?: string;
  decision: GatewayReceiptInput["decision"];
  reason: string;
  policyResult?: GatewayPolicyResult;
  dataClassification?: string;
  requestRiskClass?: string;
  providerRiskClass?: GatewayRiskClass;
  healthState?: string;
  quotaAllowed?: boolean;
  credentialKeyId?: string;
  credentialFingerprint?: string;
  validationState: "not_run" | "passed" | "failed";
  fallback?: {
    fromProviderId?: string;
    fromModelId?: string;
  };
  metadata: Record<string, unknown>;
}

export class GatewayReceiptBuilder {
  constructor(
    private readonly now: () => Date = () => new Date(),
    private readonly nonce: () => string = () => Math.random().toString(36).slice(2, 10),
  ) {}

  build(input: GatewayReceiptInput): GatewayReceipt {
    return {
      receiptId: `gw_${this.now().toISOString().replace(/[-:.TZ]/g, "")}_${this.nonce()}`,
      traceId: input.traceId,
      createdAt: this.now().toISOString(),
      providerId: input.providerId,
      requestedModelId: input.requestedModelId,
      selectedModelId: input.selectedModelId,
      decision: input.decision,
      reason: input.reason,
      policyResult: input.policy?.policyResult,
      dataClassification: input.policy?.dataClassification,
      requestRiskClass: input.policy?.requestRiskClass,
      providerRiskClass: input.providerRiskClass,
      healthState: input.healthState,
      quotaAllowed: input.quotaAllowed,
      credentialKeyId: input.credentialKeyId,
      credentialFingerprint: input.credentialFingerprint,
      validationState: input.validationState ?? "not_run",
      fallback: input.fallbackFromProviderId || input.fallbackFromModelId
        ? {
            fromProviderId: input.fallbackFromProviderId,
            fromModelId: input.fallbackFromModelId,
          }
        : undefined,
      metadata: sanitizeReceiptMetadata(input.metadata ?? {}),
    };
  }
}

export function sanitizeReceiptMetadata(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => {
      if (/(key|secret|token|credential)/i.test(key)) {
        return [key, "[REDACTED]"];
      }
      if (entry && typeof entry === "object" && !Array.isArray(entry)) {
        return [key, sanitizeReceiptMetadata(entry as Record<string, unknown>)];
      }
      return [key, entry];
    }),
  );
}
