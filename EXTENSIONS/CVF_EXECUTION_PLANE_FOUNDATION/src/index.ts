// W2-T11 — Execution Feedback Consumer Bridge (CP1–CP2)
export {
  ExecutionFeedbackConsumerPipelineContract,
  createExecutionFeedbackConsumerPipelineContract,
} from "./execution.feedback.consumer.pipeline.contract";
export type {
  ExecutionFeedbackConsumerPipelineRequest,
  ExecutionFeedbackConsumerPipelineResult,
  ExecutionFeedbackConsumerPipelineContractDependencies,
} from "./execution.feedback.consumer.pipeline.contract";
export {
  ExecutionFeedbackConsumerPipelineBatchContract,
  createExecutionFeedbackConsumerPipelineBatchContract,
} from "./execution.feedback.consumer.pipeline.batch.contract";
export type {
  ExecutionFeedbackConsumerPipelineBatch,
  ExecutionFeedbackConsumerPipelineBatchContractDependencies,
} from "./execution.feedback.consumer.pipeline.batch.contract";

// W6-T9 — Execution Audit Summary Slice (CP1)
export {
  ExecutionAuditSummaryContract,
  createExecutionAuditSummaryContract,
} from "./execution.audit.summary.contract";
export type {
  ExecutionAuditRisk,
  ExecutionAuditSummary,
  ExecutionAuditSummaryContractDependencies,
} from "./execution.audit.summary.contract";

// W2-T9 — Execution Multi-Agent Coordination Slice (CP1)
export {
  MultiAgentCoordinationContract,
  createMultiAgentCoordinationContract,
} from "./execution.multi.agent.coordination.contract";
export type {
  DistributionStrategy,
  CoordinationStatus,
  CoordinationPolicy,
  AgentAssignment,
  MultiAgentCoordinationResult,
  MultiAgentCoordinationContractDependencies,
} from "./execution.multi.agent.coordination.contract";

// W2-T9 — Execution Multi-Agent Coordination Slice (CP2)
export {
  MultiAgentCoordinationSummaryContract,
  createMultiAgentCoordinationSummaryContract,
} from "./execution.multi.agent.coordination.summary.contract";
export type {
  MultiAgentCoordinationSummary,
  MultiAgentCoordinationSummaryContractDependencies,
} from "./execution.multi.agent.coordination.summary.contract";

// W2-T10 — Execution Consumer Result Bridge Slice (CP1–CP2)
export {
  ExecutionConsumerResultContract,
  createExecutionConsumerResultContract,
} from "./execution.consumer.result.contract";
export type {
  ExecutionConsumerResultRequest,
  ExecutionConsumerResult,
  ExecutionConsumerResultContractDependencies,
} from "./execution.consumer.result.contract";
export {
  ExecutionConsumerResultBatchContract,
  createExecutionConsumerResultBatchContract,
} from "./execution.consumer.result.batch.contract";
export type {
  ExecutionConsumerResultBatch,
  ExecutionConsumerResultBatchContractDependencies,
} from "./execution.consumer.result.batch.contract";

// W6-T1 — Streaming Execution Slice (CP1–CP2)
export {
  StreamingExecutionContract,
  createStreamingExecutionContract,
} from "./execution.streaming.contract";
export type {
  StreamingChunkStatus,
  StreamingExecutionChunk,
  StreamingExecutionContractDependencies,
} from "./execution.streaming.contract";
export {
  StreamingExecutionAggregatorContract,
  createStreamingExecutionAggregatorContract,
} from "./execution.streaming.aggregator.contract";
export type {
  StreamingExecutionSummary,
  StreamingExecutionAggregatorContractDependencies,
} from "./execution.streaming.aggregator.contract";

// W2-T8 — Execution MCP Bridge Slice (CP1–CP2)
export {
  MCPInvocationContract,
  createMCPInvocationContract,
} from "./mcp.invocation.contract";
export type {
  MCPInvocationStatus,
  MCPInvocationRequest,
  MCPInvocationResult,
  MCPInvocationContractDependencies,
} from "./mcp.invocation.contract";
export {
  MCPInvocationBatchContract,
  createMCPInvocationBatchContract,
} from "./mcp.invocation.batch.contract";
export type {
  MCPInvocationBatch,
  MCPInvocationBatchContractDependencies,
} from "./mcp.invocation.batch.contract";

// W2-T7 — Execution Command Runtime Async Slice (CP1–CP2)
export {
  AsyncCommandRuntimeContract,
  createAsyncCommandRuntimeContract,
} from "./execution.async.runtime.contract";
export type {
  AsyncExecutionStatus,
  AsyncCommandRuntimeTicket,
  AsyncCommandRuntimeContractDependencies,
} from "./execution.async.runtime.contract";
export {
  AsyncExecutionStatusContract,
  createAsyncExecutionStatusContract,
} from "./execution.async.status.contract";
export type {
  AsyncExecutionStatusSummary,
  AsyncExecutionStatusContractDependencies,
} from "./execution.async.status.contract";

// W2-T6 — Execution Re-intake Loop (CP1–CP2)
export {
  ExecutionReintakeContract,
  createExecutionReintakeContract,
} from "./execution.reintake.contract";
export type {
  ReintakeAction,
  ExecutionReintakeRequest,
  ExecutionReintakeContractDependencies,
} from "./execution.reintake.contract";
export {
  ExecutionReintakeSummaryContract,
  createExecutionReintakeSummaryContract,
} from "./execution.reintake.summary.contract";
export type {
  ExecutionReintakeSummary,
  ExecutionReintakeSummaryContractDependencies,
} from "./execution.reintake.summary.contract";

