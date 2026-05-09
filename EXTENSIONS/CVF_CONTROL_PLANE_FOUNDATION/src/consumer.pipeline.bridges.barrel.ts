// CVF CPF Consumer Pipeline Bridges Barrel
// This file aggregates all consumer.pipeline bridge re-exports from CPF.
// Owned by: CVF_CONTROL_PLANE_FOUNDATION/src/index.ts (extracted per GC-023 barrel split)
// Split rationale: index.ts exceeded 1000-line hard threshold; consumer bridge block extracted
//   to domain barrel. index.ts now re-exports via: export * from "./consumer.pipeline.bridges.barrel"

// W2-T38 — Retrieval Consumer Pipeline Bridge (CP1)
export {
  RetrievalConsumerPipelineContract,
  createRetrievalConsumerPipelineContract,
} from "./retrieval.consumer.pipeline.contract";
export type {
  RetrievalConsumerPipelineRequest,
  RetrievalConsumerPipelineResult,
  RetrievalConsumerPipelineContractDependencies,
} from "./retrieval.consumer.pipeline.contract";

// W2-T38 — Retrieval Consumer Pipeline Batch (CP2)
export {
  RetrievalConsumerPipelineBatchContract,
  createRetrievalConsumerPipelineBatchContract,
} from "./retrieval.consumer.pipeline.batch.contract";
export type {
  RetrievalConsumerPipelineBatchResult,
  RetrievalConsumerPipelineBatchContractDependencies,
} from "./retrieval.consumer.pipeline.batch.contract";

// W2-T37 — Knowledge Query Batch Consumer Pipeline Bridge (CP1)
export {
  KnowledgeQueryBatchConsumerPipelineContract,
  createKnowledgeQueryBatchConsumerPipelineContract,
} from "./knowledge.query.batch.consumer.pipeline.contract";
export type {
  KnowledgeQueryBatchConsumerPipelineRequest,
  KnowledgeQueryBatchConsumerPipelineResult,
  KnowledgeQueryBatchConsumerPipelineContractDependencies,
} from "./knowledge.query.batch.consumer.pipeline.contract";

// W2-T37 — Knowledge Query Batch Consumer Pipeline Batch (CP2)
export {
  KnowledgeQueryBatchConsumerPipelineBatchContract,
  createKnowledgeQueryBatchConsumerPipelineBatchContract,
} from "./knowledge.query.batch.consumer.pipeline.batch.contract";
export type {
  KnowledgeQueryBatchConsumerPipelineBatchResult,
  KnowledgeQueryBatchConsumerPipelineBatchContractDependencies,
} from "./knowledge.query.batch.consumer.pipeline.batch.contract";

// W2-T36 — Context Build Batch Consumer Pipeline Bridge (CP1)
export {
  ContextBuildBatchConsumerPipelineContract,
  createContextBuildBatchConsumerPipelineContract,
} from "./context.build.batch.consumer.pipeline.contract";
export type {
  ContextBuildBatchConsumerPipelineRequest,
  ContextBuildBatchConsumerPipelineResult,
  ContextBuildBatchConsumerPipelineContractDependencies,
} from "./context.build.batch.consumer.pipeline.contract";

// W2-T36 — Context Build Batch Consumer Pipeline Batch (CP2)
export {
  ContextBuildBatchConsumerPipelineBatchContract,
  createContextBuildBatchConsumerPipelineBatchContract,
} from "./context.build.batch.consumer.pipeline.batch.contract";
export type {
  ContextBuildBatchConsumerPipelineBatchResult,
  ContextBuildBatchConsumerPipelineBatchContractDependencies,
} from "./context.build.batch.consumer.pipeline.batch.contract";

// W2-T35 — Context Packager Consumer Pipeline Bridge (CP1)
export {
  ContextPackagerConsumerPipelineContract,
  createContextPackagerConsumerPipelineContract,
} from "./context.packager.consumer.pipeline.contract";
export type {
  ContextPackagerConsumerPipelineRequest,
  ContextPackagerConsumerPipelineResult,
  ContextPackagerConsumerPipelineContractDependencies,
} from "./context.packager.consumer.pipeline.contract";

