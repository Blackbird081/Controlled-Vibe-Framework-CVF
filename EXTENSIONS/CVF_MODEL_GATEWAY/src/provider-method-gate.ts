import { LEGACY_PROVIDER_METHOD_ALIASES } from "./provider-capability-registry";
import type {
  ProviderCapabilityFile,
  ProviderCapabilityModel,
  ProviderMethodContract,
  ProviderMethodName,
} from "./provider-method-contract";

export class UnsupportedMethodError extends Error {
  constructor(
    public readonly providerId: string,
    public readonly modelId: string,
    public readonly method: ProviderMethodName,
  ) {
    super(`Unsupported provider method: ${providerId}/${modelId} does not support ${method}`);
    this.name = "UnsupportedMethodError";
  }
}

export interface ProviderCapabilityLookup {
  readonly capability: ProviderCapabilityFile;
  readonly model: ProviderCapabilityModel;
}

export function normalizeProviderMethodName(method: ProviderMethodName): ProviderMethodName {
  const aliases: Partial<Record<ProviderMethodName, ProviderMethodName>> =
    LEGACY_PROVIDER_METHOD_ALIASES;
  return aliases[method] ?? method;
}

export function assertProviderMethodSupported(
  capability: ProviderCapabilityFile,
  modelId: string,
  method: ProviderMethodName,
): void {
  const model = capability.models.find((entry) => entry.modelId === modelId);
  if (!model || !supportsProviderMethod(model.supportedMethods, method)) {
    throw new UnsupportedMethodError(capability.providerId, modelId, method);
  }
}

export function listSupportedMethods(
  capability: ProviderCapabilityFile,
  modelId: string,
): ProviderMethodName[] {
  return [...(capability.models.find((entry) => entry.modelId === modelId)?.supportedMethods ?? [])];
}

export function findProviderCapability(
  registry: readonly ProviderCapabilityFile[],
  providerId: string,
  modelId: string,
): ProviderCapabilityLookup | null {
  for (const capability of registry) {
    if (capability.providerId !== providerId) continue;
    const model = capability.models.find((entry) => entry.modelId === modelId);
    if (model) {
      return { capability, model };
    }
  }
  return null;
}

export function getProviderMethodContract(
  registry: readonly ProviderCapabilityFile[],
  providerId: string,
  modelId: string,
): ProviderMethodContract | null {
  const lookup = findProviderCapability(registry, providerId, modelId);
  if (!lookup) return null;
  return {
    providerId,
    modelId,
    supportedMethods: lookup.model.supportedMethods,
    defaultMethod: lookup.model.defaultMethod,
    capabilityRef: `${lookup.capability.capabilityRef ?? "provider-capability"}/${modelId}`,
  };
}

export function assertRegistryProviderMethodSupported(
  registry: readonly ProviderCapabilityFile[],
  providerId: string,
  modelId: string,
  method: ProviderMethodName,
): void {
  const lookup = findProviderCapability(registry, providerId, modelId);
  if (!lookup || !supportsProviderMethod(lookup.model.supportedMethods, method)) {
    throw new UnsupportedMethodError(providerId, modelId, method);
  }
}

export function listRegistrySupportedMethods(
  registry: readonly ProviderCapabilityFile[],
  providerId: string,
  modelId: string,
): ProviderMethodName[] {
  return [...(findProviderCapability(registry, providerId, modelId)?.model.supportedMethods ?? [])];
}

function supportsProviderMethod(
  supportedMethods: readonly ProviderMethodName[],
  method: ProviderMethodName,
): boolean {
  const normalized = normalizeProviderMethodName(method);
  return supportedMethods.includes(method)
    || supportedMethods.includes(normalized)
    || (normalized === "complete" && supportedMethods.includes("chat"));
}
