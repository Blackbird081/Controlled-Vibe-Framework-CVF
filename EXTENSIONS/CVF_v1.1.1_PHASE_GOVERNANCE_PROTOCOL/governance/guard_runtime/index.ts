/**
 * Guard Runtime — Track IV Phase A.1
 *
 * Barrel export for the CVF Guard Runtime Engine and all core guards.
 */

// Core types
export {
  type CVFPhase,
  type CVFRiskLevel,
  type CVFRole,
  type GuardDecision,
  type GuardSeverity,
  type GuardResult,
  type GuardRequestContext,
  type Guard,
  type GuardPipelineResult,
  type GuardRuntimeConfig,
  type GuardAuditEntry,
  DEFAULT_GUARD_RUNTIME_CONFIG,
} from './guard.runtime.types.js';

// Engine
export { GuardRuntimeEngine } from './guard.runtime.engine.js';

// Core Guards (Phase A.1)
export { PhaseGateGuard, PHASE_ROLE_MATRIX, PHASE_ORDER } from './guards/phase.gate.guard.js';
export { RiskGateGuard, RISK_NUMERIC } from './guards/risk.gate.guard.js';
export { AuthorityGateGuard, AUTHORITY_MATRIX } from './guards/authority.gate.guard.js';
export { AiCommitGuard, READ_ONLY_ACTIONS, MODIFY_ACTIONS } from './guards/ai.commit.guard.js';
export { MutationBudgetGuard, DEFAULT_MUTATION_BUDGETS, ESCALATION_THRESHOLD } from './guards/mutation.budget.guard.js';
export { FileScopeGuard, READ_ONLY_ROLES, BUILDER_CLASS_ROLES } from './guards/file.scope.guard.js';
export { ScopeGuard, PROTECTED_PATHS, CVF_ROOT_INDICATORS } from './guards/scope.guard.js';
export { AuditTrailGuard } from './guards/audit.trail.guard.js';

// Doc→Code Guards (Phase A.2)
export { AdrGuard, ADR_TRIGGER_PATTERNS, ADR_EXEMPT_PATTERNS } from './guards/adr.guard.js';
export { DepthAuditGuard, DEEPENING_ACTION_PATTERNS, type DepthAuditScores } from './guards/depth.audit.guard.js';
export { ArchitectureCheckGuard, ARCHITECTURE_TRIGGER_PATTERNS, ARCHITECTURE_EXEMPT_PATTERNS, type ArchitectureChecklist } from './guards/architecture.check.guard.js';
export { DocumentNamingGuard, GOVERNED_PATHS, EXEMPT_FILENAMES, CVF_PREFIX_PATTERN } from './guards/document.naming.guard.js';
export { DocumentStorageGuard, APPROVED_TAXONOMY_FOLDERS, ROOT_LEVEL_EXCEPTIONS } from './guards/document.storage.guard.js';
export { WorkspaceIsolationGuard, DOWNSTREAM_INDICATORS, CVF_ALLOWED_ROOT_FILES } from './guards/workspace.isolation.guard.js';
export { GuardRegistryGuard } from './guards/guard.registry.guard.js';

// Pipeline Orchestrator (Phase A.3)
export {
  PipelineOrchestrator,
  PHASE_SEQUENCE,
  type PipelineStatus,
  type PipelineEvent,
  type PipelineInstance,
  type PipelineArtifact,
  type PipelineArtifactType,
  type PipelineApprovalCheckpoint,
  type PipelineApprovalStatus,
  type PipelineHandoffCheckpoint,
  type PipelineHandoffResolution,
  type PipelineHandoffStatus,
  type PipelineHandoffTransition,
} from './pipeline.orchestrator.js';

// Conformance (Phase B.1)
export { ConformanceRunner } from './conformance/conformance.runner.js';
export { CVF_CORE_SCENARIOS } from './conformance/conformance.scenarios.js';
export { type ConformanceScenario, type ConformanceResult, type ConformanceReport, type ConformanceCategory, type ConformanceSeverity } from './conformance/conformance.types.js';

// Multi-Entry Gateway (Phase B.2)
export { GuardGateway } from './entry/guard.gateway.js';
export { CliAdapter } from './entry/cli.adapter.js';
export { McpAdapter } from './entry/mcp.adapter.js';
export { ApiAdapter } from './entry/api.adapter.js';
export { type EntryPointType, type EntryAdapter, type EntryResponse, type NormalizedRequest } from './entry/entry.types.js';

// Cross-Extension Wiring (Phase B.3)
export {
  ExtensionBridge,
  type ExtensionDescriptor,
  type ExtensionStatus,
  type CrossExtensionWorkflow,
  type WorkflowStep,
  type WorkflowStepReceipt,
  type WorkflowStepReceiptType,
  type WorkflowStepResult,
  type ExtensionActionHandler,
  type ExtensionActionHandlerContext,
} from './wiring/extension.bridge.js';

// SDK (Phase C)
export {
  CvfSdk,
  type CvfSdkConfig,
  type GuardPreset,
  type ReferenceGovernedLoopOptions,
  type ReferenceGovernedLoopResult,
} from './sdk/cvf.sdk.js';
export { generateCIPipeline, generateGitHubActionsYaml, generateProjectTemplate } from './sdk/ci.config.js';

// Observability (Phase D)
export { MetricsCollector, type GuardMetrics, type PipelineMetrics, type ConformanceMetrics, type SystemHealthMetrics, type DashboardSnapshot, type Alert, type AlertRule } from './observability/metrics.collector.js';

// Multi-Agent Runtime (Phase E)
export {
  MultiAgentRuntime,
  type AgentDescriptor,
  type AgentStatus,
  type TenantConfig,
  type AgentMessage,
  type ConflictRecord,
  type GovernedTaskAssignment,
  type GovernedTaskDecision,
} from './cloud/multi.agent.runtime.js';