// W2-T5 — Execution Feedback Routing Slice (CP1–CP2)
export {
  FeedbackRoutingContract,
  createFeedbackRoutingContract,
} from "./feedback.routing.contract";
export type {
  RoutingAction,
  RoutingPriority,
  FeedbackRoutingDecision,
  FeedbackRoutingContractDependencies,
} from "./feedback.routing.contract";
export {
  FeedbackResolutionContract,
  createFeedbackResolutionContract,
} from "./feedback.resolution.contract";
export type {
  UrgencyLevel,
  FeedbackResolutionSummary,
  FeedbackResolutionContractDependencies,
} from "./feedback.resolution.contract";

// W2-T4 — Execution Observer Slice (CP1–CP2)
export {
  ExecutionObserverContract,
  createExecutionObserverContract,
} from "./execution.observer.contract";
export type {
  OutcomeClass,
  ObservationCategory,
  ObservationNote,
  ExecutionObservation,
  ExecutionObserverContractDependencies,
} from "./execution.observer.contract";
export {
  ExecutionFeedbackContract,
  createExecutionFeedbackContract,
} from "./execution.feedback.contract";
export type {
  FeedbackClass,
  FeedbackPriority,
  ExecutionFeedbackSignal,
  ExecutionFeedbackContractDependencies,
} from "./execution.feedback.contract";

// W2-T3 — Bounded Execution Command Runtime (CP1–CP2)
export {
  CommandRuntimeContract,
  createCommandRuntimeContract,
} from "./command.runtime.contract";
export type {
  RuntimeExecutionStatus,
  RuntimeExecutionRecord,
  CommandRuntimeResult,
  CommandRuntimeContractDependencies,
} from "./command.runtime.contract";
export {
  ExecutionPipelineContract,
  createExecutionPipelineContract,
} from "./execution.pipeline.contract";
export type {
  ExecutionPipelineStage,
  ExecutionPipelineStageEntry,
  ExecutionPipelineReceipt,
  ExecutionPipelineContractDependencies,
} from "./execution.pipeline.contract";

// W2-T2 — Execution Dispatch Bridge (CP1–CP3)
export {
  DispatchContract,
  createDispatchContract,
} from "./dispatch.contract";
export type {
  DispatchEntry,
  DispatchResult,
  DispatchContractDependencies,
} from "./dispatch.contract";
export {
  PolicyGateContract,
  createPolicyGateContract,
} from "./policy.gate.contract";
export type {
  PolicyGateDecision,
  PolicyGateEntry,
  PolicyGateResult,
  PolicyGateContractDependencies,
} from "./policy.gate.contract";
export {
  ExecutionBridgeConsumerContract,
  createExecutionBridgeConsumerContract,
} from "./execution.bridge.consumer.contract";
export type {
  ExecutionBridgePipelineStage,
  ExecutionBridgePipelineStageEntry,
  ExecutionBridgeReceipt,
  ExecutionBridgeConsumerContractDependencies,
} from "./execution.bridge.consumer.contract";

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
  ParsedPolicyRule,
  CVFSkillDraft,
  ExternalSkillRaw,
  RawContentFormat,
  CVFSkillCertified,
} from "../../CVF_MODEL_GATEWAY/src/index";
export {
  OpenClawAdapter,
  PicoClawAdapter,
  ZeroClawAdapter,
  NanoAdapter,
  ReleaseEvidenceAdapter,
  executeFilesystemAction,
  executeHttpAction,
  NaturalPolicyParser,
  SkillAdapter,
  SkillValidator,
  SkillCertifier,
  MODEL_GATEWAY_WRAPPER,
} from "../../CVF_MODEL_GATEWAY/src/index";
export {
  GuardRuntimeEngine,
  createGuardEngine,
  PHASE_ORDER,
  PHASE_DESCRIPTIONS,
  RISK_DESCRIPTIONS,
  DEFAULT_GUARD_RUNTIME_CONFIG,
  UnifiedGuardRegistry,
  createUnifiedRegistry,
  SessionMemory,
  generateSystemPrompt,
  parseVibe,
  generateClarifications,
  generateConfirmationCard,
  formatCardAsText,
  MCP_TOOL_DESCRIPTIONS,
} from "../../CVF_ECO_v2.5_MCP_SERVER/src/sdk";
export type {
  Guard,
  GuardResult,
  GuardRequestContext,
  GuardPipelineResult,
  GuardAuditEntry,
  GuardRuntimeConfig,
  GuardDecision,
  GuardSeverity,
  CVFPhase,
  CVFRiskLevel,
  CVFRole,
  PromptContext,
  GeneratedPrompt,
  GuardMetadata,
  GuardCategory,
  RegisteredGuard,
  RegistryStats,
  ParsedVibe,
  VibeActionType,
  VibeEntity,
  VibeConstraint,
  ClarificationQuestion,
  ClarificationResult,
  ConfirmationCard,
  ConfirmationStep,
  MemoryEntry,
  SessionMemoryConfig,
  SessionSnapshot,
} from "../../CVF_ECO_v2.5_MCP_SERVER/src/sdk";

