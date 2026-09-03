/**
 * Canonical Execution Port - CSCC-R1-T2
 *
 * Implements, verbatim, the port design frozen by CSCC-R1-T1 in
 * `docs/reference/CVF_CANONICAL_EXECUTION_PORT_INTERFACE_CONTRACT_2026-09-03.md`
 * and `docs/reference/CVF_CANONICAL_EXECUTION_IDENTITY_AND_RECEIPT_JOIN_CONTRACT_2026-09-03.md`.
 *
 * `CanonicalExecutionPort` is the stable, caller-neutral contract that a Web
 * (or later MAO) adapter imports from `CVF_MODEL_GATEWAY`. `CanonicalExecutionAdapter`
 * is Gateway-owned composition code that wraps `ProviderExecutionBridge.execute`
 * behind this narrower shape; it never re-implements routing, credential,
 * health, quota, or admission logic, and it never calls a provider adapter
 * directly.
 *
 * Contract version: cvf.canonicalExecutionPort.csccR1T2.v1
 */
import type { GatewayPolicyContext } from "./gateway-policy";
import type { RoutingRequest } from "./routing-policy";
import type { GatewayExecuteRequest, GatewayExecuteResponse, GatewayErrorEnvelope } from "./unified-gateway-interface-contract";
import type { GatewayReceipt } from "./gateway-receipt";
import type { MaterialContextManifest } from "./material-context-manifest";
import type { GatewayMaterialContextManifestDisposition } from "./unified-gateway-interface-contract";
import {
  ProviderExecutionBridge,
  type CanonicalExecutionAttemptBoundary,
  type CanonicalExecutionAttemptBoundaryInput,
  type CanonicalExecutionAttemptBoundaryOutcome,
  type CanonicalExecutionAttemptOutcomeSummary,
} from "./provider-execution-bridge";

export const CANONICAL_EXECUTION_PORT_VERSION = "cvf.canonicalExecutionPort.csccR1T2.v1" as const;

export type {
  CanonicalExecutionAttemptBoundary,
  CanonicalExecutionAttemptBoundaryInput,
  CanonicalExecutionAttemptBoundaryOutcome,
  CanonicalExecutionAttemptOutcomeSummary,
};

/**
 * Caller-supplied request routing hints, minus `traceId` and
 * `preferredProviderId` (both carried at the top level of
 * `CanonicalExecutionPortRequest` per the frozen contract).
 */
export type CanonicalExecutionPortRoutingRequest = Omit<RoutingRequest, "traceId" | "preferredProviderId">;

export interface CanonicalExecutionPortRequest {
  canonicalExecutionId: string;
  prompt: string;
  systemPrompt?: string;
  policy: GatewayPolicyContext;
  preferredProviderId?: string;
  routing?: CanonicalExecutionPortRoutingRequest;
  metadata?: Record<string, unknown>;
  /** Mandatory on the stable canonical port request; see frozen contract Compatibility/Rollback Matrix. */
  attemptBoundary: CanonicalExecutionAttemptBoundary;
  signal?: AbortSignal;
}

export interface CanonicalExecutionPortResult {
  canonicalExecutionId: string;
  response?: GatewayExecuteResponse;
  error?: GatewayErrorEnvelope;
  receipt: GatewayReceipt;
  materialContextManifest?: MaterialContextManifest;
  materialContextManifestDisposition: GatewayMaterialContextManifestDisposition;
  attemptOutcome: CanonicalExecutionAttemptOutcomeSummary;
}

export interface CanonicalExecutionPort {
  execute(request: CanonicalExecutionPortRequest): Promise<CanonicalExecutionPortResult>;
}

/**
 * Gateway-owned composition code, not a provider adapter. Maps
 * `canonicalExecutionId` to both `GatewayExecuteRequest.traceId` and its
 * additive optional `canonicalExecutionId` carrier, maps remaining request
 * fields through unchanged, transports `attemptBoundary` as
 * `ProviderExecutionBridgeExecuteOptions.beforeProviderInvoke`, calls
 * `ProviderExecutionBridge.execute` exactly once, and maps that result into
 * the port result shape. Never calls a provider adapter directly and never
 * makes a second routing or credential decision.
 */
export class CanonicalExecutionAdapter implements CanonicalExecutionPort {
  constructor(private readonly bridge: ProviderExecutionBridge) {}

  async execute(request: CanonicalExecutionPortRequest): Promise<CanonicalExecutionPortResult> {
    if (typeof request.attemptBoundary !== "function") {
      // Risk class 7: the canonical Web port adapter refuses to construct a
      // request without attemptBoundary. This is a constructor/call-time
      // rejection, not a silent Gateway-side default.
      throw new TypeError(
        "CanonicalExecutionAdapter.execute requires a CanonicalExecutionPortRequest.attemptBoundary callback",
      );
    }
    const gatewayRequest: GatewayExecuteRequest = {
      traceId: request.canonicalExecutionId,
      canonicalExecutionId: request.canonicalExecutionId,
      prompt: request.prompt,
      systemPrompt: request.systemPrompt,
      policy: request.policy,
      metadata: request.metadata,
      routing: {
        traceId: request.canonicalExecutionId,
        preferredProviderId: request.preferredProviderId,
        requestedModelId: request.routing?.requestedModelId,
        estimatedTokens: request.routing?.estimatedTokens,
        executionStage: request.routing?.executionStage,
        complexityScore: request.routing?.complexityScore,
        riskScore: request.routing?.riskScore,
        requiredCapabilities: request.routing?.requiredCapabilities,
        costBudget: request.routing?.costBudget,
        latencyBudgetMs: request.routing?.latencyBudgetMs,
      },
    };
    const bridgeResult = await this.bridge.execute(gatewayRequest, {
      signal: request.signal,
      beforeProviderInvoke: request.attemptBoundary,
    });
    return {
      canonicalExecutionId: request.canonicalExecutionId,
      response: bridgeResult.response,
      error: bridgeResult.error,
      receipt: bridgeResult.receipt,
      materialContextManifest: bridgeResult.materialContextManifest,
      materialContextManifestDisposition: bridgeResult.materialContextManifestDisposition,
      // The bridge always sets attemptOutcome when beforeProviderInvoke is
      // supplied (which it always is here, since attemptBoundary is
      // mandatory on this port request); default to "not_reached" only to
      // satisfy the type in an unreachable branch.
      attemptOutcome: bridgeResult.attemptOutcome ?? "not_reached",
    };
  }
}
