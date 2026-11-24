import type { GatewayPolicyContext } from "./gateway-policy";
import type { ProviderHealthState } from "./provider-health";
import type { DynamicModelRecord } from "./dynamic-model-registry-contract";
import type { RoutingRequest } from "./routing-policy";

export const UNIFIED_GATEWAY_INTERFACE_CONTRACT_VERSION = "cvf.unifiedGatewayInterface.v1" as const;

/** Truthful bridge-level disposition; absence of a manifest is never implicit. */
export type GatewayMaterialContextManifestDisposition =
  | "attached"
  | "invalid"
  | "not_built_precondition_stopped";

export type GatewayErrorClass =
  | "policy_denied"
  | "no_candidate"
  | "quota_exceeded"
  | "provider_unavailable"
  | "invalid_request"
  | "credential_shielded"
  | "internal_error"
  | "admission_blocked";

export type NativeInferenceProcessState = "not_started" | "started" | "unknown";

/** Actual provider counters only; absent counters remain unknown. */
export interface GatewayProviderUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export type GatewayProviderDiagnosticCode =
  | "request_cancelled" | "provider_timeout" | "provider_http_error"
  | "output_incomplete" | "quota_locked" | "credential_unavailable"
  | "destination_denied" | "invalid_identity" | "network_error" | "unknown_error";

export interface GatewayProviderDiagnostic {
  /** Fingerprint of the credential actually resolved at invocation, never a key fragment. */
  credentialFingerprint?: string;
  code: GatewayProviderDiagnosticCode;
  executionSurface?: "claude_cli_subscription";
  nativeProcessState?: NativeInferenceProcessState;
  httpStatus?: number;
  usage?: GatewayProviderUsage;
}

export function sanitizeProviderCredentialFingerprint(value: unknown): string | undefined {
  return typeof value === "string" && value.length === 12 && /^[a-f0-9]{12}$/.test(value) ? value : undefined;
}

export function sanitizeGatewayProviderUsage(value: unknown): GatewayProviderUsage | undefined {
  if (!value || typeof value !== "object") return undefined;
  const result: GatewayProviderUsage = {};
  for (const key of ["inputTokens", "outputTokens", "totalTokens"] as const) {
    const count = (value as GatewayProviderUsage)[key];
    if (typeof count === "number" && Number.isFinite(count) && count >= 0) result[key] = count;
  }
  return Object.keys(result).length ? result : undefined;
}

const PROVIDER_FAILURES: Record<GatewayProviderDiagnosticCode, { errorClass: GatewayErrorClass; message: string }> = {
  request_cancelled: { errorClass: "provider_unavailable", message: "The request was cancelled before execution completed." },
  provider_timeout: { errorClass: "provider_unavailable", message: "The provider call exceeded the configured timeout." },
  provider_http_error: { errorClass: "provider_unavailable", message: "The provider returned an HTTP error." },
  output_incomplete: { errorClass: "invalid_request", message: "The provider did not return a complete usable answer. Review the request before another call." },
  quota_locked: { errorClass: "policy_denied", message: "Provider access is locked by quota or balance (free-only or exhausted). Verify current quota or balance; paid fallback is disabled." },
  credential_unavailable: { errorClass: "credential_shielded", message: "The selected provider has no configured credential." },
  destination_denied: { errorClass: "policy_denied", message: "The provider destination is not admitted." },
  invalid_identity: { errorClass: "invalid_request", message: "The provider or credential identity does not match the adapter." },
  network_error: { errorClass: "provider_unavailable", message: "A network error interrupted execution; verify the attempt before another call." },
  unknown_error: { errorClass: "internal_error", message: "The provider execution failed for an unclassified reason." },
};