export {
  ExplainabilityLayer,
} from "../../CVF_v1.7.3_RUNTIME_ADAPTER_HUB/explainability/explainability.layer";
export type {
  ExplainLocale,
  IntentType,
  RiskLevel as ExplainRiskLevel,
  ExecutionAction,
  ExplainInput,
  HumanReadableExplanation,
} from "../../CVF_v1.7.3_RUNTIME_ADAPTER_HUB/explainability/explainability.layer";

export {
  defaultEdgeSecurityConfig,
} from "../../CVF_v1.7.3_RUNTIME_ADAPTER_HUB/edge_security/edge.config";
export type {
  EdgeSecurityConfig,
} from "../../CVF_v1.7.3_RUNTIME_ADAPTER_HUB/edge_security/edge.config";

import {
  GuardRuntimeEngine,
  createGuardEngine,
  UnifiedGuardRegistry,
  createUnifiedRegistry,
  SessionMemory,
  generateSystemPrompt,
  type GeneratedPrompt,
} from "../../CVF_ECO_v2.5_MCP_SERVER/src/sdk";
import { ExplainabilityLayer, type HumanReadableExplanation } from "../../CVF_v1.7.3_RUNTIME_ADAPTER_HUB/explainability/explainability.layer";
import { defaultEdgeSecurityConfig, type EdgeSecurityConfig } from "../../CVF_v1.7.3_RUNTIME_ADAPTER_HUB/edge_security/edge.config";
import {
  OpenClawAdapter,
  PicoClawAdapter,
  ZeroClawAdapter,
  NanoAdapter,
  NaturalPolicyParser,
  SkillAdapter,
  SkillValidator,
  SkillCertifier,
  MODEL_GATEWAY_WRAPPER,
  ReleaseEvidenceAdapter,
} from "../../CVF_MODEL_GATEWAY/src/index";
import {
  MCP_TOOL_DESCRIPTIONS,
  formatCardAsText,
  generateClarifications,
  generateConfirmationCard,
  parseVibe,
} from "../../CVF_ECO_v2.5_MCP_SERVER/src/sdk";

export const EXECUTION_PLANE_FOUNDATION_COORDINATION = {
  executionClass: "coordination package",
  mcpServer: "EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER",
  modelGateway: "EXTENSIONS/CVF_MODEL_GATEWAY",
  runtimeAdapterHub: "EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB",
  externalIntegrationReference: "EXTENSIONS/CVF_v1.2.1_EXTERNAL_INTEGRATION",
  initialPhysicalMoveExcluded: [
    "EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/guards",
    "EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/cli",
    "EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/index.ts",
  ],
  preservesLineage: true,
  rationale:
    "Creates one governed execution-plane shell while preserving source ownership, prior wrapper boundaries, and rollback safety.",
} as const;

export const EXECUTION_GATEWAY_WRAPPER_ALIGNMENT = {
  executionClass: "wrapper/re-export alignment",
  shellPackage: "EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION",
  sourcePackage: "EXTENSIONS/CVF_MODEL_GATEWAY",
  wrapperAnchor: MODEL_GATEWAY_WRAPPER.executionClass,
  adapterEntrypoints: [
    "OpenClawAdapter",
    "PicoClawAdapter",
    "ZeroClawAdapter",
    "NanoAdapter",
    "executeFilesystemAction",
    "executeHttpAction",
  ],
  policyEntrypoints: ["NaturalPolicyParser"],
  skillEntrypoints: ["SkillAdapter", "SkillValidator", "SkillCertifier"],
  evidenceEntrypoints: ["ReleaseEvidenceAdapter"],
  preservesLineage: true,
} as const;

export const EXECUTION_MCP_BRIDGE_ALIGNMENT = {
  executionClass: "wrapper/re-export alignment",
  shellPackage: "EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION",
  sourcePackage: "EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/sdk.ts",
  runtimeEntrypoints: [
    "createGuardEngine",
    "createUnifiedRegistry",
    "SessionMemory",
    "DEFAULT_GUARD_RUNTIME_CONFIG",
  ],
  promptEntrypoints: ["generateSystemPrompt", "MCP_TOOL_DESCRIPTIONS"],
  translationEntrypoints: [
    "parseVibe",
    "generateClarifications",
    "generateConfirmationCard",
    "formatCardAsText",
  ],
  deferredInternals:
    EXECUTION_PLANE_FOUNDATION_COORDINATION.initialPhysicalMoveExcluded,
  preservesLineage: true,
} as const;

export interface ExecutionGatewaySurface {
  alignment: typeof EXECUTION_GATEWAY_WRAPPER_ALIGNMENT;
  wrapper: typeof MODEL_GATEWAY_WRAPPER;
  adapters: {
    OpenClawAdapter: typeof OpenClawAdapter;
    PicoClawAdapter: typeof PicoClawAdapter;
    ZeroClawAdapter: typeof ZeroClawAdapter;
    NanoAdapter: typeof NanoAdapter;
  };
  policy: {
    NaturalPolicyParser: typeof NaturalPolicyParser;
  };
  skills: {
    SkillAdapter: typeof SkillAdapter;
    SkillValidator: typeof SkillValidator;
    SkillCertifier: typeof SkillCertifier;
  };
  evidence: {
    ReleaseEvidenceAdapter: typeof ReleaseEvidenceAdapter;
  };
}

