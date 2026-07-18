import { createHash } from 'node:crypto';
import type { GovernanceEvidenceReceipt } from '@/lib/ai';
import type { AuditMemoryReceipt } from '@/lib/audit-memory-receipt';
import type { ContextBundleReadout } from '@/lib/context-bundle-readout';
import type { EvidenceToLearningReadout } from '@/lib/evidence-to-learning-readout';
import { buildEvidenceSnapshot } from '@/lib/execution-continuity';
import {
  buildFindingToLearningRecord,
  type FindingToLearningRecord,
} from '@/lib/finding-to-learning-bridge';
import { validateHandoff, type HandoffValidationResult } from '@/lib/agent-handoff-validator';

export const EXECUTION_CONTINUITY_HANDOFF_READOUT_VERSION =
  'cvf.mlw4.executionContinuityHandoffReadout.rt1.v1';
export const AUDIT_FEEDBACK_VALIDATION_READOUT_VERSION =
  'cvf.mlw5.auditFeedbackValidationReadout.rt1.v1';
export const SIMULATION_FAILURE_GATE_READOUT_VERSION =
  'cvf.mlw6.simulationFailureGateReadout.rt1.v1';

export type ContinuityStalenessVerdict = 'CURRENT' | 'STALE' | 'CONFLICTED' | 'BLOCKED';
export type SimulationScenarioVerdict = 'PASS' | 'BLOCK' | 'DEFER' | 'ESCALATE';
export type SimulationPromotionVerdict = 'BLOCK' | 'DEFER' | 'ESCALATE' | 'RECOMMEND_REVIEW';

export interface ExecutionContinuityHandoffReadout {
  readoutVersion: typeof EXECUTION_CONTINUITY_HANDOFF_READOUT_VERSION;
  continuityGateId: string;
  checkpointRef: string;
  restoreRef: string;
  handoffValidationRef: string;
  stalenessVerdict: ContinuityStalenessVerdict;
  missingEvidence: string[];
  evidenceSnapshot: ReturnType<typeof buildEvidenceSnapshot>;
  handoffValidation: HandoffValidationResult;
  learningSignalRefs: string[];
  legacyRuntimeRecordClaimsRejected: readonly ['W7ArtifactRecord', 'W7TraceRecord', 'AgentLedger'];
  runtimeRestoreAuthorized: false;
  runtimeHandoffMutationAuthorized: false;
  rawHandoffStored: false;
  autonomousMutationAuthorized: false;
  boundaries: string[];
}

export interface AuditFeedbackValidationReadout {
  readoutVersion: typeof AUDIT_FEEDBACK_VALIDATION_READOUT_VERSION;
  auditFeedbackId: string;
  feedbackSource: 'AUDIT_MEMORY_RECEIPT' | 'GOVERNANCE_GATE';
  evidenceReceiptRefs: {
    governanceReceiptId: string;
    envelopeId?: string;
    contextBundleHash: string;
    auditMemoryReceiptId?: string;
    evidenceSignalId: string;
    continuityGateId: string;
  };
  trustCalibrationCandidate: {
    candidateType: 'trust_calibration_candidate';
    provider?: string;
    model?: string;
    decision?: string;
    evidenceMode: GovernanceEvidenceReceipt['evidenceMode'];
    scoreClass?: string;
    compositeScore?: number;
    proposalOnly: true;
  };
  policyCandidate: {
    candidateType: 'policy_candidate';
    action: 'NO_MUTATION_REVIEW_ONLY';
    policySnapshotId?: string;
    directMutationRequested: false;
    proposalOnly: true;
  };
  rollbackCriteria: string[];
  requiresSimulation: boolean;
  findingToLearningRecord: FindingToLearningRecord;
  mutationAuthorized: false;
  runtimeTrustMutationAuthorized: false;
  runtimePolicyMutationAuthorized: false;
  autonomousMutationAuthorized: false;
  boundaries: string[];
}

