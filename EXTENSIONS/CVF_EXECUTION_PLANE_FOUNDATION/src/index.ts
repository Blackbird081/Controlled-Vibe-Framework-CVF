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

import {
  GuardRuntimeEngine,
  createGuardEngine,
  UnifiedGuardRegistry,
  createUnifiedRegistry,
  SessionMemory,
  generateSystemPrompt,
  type GeneratedPrompt,
} from "../../CVF_ECO_v2.5_MCP_SERVER/src/sdk";
import { ExplainabilityLayer } from "../../CVF_v1.7.3_RUNTIME_ADAPTER_HUB/explainability/explainability.layer";
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