export interface ExecutionMcpBridgeSurface {
  alignment: typeof EXECUTION_MCP_BRIDGE_ALIGNMENT;
  runtime: {
    createGuardEngine: typeof createGuardEngine;
    createUnifiedRegistry: typeof createUnifiedRegistry;
    SessionMemory: typeof SessionMemory;
  };
  prompt: {
    generateSystemPrompt: typeof generateSystemPrompt;
    MCP_TOOL_DESCRIPTIONS: typeof MCP_TOOL_DESCRIPTIONS;
  };
  translation: {
    parseVibe: typeof parseVibe;
    generateClarifications: typeof generateClarifications;
    generateConfirmationCard: typeof generateConfirmationCard;
    formatCardAsText: typeof formatCardAsText;
  };
}

export interface ExecutionPlaneFoundationShell {
  gateway: ExecutionGatewaySurface;
  mcpBridge: ExecutionMcpBridgeSurface;
  gatewayWrapper: typeof MODEL_GATEWAY_WRAPPER;
  guardEngine: GuardRuntimeEngine;
  registry: UnifiedGuardRegistry;
  memory: SessionMemory;
  explainability: ExplainabilityLayer;
  releaseEvidence: ReleaseEvidenceAdapter;
}

export interface ExecutionPlaneFoundationSummary {
  trancheId: "W2-T1";
  controlPointId: "CP1";
  generatedAt: string;
  coordination: typeof EXECUTION_PLANE_FOUNDATION_COORDINATION;
  gatewayWrapper: typeof MODEL_GATEWAY_WRAPPER;
  registeredGuardCount: number;
  enabledGuardCount: number;
  adapterSurface: string[];
  deferredSurface: readonly string[];
  textSurface: string;
  markdownSurface: string;
}

export interface ExecutionPlaneFoundationPromptPreview {
  trancheId: "W2-T1";
  controlPointId: "CP1";
  generatedAt: string;
  prompt: GeneratedPrompt;
}

export interface ExecutionPlaneWrapperAlignmentSummary {
  trancheId: "W2-T1";
  controlPointId: "CP2";
  generatedAt: string;
  shellPackage: "EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION";
  gatewayAlignment: typeof EXECUTION_GATEWAY_WRAPPER_ALIGNMENT;
  mcpBridgeAlignment: typeof EXECUTION_MCP_BRIDGE_ALIGNMENT;
  textSurface: string;
  markdownSurface: string;
}

export function createExecutionGatewaySurface(): ExecutionGatewaySurface {
  return {
    alignment: EXECUTION_GATEWAY_WRAPPER_ALIGNMENT,
    wrapper: MODEL_GATEWAY_WRAPPER,
    adapters: {
      OpenClawAdapter,
      PicoClawAdapter,
      ZeroClawAdapter,
      NanoAdapter,
    },
    policy: {
      NaturalPolicyParser,
    },
    skills: {
      SkillAdapter,
      SkillValidator,
      SkillCertifier,
    },
    evidence: {
      ReleaseEvidenceAdapter,
    },
  };
}

export function createExecutionMcpBridgeSurface(): ExecutionMcpBridgeSurface {
  return {
    alignment: EXECUTION_MCP_BRIDGE_ALIGNMENT,
    runtime: {
      createGuardEngine,
      createUnifiedRegistry,
      SessionMemory,
    },
    prompt: {
      generateSystemPrompt,
      MCP_TOOL_DESCRIPTIONS,
    },
    translation: {
      parseVibe,
      generateClarifications,
      generateConfirmationCard,
      formatCardAsText,
    },
  };
}

export function createExecutionPlaneFoundationShell(): ExecutionPlaneFoundationShell {
  const gateway = createExecutionGatewaySurface();
  const mcpBridge = createExecutionMcpBridgeSurface();

  return {
    gateway,
    mcpBridge,
    gatewayWrapper: gateway.wrapper,
    guardEngine: mcpBridge.runtime.createGuardEngine(),
    registry: mcpBridge.runtime.createUnifiedRegistry(),
    memory: new mcpBridge.runtime.SessionMemory("w2-t1-cp1-shell"),
    explainability: new ExplainabilityLayer("en"),
    releaseEvidence: new gateway.evidence.ReleaseEvidenceAdapter(),
  };
}

export function describeExecutionPlaneFoundationShell(): ExecutionPlaneFoundationSummary {
  const shell = createExecutionPlaneFoundationShell();
  const generatedAt = new Date().toISOString();
  const stats = shell.registry.getStats();
  const adapterSurface = [
    "OpenClawAdapter",
    "PicoClawAdapter",
    "ZeroClawAdapter",
    "NanoAdapter",
    "ReleaseEvidenceAdapter",
    "ExplainabilityLayer",
  ];
  const deferredSurface =
    EXECUTION_PLANE_FOUNDATION_COORDINATION.initialPhysicalMoveExcluded;

  return {
    trancheId: "W2-T1",
    controlPointId: "CP1",
    generatedAt,
    coordination: EXECUTION_PLANE_FOUNDATION_COORDINATION,
    gatewayWrapper: MODEL_GATEWAY_WRAPPER,
    registeredGuardCount: stats.totalGuards,
    enabledGuardCount: stats.enabledGuards,
    adapterSurface,
    deferredSurface,
    textSurface: buildExecutionPlaneTextSurface(generatedAt, stats, adapterSurface),
    markdownSurface: buildExecutionPlaneMarkdownSurface(
      generatedAt,
      stats,
      adapterSurface,
    ),
  };
}

