export type {
  LLMRequest,
  LLMUsage,
  LLMResponse,
  LLMAdapter,
  RuntimeCapability,
  RuntimeContext,
  RuntimeRequest,
  RuntimeResult,
  RuntimeAdapter,
  ToolExecutionContext,
  ToolRequest,
  ToolResult,
  ToolAdapter,
  MemoryContext,
  MemorySetRequest,
  MemoryGetRequest,
  MemoryDeleteRequest,
  MemoryListRequest,
  MemoryAdapter,
  PolicyDecision,
  PolicyContext,
  PolicyEvaluationRequest,
  PolicyEvaluationResult,
  PolicyContract,
} from "../../CVF_v1.7.3_RUNTIME_ADAPTER_HUB/contracts/index";

export {
  OpenClawAdapter,
  PicoClawAdapter,
  ZeroClawAdapter,
  NanoAdapter,
  ReleaseEvidenceAdapter,
  executeFilesystemAction,
  executeHttpAction,
} from "../../CVF_v1.7.3_RUNTIME_ADAPTER_HUB/adapters/index";

export {
  NaturalPolicyParser,
} from "../../CVF_v1.7.3_RUNTIME_ADAPTER_HUB/policy/natural.policy.parser";

export type {
  ParsedPolicyRule,
} from "../../CVF_v1.7.3_RUNTIME_ADAPTER_HUB/policy/natural.policy.parser";

export { SkillAdapter } from "../../CVF_v1.2.1_EXTERNAL_INTEGRATION/skill.adapter";
export { SkillValidator } from "../../CVF_v1.2.1_EXTERNAL_INTEGRATION/skill.validator";
export { SkillCertifier } from "../../CVF_v1.2.1_EXTERNAL_INTEGRATION/skill.certifier";

export type { CVFSkillDraft } from "../../CVF_v1.2.1_EXTERNAL_INTEGRATION/models/cvf-skill.draft";
export type { ExternalSkillRaw, RawContentFormat } from "../../CVF_v1.2.1_EXTERNAL_INTEGRATION/models/external-skill.raw";
export type { CVFSkillCertified } from "../../CVF_v1.2.1_EXTERNAL_INTEGRATION/models/cvf-skill.certified";

export type {
  GatewayPolicyContext,
  GatewayPolicyResult,
} from "./gateway-policy";
export { isPolicyAllowed } from "./gateway-policy";

export type {
  GatewayRiskClass,
  ProviderModel,
  ProviderRecord,
  ProviderSelectionOptions,
  ProviderStatus,
} from "./provider-registry";
export { ProviderRegistry } from "./provider-registry";

export type {
  ProviderHealthRecord,
  ProviderHealthState,
} from "./provider-health";
export { ProviderHealthMonitor } from "./provider-health";

export type {
  QuotaDecision,
  QuotaLimit,
  QuotaRequest,
  QuotaUsage,
} from "./quota-ledger";
export { QuotaLedger } from "./quota-ledger";

export type {
  GatewayReceipt,
  GatewayReceiptInput,
} from "./gateway-receipt";
export {
  GatewayReceiptBuilder,
  sanitizeReceiptMetadata,
} from "./gateway-receipt";

export type {
  ProviderExitClass,
  ProviderExitClassification,
  ProviderJsonEnvelope,
  ProviderOutputMode,
  ProviderStdoutPolicy,
  ProviderStreamChunk,
} from "./provider-output-contract";
export {
  assertProviderStdoutPolicy,
  classifyProviderExitCode,
  parseProviderJsonEnvelope,
  parseProviderNdjsonStream,
  PROVIDER_OUTPUT_EXIT_CODES,
  PROVIDER_STDOUT_POLICY,
} from "./provider-output-contract";

export type {
  CredentialMetadata,
  CredentialReference,
} from "./credential-boundary";
export {
  CredentialBoundary,
  fingerprintSecret,
  redactSecret,
} from "./credential-boundary";

export type {
  FallbackAttempt,
  FallbackDecision,
  FallbackPolicyConfig,
} from "./fallback-policy";
export { FallbackPolicy } from "./fallback-policy";

export type {
  StickySessionLookupOptions,
  StickySessionRecord,
} from "./sticky-session";
export { StickySessionStore } from "./sticky-session";

export type {
  RoutingDecision,
  RoutingRequest,
} from "./routing-policy";
export { RoutingPolicyEngine } from "./routing-policy";

export const MODEL_GATEWAY_WRAPPER = {
  executionClass: "wrapper/re-export merge",
  runtimeOwnership: "implementation-owner upgrade",
  runtimeAdapterHub: "EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB",
  externalIntegration: "EXTENSIONS/CVF_v1.2.1_EXTERNAL_INTEGRATION",
  freellmapiSourceLineage: ".private_reference/legacy/CVF 16.5/freellmapi",
  preservesRiskModelAssets: true,
  preservesReleaseEvidencePaths: true,
  enforcesGuardContractBeforeRouting: true,
} as const;