// W2-T35 — Context Packager Consumer Pipeline Batch (CP2)
export {
  ContextPackagerConsumerPipelineBatchContract,
  createContextPackagerConsumerPipelineBatchContract,
} from "./context.packager.consumer.pipeline.batch.contract";
export type {
  ContextPackagerConsumerPipelineBatchResult,
  ContextPackagerConsumerPipelineBatchContractDependencies,
} from "./context.packager.consumer.pipeline.batch.contract";

// W2-T34 — Context Enrichment Consumer Pipeline Bridge (CP1)
export {
  ContextEnrichmentConsumerPipelineContract,
  createContextEnrichmentConsumerPipelineContract,
} from "./context.enrichment.consumer.pipeline.contract";
export type {
  ContextEnrichmentConsumerPipelineRequest,
  ContextEnrichmentConsumerPipelineResult,
  ContextEnrichmentConsumerPipelineContractDependencies,
} from "./context.enrichment.consumer.pipeline.contract";

// W2-T34 — Context Enrichment Consumer Pipeline Batch (CP2)
export {
  ContextEnrichmentConsumerPipelineBatchContract,
  createContextEnrichmentConsumerPipelineBatchContract,
} from "./context.enrichment.consumer.pipeline.batch.contract";
export type {
  ContextEnrichmentConsumerPipelineBatchResult,
  ContextEnrichmentConsumerPipelineBatchContractDependencies,
} from "./context.enrichment.consumer.pipeline.batch.contract";

// W2-T33 — Boardroom Round Consumer Pipeline Bridge (CP1)
export {
  BoardroomRoundConsumerPipelineContract,
  createBoardroomRoundConsumerPipelineContract,
} from "./boardroom.round.consumer.pipeline.contract";
export type {
  BoardroomRoundConsumerPipelineRequest,
  BoardroomRoundConsumerPipelineResult,
  BoardroomRoundConsumerPipelineContractDependencies,
} from "./boardroom.round.consumer.pipeline.contract";

// W2-T33 — Boardroom Round Consumer Pipeline Batch (CP2)
export {
  BoardroomRoundConsumerPipelineBatchContract,
  createBoardroomRoundConsumerPipelineBatchContract,
} from "./boardroom.round.consumer.pipeline.batch.contract";
export type {
  BoardroomRoundConsumerPipelineBatchResult,
  BoardroomRoundConsumerPipelineBatchContractDependencies,
  BoardroomRoundFocusCounts,
  DominantRefinementFocus,
} from "./boardroom.round.consumer.pipeline.batch.contract";

// W2-T32 — Context Build Consumer Pipeline Bridge (CP1)
export {
  ContextBuildConsumerPipelineContract,
  createContextBuildConsumerPipelineContract,
} from "./context.build.consumer.pipeline.contract";
export type {
  ContextBuildConsumerPipelineRequest,
  ContextBuildConsumerPipelineResult,
  ContextBuildConsumerPipelineContractDependencies,
} from "./context.build.consumer.pipeline.contract";

// W2-T32 — Context Build Consumer Pipeline Batch (CP2)
export {
  ContextBuildConsumerPipelineBatchContract,
  createContextBuildConsumerPipelineBatchContract,
} from "./context.build.consumer.pipeline.batch.contract";
export type {
  ContextBuildConsumerPipelineBatchResult,
  ContextBuildConsumerPipelineBatchContractDependencies,
} from "./context.build.consumer.pipeline.batch.contract";

// W2-T31 — Boardroom Transition Gate Consumer Pipeline Bridge (CP1)
export {
  BoardroomTransitionGateConsumerPipelineContract,
  createBoardroomTransitionGateConsumerPipelineContract,
} from "./boardroom.transition.gate.consumer.pipeline.contract";
export type {
  BoardroomTransitionGateConsumerPipelineRequest,
  BoardroomTransitionGateConsumerPipelineResult,
  BoardroomTransitionGateConsumerPipelineContractDependencies,
} from "./boardroom.transition.gate.consumer.pipeline.contract";