export function createExecutionPlanePromptPreview(): ExecutionPlaneFoundationPromptPreview {
  const generatedAt = new Date().toISOString();
  const prompt = generateSystemPrompt({
    agentId: "w2-t1-cp1-shell",
    phase: "BUILD",
    projectName: "W2-T1 execution-plane foundation shell",
    userConstraints: ["no implicit deploy", "no governance bypass"],
    mcpToolsAvailable: true,
    language: "en",
  });

  return {
    trancheId: "W2-T1",
    controlPointId: "CP1",
    generatedAt,
    prompt,
  };
}

export function describeExecutionPlaneWrapperAlignment(): ExecutionPlaneWrapperAlignmentSummary {
  const generatedAt = new Date().toISOString();

  return {
    trancheId: "W2-T1",
    controlPointId: "CP2",
    generatedAt,
    shellPackage: "EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION",
    gatewayAlignment: EXECUTION_GATEWAY_WRAPPER_ALIGNMENT,
    mcpBridgeAlignment: EXECUTION_MCP_BRIDGE_ALIGNMENT,
    textSurface: buildExecutionPlaneWrapperAlignmentTextSurface(generatedAt),
    markdownSurface: buildExecutionPlaneWrapperAlignmentMarkdownSurface(generatedAt),
  };
}

// =============================================
// CP3 — Adapter Evidence & Explainability Integration
// =============================================

export const EXECUTION_ADAPTER_EVIDENCE_ALIGNMENT = {
  executionClass: "coordination package" as const,
  controlPoint: "CP3" as const,
  shellPackage: "EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION" as const,
  explainabilitySource: "EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/explainability" as const,
  releaseEvidenceSource: "EXTENSIONS/CVF_MODEL_GATEWAY" as const,
  adapterInventory: [
    "OpenClawAdapter",
    "PicoClawAdapter",
    "ZeroClawAdapter",
    "NanoAdapter",
  ] as const,
  evidenceEntrypoints: ["ReleaseEvidenceAdapter", "ExplainabilityLayer"] as const,
  preservesLineage: true as const,
} as const;

export interface ExecutionAdapterEvidenceSurface {
  alignment: typeof EXECUTION_ADAPTER_EVIDENCE_ALIGNMENT;
  explainability: {
    layer: ExplainabilityLayer;
    supportedLocales: readonly string[];
    sampleExplanation: HumanReadableExplanation;
  };
  releaseEvidence: {
    adapter: ReleaseEvidenceAdapter;
  };
  adapterInventory: {
    registered: readonly string[];
    count: number;
  };
}

export interface ExecutionAdapterEvidenceSummary {
  trancheId: "W2-T1";
  controlPointId: "CP3";
  generatedAt: string;
  alignment: typeof EXECUTION_ADAPTER_EVIDENCE_ALIGNMENT;
  explainabilityLocales: readonly string[];
  sampleExplanation: HumanReadableExplanation;
  registeredAdapters: readonly string[];
  adapterCount: number;
  textSurface: string;
  markdownSurface: string;
}

export function createExecutionAdapterEvidenceSurface(): ExecutionAdapterEvidenceSurface {
  const layer = new ExplainabilityLayer("en");
  const sampleExplanation = layer.explain({
    intentType: "CODE_EXECUTION",
    riskLevel: "MEDIUM",
    riskScore: 45,
    action: "ESCALATE",
  });

  return {
    alignment: EXECUTION_ADAPTER_EVIDENCE_ALIGNMENT,
    explainability: {
      layer,
      supportedLocales: ["vi", "en"],
      sampleExplanation,
    },
    releaseEvidence: {
      adapter: new ReleaseEvidenceAdapter(),
    },
    adapterInventory: {
      registered: EXECUTION_ADAPTER_EVIDENCE_ALIGNMENT.adapterInventory,
      count: EXECUTION_ADAPTER_EVIDENCE_ALIGNMENT.adapterInventory.length,
    },
  };
}

export function describeExecutionAdapterEvidence(): ExecutionAdapterEvidenceSummary {
  const surface = createExecutionAdapterEvidenceSurface();
  const generatedAt = new Date().toISOString();

  return {
    trancheId: "W2-T1",
    controlPointId: "CP3",
    generatedAt,
    alignment: EXECUTION_ADAPTER_EVIDENCE_ALIGNMENT,
    explainabilityLocales: surface.explainability.supportedLocales,
    sampleExplanation: surface.explainability.sampleExplanation,
    registeredAdapters: surface.adapterInventory.registered,
    adapterCount: surface.adapterInventory.count,
    textSurface: buildAdapterEvidenceTextSurface(generatedAt, surface),
    markdownSurface: buildAdapterEvidenceMarkdownSurface(generatedAt, surface),
  };
}

// =============================================
// CP4 — Selected Execution Authorization Boundary Alignment
// =============================================


export const EXECUTION_AUTHORIZATION_BOUNDARY_ALIGNMENT = {
  executionClass: "wrapper/re-export" as const,
  controlPoint: "CP4" as const,
  shellPackage: "EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION" as const,
  policyContractSource: "EXTENSIONS/CVF_MODEL_GATEWAY (via CVF_v1.7.3_RUNTIME_ADAPTER_HUB/contracts)" as const,
  edgeSecuritySource: "EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/edge_security" as const,
  authorizationTypes: [
    "PolicyDecision",
    "PolicyContract",
    "PolicyEvaluationRequest",
    "PolicyEvaluationResult",
    "EdgeSecurityConfig",
  ] as const,
  deferredInternals: [
    "EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/guards",
    "EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/cli",
  ] as const,
  preservesLineage: true as const,
} as const;