export interface SimulationScenarioResult {
  scenarioId: string;
  verdict: SimulationScenarioVerdict;
  critical: boolean;
  rationale: string;
}

export interface SimulationFailureGateReadout {
  readoutVersion: typeof SIMULATION_FAILURE_GATE_READOUT_VERSION;
  simulationGateId: string;
  candidateRef: string;
  scenarioSetId: 'cvf.mlw6.defaultScenarioSet.rt1.v1';
  minimumPassThreshold: number;
  passCount: number;
  criticalFailureCount: number;
  rollbackPlanRef?: string;
  scenarioResults: SimulationScenarioResult[];
  promotionVerdict: SimulationPromotionVerdict;
  automaticPromotionAuthorized: false;
  runtimeSimulationMutationAuthorized: false;
  runtimeTruthMutationAuthorized: false;
  autonomousMutationAuthorized: false;
  liveSimulationExecuted: false;
  boundaries: string[];
}

function sortStable(input: unknown): unknown {
  if (Array.isArray(input)) return input.map(sortStable);
  if (!input || typeof input !== 'object') return input;
  return Object.fromEntries(
    Object.entries(input as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => [key, sortStable(value)]),
  );
}

function stableHash(input: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(sortStable(input)), 'utf8')
    .digest('hex');
}

function definedRefs(input: (string | undefined)[]): string[] {
  return input.filter((value): value is string => Boolean(value));
}

function missingContinuityEvidence(input: {
  receipt: GovernanceEvidenceReceipt;
  contextBundleReadout: ContextBundleReadout;
  evidenceToLearningReadout: EvidenceToLearningReadout;
}): string[] {
  const missing: string[] = [];
  if (!input.receipt.receiptId) missing.push('governanceReceiptId');
  if (!input.receipt.policySnapshotId) missing.push('policySnapshotId');
  if (!input.contextBundleReadout.bundleHash) missing.push('contextBundleHash');
  if (!input.evidenceToLearningReadout.signalId) missing.push('evidenceLearningSignalId');
  return missing;
}

export function buildExecutionContinuityHandoffReadout(input: {
  receipt: GovernanceEvidenceReceipt;
  contextBundleReadout: ContextBundleReadout;
  evidenceToLearningReadout: EvidenceToLearningReadout;
}): ExecutionContinuityHandoffReadout {
  const evidenceSnapshot = buildEvidenceSnapshot(input.receipt as unknown as Record<string, unknown>);
  const missingEvidence = missingContinuityEvidence(input);
  const handoffValidation = validateHandoff({
    workflow: {
      id: `workflow-${input.receipt.receiptId}`,
      name: 'execute-runtime-learning-chain',
      status: missingEvidence.length > 0 ? 'failed' : 'completed',
    },
    fromTask: {
      id: `task-${input.receipt.receiptId}`,
      agentId: 'builder',
      status: missingEvidence.length > 0 ? 'failed' : 'completed',
      output: `receipt:${input.receipt.receiptId};contextBundle:${input.contextBundleReadout.bundleHash};signal:${input.evidenceToLearningReadout.signalId}`,
    },
    toAgentId: 'reviewer',
    toAgentRole: 'reviewer',
  });
  const stalenessVerdict: ContinuityStalenessVerdict =
    missingEvidence.length > 0 || handoffValidation.decision === 'BLOCK' ? 'BLOCKED' : 'CURRENT';
  const continuityGateId = `mlw4-${stableHash({
    receiptId: input.receipt.receiptId,
    contextBundleHash: input.contextBundleReadout.bundleHash,
    signalId: input.evidenceToLearningReadout.signalId,
    stalenessVerdict,
  }).slice(0, 24)}`;

  return {
    readoutVersion: EXECUTION_CONTINUITY_HANDOFF_READOUT_VERSION,
    continuityGateId,
    checkpointRef: `receipt:${input.receipt.receiptId};contextBundle:${input.contextBundleReadout.bundleHash}`,
    restoreRef: `metadata-only-restore:${continuityGateId}`,
    handoffValidationRef: `handoff:${continuityGateId}:${handoffValidation.decision}`,
    stalenessVerdict,
    missingEvidence,
    evidenceSnapshot,
    handoffValidation,
    learningSignalRefs: [input.evidenceToLearningReadout.signalId],
    legacyRuntimeRecordClaimsRejected: ['W7ArtifactRecord', 'W7TraceRecord', 'AgentLedger'],
    runtimeRestoreAuthorized: false,
    runtimeHandoffMutationAuthorized: false,
    rawHandoffStored: false,
    autonomousMutationAuthorized: false,
    boundaries: [
      'metadata_only_continuity_gate',
      'receipt_ref_only',
      'context_bundle_hash_only',
      'no_raw_handoff_storage',
      'no_runtime_restore',
      'legacy_w7_runtime_names_rejected',
      'no_autonomous_mutation',
    ],
  };
}

