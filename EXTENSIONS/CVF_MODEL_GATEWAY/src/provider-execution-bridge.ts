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
  GatewayMaterialContextManifestDisposition,
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
import type { MaterialContextManifest } from "./material-context-manifest";
import { buildMaterialContextManifest, validateMaterialContextManifest } from "./material-context-manifest";
export interface ProviderExecutionAdapterInput {
  traceId: string;
  providerId: string;
  modelId: string;
  prompt: string;
  systemPrompt?: string;
  metadata?: Record<string, unknown>;
  signal?: AbortSignal;
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
/**
 * CSCC-R1-T2 additive attempt-outcome summary. `"not_reached"` covers every
 * pre-adapter stop; `"denied"` covers callback denial; `"callback_error"`
 * covers a callback throw/rejection; `"invoked"` covers a callback allow
 * (regardless of whether the subsequent adapter call itself succeeds).
 * Absent when no `beforeProviderInvoke` option was supplied at all (legacy
 * callers keep consuming `ProviderExecutionBridgeResult` unaffected).
 */
export type CanonicalExecutionAttemptOutcomeSummary = "not_reached" | "denied" | "callback_error" | "invoked";

export interface ProviderExecutionBridgeResult {
  response?: GatewayExecuteResponse;
  error?: GatewayErrorEnvelope;
  receipt: GatewayReceipt;
  materialContextManifest?: MaterialContextManifest;
  materialContextManifestDisposition: GatewayMaterialContextManifestDisposition;
  /** CSCC-R1-T2 additive field; present only when `beforeProviderInvoke` was supplied. */
  attemptOutcome?: CanonicalExecutionAttemptOutcomeSummary;
}
/**
 * CSCC-R1-T2 atomic attempt-boundary callback input. Gateway constructs this
 * before invoking the caller-supplied `beforeProviderInvoke` callback; it
 * carries only the Gateway-selected provider/model and the request identity,
 * never a fabricated `attemptIndex` (only the callback's own
 * `admitProviderAttempt` call can allocate that).
 */
export interface CanonicalExecutionAttemptBoundaryInput {
  canonicalExecutionId: string;
  providerId: string;
  modelId: string;
  traceId: string;
}

/** CSCC-R1-T2 atomic attempt-boundary callback outcome. */
export type CanonicalExecutionAttemptBoundaryOutcome =
  | { decision: "allow"; attemptIndex: number }
  | { decision: "deny"; attemptIndex: number; reason: string; retryAfterSeconds?: number };

/**
 * CSCC-R1-T2 atomic attempt-boundary callback type. Gateway invokes this
 * exactly once per bridge execution, only when every pre-adapter stop has
 * already passed, and only ever immediately before its own single
 * `adapter.execute` call.
 */
export type CanonicalExecutionAttemptBoundary = (
  input: CanonicalExecutionAttemptBoundaryInput,
) => Promise<CanonicalExecutionAttemptBoundaryOutcome>;

export interface ProviderExecutionBridgeExecuteOptions {
  signal?: AbortSignal;
  /**
   * CSCC-R1-T2 additive optional atomic attempt-boundary callback. When
   * omitted, `execute` behaves exactly as before this addition: no callback
   * is invoked and `adapter.execute` runs immediately once all pre-adapter
   * stops pass. When present, invoked exactly once immediately before the
   * one `adapter.execute` call, only after every pre-adapter stop already
   * passed, and only proceeds to `adapter.execute` on a `{ decision: "allow" }`
   * outcome. A `{ decision: "deny" }` outcome short-circuits before
   * `adapter.execute` and produces a typed no-invocation `admission_blocked`
   * result; a thrown/rejected callback short-circuits the same way but
   * produces a typed no-invocation `internal_error` result. Neither ever
   * calls the adapter.
   */
  beforeProviderInvoke?: CanonicalExecutionAttemptBoundary;
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
  async execute(
    request: GatewayExecuteRequest,
    options: ProviderExecutionBridgeExecuteOptions = {},
  ): Promise<ProviderExecutionBridgeResult> {
    const traceId = request.traceId;
    const canonicalExecutionId = request.canonicalExecutionId;
    const attemptOutcomeApplicable = options.beforeProviderInvoke !== undefined;
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
      return this.buildStoppedResult(traceId, canonicalExecutionId, decision, attemptOutcomeApplicable);
    }
    const { providerId, modelId } = decision;
    const adapter = this.adapters.get(providerId);
    if (!adapter || adapter.providerId !== providerId) {
      return this.buildShieldedErrorResult(
        traceId,
        canonicalExecutionId,
        "provider_unavailable",
        "No matching adapter registered for selected provider",
        providerId,
        modelId,
        true,
        attemptOutcomeApplicable,
      );
    }
    const credentialRef = this.credentialRefs.get(providerId);
    if (!credentialRef) {
      return this.buildShieldedErrorResult(
        traceId,
        canonicalExecutionId,
        "credential_shielded",
        "No credential reference configured for selected provider",
        providerId,
        modelId,
        false,
        attemptOutcomeApplicable,
      );
    }
    const credentialMeta: CredentialMetadata = this.credential.resolveMetadata(credentialRef);
    if (!credentialMeta.available) {
      return this.buildShieldedErrorResult(
        traceId,
        canonicalExecutionId,
        "credential_shielded",
        "Credential metadata unavailable for selected provider",
        providerId,
        modelId,
        false,
        attemptOutcomeApplicable,
      );
    }
    if (!this.health.isUsable(providerId)) {
      return this.buildShieldedErrorResult(
        traceId,
        canonicalExecutionId,
        "provider_unavailable",
        "Provider health check failed",
        providerId,
        modelId,
        true,
        attemptOutcomeApplicable,
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
        canonicalExecutionId,
        "quota_exceeded",
        "Quota exceeded for selected provider and model",
        providerId,
        modelId,
        true,
        attemptOutcomeApplicable,
      );
    }
    if (this.admissionRecords) {
      const admissionRecord = this.admissionRecords.get(providerId);
      if (admissionRecord) {
        const guardResult = checkBridgeAdmission(admissionRecord);
        if (guardResult.verdict === "block") {
          return this.buildShieldedErrorResult(
            traceId,
            canonicalExecutionId,
            "admission_blocked",
            "Adapter admission blocked by bridge admission guard",
            providerId,
            modelId,
            false,
            attemptOutcomeApplicable,
          );
        }
      }
    }
    const invocationBinding = { providerId, modelId };
    const manifestBuildResult = buildMaterialContextManifest(request, invocationBinding);
    if (!manifestBuildResult.ok) {
      return this.buildManifestFailureResult(
        traceId,
        canonicalExecutionId,
        providerId,
        modelId,
        credentialMeta,
        attemptOutcomeApplicable,
      );
    }
    const materialContextManifest = manifestBuildResult.manifest;
    if (!validateMaterialContextManifest(materialContextManifest, request, invocationBinding)) {
      return this.buildManifestFailureResult(
        traceId,
        canonicalExecutionId,
        providerId,
        modelId,
        credentialMeta,
        attemptOutcomeApplicable,
      );
    }
    // -- CSCC-R1-T2 atomic attempt boundary: every pre-adapter stop above has
    // already passed. The callback, when supplied, fires exactly once here,
    // immediately before the one adapter.execute call below. -----------------
    if (options.beforeProviderInvoke) {
      let outcome: CanonicalExecutionAttemptBoundaryOutcome;
      try {
        // CSCC-R1-T2 rework: canonicalExecutionId is never inferred from the
        // legacy traceId. The port adapter always sets both fields to the
        // same value on a canonical call, and beforeProviderInvoke is only
        // ever supplied by a canonical caller, so canonicalExecutionId is
        // defined here; a legacy caller (no canonicalExecutionId) never
        // supplies beforeProviderInvoke and never reaches this branch.
        outcome = await options.beforeProviderInvoke({
          canonicalExecutionId: canonicalExecutionId as string,
          providerId,
          modelId,
          traceId,
        });
      } catch {
        return this.buildAttemptBoundaryErrorResult(
          traceId,
          canonicalExecutionId,
          providerId,
          modelId,
          credentialMeta,
          "callback_error",
          "attempt_boundary_callback_threw",
        );
      }
      if (outcome.decision === "deny") {
        return this.buildAttemptBoundaryErrorResult(
          traceId,
          canonicalExecutionId,
          providerId,
          modelId,
          credentialMeta,
          "denied",
          "attempt_boundary_callback_denied",
        );
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
        signal: options.signal,
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
        canonicalExecutionId,
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
        metadata: { materialContextManifestDigest: materialContextManifest.manifestDigest },
      });
      const response: GatewayExecuteResponse = {
        traceId,
        text: adapterResult.text,
        usage: adapterResult.usage,
        model: { providerId, modelId },
      };
      return {
        response,
        receipt,
        materialContextManifest,
        materialContextManifestDisposition: "attached",
        ...(attemptOutcomeApplicable ? { attemptOutcome: "invoked" as const } : {}),
      };
    } catch (caught: unknown) {
      this.health.recordFailure(providerId, undefined, "adapter_execution_error");
      const receipt = this.receipt.build({
        traceId,
        canonicalExecutionId,
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
        metadata: { materialContextManifestDigest: materialContextManifest.manifestDigest },
      });
      const error: GatewayErrorEnvelope = {
        errorClass: "internal_error",
        traceId,
        message: "Provider adapter execution failed",
        credentialShielded: true,
        retryable: true,
      };
      return {
        error,
        receipt,
        materialContextManifest,
        materialContextManifestDisposition: "attached",
        ...(attemptOutcomeApplicable ? { attemptOutcome: "invoked" as const } : {}),
      };
    }
  }
  private buildAttemptBoundaryErrorResult(
    traceId: string,
    canonicalExecutionId: string | undefined,
    providerId: string,
    modelId: string,
    credentialMeta: CredentialMetadata,
    attemptOutcome: Extract<CanonicalExecutionAttemptOutcomeSummary, "denied" | "callback_error">,
    reason: string,
  ): ProviderExecutionBridgeResult {
    // CSCC-R1-T2 rework: the frozen T1 Callback Outcome Table maps a
    // callback denial to errorClass "admission_blocked" (the same class the
    // pre-adapter checkBridgeAdmission stop already uses) and a callback
    // throw/rejection to "internal_error" (a typed no-invocation subtype,
    // distinguished from an adapter-level internal_error by receipt reason
    // "attempt_boundary_callback_threw"). These are two different stop
    // reasons and must not share one errorClass.
    const error: GatewayErrorEnvelope = {
      errorClass: attemptOutcome === "denied" ? "admission_blocked" : "internal_error",
      traceId,
      message: "Provider attempt boundary callback did not allow invocation",
      credentialShielded: true,
      retryable: attemptOutcome === "denied",
    };
    const receipt = this.receipt.build({
      traceId,
      canonicalExecutionId,
      providerId,
      selectedModelId: modelId,
      decision: "selected",
      reason,
      healthState: "degraded",
      quotaAllowed: true,
      credentialKeyId: credentialMeta.keyId,
      credentialFingerprint: credentialMeta.fingerprint,
      validationState: "failed",
      metadata: { materialContextManifestDisposition: "not_built_precondition_stopped" },
    });
    return {
      error,
      receipt,
      materialContextManifestDisposition: "not_built_precondition_stopped",
      attemptOutcome,
    };
  }
  private buildManifestFailureResult(
    traceId: string,
    canonicalExecutionId: string | undefined,
    providerId: string,
    modelId: string,
    credentialMeta: CredentialMetadata,
    attemptOutcomeApplicable: boolean,
  ): ProviderExecutionBridgeResult {
    const error: GatewayErrorEnvelope = {
      errorClass: "invalid_request",
      traceId,
      message: "Material context manifest missing, invalid, or trace-mismatched",
      credentialShielded: true,
      retryable: false,
    };
    const receipt = this.receipt.build({
      traceId,
      canonicalExecutionId,
      providerId,
      selectedModelId: modelId,
      decision: "selected",
      reason: "material_context_manifest_invalid",
      healthState: "degraded",
      quotaAllowed: true,
      credentialKeyId: credentialMeta.keyId,
      credentialFingerprint: credentialMeta.fingerprint,
      validationState: "failed",
      metadata: { materialContextManifestDisposition: "invalid" },
    });
    return {
      error,
      receipt,
      materialContextManifestDisposition: "invalid",
      ...(attemptOutcomeApplicable ? { attemptOutcome: "not_reached" as const } : {}),
    };
  }
  private buildStoppedResult(
    traceId: string,
    canonicalExecutionId: string | undefined,
    decision: Extract<RoutingDecision, { status: "denied" | "requires_approval" | "no_candidate" }>,
    attemptOutcomeApplicable: boolean,
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
      canonicalExecutionId,
      decision: receiptDecisionMap[decision.status],
      reason: decision.reason,
      validationState: "not_run",
      metadata: { materialContextManifestDisposition: "not_built_precondition_stopped" },
    });
    return {
      error,
      receipt,
      materialContextManifestDisposition: "not_built_precondition_stopped",
      ...(attemptOutcomeApplicable ? { attemptOutcome: "not_reached" as const } : {}),
    };
  }
  private buildShieldedErrorResult(
    traceId: string,
    canonicalExecutionId: string | undefined,
    errorClass: GatewayErrorClass,
    message: string,
    providerId: string,
    modelId: string,
    retryable: boolean,
    attemptOutcomeApplicable: boolean,
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
      canonicalExecutionId,
      providerId,
      selectedModelId: modelId,
      decision: "selected",
      reason: message,
      validationState: "failed",
      metadata: { materialContextManifestDisposition: "not_built_precondition_stopped" },
    });
    return {
      error,
      receipt,
      materialContextManifestDisposition: "not_built_precondition_stopped",
      ...(attemptOutcomeApplicable ? { attemptOutcome: "not_reached" as const } : {}),
    };
  }
}
