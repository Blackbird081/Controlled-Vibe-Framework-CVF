// W1-T5 — AI Boardroom Reverse Prompting (CP1–CP2)
export {
  ReversePromptingContract,
  createReversePromptingContract,
} from "./reverse.prompting.contract";
export type {
  QuestionCategory,
  QuestionPriority,
  ClarificationQuestion,
  SignalAnalysis,
  ReversePromptPacket,
  ReversePromptingContractDependencies,
} from "./reverse.prompting.contract";
export {
  ClarificationRefinementContract,
  createClarificationRefinementContract,
} from "./clarification.refinement.contract";
export type {
  ClarificationAnswer,
  RefinementEnrichment,
  RefinedIntakeRequest,
  ClarificationRefinementContractDependencies,
} from "./clarification.refinement.contract";

// W1-T4 — Control-Plane AI Gateway Slice (CP1–CP2)
export {
  AIGatewayContract,
  createAIGatewayContract,
} from "./ai.gateway.contract";
export type {
  GatewaySignalType,
  GatewayEnvContext,
  GatewayPrivacyConfig,
  GatewaySignalRequest,
  GatewayPrivacyReport,
  GatewayEnvMetadata,
  GatewayProcessedRequest,
  AIGatewayContractDependencies,
} from "./ai.gateway.contract";
export {
  GatewayConsumerContract,
  createGatewayConsumerContract,
} from "./gateway.consumer.contract";
export type {
  GatewayConsumptionStage,
  GatewayConsumptionStageEntry,
  GatewayConsumptionReceipt,
  GatewayConsumerContractDependencies,
} from "./gateway.consumer.contract";

export { IntentPipeline } from "../../CVF_ECO_v1.0_INTENT_VALIDATION/src/intent.pipeline";
export { IntentParser } from "../../CVF_ECO_v1.0_INTENT_VALIDATION/src/intent.parser";
export {
  SchemaMapper,
  resetRuleCounter,
} from "../../CVF_ECO_v1.0_INTENT_VALIDATION/src/schema.mapper";
export {
  ConstraintGenerator,
  resetConstraintCounter,
} from "../../CVF_ECO_v1.0_INTENT_VALIDATION/src/constraint.generator";
export {
  DOMAIN_REGISTRY,
  findDomains,
  findActions,
} from "../../CVF_ECO_v1.0_INTENT_VALIDATION/src/domain.registry";
export type {
  Domain,
  EnforcementLevel,
  IntentResult,
  GovernanceRule,
  RuntimeConstraint,
  ValidatedIntent,
  DomainDefinition,
  RiskLevel as IntentRiskLevel,
} from "../../CVF_ECO_v1.0_INTENT_VALIDATION/src/types";

export { RAGPipeline } from "../../CVF_ECO_v1.4_RAG_PIPELINE/src/rag.pipeline";
export {
  DocumentStore,
  resetDocCounter,
} from "../../CVF_ECO_v1.4_RAG_PIPELINE/src/document.store";
export { Retriever } from "../../CVF_ECO_v1.4_RAG_PIPELINE/src/retriever";
export type {
  RetrievalTier,
  DocumentType,
  RAGDocument,
  RAGQuery,
  RAGResult,
  TierConfig,
} from "../../CVF_ECO_v1.4_RAG_PIPELINE/src/types";
export { DEFAULT_TIER_CONFIG } from "../../CVF_ECO_v1.4_RAG_PIPELINE/src/types";

export { GovernanceCanvas } from "../../CVF_ECO_v2.1_GOVERNANCE_CANVAS/src/canvas";
export { MetricsCollector } from "../../CVF_ECO_v2.1_GOVERNANCE_CANVAS/src/metrics.collector";
export { ReportRenderer } from "../../CVF_ECO_v2.1_GOVERNANCE_CANVAS/src/report.renderer";
export type {
  Verdict,
  SessionSnapshot,
  GovernanceMetrics,
  CanvasReport,
  CanvasConfig,
  RiskLevel as CanvasRiskLevel,
} from "../../CVF_ECO_v2.1_GOVERNANCE_CANVAS/src/types";
export { DEFAULT_CANVAS_CONFIG } from "../../CVF_ECO_v2.1_GOVERNANCE_CANVAS/src/types";

export { ContextFreezer } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/context.freezer";
export {
  computeDeterministicHash,
  verifyHash,
} from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
export type { ContextSnapshot } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/types/index";