export function buildAuditFeedbackValidationReadout(input: {
  receipt: GovernanceEvidenceReceipt;
  contextBundleReadout: ContextBundleReadout;
  evidenceToLearningReadout: EvidenceToLearningReadout;
  executionContinuityHandoffReadout: ExecutionContinuityHandoffReadout;
  auditMemoryReceipt?: AuditMemoryReceipt;
  nowFn?: () => string;
}): AuditFeedbackValidationReadout {
  const feedbackSource = input.auditMemoryReceipt ? 'AUDIT_MEMORY_RECEIPT' : 'GOVERNANCE_GATE';
  const evidenceBasis = definedRefs([
    `receipt:${input.receipt.receiptId}`,
    `contextBundle:${input.contextBundleReadout.bundleHash}`,
    `mlw3:${input.evidenceToLearningReadout.signalId}`,
    `mlw4:${input.executionContinuityHandoffReadout.continuityGateId}`,
    input.auditMemoryReceipt?.receipt.receiptId
      ? `auditMemoryReceipt:${input.auditMemoryReceipt.receipt.receiptId}`
      : undefined,
  ]);
  const auditFeedbackId = `mlw5-${stableHash({
    receiptId: input.receipt.receiptId,
    contextBundleHash: input.contextBundleReadout.bundleHash,
    signalId: input.evidenceToLearningReadout.signalId,
    continuityGateId: input.executionContinuityHandoffReadout.continuityGateId,
    auditMemoryReceiptId: input.auditMemoryReceipt?.receipt.receiptId,
  }).slice(0, 24)}`;
  const requiresSimulation =
    input.evidenceToLearningReadout.proposalAction === 'ESCALATE' ||
    input.executionContinuityHandoffReadout.stalenessVerdict !== 'CURRENT' ||
    input.receipt.decision !== 'ALLOW';
  const findingToLearningRecord = buildFindingToLearningRecord(
    {
      sourceId: auditFeedbackId,
      sourceArtifact: '/api/execute#auditFeedbackValidationReadout',
      sourceSummary: 'Audit and governance feedback normalized as proposal-only validation input.',
      lane: 'GOVERNANCE_CONTROL_PLANE',
      defectClass: 'RUNTIME_SIGNAL_GAP',
      severity: requiresSimulation ? 'medium' : 'low',
      disposition: 'N/A_WITH_REASON',
      nextControlAction: 'Validation readout only; simulation gate may review candidate, no direct policy or trust mutation.',
      evidenceBasis: evidenceBasis.join(';'),
    },
    input.nowFn,
  );

  return {
    readoutVersion: AUDIT_FEEDBACK_VALIDATION_READOUT_VERSION,
    auditFeedbackId,
    feedbackSource,
    evidenceReceiptRefs: {
      governanceReceiptId: input.receipt.receiptId,
      envelopeId: input.receipt.envelopeId,
      contextBundleHash: input.contextBundleReadout.bundleHash,
      auditMemoryReceiptId: input.auditMemoryReceipt?.receipt.receiptId || undefined,
      evidenceSignalId: input.evidenceToLearningReadout.signalId,
      continuityGateId: input.executionContinuityHandoffReadout.continuityGateId,
    },
    trustCalibrationCandidate: {
      candidateType: 'trust_calibration_candidate',
      provider: input.receipt.provider,
      model: input.receipt.model,
      decision: input.receipt.decision,
      evidenceMode: input.receipt.evidenceMode,
      scoreClass: input.evidenceToLearningReadout.truthCandidate.scoreClass,
      compositeScore: input.evidenceToLearningReadout.truthCandidate.compositeScore,
      proposalOnly: true,
    },
    policyCandidate: {
      candidateType: 'policy_candidate',
      action: 'NO_MUTATION_REVIEW_ONLY',
      policySnapshotId: input.receipt.policySnapshotId,
      directMutationRequested: false,
      proposalOnly: true,
    },
    rollbackCriteria: [
      `requiresReceipt:${input.receipt.receiptId}`,
      `requiresContextBundleHash:${input.contextBundleReadout.bundleHash}`,
      `requiresContinuityGate:${input.executionContinuityHandoffReadout.continuityGateId}`,
      'requiresOperatorReviewBeforeMutation',
      'requiresMLW6ForHighRiskCandidate',
    ],
    requiresSimulation,
    findingToLearningRecord,
    mutationAuthorized: false,
    runtimeTrustMutationAuthorized: false,
    runtimePolicyMutationAuthorized: false,
    autonomousMutationAuthorized: false,
    boundaries: [
      'audit_feedback_metadata_only',
      'proposal_only_trust_calibration_candidate',
      'proposal_only_policy_candidate',
      'no_direct_policy_mutation',
      'no_runtime_trust_mutation',
      'rollback_criteria_required',
      'no_autonomous_mutation',
    ],
  };
}

