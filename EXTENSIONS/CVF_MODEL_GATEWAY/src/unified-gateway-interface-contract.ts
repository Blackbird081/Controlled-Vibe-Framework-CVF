import type { GatewayPolicyContext } from "./gateway-policy";
import type { ProviderHealthState } from "./provider-health";
import type { DynamicModelRecord } from "./dynamic-model-registry-contract";
import type { RoutingRequest } from "./routing-policy";

export const UNIFIED_GATEWAY_INTERFACE_CONTRACT_VERSION = "cvf.unifiedGatewayInterface.v1" as const;

export type GatewayErrorClass =
  | "policy_denied"
  | "no_candidate"
  | "quota_exceeded"
  | "provider_unavailable"
  | "invalid_request"
  | "credential_shielded"
  | "internal_error"
  | "admission_blocked";

export interface GatewayErrorEnvelope {
  errorClass: GatewayErrorClass;
  traceId: string;
  message: string;
  credentialShielded: true;
  providerIdShielded?: true;
  retryable: boolean;
}

export interface GatewayExecuteRequest {
  traceId: string;
  prompt: string;
  systemPrompt?: string;
  policy: GatewayPolicyContext;
  routing?: RoutingRequest;
  preferredModel?: DynamicModelRecord;
  metadata?: Record<string, unknown>;
}

export interface GatewayExecuteResponse {
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