export {
  CVF_RISK_SCORE_MAP,
  scoreToRiskLevel,
  riskLevelToScore,
} from "../../CVF_v1.7_CONTROLLED_INTELLIGENCE/core/governance/risk.mapping";
export type { CVFRiskLevel } from "../../CVF_v1.7_CONTROLLED_INTELLIGENCE/core/governance/risk.mapping";
export {
  getRiskLabel,
  formatRiskDisplay,
  getAllRiskLabels,
} from "../../CVF_v1.7_CONTROLLED_INTELLIGENCE/core/governance/risk.labels";
export type {
  SupportedLocale,
  NonCoderRiskLabel,
} from "../../CVF_v1.7_CONTROLLED_INTELLIGENCE/core/governance/risk.labels";
export {
  runtimeToCVFRisk,
  cvfToRuntimeRisk,
  normalizeRuntimeScore,
  runtimeRiskToDisplay,
} from "../../CVF_v1.7_CONTROLLED_INTELLIGENCE/integration/risk.bridge";
export {
  segmentContext,
  pruneContext,
  injectSummary,
  createFork,
  canAccessScope,
} from "../../CVF_v1.7_CONTROLLED_INTELLIGENCE/intelligence/context_segmentation/context.segmenter";
export type {
  SegmentedContext,
} from "../../CVF_v1.7_CONTROLLED_INTELLIGENCE/intelligence/context_segmentation/context.segmenter";
export type {
  ContextChunk,
  PhaseSummary,
  MemoryBoundary,
  ForkedSession,
} from "../../CVF_v1.7_CONTROLLED_INTELLIGENCE/intelligence/context_segmentation/context.types";
export { AgentRole } from "../../CVF_v1.7_CONTROLLED_INTELLIGENCE/intelligence/role_transition_guard/role.types";
export {
  ReasoningMode,
  resolveTemperature,
} from "../../CVF_v1.7_CONTROLLED_INTELLIGENCE/intelligence/determinism_control/temperature.policy";
export { resolveReasoningMode } from "../../CVF_v1.7_CONTROLLED_INTELLIGENCE/intelligence/determinism_control/reasoning.mode";
export type {
  ReasoningInput,
  ReasoningConfig,
  ReasoningDecision,
  ReasoningResult,
} from "../../CVF_v1.7_CONTROLLED_INTELLIGENCE/intelligence/reasoning_gate/reasoning.types";
export type {
  ReproducibilitySnapshot,
} from "../../CVF_v1.7_CONTROLLED_INTELLIGENCE/intelligence/determinism_control/reproducibility.snapshot";
export {
  ControlPlaneIntakeContract,
  createControlPlaneIntakeContract,
  packageIntakeContext,
} from "./intake.contract";
export type {
  IntakeContextChunk,
  IntakePackagedContext,
  ControlPlaneIntakeRequest,
  ControlPlaneIntakeRetrievalOptions,
  ControlPlaneIntakeRetrievalSurface,
  ControlPlaneIntakeResult,
  ControlPlaneIntakeContractDependencies,
} from "./intake.contract";
export {
  RetrievalContract,
  createRetrievalContract,
  mapDocument,
  resolveSource,
  matchesFilters,
  readStringFilter,
  readStringList,
} from "./retrieval.contract";
export type {
  RetrievalChunk,
  RetrievalRequestOptions,
  RetrievalRequest,
  RetrievalResultSurface,
  RetrievalContractDependencies,
} from "./retrieval.contract";
export {
  PackagingContract,
  createPackagingContract,
  estimateTokenCount,
  serializeChunks,
  sortValue,
} from "./packaging.contract";
export type {
  PackagingChunk,
  PackagingRequest,
  PackagingResultSurface,
  PackagingContractDependencies,
  FreezeReceipt,
} from "./packaging.contract";
export {
  ConsumerContract,
  createConsumerContract,
  buildPipelineStages,
} from "./consumer.contract";
export type {
  ConsumerRequest,
  ConsumptionReceipt,
  ConsumerContractDependencies,
} from "./consumer.contract";
export {
  DesignContract,
  createDesignContract,
} from "./design.contract";
export type {
  DesignPlan,
  DesignTask,
  DesignAgentRole,
  DesignTaskRisk,
  DesignTaskPhase,
  DesignContractDependencies,
} from "./design.contract";
export {
  BoardroomContract,
  createBoardroomContract,
} from "./boardroom.contract";
export type {
  BoardroomSession,
  BoardroomRequest,
  BoardroomSessionDecision,
  BoardroomDecision,
  ClarificationEntry,
  ClarificationStatus,
  BoardroomContractDependencies,
} from "./boardroom.contract";
export {
  OrchestrationContract,
  createOrchestrationContract,
} from "./orchestration.contract";
export type {
  TaskAssignment,
  OrchestrationResult,
  OrchestrationContractDependencies,
} from "./orchestration.contract";
export {
  DesignConsumerContract,
  createDesignConsumerContract,
} from "./design.consumer.contract";
export type {
  DesignConsumptionReceipt,
  DesignPipelineStage,
  DesignPipelineStageEntry,
  DesignConsumerContractDependencies,
} from "./design.consumer.contract";