export interface ExecutionAuthorizationBoundarySurface {
  alignment: typeof EXECUTION_AUTHORIZATION_BOUNDARY_ALIGNMENT;
  policy: {
    decisionTypes: readonly string[];
    contractSurface: string;
  };
  edgeSecurity: {
    config: EdgeSecurityConfig;
    enabledCapabilities: readonly string[];
  };
  guardBoundary: {
    registeredGuardCount: number;
    enabledGuardCount: number;
  };
}

export interface ExecutionAuthorizationBoundarySummary {
  trancheId: "W2-T1";
  controlPointId: "CP4";
  generatedAt: string;
  alignment: typeof EXECUTION_AUTHORIZATION_BOUNDARY_ALIGNMENT;
  policyDecisionTypes: readonly string[];
  edgeSecurityCapabilities: readonly string[];
  registeredGuardCount: number;
  enabledGuardCount: number;
  textSurface: string;
  markdownSurface: string;
}

export function createExecutionAuthorizationBoundarySurface(): ExecutionAuthorizationBoundarySurface {
  const registry = createUnifiedRegistry();
  const stats = registry.getStats();
  const config = defaultEdgeSecurityConfig;

  const enabledCapabilities: string[] = [];
  if (config.enablePIIMasking) enabledCapabilities.push("PII Masking");
  if (config.enableSecretMasking) enabledCapabilities.push("Secret Masking");
  if (config.enableInjectionPrecheck) enabledCapabilities.push("Injection Precheck");
  if (config.enableAuditLog) enabledCapabilities.push("Audit Log");

  return {
    alignment: EXECUTION_AUTHORIZATION_BOUNDARY_ALIGNMENT,
    policy: {
      decisionTypes: ["allow", "deny", "review", "sandbox", "pending"],
      contractSurface: "PolicyContract.evaluate(request) → PolicyEvaluationResult",
    },
    edgeSecurity: {
      config,
      enabledCapabilities,
    },
    guardBoundary: {
      registeredGuardCount: stats.totalGuards,
      enabledGuardCount: stats.enabledGuards,
    },
  };
}

export function describeExecutionAuthorizationBoundary(): ExecutionAuthorizationBoundarySummary {
  const surface = createExecutionAuthorizationBoundarySurface();
  const generatedAt = new Date().toISOString();

  return {
    trancheId: "W2-T1",
    controlPointId: "CP4",
    generatedAt,
    alignment: EXECUTION_AUTHORIZATION_BOUNDARY_ALIGNMENT,
    policyDecisionTypes: surface.policy.decisionTypes,
    edgeSecurityCapabilities: surface.edgeSecurity.enabledCapabilities,
    registeredGuardCount: surface.guardBoundary.registeredGuardCount,
    enabledGuardCount: surface.guardBoundary.enabledGuardCount,
    textSurface: buildAuthorizationBoundaryTextSurface(generatedAt, surface),
    markdownSurface: buildAuthorizationBoundaryMarkdownSurface(generatedAt, surface),
  };
}

function buildExecutionPlaneTextSurface(
  generatedAt: string,
  stats: { totalGuards: number; enabledGuards: number },
  adapterSurface: string[],
): string {
  return [
    "=".repeat(72),
    "  CVF W2-T1 CP1 Execution-Plane Foundation Shell",
    "=".repeat(72),
    "Tranche: W2-T1",
    "Control Point: CP1",
    `Execution Class: ${EXECUTION_PLANE_FOUNDATION_COORDINATION.executionClass}`,
    `Generated At: ${generatedAt}`,
    `Source Lineage: ${buildLineageList().join(", ")}`,
    `Gateway Wrapper Anchor: ${MODEL_GATEWAY_WRAPPER.executionClass}`,
    `Registered Guards: ${stats.totalGuards}`,
    `Enabled Guards: ${stats.enabledGuards}`,
    `Adapter Surface: ${adapterSurface.join(", ")}`,
    `Deferred Initial Surfaces: ${EXECUTION_PLANE_FOUNDATION_COORDINATION.initialPhysicalMoveExcluded.join(
      ", ",
    )}`,
  ].join("\n");
}

function buildExecutionPlaneMarkdownSurface(
  generatedAt: string,
  stats: { totalGuards: number; enabledGuards: number },
  adapterSurface: string[],
): string {
  return [
    "# CVF W2-T1 CP1 Execution-Plane Foundation Shell",
    "",
    `> Tranche: \`W2-T1\``,
    `> Control Point: \`CP1\``,
    `> Execution Class: \`${EXECUTION_PLANE_FOUNDATION_COORDINATION.executionClass}\``,
    `> Generated At: \`${generatedAt}\``,
    "",
    "## Source Lineage",
    "",
    ...buildLineageList().map((lineage) => `- \`${lineage}\``),
    "",
    "## Shell Readout",
    "",
    `- gateway wrapper anchor: \`${MODEL_GATEWAY_WRAPPER.executionClass}\``,
    `- registered guards: \`${stats.totalGuards}\``,
    `- enabled guards: \`${stats.enabledGuards}\``,
    `- adapter surface: \`${adapterSurface.join(", ")}\``,
    "",
    "## Deferred Initial Surfaces",
    "",
    ...EXECUTION_PLANE_FOUNDATION_COORDINATION.initialPhysicalMoveExcluded.map(
      (surface) => `- \`${surface}\``,
    ),
  ].join("\n");
}

