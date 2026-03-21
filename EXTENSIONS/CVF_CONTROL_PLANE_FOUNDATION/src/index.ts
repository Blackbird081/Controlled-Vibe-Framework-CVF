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

export function createControlPlaneFoundationShell(): ControlPlaneFoundationShell {
  return {
    intent: new IntentPipeline(),
    knowledge: new RAGPipeline(),
    reporting: new GovernanceCanvas(),
    context: new ContextFreezer(),
  };
}
