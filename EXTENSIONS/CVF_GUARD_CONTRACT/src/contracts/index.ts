/**
 * CVF Canonical Contracts — Phase 1.P Barrel Export
 * ==================================================
 * Exports all canonical contract types and adapter maps defined in Phase 1.P.
 * Import from here, not from individual contract files.
 *
 * Authorized by: docs/baselines/CVF_GC018_PHASE_1P_POLICY_RISK_GUARD_CONVERGENCE_2026-05-18.md
 */

export type {
  PolicyDecision,
  PolicyRequestContext,
  PolicyDecisionResult,
  PolicyEvidence,
  PolicyEngine,
  PolicyEngineAdapterMeta,
} from './policy-decision.contract';

export {
  RISK_LEVEL_ORDER,
  isMoreSevere,
  maxRiskLevel,
} from './policy-decision.contract';

export type { RiskLevel } from './policy-decision.contract';

export type {
  RiskAssessmentContext,
  RiskSignal,
  RiskAssessmentResult,
  RiskEngine,
  RiskEngineAdapterMeta,
} from './risk-engine.contract';

export {
  R_SCALE_POLICY_BINDING,
} from './risk-engine.contract';

export type { RScaleDefaultAction } from './risk-engine.contract';

export type {
  GuardEngineAdapter,
  GuardContribution,
  GuardEngineAdapterMeta,
} from './guard-engine.contract';

export {
  CANONICAL_GUARD_ENGINE,
  GUARD_ENGINE_ADAPTER_MAP,
} from './guard-engine.contract';

export { POLICY_ENGINE_ADAPTER_MAP } from './policy-engine-adapter-map';
export { RISK_ENGINE_ADAPTER_MAP } from './risk-engine-adapter-map';

export type {
  AgentFunctionRole,
  OperatorTeamRole,
  AuthRbacRole,
  GovernanceActorRole,
  RoleAxisAssignment,
  RoleAxisAdapterMeta,
} from './role-axis.contract';

export {
  CANONICAL_ROLE_SURFACES,
} from './role-axis.contract';

export { ROLE_AXIS_ADAPTER_MAP } from './role-axis-adapter-map';

export type {
  RolePermissionOutputClass,
  RolePermissionDenyRuleId,
  ReceiptOwnerAxis,
  ReceiptOwnerBoundary,
  RolePermissionProfile,
} from './role-permission.contract';

export {
  ROLE_PERMISSION_SCHEMA_VERSION,
  ROLE_PERMISSION_OUTPUT_CLASSES,
  ROLE_PERMISSION_DENY_RULES,
  ROLE_PERMISSION_PROFILES,
  getRolePermissionProfile,
  isOutputAllowedForRole,
  roleHasDenyRule,
  rolePermissionCoversAllRoles,
} from './role-permission.contract';

export type {
  OrchestratorAuthorityRole,
  WorkerLaneRole,
  OrchestratorDelegationCondition,
  OrchestratorOverreachDenyRule,
  OrchestratorDelegationProfile,
  WorkerMemoryWriteBoundary,
  WorkerLaneTicket,
} from './orchestrator.contract';

export {
  ORCHESTRATOR_CONTRACT_VERSION,
  ORCHESTRATOR_AUTHORITY_ROLES,
  WORKER_LANE_ROLES,
  ORCHESTRATOR_OVERREACH_DENY_RULES,
  ORCHESTRATOR_DELEGATION_PROFILES,
  isOrchestratorAuthorityRole,
  isWorkerLaneRole,
  orchestratorCoversAllRoles,
  canIssueWorkerLaneTicket,
  createWorkerLaneTicket,
} from './orchestrator.contract';

export type {
  MemoryContinuityTier,
  MemoryTierOwnerRole,
  MemoryPrivacyFilterId,
  WorkerRestrictedMemoryTier,
  MemoryTierOwnerPolicy,
  MemoryReinjectionPolicy,
  WorkerMemoryWriteRestrictionPolicy,
  WorkerMemoryWriteRequest,
  WorkerMemoryWriteDecision,
} from './memory-continuity.contract';

export {
  MEMORY_CONTINUITY_CONTRACT_VERSION,
  MEMORY_CONTINUITY_TIERS,
  MEMORY_TIER_OWNER_POLICIES,
  MEMORY_REINJECTION_POLICIES,
  WORKER_MEMORY_WRITE_RESTRICTIONS,
  memoryContinuityCoversAllTiers,
  isWorkerRestrictedMemoryTier,
  evaluateWorkerMemoryWrite,
} from './memory-continuity.contract';

export type {
  RuntimeWorkflowState,
  RuntimeFailureState,
  GuardEnforcementPoint,
  ToolActionClass,
  WorkflowTrigger,
  OperationalBenchmarkMetricKind,
  GuardEnforcementPointMeta,
  WorkflowTransition,
  OperationalBenchmarkExtension,
  RuntimeWorkflowEvent,
  RuntimeWorkflowDecision,
} from './runtime-workflow.contract';

export {
  RUNTIME_WORKFLOW_CONTRACT_VERSION,
  RUNTIME_FAILURE_STATES,
  GUARD_ENFORCEMENT_POINTS,
  TOOL_ACTION_CLASSES,
  WORKFLOW_TRANSITIONS,
  OPERATIONAL_BENCHMARK_EXTENSIONS,
  runtimeWorkflowCoversFailureStates,
  runtimeWorkflowCoversGuardPoints,
  toolActionClassCovers,
  evaluateRuntimeWorkflowEvent,
} from './runtime-workflow.contract';

export type {
  Receipt,
  GatewayReceiptPayload,
  ExecutionBridgeReceiptPayload,
  GovernanceLedgerReceiptPayload,
  ControlledMemoryReceiptPayload,
  GatewayReceipt,
  ExecutionBridgeReceipt,
  GovernanceLedgerReceipt,
  ControlledMemoryReceipt,
  ReceiptEnvelopeAdapterMeta,
} from './receipt-envelope.contract';

export {
  RECEIPT_SCHEMA_VERSION_1R,
} from './receipt-envelope.contract';

export { RECEIPT_ENVELOPE_ADAPTER_MAP } from './receipt-envelope-adapter-map';

export type {
  MemoryTierId,
  MemoryTierSpec,
  MemoryTierAdapterMeta,
} from './memory-tier.contract';

export {
  MEMORY_TIER_SPECS,
  DEFERRED_MEMORY_TIERS,
  isCanonicalTier,
  isTierImmutable,
} from './memory-tier.contract';

export { MEMORY_TIER_ADAPTER_MAP } from './memory-tier-adapter-map';

export type {
  PROVISIONAL,
  GovernedCapability,
  OutcomeWorkflow,
  OutcomeWorkflowStep,
  OutcomeDeliverable,
} from './governed-capability.contract';

export {
  OUTCOME_DELIVERABLE_CHAIN_DOC,
} from './governed-capability.contract';

export type {
  Phase2BWireupStatus,
  Phase2BWireupActor,
  Phase2BWireupClock,
  Phase2BWireupInput,
  Phase2BWireupResult,
} from './phase2b-wireup.contract';

export {
  PHASE_2B_WIREUP_VERSION,
  runPhase2BWireupFixture,
} from './phase2b-wireup.contract';

export type {
  MetricEmissionStatus,
  OperationalMetricSchema,
} from './operational-metrics.schema';

export {
  OPERATIONAL_METRICS_SCHEMA,
  getMetricById,
  getMetricsByEmissionStatus,
  getMetricsByEmissionPhase,
} from './operational-metrics.schema';