function buildExecutionPlaneWrapperAlignmentTextSurface(generatedAt: string): string {
  return [
    "=".repeat(72),
    "  CVF W2-T1 CP2 MCP And Gateway Wrapper Alignment",
    "=".repeat(72),
    "Tranche: W2-T1",
    "Control Point: CP2",
    `Generated At: ${generatedAt}`,
    `Gateway Wrapper Anchor: ${EXECUTION_GATEWAY_WRAPPER_ALIGNMENT.wrapperAnchor}`,
    `Gateway Entrypoints: ${EXECUTION_GATEWAY_WRAPPER_ALIGNMENT.adapterEntrypoints.join(", ")}, ${EXECUTION_GATEWAY_WRAPPER_ALIGNMENT.policyEntrypoints.join(", ")}, ${EXECUTION_GATEWAY_WRAPPER_ALIGNMENT.skillEntrypoints.join(", ")}, ${EXECUTION_GATEWAY_WRAPPER_ALIGNMENT.evidenceEntrypoints.join(", ")}`,
    `MCP Entrypoints: ${EXECUTION_MCP_BRIDGE_ALIGNMENT.runtimeEntrypoints.join(", ")}, ${EXECUTION_MCP_BRIDGE_ALIGNMENT.promptEntrypoints.join(", ")}, ${EXECUTION_MCP_BRIDGE_ALIGNMENT.translationEntrypoints.join(", ")}`,
    `Deferred Initial Surfaces: ${EXECUTION_MCP_BRIDGE_ALIGNMENT.deferredInternals.join(", ")}`,
  ].join("\n");
}

function buildExecutionPlaneWrapperAlignmentMarkdownSurface(generatedAt: string): string {
  return [
    "# CVF W2-T1 CP2 MCP And Gateway Wrapper Alignment",
    "",
    `> Tranche: \`W2-T1\``,
    `> Control Point: \`CP2\``,
    `> Generated At: \`${generatedAt}\``,
    "",
    "## Gateway Wrapper Boundary",
    "",
    `- shell package: \`${EXECUTION_GATEWAY_WRAPPER_ALIGNMENT.shellPackage}\``,
    `- source package: \`${EXECUTION_GATEWAY_WRAPPER_ALIGNMENT.sourcePackage}\``,
    `- wrapper anchor: \`${EXECUTION_GATEWAY_WRAPPER_ALIGNMENT.wrapperAnchor}\``,
    ...EXECUTION_GATEWAY_WRAPPER_ALIGNMENT.adapterEntrypoints.map(
      (entrypoint) => `- gateway adapter entrypoint: \`${entrypoint}\``,
    ),
    ...EXECUTION_GATEWAY_WRAPPER_ALIGNMENT.policyEntrypoints.map(
      (entrypoint) => `- gateway policy entrypoint: \`${entrypoint}\``,
    ),
    ...EXECUTION_GATEWAY_WRAPPER_ALIGNMENT.skillEntrypoints.map(
      (entrypoint) => `- gateway skill entrypoint: \`${entrypoint}\``,
    ),
    ...EXECUTION_GATEWAY_WRAPPER_ALIGNMENT.evidenceEntrypoints.map(
      (entrypoint) => `- gateway evidence entrypoint: \`${entrypoint}\``,
    ),
    "",
    "## MCP Bridge Boundary",
    "",
    `- shell package: \`${EXECUTION_MCP_BRIDGE_ALIGNMENT.shellPackage}\``,
    `- source package: \`${EXECUTION_MCP_BRIDGE_ALIGNMENT.sourcePackage}\``,
    ...EXECUTION_MCP_BRIDGE_ALIGNMENT.runtimeEntrypoints.map(
      (entrypoint) => `- mcp runtime entrypoint: \`${entrypoint}\``,
    ),
    ...EXECUTION_MCP_BRIDGE_ALIGNMENT.promptEntrypoints.map(
      (entrypoint) => `- mcp prompt entrypoint: \`${entrypoint}\``,
    ),
    ...EXECUTION_MCP_BRIDGE_ALIGNMENT.translationEntrypoints.map(
      (entrypoint) => `- mcp translation entrypoint: \`${entrypoint}\``,
    ),
    "",
    "## Deferred Initial Surfaces",
    "",
    ...EXECUTION_MCP_BRIDGE_ALIGNMENT.deferredInternals.map(
      (surface) => `- \`${surface}\``,
    ),
  ].join("\n");
}

function buildLineageList(): string[] {
  return [
    EXECUTION_PLANE_FOUNDATION_COORDINATION.mcpServer,
    EXECUTION_PLANE_FOUNDATION_COORDINATION.modelGateway,
    EXECUTION_PLANE_FOUNDATION_COORDINATION.runtimeAdapterHub,
  ];
}

