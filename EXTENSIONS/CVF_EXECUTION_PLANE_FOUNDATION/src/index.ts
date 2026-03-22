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
  MODEL_GATEWAY_WRAPPER,
  ReleaseEvidenceAdapter,
} from "../../CVF_MODEL_GATEWAY/src/index";

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

export interface ExecutionPlaneFoundationShell {
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

export function createExecutionPlaneFoundationShell(): ExecutionPlaneFoundationShell {
  return {
    gatewayWrapper: MODEL_GATEWAY_WRAPPER,
    guardEngine: createGuardEngine(),
    registry: createUnifiedRegistry(),
    memory: new SessionMemory("w2-t1-cp1-shell"),
    explainability: new ExplainabilityLayer("en"),
    releaseEvidence: new ReleaseEvidenceAdapter(),
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

function buildLineageList(): string[] {
  return [
    EXECUTION_PLANE_FOUNDATION_COORDINATION.mcpServer,
    EXECUTION_PLANE_FOUNDATION_COORDINATION.modelGateway,
    EXECUTION_PLANE_FOUNDATION_COORDINATION.runtimeAdapterHub,
  ];
}
