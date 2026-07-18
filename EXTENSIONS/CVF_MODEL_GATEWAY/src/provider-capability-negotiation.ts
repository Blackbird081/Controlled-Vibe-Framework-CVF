/**
 * Provider Capability Negotiation
 *
 * Pure local capability negotiation over the existing provider-method gate.
 */

import type { ProviderCapabilityFile, ProviderMethodName } from "./provider-method-contract";
import {
  listRegistrySupportedMethods,
  normalizeProviderMethodName,
} from "./provider-method-gate";

export const PROVIDER_CAPABILITY_NEGOTIATION_VERSION =
  "cvf.providerCapabilityNegotiation.p5b.v1" as const;

export type CapabilityNegotiationStatus =
  | "negotiated"
  | "blocked"
  | "fallback_available";

export interface CapabilityNegotiationResult {
  status: CapabilityNegotiationStatus;
  providerId: string;
  modelId: string;
  requestedMethod: string;
  effectiveMethod: string;
  supportedMethods: readonly string[];
  reasonCodes: readonly string[];
  reasons: readonly string[];
}

export function negotiateProviderCapability(
  providerId: string,
  modelId: string,
  requestedMethod: ProviderMethodName,
  capabilityRegistry: readonly ProviderCapabilityFile[],
): CapabilityNegotiationResult {
  const normalizedMethod = normalizeProviderMethodName(requestedMethod);
  const supportedMethods = listRegistrySupportedMethods(capabilityRegistry, providerId, modelId);

  if (supportedMethods.includes(requestedMethod)) {
    return buildResult("negotiated", providerId, modelId, requestedMethod, requestedMethod, supportedMethods);
  }

  if (supportedMethods.includes(normalizedMethod)) {
    return buildResult("negotiated", providerId, modelId, requestedMethod, normalizedMethod, supportedMethods);
  }

  if (requestedMethod === "complete" && supportedMethods.includes("chat")) {
    return buildResult(
      "fallback_available",
      providerId,
      modelId,
      requestedMethod,
      "chat",
      supportedMethods,
      ["fallback_method_available"],
      ["fallback_method_available:chat"],
    );
  }

  const reasonCode = supportedMethods.length === 0
    ? "provider_or_model_not_in_registry"
    : "method_not_supported";
  return buildResult(
    "blocked",
    providerId,
    modelId,
    requestedMethod,
    normalizedMethod,
    supportedMethods,
    [reasonCode],
    [`${reasonCode}:${requestedMethod}`],
  );
}

function buildResult(
  status: CapabilityNegotiationStatus,
  providerId: string,
  modelId: string,
  requestedMethod: ProviderMethodName,
  effectiveMethod: ProviderMethodName,
  supportedMethods: readonly ProviderMethodName[],
  reasonCodes: readonly string[] = [],
  reasons: readonly string[] = [],
): CapabilityNegotiationResult {
  return {
    status,
    providerId,
    modelId,
    requestedMethod,
    effectiveMethod,
    supportedMethods,
    reasonCodes,
    reasons,
  };
}