function buildAdapterEvidenceTextSurface(
  generatedAt: string,
  surface: ExecutionAdapterEvidenceSurface,
): string {
  return [
    "=".repeat(72),
    "  CVF W2-T1 CP3 Adapter Evidence And Explainability Integration",
    "=".repeat(72),
    "Tranche: W2-T1",
    "Control Point: CP3",
    `Execution Class: ${EXECUTION_ADAPTER_EVIDENCE_ALIGNMENT.executionClass}`,
    `Generated At: ${generatedAt}`,
    `Explainability Source: ${EXECUTION_ADAPTER_EVIDENCE_ALIGNMENT.explainabilitySource}`,
    `Release Evidence Source: ${EXECUTION_ADAPTER_EVIDENCE_ALIGNMENT.releaseEvidenceSource}`,
    `Supported Locales: ${surface.explainability.supportedLocales.join(", ")}`,
    `Registered Adapters: ${surface.adapterInventory.registered.join(", ")}`,
    `Adapter Count: ${surface.adapterInventory.count}`,
    `Sample Explanation Summary: ${surface.explainability.sampleExplanation.summary}`,
    `Sample Explanation Details: ${surface.explainability.sampleExplanation.details}`,
    `Sample Risk Message: ${surface.explainability.sampleExplanation.riskMessage}`,
  ].join("\n");
}

function buildAdapterEvidenceMarkdownSurface(
  generatedAt: string,
  surface: ExecutionAdapterEvidenceSurface,
): string {
  return [
    "# CVF W2-T1 CP3 Adapter Evidence And Explainability Integration",
    "",
    `> Tranche: \`W2-T1\``,
    `> Control Point: \`CP3\``,
    `> Execution Class: \`${EXECUTION_ADAPTER_EVIDENCE_ALIGNMENT.executionClass}\``,
    `> Generated At: \`${generatedAt}\``,
    "",
    "## Explainability Surface",
    "",
    `- source: \`${EXECUTION_ADAPTER_EVIDENCE_ALIGNMENT.explainabilitySource}\``,
    `- supported locales: \`${surface.explainability.supportedLocales.join(", ")}\``,
    `- sample explanation summary: \`${surface.explainability.sampleExplanation.summary}\``,
    `- sample risk message: \`${surface.explainability.sampleExplanation.riskMessage}\``,
    "",
    "## Release Evidence Surface",
    "",
    `- source: \`${EXECUTION_ADAPTER_EVIDENCE_ALIGNMENT.releaseEvidenceSource}\``,
    ...EXECUTION_ADAPTER_EVIDENCE_ALIGNMENT.evidenceEntrypoints.map(
      (ep) => `- evidence entrypoint: \`${ep}\``,
    ),
    "",
    "## Adapter Inventory",
    "",
    ...surface.adapterInventory.registered.map(
      (adapter) => `- registered adapter: \`${adapter}\``,
    ),
    `- total count: \`${surface.adapterInventory.count}\``,
  ].join("\n");
}

function buildAuthorizationBoundaryTextSurface(
  generatedAt: string,
  surface: ExecutionAuthorizationBoundarySurface,
): string {
  return [
    "=".repeat(72),
    "  CVF W2-T1 CP4 Selected Execution Authorization Boundary Alignment",
    "=".repeat(72),
    "Tranche: W2-T1",
    "Control Point: CP4",
    `Execution Class: ${EXECUTION_AUTHORIZATION_BOUNDARY_ALIGNMENT.executionClass}`,
    `Generated At: ${generatedAt}`,
    `Policy Decision Types: ${surface.policy.decisionTypes.join(", ")}`,
    `Policy Contract Surface: ${surface.policy.contractSurface}`,
    `Edge Security Config: PII=${surface.edgeSecurity.config.enablePIIMasking}, Secret=${surface.edgeSecurity.config.enableSecretMasking}, Injection=${surface.edgeSecurity.config.enableInjectionPrecheck}, Audit=${surface.edgeSecurity.config.enableAuditLog}`,
    `Edge Security Capabilities: ${surface.edgeSecurity.enabledCapabilities.join(", ")}`,
    `Guard Boundary: ${surface.guardBoundary.registeredGuardCount} registered, ${surface.guardBoundary.enabledGuardCount} enabled`,
  ].join("\n");
}

function buildAuthorizationBoundaryMarkdownSurface(
  generatedAt: string,
  surface: ExecutionAuthorizationBoundarySurface,
): string {
  return [
    "# CVF W2-T1 CP4 Selected Execution Authorization Boundary Alignment",
    "",
    `> Tranche: \`W2-T1\``,
    `> Control Point: \`CP4\``,
    `> Execution Class: \`${EXECUTION_AUTHORIZATION_BOUNDARY_ALIGNMENT.executionClass}\``,
    `> Generated At: \`${generatedAt}\``,
    "",
    "## Policy Authorization Boundary",
    "",
    `- contract surface: \`${surface.policy.contractSurface}\``,
    ...surface.policy.decisionTypes.map(
      (dt) => `- decision type: \`${dt}\``,
    ),
    "",
    "## Edge Security Boundary",
    "",
    ...surface.edgeSecurity.enabledCapabilities.map(
      (cap) => `- enabled capability: \`${cap}\``,
    ),
    `- masking token prefix: \`${surface.edgeSecurity.config.maskingTokenPrefix}\``,
    "",
    "## Guard Boundary",
    "",
    `- registered guards: \`${surface.guardBoundary.registeredGuardCount}\``,
    `- enabled guards: \`${surface.guardBoundary.enabledGuardCount}\``,
    "",
    "## Deferred Internals",
    "",
    ...EXECUTION_AUTHORIZATION_BOUNDARY_ALIGNMENT.deferredInternals.map(
      (d) => `- \`${d}\``,
    ),
  ].join("\n");
}
