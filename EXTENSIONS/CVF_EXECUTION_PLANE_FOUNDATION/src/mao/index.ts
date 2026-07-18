// CVF MAO-T1 - Local Module Front Door
//
// Stable local barrel for the src/mao/ task-graph/event-ledger/read-model
// foundation. MAO-OA-T1 forwards this barrel through the package root
// (../index.ts, one `export * from "./mao"` line) so the compiler and
// related MAO contracts are discoverable from the execution-plane package
// entrypoint. This barrel remains the local source of truth; it is not
// wired to any queue, scheduler, UI, or runtime caller.
//
// MAO-T2 consumer note: the control-plane role resolver
// (EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/mao/role.resolver.contract.ts)
// imports MaoTaskGraph, MaoAuthorityEnvelope, MaoTaskDefinition,
// MaoRiskLevel, and MaoTaskRole directly from ./task.graph.contract (not
// through this barrel, to avoid adding a barrel-level dependency edge). The
// dependency direction is control-plane -> execution-plane only, per the
// MAO contract's Role Resolver Ownership decision: execution-plane owns
// task-graph/state mechanics; the control-plane resolver owns admission
// policy and must never be imported back into this module.
//
// See docs/reference/multi_agent_orchestration/README.md and
// docs/reference/multi_agent_orchestration/CVF_MAO_RUNTIME_FOUNDATION_CONTRACT.md
// for the design authority this module implements.

export type {
  MaoRoute,
  MaoRiskLevel,
  MaoTaskRole,
  MaoApprovalCheckpoint,
  MaoBudgetAllocation,
  MaoAuthorityEnvelopeInput,
  MaoAuthorityEnvelope,
  MaoTaskDefinition,
  MaoTaskDefinitionInput,
  MaoDependencyEdge,
  MaoTaskGraphInput,
  MaoTaskGraph,
  MaoGraphCompileFailureReason,
  MaoGraphCompileSuccess,
  MaoGraphCompileFailure,
  MaoGraphCompileResult,
} from "./task.graph.contract";

export {
  computeAuthorityHash,
  buildAuthorityEnvelope,
  verifyAuthorityEnvelope,
  detectDependencyCycle,
  compileTaskGraph,
  directDependents,
  directDependencies,
} from "./task.graph.contract";

export type {
  MaoTaskState,
  MaoEventType,
  MaoEventLedgerEntry,
  MaoAppendEventInput,
  MaoLedgerAppendFailureReason,
  MaoLedgerAppendSuccess,
  MaoLedgerAppendFailure,
  MaoLedgerAppendResult,
} from "./event.ledger.contract";

export {
  MAO_TERMINAL_STATES,
  isTerminalState,
  descendantPropagationFor,
  MaoEventLedger,
} from "./event.ledger.contract";

export type {
  MaoTerminalOutcome,
  MaoReadModelTaskState,
  MaoGeneratedReadModel,
  MaoReadModelBuildInput,
} from "./read.model.contract";

export { buildReadModel, readModelsAreEqual } from "./read.model.contract";

export type {
  MaoAdmissionReceiptLike,
  MaoDiagnosticClass,
  MaoCapabilityDeclaration,
  MaoUsageEnvelope,
  MaoInvocationReceipt,
  MaoInvocationRejectionReason,
  MaoInvocationRequest,
  MaoInvocationSuccess,
  MaoInvocationFailure,
  MaoInvocationResult,
} from "./delegation.adapter.contract";

export { MaoDelegationAdapter, createMaoDelegationAdapter } from "./delegation.adapter.contract";

// --- MAO-T4 reviewer isolation, dissent, and revision loop ---

export type {
  MaoIsolatedSourcePacket,
  MaoExcludedContextEntry,
  MaoReviewerSourceContract,
  MaoSelfApprovalCheck,
  MaoRecomputedEvidence,
} from "./reviewer.isolation.contract";

export {
  buildIsolatedSourcePacket,
  verifyIsolatedSourcePacket,
  checkSelfApproval,
  checkEvidenceIndependence,
  buildRecomputedEvidence,
} from "./reviewer.isolation.contract";

