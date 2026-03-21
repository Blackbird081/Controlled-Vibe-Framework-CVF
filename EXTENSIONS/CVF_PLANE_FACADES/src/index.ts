/**
 * CVF Plane Facades — Barrel Export
 * ==================================
 * SINGLE IMPORT POINT for all CVF plane facades.
 *
 * Usage:
 *   import {
 *     createGovernanceFacade,
 *     createExecutionFacade,
 *     createKnowledgeFacade,
 *     createLearningFacade,
 *   } from 'cvf-plane-facades';
 *
 * Architecture:
 *   - GovernanceFacade  → Guard evaluation, phase validation, audit
 *   - ExecutionFacade   → Governance-checked execution, model routing
 *   - KnowledgeFacade   → RAG retrieval, context packaging, PII filter
 *   - LearningFacade    → Reputation, task ledger, observability
 *
 * @module cvf-plane-facades
 */

// Governance Plane
export {
  GovernanceFacade,
  createGovernanceFacade,
  type GovernanceCheckRequest,
  type GovernanceCheckResult,
  type PhaseValidationResult,
} from './governance.facade';

// Execution Plane
export {
  ExecutionFacade,
  createExecutionFacade,
  type ExecutionRequest,
  type ExecutionResult,
  type ModelRoutingRequest,
  type ModelRoutingResult,
} from './execution.facade';

// Control Plane (Knowledge)
export {
  KnowledgeFacade,
  createKnowledgeFacade,
  type ContextChunk,
  type RetrievalOptions,
  type PackagedContext,
  type FilteredContent,
} from './knowledge.facade';

// Learning Plane
export {
  LearningFacade,
  createLearningFacade,
  type ReputationScore,
  type TaskOutcome,
  type MetricEntry,
  type LearningConfig,
} from './learning.facade';

// Re-export canonical types from Guard Contract for convenience
export type {
  GuardRequestContext,
  GuardPipelineResult,
  GuardResult,
  GuardAuditEntry,
  GuardRuntimeConfig,
  Guard,
  CanonicalCVFPhase,
  CVFPhase,
  CVFRiskLevel,
  CVFRole,
  GuardDecision,
  GuardSeverity,
} from 'cvf-guard-contract';

export {
  PHASE_ORDER,
  RISK_NUMERIC,
  MANDATORY_GUARD_IDS,
  DEFAULT_GUARD_RUNTIME_CONFIG,
} from 'cvf-guard-contract';