import { IntentPipeline } from "../../CVF_ECO_v1.0_INTENT_VALIDATION/src/intent.pipeline";
import { RAGPipeline } from "../../CVF_ECO_v1.4_RAG_PIPELINE/src/rag.pipeline";
import { GovernanceCanvas } from "../../CVF_ECO_v2.1_GOVERNANCE_CANVAS/src/canvas";
import type {
  CanvasReport,
  SessionSnapshot,
} from "../../CVF_ECO_v2.1_GOVERNANCE_CANVAS/src/types";
import { ContextFreezer } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/context.freezer";

export const CONTROL_PLANE_FOUNDATION_COORDINATION = {
  executionClass: "coordination package",
  intentValidation: "EXTENSIONS/CVF_ECO_v1.0_INTENT_VALIDATION",
  ragPipeline: "EXTENSIONS/CVF_ECO_v1.4_RAG_PIPELINE",
  governanceCanvas: "EXTENSIONS/CVF_ECO_v2.1_GOVERNANCE_CANVAS",
  deterministicReproducibility: "EXTENSIONS/CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY",
  selectedControlledIntelligenceReferences: [
    "EXTENSIONS/CVF_v1.7_CONTROLLED_INTELLIGENCE",
  ],
  initialPhysicalMoveExcluded: [
    "EXTENSIONS/CVF_v1.7_CONTROLLED_INTELLIGENCE",
  ],
  preservesLineage: true,
  rationale:
    "Creates one governed control-plane shell while preserving source ownership and rollback safety.",
} as const;

export const CONTROL_PLANE_SELECTED_INTELLIGENCE_ALIGNMENT = {
  controlPointId: "CP4",
  executionClass: "wrapper/re-export",
  sourceModule: "EXTENSIONS/CVF_v1.7_CONTROLLED_INTELLIGENCE",
  includedSurfaces: [
    "core/governance/risk.mapping",
    "core/governance/risk.labels",
    "integration/risk.bridge",
    "intelligence/context_segmentation/context.segmenter",
    "intelligence/context_segmentation/context.types",
    "intelligence/context_segmentation/memory.boundary",
    "intelligence/reasoning_gate/reasoning.types",
    "intelligence/determinism_control/reasoning.mode",
    "intelligence/determinism_control/temperature.policy",
    "intelligence/role_transition_guard/role.types",
  ],
  deferredSurfaces: [
    "intelligence/reasoning_gate/controlled.reasoning",
    "intelligence/role_transition_guard/recursion.guard",
    "core/governance/verification_policy/verification.engine",
  ],
  preservesLineage: true,
  physicalConsolidation: false,
  rationale:
    "Aligns selected v1.7 helper/type surfaces to the control-plane shell without absorbing runtime-critical reasoning execution.",
} as const;

export interface ControlPlaneFoundationShell {
  intent: IntentPipeline;
  knowledge: RAGPipeline;
  reporting: GovernanceCanvas;
  context: ContextFreezer;
}

export interface ControlPlaneEvidenceSurfaceOptions {
  reportTitle?: string;
  evidenceTitle?: string;
  includeSessionDetails?: boolean;
  knowledgeSources?: string[];
  frozenContextHashes?: string[];
  notes?: string[];
}

export interface ControlPlaneEvidenceSurface {
  trancheId: "W1-T1";
  controlPointId: "CP3";
  generatedAt: string;
  coordination: typeof CONTROL_PLANE_FOUNDATION_COORDINATION;
  report: CanvasReport;
  textSurface: string;
  markdownSurface: string;
}

export function createControlPlaneFoundationShell(): ControlPlaneFoundationShell {
  return {
    intent: new IntentPipeline(),
    knowledge: new RAGPipeline(),
    reporting: new GovernanceCanvas(),
    context: new ContextFreezer(),
  };
}

