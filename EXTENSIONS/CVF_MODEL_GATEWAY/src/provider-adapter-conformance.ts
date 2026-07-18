/**
 * Provider Adapter Contract Conformance
 *
 * Deterministic, provider-agnostic evaluator that checks whether a
 * user-supplied ProviderExecutionAdapter satisfies CVF's generic adapter
 * contract before it is admitted to the P4B-A bridge. No concrete provider
 * identity is required or favored. No network call, secret resolution, or
 * adapter invocation is performed.
 *
 * Contract version: cvf.providerAdapterConformance.p4c.v1
 */

import type { ProviderCapabilityFile, ProviderMethodName } from "./provider-method-contract";
import type { ProviderExecutionAdapter } from "./provider-execution-bridge";
import {
  findProviderCapability,
  listRegistrySupportedMethods,
  normalizeProviderMethodName,
} from "./provider-method-gate";

// ---------------------------------------------------------------------------
// P4C conformance types
// ---------------------------------------------------------------------------

export type ProviderAdapterConformanceStatus = "conformant" | "blocked";

export interface ProviderAdapterConformanceInput {
  providerId: string;
  modelId: string;
  method: ProviderMethodName;
  adapter: ProviderExecutionAdapter;
  capabilityRegistry: readonly ProviderCapabilityFile[];
  credentialMetadataAvailable?: boolean;
}

export interface ProviderAdapterConformanceReport {
  status: ProviderAdapterConformanceStatus;
  providerId: string;
  modelId: string;
  requestedMethod: ProviderMethodName;
  normalizedMethod: ProviderMethodName;
  supportedMethods: readonly ProviderMethodName[];
  adapterExecutionAuthorized: boolean;
  liveExecutionAuthorized: false;
  reasons: readonly string[];
}

// ---------------------------------------------------------------------------
// Conformance evaluator (pure local, no adapter.execute() call)
// ---------------------------------------------------------------------------

export const PROVIDER_ADAPTER_CONFORMANCE_VERSION =
  "cvf.providerAdapterConformance.p4c.v1" as const;

export function evaluateProviderAdapterConformance(
  input: ProviderAdapterConformanceInput,
): ProviderAdapterConformanceReport {
  const { providerId, modelId, method, adapter, capabilityRegistry } = input;

  const reasons: string[] = [];
  const normalizedMethod = normalizeProviderMethodName(method);

  // Rule 1: Adapter providerId must match the declared providerId
  if (adapter.providerId !== providerId) {
    reasons.push(
      `adapter_provider_mismatch: adapter.providerId="${adapter.providerId}" does not match providerId="${providerId}"`,
    );
  }

  // Rule 2: Provider/model must exist in the capability registry
  const lookup = findProviderCapability(capabilityRegistry, providerId, modelId);
  if (!lookup) {
    reasons.push(
      `missing_provider_capability: no capability entry found for provider="${providerId}" model="${modelId}"`,
    );
    // Cannot check method support without a registry entry; return blocked early
    return {
      status: "blocked",
      providerId,
      modelId,
      requestedMethod: method,
      normalizedMethod,
      supportedMethods: [],
      adapterExecutionAuthorized: false,
      liveExecutionAuthorized: false,
      reasons,
    };
  }

  const supportedMethods = listRegistrySupportedMethods(capabilityRegistry, providerId, modelId);

  // Rule 3: The requested method (or its normalized form) must be supported
  const methodSupported =
    supportsMethod(supportedMethods, method) ||
    supportsMethod(supportedMethods, normalizedMethod) ||
    (normalizedMethod === "complete" && supportsMethod(supportedMethods, "chat"));

  if (!methodSupported) {
    reasons.push(
      `unsupported_method: method="${method}" (normalized="${normalizedMethod}") not in supported=[${supportedMethods.join(", ")}] for provider="${providerId}" model="${modelId}"`,
    );
  }

  // Rule 4 (optional): Credential metadata must be available when caller requires it
  if (input.credentialMetadataAvailable === false) {
    reasons.push(
      `credential_metadata_unavailable: caller indicated credential metadata is not available`,
    );
  }

  const isConformant = reasons.length === 0;

  return {
    status: isConformant ? "conformant" : "blocked",
    providerId,
    modelId,
    requestedMethod: method,
    normalizedMethod,
    supportedMethods,
    adapterExecutionAuthorized: isConformant,
    liveExecutionAuthorized: false,
    reasons,
  };
}

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

function supportsMethod(
  supportedMethods: readonly ProviderMethodName[],
  method: ProviderMethodName,
): boolean {
  return supportedMethods.includes(method);
}