// W2-T31 — Boardroom Transition Gate Consumer Pipeline Batch (CP2)
export {
  BoardroomTransitionGateConsumerPipelineBatchContract,
  createBoardroomTransitionGateConsumerPipelineBatchContract,
} from "./boardroom.transition.gate.consumer.pipeline.batch.contract";
export type {
  BoardroomTransitionGateConsumerPipelineBatchResult,
  BoardroomTransitionGateConsumerPipelineBatchContractDependencies,
} from "./boardroom.transition.gate.consumer.pipeline.batch.contract";

// W2-T30 — Boardroom Multi-Round Consumer Pipeline Bridge (CP1)
export {
  BoardroomMultiRoundConsumerPipelineContract,
  createBoardroomMultiRoundConsumerPipelineContract,
} from "./boardroom.multi.round.consumer.pipeline.contract";
export type {
  BoardroomMultiRoundConsumerPipelineRequest,
  BoardroomMultiRoundConsumerPipelineResult,
  BoardroomMultiRoundConsumerPipelineContractDependencies,
} from "./boardroom.multi.round.consumer.pipeline.contract";

// W2-T30 — Boardroom Multi-Round Consumer Pipeline Batch (CP2)
export {
  BoardroomMultiRoundConsumerPipelineBatchContract,
  createBoardroomMultiRoundConsumerPipelineBatchContract,
} from "./boardroom.multi.round.consumer.pipeline.batch.contract";
export type {
  BoardroomMultiRoundConsumerPipelineBatchResult,
  BoardroomMultiRoundConsumerPipelineBatchContractDependencies,
} from "./boardroom.multi.round.consumer.pipeline.batch.contract";

// W1-T30 — Route Match Consumer Bridge (CP1–CP2)
export {
  RouteMatchConsumerPipelineContract,
  createRouteMatchConsumerPipelineContract,
} from "./route.match.consumer.pipeline.contract";
export type {
  RouteMatchConsumerPipelineRequest,
  RouteMatchConsumerPipelineResult,
  RouteMatchConsumerPipelineContractDependencies,
} from "./route.match.consumer.pipeline.contract";
export {
  RouteMatchConsumerPipelineBatchContract,
  createRouteMatchConsumerPipelineBatchContract,
} from "./route.match.consumer.pipeline.batch.contract";
export type {
  RouteMatchConsumerPipelineBatchResult,
  RouteMatchConsumerPipelineBatchContractDependencies,
} from "./route.match.consumer.pipeline.batch.contract";

// W1-T29 — Intake Consumer Bridge (CP1–CP2)
export {
  IntakeConsumerPipelineContract,
  createIntakeConsumerPipelineContract,
} from "./intake.consumer.pipeline.contract";
export type {
  IntakeConsumerPipelineRequest,
  IntakeConsumerPipelineResult,
  IntakeConsumerPipelineContractDependencies,
} from "./intake.consumer.pipeline.contract";
export {
  IntakeConsumerPipelineBatchContract,
  createIntakeConsumerPipelineBatchContract,
} from "./intake.consumer.pipeline.batch.contract";
export type {
  IntakeConsumerPipelineBatchResult,
  IntakeConsumerPipelineBatchContractDependencies,
} from "./intake.consumer.pipeline.batch.contract";

// W1-T28 — AI Gateway Consumer Bridge (CP1–CP2)
export {
  AIGatewayConsumerPipelineContract,
  createAIGatewayConsumerPipelineContract,
} from "./ai.gateway.consumer.pipeline.contract";
export type {
  AIGatewayConsumerPipelineRequest,
  AIGatewayConsumerPipelineResult,
  AIGatewayConsumerPipelineContractDependencies,
} from "./ai.gateway.consumer.pipeline.contract";
export {
  AIGatewayConsumerPipelineBatchContract,
  createAIGatewayConsumerPipelineBatchContract,
} from "./ai.gateway.consumer.pipeline.batch.contract";
export type {
  AIGatewayConsumerPipelineBatchResult,
  AIGatewayConsumerPipelineBatchContractDependencies,
} from "./ai.gateway.consumer.pipeline.batch.contract";