/** Closed, secret-safe failure transport. Raw provider bodies/messages are never accepted. */
export class ProviderExecutionError extends Error {
  readonly diagnostic: GatewayProviderDiagnostic;
  constructor(code: GatewayProviderDiagnosticCode, details: Omit<GatewayProviderDiagnostic, "code"> = {}) {
    const safeCode = Object.prototype.hasOwnProperty.call(PROVIDER_FAILURES, code) ? code : "unknown_error";
    super(PROVIDER_FAILURES[safeCode].message);
    this.name = "ProviderExecutionError";
    const status = details.httpStatus;
    this.diagnostic = Object.freeze({
      code: safeCode,
      ...(details.executionSurface === "claude_cli_subscription" ? { executionSurface: details.executionSurface } : {}),
      ...(typeof details.nativeProcessState === "string" && ["not_started", "started", "unknown"].includes(details.nativeProcessState) ? { nativeProcessState: details.nativeProcessState } : {}),
      ...(sanitizeProviderCredentialFingerprint(details.credentialFingerprint) ? { credentialFingerprint: sanitizeProviderCredentialFingerprint(details.credentialFingerprint) } : {}),
      ...(typeof status === "number" && Number.isInteger(status) && status >= 100 && status <= 599 ? { httpStatus: status } : {}),
      ...(sanitizeGatewayProviderUsage(details.usage) ? { usage: Object.freeze(sanitizeGatewayProviderUsage(details.usage)) } : {}),
    });
  }
  toGatewayEnvelope(traceId: string): GatewayErrorEnvelope {
    // Reconstruct rather than copying Error.message, cause, or arbitrary properties.
    const safe = new ProviderExecutionError(this.diagnostic.code, this.diagnostic).diagnostic;
    const failure = PROVIDER_FAILURES[safe.code];
    return {
      errorClass: failure.errorClass, traceId, message: safe.code === "quota_locked" && safe.executionSurface === "claude_cli_subscription" ? "The provider reported that access is unavailable." : failure.message, credentialShielded: true,
      retryable: safe.code === "provider_http_error" && (safe.httpStatus === 408 || safe.httpStatus === 429 || (safe.httpStatus ?? 0) >= 500),
      providerDiagnostic: safe,
    };
  }
}

export interface GatewayErrorEnvelope {
  errorClass: GatewayErrorClass;
  traceId: string;
  message: string;
  credentialShielded: true;
  providerIdShielded?: true;
  retryable: boolean;
  providerDiagnostic?: GatewayProviderDiagnostic;
}

export interface GatewayExecuteRequest {
  traceId: string;
  prompt: string;
  systemPrompt?: string;
  policy: GatewayPolicyContext;
  routing?: RoutingRequest;
  preferredModel?: DynamicModelRecord;
  metadata?: Record<string, unknown>;
  /**
   * CSCC-R1-T2 additive identity carrier. Optional so every legacy Gateway
   * caller that omits it remains fully source- and behavior-compatible. Set
   * by `CanonicalExecutionAdapter` equal to the canonical port request's
   * `canonicalExecutionId` (itself seeded from `WebGovernanceEnvelope.envelopeId`);
   * never inferred from an arbitrary legacy `traceId`. See
   * `docs/reference/CVF_CANONICAL_EXECUTION_IDENTITY_AND_RECEIPT_JOIN_CONTRACT_2026-09-03.md`.
   */
  canonicalExecutionId?: string;
}

export interface GatewayExecuteResponse {
  executionSurface?: "claude_cli_subscription";
  observedModelId?: string;
  nativeProcessState?: NativeInferenceProcessState;
  providerUsage?: GatewayProviderUsage;
  traceId: string;
  text: string;
  usage?: { inputTokens: number; outputTokens: number };
  receiptObligation?: string;
  model?: { providerId: string; modelId: string };
}

export interface GatewayStreamRequest extends GatewayExecuteRequest {}

export interface GatewayStreamChunk {
  traceId: string;
  chunk: string;
  done: boolean;
  receiptObligation?: string;
}

export interface GatewayEmbeddingRequest {
  traceId: string;
  input: string | string[];
  model?: string;
  policy: GatewayPolicyContext;
  metadata?: Record<string, unknown>;
}

export interface GatewayEmbeddingResponse {
  traceId: string;
  embeddings: number[][];
  dimensions: number;
  receiptObligation?: string;
}

export interface GatewayHealthResponse {
  traceId: string;
  status: "ok" | "degraded" | "unavailable";
  providerHealthSummary?: Record<string, ProviderHealthState>;
  checkedAt: string;
}

export interface UnifiedGatewayInterfaceContract {
  execute(request: GatewayExecuteRequest): Promise<GatewayExecuteResponse | GatewayErrorEnvelope>;
  stream(request: GatewayStreamRequest): AsyncIterable<GatewayStreamChunk | GatewayErrorEnvelope>;
  embedding(request: GatewayEmbeddingRequest): Promise<GatewayEmbeddingResponse | GatewayErrorEnvelope>;
  health(traceId: string): Promise<GatewayHealthResponse>;
}
