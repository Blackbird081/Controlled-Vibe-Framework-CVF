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
  GatewayReceiptEnvelope,
  GatewayReceiptInput,
  GatewayReceiptMemoryRecord,
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
  ProviderCapabilityModel,
  ProviderCapabilityOwnerRef,
  ProviderCapabilityOwnerRefName,
  ProviderCapabilityFile,
  ProviderMethodContract,
  ProviderMethodName,
} from "./provider-method-contract";
export {
  LEGACY_PROVIDER_METHOD_ALIASES,
  PROVIDER_CAPABILITY_OWNER_REFS,
  PROVIDER_CAPABILITY_REGISTRY,
  REVIEW_CVF_PROVIDER_METHODS,
} from "./provider-capability-registry";
export type {
  AlibabaFreeQuotaModelLedgerEntry,
  AlibabaFreeQuotaStatus,
} from "./alibaba-free-quota-model-ledger";
export {
  ALIBABA_DASHSCOPE_INTL_ENDPOINT,
  ALIBABA_DASHSCOPE_MAINLAND_ENDPOINT,
  ALIBABA_FREE_QUOTA_LEDGER_REFERENCE,
  ALIBABA_FREE_QUOTA_MODELS,
  getAlibabaFreeQuotaModel,
  getAlibabaFreeQuotaStatus,
  resolveAlibabaDashScopeEndpoint,
} from "./alibaba-free-quota-model-ledger";
export type {
  ProviderCapabilityLookup,
} from "./provider-method-gate";
export {
  assertProviderMethodSupported,
  assertRegistryProviderMethodSupported,
  findProviderCapability,
  getProviderMethodContract,
  listRegistrySupportedMethods,
  listSupportedMethods,
  normalizeProviderMethodName,
  UnsupportedMethodError,
} from "./provider-method-gate";

export type {
  ProviderFallbackDiagnosticClass,
  ProviderFallbackPosture,
  ProviderFallbackUserAction,
  ProviderMethodFailureInput,
  ProviderMethodFallbackEvaluation,
  ProviderMethodFallbackEvaluationInput,
  ProviderMethodFallbackStatus,
} from "./provider-method-fallback-normalization";
export {
  evaluateProviderMethodFallback,
  PROVIDER_METHOD_FALLBACK_NORMALIZATION_VERSION,
} from "./provider-method-fallback-normalization";

export type {
  StreamCapableProvider,
  StreamContract,
  StreamRequest,
} from "./stream-contract";
export {
  isStreamContract,
  STREAM_CONTRACT_REQUIRED_FIELDS,
} from "./stream-contract";

export type {
  VisionCapableProvider,
  VisionContract,
  VisionRequest,
} from "./vision-contract";
export {
  isVisionContract,
  VISION_CONTRACT_REQUIRED_FIELDS,
} from "./vision-contract";

export type {
  VisionRuntimeAdapterOptions,
  VisionRuntimeProvider,
  VisionRuntimeRequestBody,
} from "./vision-runtime-adapter";
export {
  assertVisionProviderCapability,
  buildVisionRuntimeRequestBody,
  createAlibabaVisionRuntimeAdapter,
  isVisionRuntimeModel,
  VISION_RUNTIME_CAPABLE_MODELS,
  VISION_RUNTIME_DEFAULT_MODELS,
} from "./vision-runtime-adapter";

export type {
  ReasoningCapableProvider,
  ReasoningContract,
  ReasoningRequest,
} from "./reasoning-contract";
export {
  isReasoningContract,
  REASONING_CONTRACT_REQUIRED_FIELDS,
} from "./reasoning-contract";

export type {
  JsonModeCapableProvider,
  JsonModeContract,
  JsonModeRequest,
} from "./json-mode-contract";
export {
  isJsonModeContract,
  JSON_MODE_CONTRACT_REQUIRED_FIELDS,
} from "./json-mode-contract";