// W1-T22 — Knowledge Query Consumer Bridge (CP1–CP2)
export {
  KnowledgeQueryConsumerPipelineContract,
  createKnowledgeQueryConsumerPipelineContract,
} from "./knowledge.query.consumer.pipeline.contract";
export type {
  KnowledgeQueryConsumerPipelineRequest,
  KnowledgeQueryConsumerPipelineResult,
  KnowledgeQueryConsumerPipelineContractDependencies,
} from "./knowledge.query.consumer.pipeline.contract";
export {
  KnowledgeQueryConsumerPipelineBatchContract,
  createKnowledgeQueryConsumerPipelineBatchContract,
} from "./knowledge.query.consumer.pipeline.batch.contract";
export type {
  KnowledgeQueryConsumerPipelineBatch,
  KnowledgeQueryConsumerPipelineBatchContractDependencies,
} from "./knowledge.query.consumer.pipeline.batch.contract";

// W2-T26 — Design Consumer Bridge (CP1–CP2)
export {
  DesignConsumerPipelineContract,
  createDesignConsumerPipelineContract,
} from "./design.consumer.pipeline.contract";
export type {
  DesignConsumerPipelineRequest,
  DesignConsumerPipelineResult,
  DesignConsumerPipelineContractDependencies,
} from "./design.consumer.pipeline.contract";
export {
  DesignConsumerPipelineBatchContract,
  createDesignConsumerPipelineBatchContract,
} from "./design.consumer.pipeline.batch.contract";
export type {
  DesignConsumerPipelineBatchResult,
  DesignConsumerPipelineBatchContractDependencies,
} from "./design.consumer.pipeline.batch.contract";

// W1-T25 — Route Match Log Consumer Bridge (CP1–CP2)
export {
  RouteMatchLogConsumerPipelineContract,
  createRouteMatchLogConsumerPipelineContract,
} from "./route.match.log.consumer.pipeline.contract";
export type {
  RouteMatchLogConsumerPipelineRequest,
  RouteMatchLogConsumerPipelineResult,
  RouteMatchLogConsumerPipelineContractDependencies,
} from "./route.match.log.consumer.pipeline.contract";
export {
  RouteMatchLogConsumerPipelineBatchContract,
  createRouteMatchLogConsumerPipelineBatchContract,
} from "./route.match.log.consumer.pipeline.batch.contract";
export type {
  RouteMatchLogConsumerPipelineBatchResult,
  RouteMatchLogConsumerPipelineBatchContractDependencies,
} from "./route.match.log.consumer.pipeline.batch.contract";

// W1-T24 — Gateway PII Detection Log Consumer Bridge (CP1–CP2)
export {
  GatewayPIIDetectionLogConsumerPipelineContract,
  createGatewayPIIDetectionLogConsumerPipelineContract,
} from "./gateway.pii.detection.log.consumer.pipeline.contract";
export type {
  GatewayPIIDetectionLogConsumerPipelineRequest,
  GatewayPIIDetectionLogConsumerPipelineResult,
  GatewayPIIDetectionLogConsumerPipelineContractDependencies,
} from "./gateway.pii.detection.log.consumer.pipeline.contract";
export {
  GatewayPIIDetectionLogConsumerPipelineBatchContract,
  createGatewayPIIDetectionLogConsumerPipelineBatchContract,
} from "./gateway.pii.detection.log.consumer.pipeline.batch.contract";
export type {
  GatewayPIIDetectionLogConsumerPipelineBatchResult,
  GatewayPIIDetectionLogConsumerPipelineBatchContractDependencies,
} from "./gateway.pii.detection.log.consumer.pipeline.batch.contract";

// W1-T23 — Gateway Auth Log Consumer Bridge (CP1–CP2)
export {
  GatewayAuthLogConsumerPipelineContract,
  createGatewayAuthLogConsumerPipelineContract,
} from "./gateway.auth.log.consumer.pipeline.contract";
export type {
  GatewayAuthLogConsumerPipelineRequest,
  GatewayAuthLogConsumerPipelineResult,
  GatewayAuthLogConsumerPipelineContractDependencies,
} from "./gateway.auth.log.consumer.pipeline.contract";
export {
  GatewayAuthLogConsumerPipelineBatchContract,
  createGatewayAuthLogConsumerPipelineBatchContract,
} from "./gateway.auth.log.consumer.pipeline.batch.contract";
export type {
  GatewayAuthLogConsumerPipelineBatchResult,
  GatewayAuthLogConsumerPipelineBatchContractDependencies,
} from "./gateway.auth.log.consumer.pipeline.batch.contract";