export type {
  MaoDefectClass,
  MaoReviewDecision,
  MaoDissentRecord,
  MaoDefectEntry,
  MaoReviewReceipt,
  MaoRevisionLedger,
  MaoReviewReceiptInput,
  MaoRevisionCeilingCheck,
  MaoRecordReviewResult,
  MaoReviewTerminalDecision,
} from "./dissent.revision.contract";

export {
  buildReviewReceipt,
  buildDefectEntry,
  buildDissentRecord,
  checkRevisionCeiling,
  createRevisionLedger,
  recordReviewInLedger,
  terminalReviewDecision,
  verifyDissentDeterminism,
  verifyReviewReceiptConsistency,
} from "./dissent.revision.contract";

// --- MAO-T5 designated closer and commit/session interlock ---

export type {
  MaoIntegrationDecision,
  MaoIntegrationReceipt,
  MaoIntegrationReceiptInput,
  MaoCloserValidationResult,
  MaoCommitAuthorizationResult,
  MaoSessionSyncProjection,
} from "./closer.interlock.contract";

export {
  validateExactlyOneCloser,
  checkCloserIdentity,
  buildIntegrationReceipt,
  checkCommitAuthorization,
  buildSessionSyncProjection,
  makeIntegrationDecision,
  verifyIntegrationReceiptConsistency,
} from "./closer.interlock.contract";

// --- MAO-T6 timeout, heartbeat, cancel, retry, and recovery ---

export type {
  MaoDeterministicClock,
  MaoTimeoutResult,
  MaoHeartbeatRecord,
  MaoCancelState,
  MaoCancelTracker,
  MaoRetryClass,
  MaoIdempotencyGuard,
  MaoOrphanClassification,
  MaoAttemptRecord,
} from "./lifecycle.controller.contract";

export {
  createDeterministicClock,
  detectTimeout,
  recordHeartbeat,
  isHeartbeatStale,
  createCancelTracker,
  requestCancel,
  acceptCancel,
  mayStartNewChild,
  classifyRetry,
  createIdempotencyGuard,
  classifyOrphan,
  MaoLifecycleController,
} from "./lifecycle.controller.contract";

// --- MAO-T7 evidence, observability, and operator readout ---

export type {
  MaoReceiptKind,
  MaoRedactionResult,
  MaoEvidenceRecord,
  MaoIngestReceiptEvidenceInput,
  MaoIngestEvidenceFailureReason,
  MaoIngestEvidenceResult,
  MaoEvidenceReadout,
  MaoRetentionDecision,
  MaoRetentionPolicyInput,
  MaoFreshnessClass,
  MaoWorkspaceMilestoneKind,
  MaoWorkspaceMilestoneProjection,
} from "./evidence.readout.contract";

export {
  MAO_MILESTONE_RECEIPT_KINDS,
  redactFields,
  MaoEvidenceLedger,
  buildEvidenceReadout,
  readoutsAreEqual,
  evaluateRetention,
  classifyReadoutFreshness,
  milestoneForReceiptKind,
  projectWorkspaceMilestones,
} from "./evidence.readout.contract";

// --- MAO-T8 representative end-to-end pilot harness ---

export type {
  MaoPilotSeedReceipt,
  MaoPilotReviewOutcome,
  MaoPilotCloseOutcome,
  MaoPilotDuplicateResult,
  MaoPilotTimeoutResult,
  MaoPilotCancelResult,
  MaoPilotBudgetResult,
  MaoPilotChainResult,
} from "./representative.pilot.contract";

export {
  PILOT_TASK_ID,
  PILOT_WORKER_IDENTITY,
  PILOT_REVIEWER_IDENTITY,
  PILOT_CLOSER_IDENTITY,
  PILOT_TASK_GRAPH_ID,
  PILOT_STALE_AFTER_MS,
  PILOT_MAX_REVISION_DEPTH,
  compilePilotGraph,
  runWorkerPhase,
  runReviewerPhase,
  runCloserPhase,
  runDuplicateAdmissionNegative,
  runTimeoutNegative,
  runCancelNegative,
  runBudgetCeilingNegative,
  runPilotChain,
} from "./representative.pilot.contract";

// --- MAO-LIVE-T1 live provider adapter value pilot bridge ---