export type {
  ToolCallCapableProvider,
  ToolCallContract,
  ToolCallRequest,
} from "./tool-call-contract";
export {
  isToolCallContract,
  TOOL_CALL_CONTRACT_REQUIRED_FIELDS,
} from "./tool-call-contract";

export type {
  EmbeddingCapableProvider,
  EmbeddingContract,
  EmbeddingRequest,
} from "./embedding-contract";
export {
  EMBEDDING_CONTRACT_REQUIRED_FIELDS,
  isEmbeddingContract,
} from "./embedding-contract";

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
  RoutingPolicyContractSnapshot,
  RoutingRequest,
  RoutingStageDecision,
} from "./routing-policy";
export {
  buildRoutingPolicyContractSnapshot,
  ROUTING_POLICY_CONTRACT_VERSION,
  RoutingPolicyEngine,
} from "./routing-policy";
export type {
  RoutingCandidate,
  RoutingPolicyPipelineRequest,
  RoutingPolicyPipelineResult,
} from "./routing-policy-pipeline";
export {
  collectAppliedRoutingPolicies,
  modelSupportsRequiredCapabilities,
  runRoutingPolicyPipeline,
  selectCandidateModel,
} from "./routing-policy-pipeline";

export type {
  DynamicModelRecord,
  DynamicModelRegistryContract,
  FindOptimalQuery,
  ModelTier,
} from "./dynamic-model-registry-contract";
export { DYNAMIC_MODEL_REGISTRY_CONTRACT_VERSION } from "./dynamic-model-registry-contract";

export type {
  GatewayErrorClass,
  GatewayErrorEnvelope,
  GatewayExecuteRequest,
  GatewayExecuteResponse,
  GatewayStreamRequest,
  GatewayStreamChunk,
  GatewayEmbeddingRequest,
  GatewayEmbeddingResponse,
  GatewayHealthResponse,
  UnifiedGatewayInterfaceContract,
} from "./unified-gateway-interface-contract";
export { UNIFIED_GATEWAY_INTERFACE_CONTRACT_VERSION } from "./unified-gateway-interface-contract";

export type { UnifiedGatewaySkeletonOptions } from "./unified-gateway-skeleton";
export { UnifiedGatewaySkeletonImpl } from "./unified-gateway-skeleton";

export type {
  ProviderExecutionAdapter,
  ProviderExecutionAdapterInput,
  ProviderExecutionAdapterResult,
  ProviderExecutionBridgeOptions,
  ProviderExecutionBridgeResult,
} from "./provider-execution-bridge";
export {
  ProviderExecutionBridge,
  PROVIDER_EXECUTION_BRIDGE_VERSION,
} from "./provider-execution-bridge";

export type {
  ProviderAdapterConformanceStatus,
  ProviderAdapterConformanceInput,
  ProviderAdapterConformanceReport,
} from "./provider-adapter-conformance";
export {
  evaluateProviderAdapterConformance,
  PROVIDER_ADAPTER_CONFORMANCE_VERSION,
} from "./provider-adapter-conformance";

export type {
  AdapterAdmissionOptions,
  AdapterAdmissionReasonCode,
  AdapterAdmissionRecord,
  AdapterAdmissionStatus,
} from "./provider-adapter-admission";
export {
  admitProviderAdapter,
  PROVIDER_ADAPTER_ADMISSION_VERSION,
} from "./provider-adapter-admission";

export type {
  CapabilityNegotiationResult,
  CapabilityNegotiationStatus,
} from "./provider-capability-negotiation";
export {
  negotiateProviderCapability,
  PROVIDER_CAPABILITY_NEGOTIATION_VERSION,
} from "./provider-capability-negotiation";

export type {
  BridgeAdmissionGuardResult,
  BridgeAdmissionVerdict,
} from "./provider-bridge-admission-guard";
export {
  checkBridgeAdmission,
  BRIDGE_ADMISSION_BOUNDARY_VERSION,
} from "./provider-bridge-admission-guard";

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