// W1-T21 — Clarification Refinement Consumer Bridge (CP1–CP2)
export {
  ClarificationRefinementConsumerPipelineContract,
  createClarificationRefinementConsumerPipelineContract,
} from "./clarification.refinement.consumer.pipeline.contract";
export type {
  ClarificationRefinementConsumerPipelineRequest,
  ClarificationRefinementConsumerPipelineResult,
  ClarificationRefinementConsumerPipelineContractDependencies,
} from "./clarification.refinement.consumer.pipeline.contract";
export {
  ClarificationRefinementConsumerPipelineBatchContract,
  createClarificationRefinementConsumerPipelineBatchContract,
} from "./clarification.refinement.consumer.pipeline.batch.contract";
export type {
  ClarificationRefinementConsumerPipelineBatch,
  ClarificationRefinementConsumerPipelineBatchContractDependencies,
} from "./clarification.refinement.consumer.pipeline.batch.contract";

// W1-T20 — GatewayAuth Consumer Bridge (CP1–CP2)
export {
  GatewayAuthConsumerPipelineContract,
  createGatewayAuthConsumerPipelineContract,
} from "./gateway.auth.consumer.pipeline.contract";
export type {
  GatewayAuthConsumerPipelineRequest,
  GatewayAuthConsumerPipelineResult,
  GatewayAuthConsumerPipelineContractDependencies,
} from "./gateway.auth.consumer.pipeline.contract";
export {
  GatewayAuthConsumerPipelineBatchContract,
  createGatewayAuthConsumerPipelineBatchContract,
} from "./gateway.auth.consumer.pipeline.batch.contract";
export type {
  GatewayAuthConsumerPipelineBatch,
  GatewayAuthConsumerPipelineBatchContractDependencies,
} from "./gateway.auth.consumer.pipeline.batch.contract";

// W1-T19 — Knowledge Ranking Consumer Bridge (CP1–CP2)
export {
  KnowledgeRankingConsumerPipelineContract,
  createKnowledgeRankingConsumerPipelineContract,
} from "./knowledge.ranking.consumer.pipeline.contract";
export type {
  KnowledgeRankingConsumerPipelineRequest,
  KnowledgeRankingConsumerPipelineResult,
  KnowledgeRankingConsumerPipelineContractDependencies,
} from "./knowledge.ranking.consumer.pipeline.contract";
export {
  KnowledgeRankingConsumerPipelineBatchContract,
  createKnowledgeRankingConsumerPipelineBatchContract,
} from "./knowledge.ranking.consumer.pipeline.batch.contract";
export type {
  KnowledgeRankingConsumerPipelineBatch,
  KnowledgeRankingConsumerPipelineBatchContractDependencies,
} from "./knowledge.ranking.consumer.pipeline.batch.contract";

// W1-T18 — Gateway PII Detection Consumer Bridge (CP1–CP2)
export {
  GatewayPIIDetectionConsumerPipelineContract,
  createGatewayPIIDetectionConsumerPipelineContract,
} from "./gateway.pii.detection.consumer.pipeline.contract";
export type {
  GatewayPIIDetectionConsumerPipelineRequest,
  GatewayPIIDetectionConsumerPipelineResult,
  GatewayPIIDetectionConsumerPipelineContractDependencies,
} from "./gateway.pii.detection.consumer.pipeline.contract";
export {
  GatewayPIIDetectionConsumerPipelineBatchContract,
  createGatewayPIIDetectionConsumerPipelineBatchContract,
} from "./gateway.pii.detection.consumer.pipeline.batch.contract";
export type {
  GatewayPIIDetectionConsumerPipelineBatch,
  GatewayPIIDetectionConsumerPipelineBatchContractDependencies,
} from "./gateway.pii.detection.consumer.pipeline.batch.contract";