function scenarioResultsFor(input: {
  receipt: GovernanceEvidenceReceipt;
  contextBundleReadout: ContextBundleReadout;
  evidenceToLearningReadout: EvidenceToLearningReadout;
  executionContinuityHandoffReadout: ExecutionContinuityHandoffReadout;
  auditFeedbackValidationReadout: AuditFeedbackValidationReadout;
}): SimulationScenarioResult[] {
  const results: SimulationScenarioResult[] = [];
  results.push({
    scenarioId: 'missing-evidence-candidate',
    verdict: input.executionContinuityHandoffReadout.missingEvidence.length > 0 ? 'BLOCK' : 'PASS',
    critical: true,
    rationale: input.executionContinuityHandoffReadout.missingEvidence.length > 0
      ? `Missing evidence: ${input.executionContinuityHandoffReadout.missingEvidence.join(',')}`
      : 'Receipt, context bundle hash, and learning signal refs are present.',
  });
  results.push({
    scenarioId: 'bypass-context-bundle',
    verdict: input.contextBundleReadout.bundleHash ? 'PASS' : 'BLOCK',
    critical: true,
    rationale: input.contextBundleReadout.bundleHash
      ? 'Candidate carries context bundle hash evidence.'
      : 'Candidate lacks context bundle hash evidence.',
  });
  results.push({
    scenarioId: 'direct-mutation-request',
    verdict: input.auditFeedbackValidationReadout.mutationAuthorized ? 'BLOCK' : 'PASS',
    critical: true,
    rationale: input.auditFeedbackValidationReadout.mutationAuthorized
      ? 'Candidate requested mutation inside validation lane.'
      : 'Candidate remains proposal-only with mutationAuthorized=false.',
  });
  results.push({
    scenarioId: 'conflicting-audit-truth',
    verdict: input.receipt.decision && input.receipt.decision !== 'ALLOW' ? 'ESCALATE' : 'PASS',
    critical: false,
    rationale: input.receipt.decision && input.receipt.decision !== 'ALLOW'
      ? `Governance decision ${input.receipt.decision} requires reviewer escalation.`
      : 'Governance decision is compatible with metadata-only review.',
  });
  results.push({
    scenarioId: 'rollback-absent',
    verdict: input.auditFeedbackValidationReadout.rollbackCriteria.length > 0 ? 'PASS' : 'BLOCK',
    critical: true,
    rationale: input.auditFeedbackValidationReadout.rollbackCriteria.length > 0
      ? 'Rollback criteria are recorded before any candidate promotion.'
      : 'Rollback criteria are absent.',
  });
  results.push({
    scenarioId: 'low-confidence-candidate',
    verdict: input.evidenceToLearningReadout.truthCandidate.compositeScore === undefined
      ? 'DEFER'
      : input.evidenceToLearningReadout.truthCandidate.compositeScore < 0.6
        ? 'DEFER'
        : 'PASS',
    critical: false,
    rationale: input.evidenceToLearningReadout.truthCandidate.compositeScore === undefined
      ? 'No composite score was emitted; reviewer retains manual evaluation.'
      : `Composite score ${input.evidenceToLearningReadout.truthCandidate.compositeScore} evaluated against advisory floor.`,
  });
  results.push({
    scenarioId: 'pattern-drift',
    verdict: input.auditFeedbackValidationReadout.requiresSimulation ? 'ESCALATE' : 'PASS',
    critical: false,
    rationale: input.auditFeedbackValidationReadout.requiresSimulation
      ? 'Candidate requires separate high-risk review path before promotion.'
      : 'No high-risk drift trigger observed in metadata candidate.',
  });
  return results;
}

