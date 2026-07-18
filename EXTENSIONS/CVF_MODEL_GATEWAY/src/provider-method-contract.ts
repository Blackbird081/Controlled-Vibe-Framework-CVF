export type ProviderMethodName =
  | "complete"
  | "chat"
  | "stream"
  | "tool_call"
  | "reasoning"
  | "json_mode"
  | "vision"
  | "embedding"
  | "receipt";

export type ProviderCapabilityOwnerRefName = "retry" | "cost" | "risk";

export interface ProviderCapabilityOwnerRef {
  readonly name: ProviderCapabilityOwnerRefName;
  readonly ownerSurface: string;
  readonly status: "existing_owner_surface";
  readonly reference: string;
}

export interface ProviderCapabilityModel {
  readonly modelId: string;
  readonly supportedMethods: readonly ProviderMethodName[];
  readonly defaultMethod: ProviderMethodName;
  readonly metadata?: Record<string, unknown>;
}

export interface ProviderMethodContract {
  readonly providerId: string;
  readonly modelId: string;
  readonly supportedMethods: readonly ProviderMethodName[];
  readonly defaultMethod: ProviderMethodName;
  readonly capabilityRef: string;
}

export interface ProviderCapabilityFile {
  readonly contractVersion?: "cvf.providerCapability.v1";
  readonly providerId: string;
  readonly capabilityRef?: string;
  readonly ownerRefs?: readonly ProviderCapabilityOwnerRef[];
  readonly models: readonly ProviderCapabilityModel[];
}