export function createControlPlaneEvidenceSurface(
  sessions: SessionSnapshot[],
  options: ControlPlaneEvidenceSurfaceOptions = {},
): ControlPlaneEvidenceSurface {
  const shell = createControlPlaneFoundationShell();
  const reportTitle = options.reportTitle ?? "CVF Control Plane Governance Canvas";
  const evidenceTitle =
    options.evidenceTitle ?? "CVF W1-T1 CP3 Control-Plane Review Surface";
  const generatedAt = new Date().toISOString();

  shell.reporting = new GovernanceCanvas({
    title: reportTitle,
    includeSessionDetails: options.includeSessionDetails ?? true,
  });
  shell.reporting.addSessions(sessions);
  const report = shell.reporting.generateReport();
  const textSurface = buildControlPlaneEvidenceTextSurface(
    evidenceTitle,
    generatedAt,
    report,
    options,
  );
  const markdownSurface = buildControlPlaneEvidenceMarkdownSurface(
    evidenceTitle,
    generatedAt,
    report,
    options,
  );

  return {
    trancheId: "W1-T1",
    controlPointId: "CP3",
    generatedAt,
    coordination: CONTROL_PLANE_FOUNDATION_COORDINATION,
    report,
    textSurface,
    markdownSurface,
  };
}

function buildControlPlaneEvidenceTextSurface(
  evidenceTitle: string,
  generatedAt: string,
  report: CanvasReport,
  options: ControlPlaneEvidenceSurfaceOptions,
): string {
  const lines = [
    "=".repeat(72),
    `  ${evidenceTitle}`,
    "=".repeat(72),
    `Tranche: W1-T1`,
    `Control Point: CP3`,
    `Execution Class: ${CONTROL_PLANE_FOUNDATION_COORDINATION.executionClass}`,
    `Generated At: ${generatedAt}`,
    `Source Lineage: ${buildLineageList().join(", ")}`,
  ];

  if (options.knowledgeSources && options.knowledgeSources.length > 0) {
    lines.push(`Knowledge Sources: ${options.knowledgeSources.join(", ")}`);
  }

  if (options.frozenContextHashes && options.frozenContextHashes.length > 0) {
    lines.push(`Frozen Context Hashes: ${options.frozenContextHashes.join(", ")}`);
  }

  if (options.notes && options.notes.length > 0) {
    lines.push(`Notes: ${options.notes.join(" | ")}`);
  }

  lines.push("");
  lines.push(report.textReport);

  return lines.join("\n");
}

function buildControlPlaneEvidenceMarkdownSurface(
  evidenceTitle: string,
  generatedAt: string,
  report: CanvasReport,
  options: ControlPlaneEvidenceSurfaceOptions,
): string {
  const lines = [
    `# ${evidenceTitle}`,
    "",
    `> Tranche: \`W1-T1\``,
    `> Control Point: \`CP3\``,
    `> Execution Class: \`${CONTROL_PLANE_FOUNDATION_COORDINATION.executionClass}\``,
    `> Generated At: \`${generatedAt}\``,
    "",
    "## Source Lineage",
    "",
    ...buildLineageList().map((lineage) => `- \`${lineage}\``),
  ];

  if (options.knowledgeSources && options.knowledgeSources.length > 0) {
    lines.push("");
    lines.push("## Knowledge Sources");
    lines.push("");
    lines.push(...options.knowledgeSources.map((source) => `- \`${source}\``));
  }

  if (options.frozenContextHashes && options.frozenContextHashes.length > 0) {
    lines.push("");
    lines.push("## Frozen Context Hashes");
    lines.push("");
    lines.push(
      ...options.frozenContextHashes.map((hash) => `- \`${hash}\``),
    );
  }

  if (options.notes && options.notes.length > 0) {
    lines.push("");
    lines.push("## Notes");
    lines.push("");
    lines.push(...options.notes.map((note) => `- ${note}`));
  }

  lines.push("");
  lines.push("## Governance Canvas Report");
  lines.push("");
  lines.push(report.markdownReport);

  return lines.join("\n");
}

function buildLineageList(): string[] {
  return [
    CONTROL_PLANE_FOUNDATION_COORDINATION.intentValidation,
    CONTROL_PLANE_FOUNDATION_COORDINATION.ragPipeline,
    CONTROL_PLANE_FOUNDATION_COORDINATION.governanceCanvas,
    CONTROL_PLANE_FOUNDATION_COORDINATION.deterministicReproducibility,
  ];
}