function promotionVerdictFor(results: SimulationScenarioResult[]): SimulationPromotionVerdict {
  if (results.some((result) => result.critical && result.verdict === 'BLOCK')) return 'BLOCK';
  if (results.some((result) => result.verdict === 'ESCALATE')) return 'ESCALATE';
  if (results.some((result) => result.verdict === 'DEFER')) return 'DEFER';
  return 'RECOMMEND_REVIEW';
}

export function buildSimulationFailureGateReadout(input: {
  receipt: GovernanceEvidenceReceipt;
  contextBundleReadout: ContextBundleReadout;
  evidenceToLearningReadout: EvidenceToLearningReadout;
  executionContinuityHandoffReadout: ExecutionContinuityHandoffReadout;
  auditFeedbackValidationReadout: AuditFeedbackValidationReadout;
}): SimulationFailureGateReadout {
  const scenarioResults = scenarioResultsFor(input);
  const passCount = scenarioResults.filter((result) => result.verdict === 'PASS').length;
  const criticalFailureCount = scenarioResults.filter(
    (result) => result.critical && result.verdict === 'BLOCK',
  ).length;
  const rollbackPlanRef = `rollback:${stableHash(input.auditFeedbackValidationReadout.rollbackCriteria).slice(0, 24)}`;
  const simulationGateId = `mlw6-${stableHash({
    candidateRef: input.auditFeedbackValidationReadout.auditFeedbackId,
    receiptId: input.receipt.receiptId,
    scenarioResults,
    rollbackPlanRef,
  }).slice(0, 24)}`;

  return {
    readoutVersion: SIMULATION_FAILURE_GATE_READOUT_VERSION,
    simulationGateId,
    candidateRef: input.auditFeedbackValidationReadout.auditFeedbackId,
    scenarioSetId: 'cvf.mlw6.defaultScenarioSet.rt1.v1',
    minimumPassThreshold: 5,
    passCount,
    criticalFailureCount,
    rollbackPlanRef,
    scenarioResults,
    promotionVerdict: promotionVerdictFor(scenarioResults),
    automaticPromotionAuthorized: false,
    runtimeSimulationMutationAuthorized: false,
    runtimeTruthMutationAuthorized: false,
    autonomousMutationAuthorized: false,
    liveSimulationExecuted: false,
    boundaries: [
      'metadata_only_simulation_gate',
      'bounded_scenario_evaluation',
      'no_runtime_truth_mutation',
      'no_automatic_promotion',
      'review_recommendation_only',
      'no_autonomous_mutation',
    ],
  };
}
