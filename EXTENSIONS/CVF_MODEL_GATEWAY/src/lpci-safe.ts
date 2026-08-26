// LPCI1-WEB-R1 - package-safe Model Gateway entry for the LPCI query route
// and provider binding. Exports only the exact symbols those two consumers
// use. Deliberately does not re-export the package root barrel (src/index.ts),
// which pulls in Runtime Adapter Hub and External Integration owners through
// monorepo-relative imports that do not resolve once this package is
// installed under node_modules.

export type { CredentialReference } from "./credential-boundary";
export { CredentialBoundary } from "./credential-boundary";

export type { GatewayExecuteRequest } from "./unified-gateway-interface-contract";

export type { ProviderExecutionBridgeResult } from "./provider-execution-bridge";
export { ProviderExecutionBridge } from "./provider-execution-bridge";

export { ProviderHealthMonitor } from "./provider-health";
export { ProviderRegistry } from "./provider-registry";
export { QuotaLedger } from "./quota-ledger";
export { RoutingPolicyEngine } from "./routing-policy";

export { GatewayReceiptBuilder } from "./gateway-receipt";

export { PROVIDER_CAPABILITY_REGISTRY } from "./provider-capability-registry";
export { assertRegistryProviderMethodSupported } from "./provider-method-gate";

export type { OpenAiCompatibleFetch } from "./openai-compatible-execute-adapter";
export { createCredentialBoundOpenAiCompatibleExecuteAdapter } from "./openai-compatible-execute-adapter";