export type {
  MaoLiveRubricScore,
  MaoLiveCallDiagnosticClass,
  MaoLiveCallDiagnostic,
  MaoLiveDirectLaneResult,
  MaoLiveWorkerAttempt,
  MaoLiveReviewOutcome,
  MaoLiveLaneResult,
  MaoLiveValueVerdict,
  MaoLiveComparativeResult,
} from "./live.provider.value.pilot";

export {
  LIVE_PILOT_TASK_ID,
  LIVE_PILOT_WORKER_IDENTITY,
  LIVE_PILOT_REVIEWER_IDENTITY,
  LIVE_PILOT_CLOSER_IDENTITY,
  LIVE_PILOT_TASK_GRAPH_ID,
  LIVE_PILOT_MAX_REVISION_DEPTH,
  LIVE_PILOT_MAX_LIVE_CALLS,
  LIVE_PILOT_TASK_PROMPT,
  LIVE_PILOT_EXPECTED_TOKENS,
  LIVE_PILOT_REQUIRED_MATCH_COUNT,
  LIVE_PILOT_MAX_RESPONSE_LENGTH,
  scoreAgainstRubric,
  MaoLiveCallLedger,
  runDirectLane,
  runMaoLane,
  decideValueVerdict,
} from "./live.provider.value.pilot";

// --- MAO-OA-T2 durable run store, replay recovery, and idempotent resume ---

export type {
  MaoDurableRunSnapshot,
  MaoDurableRunStoreFailureReason,
  MaoDurableRunStoreFailure,
  MaoDurableRunCreateSuccess,
  MaoDurableRunAppendSuccess,
  MaoDurableRunResumeSuccess,
  MaoDurableRunListSuccess,
} from "./durable.run.store";

export { MAO_DURABLE_RUN_SNAPSHOT_SCHEMA_VERSION, MaoFileRunStore } from "./durable.run.store";

// --- MAO-OA-T3 operational worker launcher and liveness wiring ---

export type {
  MaoOperationalAdapterPort,
  MaoOperationalLaunchRequest,
  MaoOperationalLaunchFailureReason,
  MaoOperationalLaunchFailure,
  MaoOperationalLaunchSuccess,
  MaoOperationalLaunchResult,
  MaoOperationalHeartbeatFailure,
  MaoOperationalHeartbeatSuccess,
  MaoOperationalHeartbeatResult,
  MaoOperationalTimeoutFailureReason,
  MaoOperationalTimeoutFailure,
  MaoOperationalTimeoutNotYetResult,
  MaoOperationalTimeoutDetectedResult,
  MaoOperationalTimeoutResult,
  MaoOperationalCancelFailureReason,
  MaoOperationalCancelFailure,
  MaoOperationalCancelRequestSuccess,
  MaoOperationalCancelAcceptSuccess,
  MaoOperationalCancelRequestResult,
  MaoOperationalCancelAcceptResult,
} from "./operational.worker.launcher";

export { MaoOperationalWorkerLauncher } from "./operational.worker.launcher";

// --- MAO-OA-T4 operational review convergence and commit/session interlock ---

export type {
  MaoOperationalReviewRequest,
  MaoOperationalReviewFailureReason,
  MaoOperationalReviewFailure,
  MaoOperationalReviewSuccess,
  MaoOperationalReviewResult,
  MaoOperationalClosureRequest,
  MaoOperationalClosureFailureReason,
  MaoOperationalClosureFailure,
  MaoOperationalClosureSuccess,
  MaoOperationalClosureResult,
} from "./operational.review.convergence";

export { MaoOperationalReviewConvergence, createMaoOperationalReviewConvergence } from "./operational.review.convergence";

// --- MAO-OA-T5 operational operator readout and workspace session projection ---

export type {
  MaoOperationalWorkspaceLane,
  MaoOperationalWorkspaceItemSnapshot,
  MaoOperationalGuardStatus,
  MaoOperationalGuardSnapshot,
  MaoOperationalOperatorProjectionInput,
  MaoOperationalOperatorProjectionFailureReason,
  MaoOperationalOperatorProjectionFailure,
  MaoOperationalOperatorReadout,
  MaoOperationalOperatorProjectionSuccess,
  MaoOperationalOperatorProjectionResult,
} from "./operational.operator.projection";

export {
  MAO_OPERATIONAL_CANONICAL_LANES,
  buildOperationalOperatorProjection,
  MaoOperationalOperatorProjection,
} from "./operational.operator.projection";
