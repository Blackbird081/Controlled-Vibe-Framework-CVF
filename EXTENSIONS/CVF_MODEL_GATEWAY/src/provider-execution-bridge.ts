/**
 * Provider Execution Bridge
 *
 * Deterministic orchestration surface connecting existing routing, credential
 * metadata, health, quota, and receipt owners to an injected provider-neutral
 * adapter contract. No concrete provider binding, credential secret, network
 * call, or live proof is present.
 *
 * Contract version: cvf.providerExecutionBridge.p4bA.v1
 */
import type {
  GatewayExecuteRequest,
  GatewayExecuteResponse,
  GatewayErrorEnvelope,
  GatewayErrorClass,
} from "./unified-gateway-interface-contract";
import type { AdapterAdmissionRecord } from "./provider-adapter-admission";
import { checkBridgeAdmission } from "./provider-bridge-admission-guard";
import type { RoutingRequest, RoutingDecision } from "./routing-policy";
import type { CredentialReference, CredentialMetadata } from "./credential-boundary";
import type { GatewayReceipt, GatewayReceiptInput } from "./gateway-receipt";
import { RoutingPolicyEngine } from "./routing-policy";
import { CredentialBoundary } from "./credential-boundary";
import { ProviderHealthMonitor } from "./provider-health";
import { QuotaLedger } from "./quota-ledger";
import { GatewayReceiptBuilder } from "./gateway-receipt";
export interface ProviderExecutionAdapterInput {
  traceId: string;
  providerId: string;
  modelId: string;
  prompt: string;
  systemPrompt?: string;
  metadata?: Record<string, unknown>;
}
export interface ProviderExecutionAdapterResult {
  text: string;
  usage?: { inputTokens: number; outputTokens: number };
}
export interface ProviderExecutionAdapter {
  readonly providerId: string;
  execute(input: ProviderExecutionAdapterInput): Promise<ProviderExecutionAdapterResult>;
}
export interface ProviderExecutionBridgeOptions {
  routing: RoutingPolicyEngine;
  credential: CredentialBoundary;
  health: ProviderHealthMonitor;
  quota: QuotaLedger;
  receipt: GatewayReceiptBuilder;
  credentialRefs: Map<string, CredentialReference>;
  adapters: Map<string, ProviderExecutionAdapter>;
  admissionRecords?: Map<string, AdapterAdmissionRecord>;
}
export interface ProviderExecutionBridgeResult {
  response?: GatewayExecuteResponse;
  error?: GatewayErrorEnvelope;
  receipt: GatewayReceipt;
}
export const PROVIDER_EXECUTION_BRIDGE_VERSION = "cvf.providerExecutionBridge.p4bA.v1" as const;
export class ProviderExecutionBridge {
  private readonly routing: RoutingPolicyEngine;
  private readonly credential: CredentialBoundary;
  private readonly health: ProviderHealthMonitor;
  private readonly quota: QuotaLedger;
  private readonly receipt: GatewayReceiptBuilder;
  private readonly credentialRefs: Map<string, CredentialReference>;
  private readonly adapters: Map<string, ProviderExecutionAdapter>;
  private readonly admissionRecords?: Map<string, AdapterAdmissionRecord>;
  constructor(options: ProviderExecutionBridgeOptions) {
    this.routing = options.routing;
    this.credential = options.credential;
    this.health = options.health;
    this.quota = options.quota;
    this.receipt = options.receipt;
    this.credentialRefs = options.credentialRefs;
    this.adapters = options.adapters;
    this.admissionRecords = options.admissionRecords;
  }
  async execute(request: GatewayExecuteRequest): Promise<ProviderExecutionBridgeResult> {
    const traceId = request.traceId;
    const routingRequest: RoutingRequest = {
      traceId,
      policy: request.policy,
      requestedModelId: request.routing?.requestedModelId,
      preferredProviderId: request.routing?.preferredProviderId,
      estimatedTokens: request.routing?.estimatedTokens,
      executionStage: request.routing?.executionStage,
      complexityScore: request.routing?.complexityScore,
      riskScore: request.routing?.riskScore,
      requiredCapabilities: request.routing?.requiredCapabilities,
      costBudget: request.routing?.costBudget,
      latencyBudgetMs: request.routing?.latencyBudgetMs,
    };
    const decision = this.routing.decide(routingRequest);
    if (decision.status !== "selected") {
      return this.buildStoppedResult(traceId, decision);
    }
    const { providerId, modelId } = decision;
    const adapter = this.adapters.get(providerId);
    if (!adapter || adapter.providerId !== providerId) {
      return this.buildShieldedErrorResult(
        traceId,
        "provider_unavailable",
        "No matching adapter registered for selected provider",
        providerId,
        modelId,
        true,
      );
    }
    const credentialRef = this.credentialRefs.get(providerId);
    if (!credentialRef) {
      return this.buildShieldedErrorResult(
        traceId,
        "credential_shielded",
        "No credential reference configured for selected provider",
        providerId,
        modelId,
        false,
      );
    }
    const credentialMeta: CredentialMetadata = this.credential.resolveMetadata(credentialRef);
    if (!credentialMeta.available) {
      return this.buildShieldedErrorResult(
        traceId,
        "credential_shielded",
        "Credential metadata unavailable for selected provider",
        providerId,
        modelId,
        false,
      );
    }
    if (!this.health.isUsable(providerId)) {
      return this.buildShieldedErrorResult(
        traceId,
        "provider_unavailable",
        "Provider health check failed",
        providerId,
        modelId,
        true,
      );
    }
    const quotaCheck = this.quota.canUse({
      providerId,
      modelId,
      estimatedTokens: request.routing?.estimatedTokens,
    });
    if (!quotaCheck.allowed) {
      return this.buildShieldedErrorResult(
        traceId,
        "quota_exceeded",
        "Quota exceeded for selected provider and model",
        providerId,
        modelId,
        true,
      );
    }
    if (this.admissionRecords) {
      const admissionRecord = this.admissionRecords.get(providerId);
      if (admissionRecord) {
        const guardResult = checkBridgeAdmission(admissionRecord);
        if (guardResult.verdict === "block") {
          return this.buildShieldedErrorResult(
            traceId,
            "admission_blocked",
            "Adapter admission blocked by bridge admission guard",
            providerId,
            modelId,
            false,
          );
        }
      }
    }
    try {
      const adapterResult = await adapter.execute({
        traceId,
        providerId,
        modelId,
        prompt: request.prompt,
        systemPrompt: request.systemPrompt,
        metadata: request.metadata,
      });
      this.health.recordSuccess(providerId);
      this.quota.recordUse({
        providerId,
        modelId,
        estimatedTokens: request.routing?.estimatedTokens,
        actualTokens: adapterResult.usage
          ? adapterResult.usage.inputTokens + adapterResult.usage.outputTokens
          : undefined,
      });
      const receipt = this.receipt.build({
        traceId,
        providerId,
        selectedModelId: modelId,
        decision: "selected",
        reason: "adapter_execution_success",
        policy: request.policy,
        healthState: "healthy",
        quotaAllowed: true,
        credentialKeyId: credentialMeta.keyId,
        credentialFingerprint: credentialMeta.fingerprint,
        validationState: "passed",
      });
      const response: GatewayExecuteResponse = {
        traceId,
        text: adapterResult.text,
        usage: adapterResult.usage,
        model: { providerId, modelId },
      };
      return { response, receipt };
    } catch (caught: unknown) {
      this.health.recordFailure(providerId, undefined, "adapter_execution_error");
      const receipt = this.receipt.build({
        traceId,
        providerId,
        selectedModelId: modelId,
        decision: "selected",
        reason: "adapter_execution_error",
        policy: request.policy,
        healthState: "degraded",
        quotaAllowed: true,
        credentialKeyId: credentialMeta.keyId,
        credentialFingerprint: credentialMeta.fingerprint,
        validationState: "failed",
      });
      const error: GatewayErrorEnvelope = {
        errorClass: "internal_error",
        traceId,
        message: "Provider adapter execution failed",
        credentialShielded: true,
        retryable: true,
      };
      return { error, receipt };
    }
  }
  private buildStoppedResult(
    traceId: string,
    decision: Extract<RoutingDecision, { status: "denied" | "requires_approval" | "no_candidate" }>,
  ): ProviderExecutionBridgeResult {
    const errorClassMap: Record<string, GatewayErrorClass> = {
      denied: "policy_denied",
      requires_approval: "policy_denied",
      no_candidate: "no_candidate",
    };
    const receiptDecisionMap: Record<string, GatewayReceiptInput["decision"]> = {
      denied: "denied",
      requires_approval: "requires_approval",
      no_candidate: "no_candidate",
    };
    const error: GatewayErrorEnvelope = {
      errorClass: errorClassMap[decision.status],
      traceId,
      message: decision.reason,
      credentialShielded: true,
      retryable: false,
    };
    const receipt = this.receipt.build({
      traceId,
      decision: receiptDecisionMap[decision.status],
      reason: decision.reason,
      validationState: "not_run",
    });
    return { error, receipt };
  }
  private buildShieldedErrorResult(
    traceId: string,
    errorClass: GatewayErrorClass,
    message: string,
    providerId: string,
    modelId: string,
    retryable: boolean,
  ): ProviderExecutionBridgeResult {
    const error: GatewayErrorEnvelope = {
      errorClass,
      traceId,
      message,
      credentialShielded: true,
      retryable,
    };
    const receipt = this.receipt.build({
      traceId,
      providerId,
      selectedModelId: modelId,
      decision: "selected",
      reason: message,
      validationState: "failed",
    });
    return { error, receipt };
  }
}
