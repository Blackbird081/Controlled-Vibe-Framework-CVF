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