// W1-T17 — Reverse Prompting Consumer Bridge (CP1–CP2)
export {
  ReversePromptingConsumerPipelineContract,
  createReversePromptingConsumerPipelineContract,
} from "./reverse.prompting.consumer.pipeline.contract";
export type {
  ReversePromptingConsumerPipelineRequest,
  ReversePromptingConsumerPipelineResult,
  ReversePromptingConsumerPipelineContractDependencies,
} from "./reverse.prompting.consumer.pipeline.contract";
export {
  ReversePromptingConsumerPipelineBatchContract,
  createReversePromptingConsumerPipelineBatchContract,
} from "./reverse.prompting.consumer.pipeline.batch.contract";
export type {
  ReversePromptingConsumerPipelineBatch,
  ReversePromptingConsumerPipelineBatchContractDependencies,
} from "./reverse.prompting.consumer.pipeline.batch.contract";

// W1-T16 — Boardroom Consumer Bridge (CP1–CP2)
export {
  BoardroomConsumerPipelineContract,
  createBoardroomConsumerPipelineContract,
} from "./boardroom.consumer.pipeline.contract";
export type {
  BoardroomConsumerPipelineRequest,
  BoardroomConsumerPipelineResult,
  BoardroomConsumerPipelineContractDependencies,
} from "./boardroom.consumer.pipeline.contract";
export {
  BoardroomConsumerPipelineBatchContract,
  createBoardroomConsumerPipelineBatchContract,
} from "./boardroom.consumer.pipeline.batch.contract";
export type {
  BoardroomConsumerPipelineBatchResult,
  BoardroomConsumerPipelineBatchContractDependencies,
} from "./boardroom.consumer.pipeline.batch.contract";

// W1-T15 — Control Plane Orchestration Consumer Bridge (CP1–CP2)
export {
  OrchestrationConsumerPipelineContract,
  createOrchestrationConsumerPipelineContract,
} from "./orchestration.consumer.pipeline.contract";
export type {
  OrchestrationConsumerPipelineRequest,
  OrchestrationConsumerPipelineResult,
  OrchestrationConsumerPipelineContractDependencies,
} from "./orchestration.consumer.pipeline.contract";
export {
  OrchestrationConsumerPipelineBatchContract,
  createOrchestrationConsumerPipelineBatchContract,
} from "./orchestration.consumer.pipeline.batch.contract";
export type {
  OrchestrationConsumerPipelineBatch,
  OrchestrationConsumerPipelineBatchContractDependencies,
} from "./orchestration.consumer.pipeline.batch.contract";

// W1-T14 — Gateway Knowledge Pipeline Integration Slice (CP1–CP2)
export {
  GatewayConsumerPipelineContract,
  createGatewayConsumerPipelineContract,
} from "./gateway.consumer.pipeline.contract";
export type {
  GatewayConsumerPipelineRequest,
  GatewayConsumerPipelineResult,
  GatewayConsumerPipelineContractDependencies,
} from "./gateway.consumer.pipeline.contract";
export {
  GatewayConsumerPipelineBatchContract,
  createGatewayConsumerPipelineBatchContract,
} from "./gateway.consumer.pipeline.batch.contract";
export type {
  GatewayConsumerPipelineBatch,
  GatewayConsumerPipelineBatchContractDependencies,
} from "./gateway.consumer.pipeline.batch.contract";

// W1-T13 — Control Plane Consumer Pipeline Slice (CP1–CP2)
export {
  ControlPlaneConsumerPipelineContract,
  createControlPlaneConsumerPipelineContract,
} from "./consumer.pipeline.contract";
export type {
  ControlPlaneConsumerRequest,
  ControlPlaneConsumerPackage,
  ControlPlaneConsumerPipelineContractDependencies,
} from "./consumer.pipeline.contract";
export {
  ControlPlaneConsumerPipelineBatchContract,
  createControlPlaneConsumerPipelineBatchContract,
} from "./consumer.pipeline.batch.contract";
export type {
  ControlPlaneConsumerPipelineBatch,
  ControlPlaneConsumerPipelineBatchContractDependencies,
} from "./consumer.pipeline.batch.contract";
