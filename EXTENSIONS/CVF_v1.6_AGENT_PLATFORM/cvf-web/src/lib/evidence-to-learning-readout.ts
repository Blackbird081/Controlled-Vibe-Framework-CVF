import { createHash } from 'node:crypto';
import type { GovernanceEvidenceReceipt } from '@/lib/ai';
import type { AuditMemoryReceipt } from '@/lib/audit-memory-receipt';
import type { ContextBundleReadout } from '@/lib/context-bundle-readout';
import {
  buildFindingToLearningRecord,
  type FindingToLearningRecord,
} from '@/lib/finding-to-learning-bridge';
import type { LearningPlaneReadout } from '@/lib/learning-plane-readout';

export const EVIDENCE_TO_LEARNING_READOUT_VERSION = 'cvf.mlw3.evidenceToLearningReadout.rt1.v1';

export type EvidenceToLearningProposalAction = 'NOOP' | 'REVIEW' | 'ESCALATE';

export interface EvidenceToLearningReadout {
  readoutVersion: typeof EVIDENCE_TO_LEARNING_READOUT_VERSION;
  signalId: string;
  evidenceReceiptRefs: {
    governanceReceiptId: string;
    envelopeId?: string;
    contextBundleId: string;
    contextBundleHash: string;
    auditMemoryReceiptId?: string;
  };
  truthCandidate: {
    candidateType: 'receipt_metadata_truth_candidate';
    evidenceMode: GovernanceEvidenceReceipt['evidenceMode'];
    decision?: string;
    policySnapshotId?: string;
    contextBundleHash: string;
    scoreClass?: string;
    compositeScore?: number;
    rawOutputIncluded: false;
    rawContextIncluded: false;
  };
  evaluationCandidate: {
    candidateType: 'route_evaluation_candidate';
    basis: 'receipt_context_bundle_metadata';
    requestContextReadiness: string;
    retrievedChunkCount: number;
    knowledgeInjected: boolean;
    proposalOnly: true;
  };
  reputationCandidate: {
    candidateType: 'provider_reputation_candidate';
    provider?: string;
    model?: string;
    routingDecision?: string;
    decision?: string;
    evidenceMode: GovernanceEvidenceReceipt['evidenceMode'];
    proposalOnly: true;
  };
  proposalAction: EvidenceToLearningProposalAction;
  findingToLearningRecord: FindingToLearningRecord;
  requiresGovernanceWorkOrder: boolean;
  autonomousMutationAuthorized: false;
  runtimeTruthMutationAuthorized: false;
  runtimeModelTuningAuthorized: false;
  rawOutputIncluded: false;
  rawContextIncluded: false;
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

function proposalActionFor(input: {
  receipt: GovernanceEvidenceReceipt;
  contextBundleReadout: ContextBundleReadout;
}): EvidenceToLearningProposalAction {
  if (input.receipt.decision && input.receipt.decision !== 'ALLOW') return 'ESCALATE';
  if (input.contextBundleReadout.sourceMap.length > 0) return 'REVIEW';
  return 'NOOP';
}

export function buildEvidenceToLearningReadout(input: {
  receipt: GovernanceEvidenceReceipt;
  contextBundleReadout: ContextBundleReadout;
  learningPlaneReadout: LearningPlaneReadout;
  auditMemoryReceipt?: AuditMemoryReceipt;
  nowFn?: () => string;
}): EvidenceToLearningReadout {
  const proposalAction = proposalActionFor(input);
  const evidenceBasis = [
    `receipt:${input.receipt.receiptId}`,
    `contextBundle:${input.contextBundleReadout.bundleHash}`,
    input.auditMemoryReceipt?.receipt?.receiptId
      ? `auditMemoryReceipt:${input.auditMemoryReceipt.receipt.receiptId}`
      : undefined,
  ].filter((value): value is string => Boolean(value));
  const signalId = `mlw3-${stableHash({
    receiptId: input.receipt.receiptId,
    envelopeId: input.receipt.envelopeId,
    contextBundleHash: input.contextBundleReadout.bundleHash,
    auditMemoryReceiptId: input.auditMemoryReceipt?.receipt?.receiptId,
  }).slice(0, 24)}`;
  const findingToLearningRecord = buildFindingToLearningRecord(
    {
      sourceId: signalId,
      sourceArtifact: '/api/execute#evidenceToLearningReadout',
      sourceSummary: 'Governed execute receipt and context-bundle metadata normalized as proposal-only learning signal.',
      lane: 'GOVERNANCE_CONTROL_PLANE',
      defectClass: 'RUNTIME_SIGNAL_GAP',
      severity: proposalAction === 'ESCALATE' ? 'medium' : 'low',
      disposition: 'N/A_WITH_REASON',
      nextControlAction: 'Metadata-only learning proposal; no autonomous mutation or runtime truth update.',
      evidenceBasis: evidenceBasis.join(';'),
    },
    input.nowFn,
  );

  return {
    readoutVersion: EVIDENCE_TO_LEARNING_READOUT_VERSION,
    signalId,
    evidenceReceiptRefs: {
      governanceReceiptId: input.receipt.receiptId,
      envelopeId: input.receipt.envelopeId,
      contextBundleId: input.contextBundleReadout.bundleId,
      contextBundleHash: input.contextBundleReadout.bundleHash,
      auditMemoryReceiptId: input.auditMemoryReceipt?.receipt?.receiptId || undefined,
    },
    truthCandidate: {
      candidateType: 'receipt_metadata_truth_candidate',
      evidenceMode: input.receipt.evidenceMode,
      decision: input.receipt.decision,
      policySnapshotId: input.receipt.policySnapshotId,
      contextBundleHash: input.contextBundleReadout.bundleHash,
      scoreClass: input.learningPlaneReadout.scoreClass,
      compositeScore: input.learningPlaneReadout.compositeScore,
      rawOutputIncluded: false,
      rawContextIncluded: false,
    },
    evaluationCandidate: {
      candidateType: 'route_evaluation_candidate',
      basis: 'receipt_context_bundle_metadata',
      requestContextReadiness: input.contextBundleReadout.requestContext.readiness,
      retrievedChunkCount: input.contextBundleReadout.retrievalTrace.chunkCount,
      knowledgeInjected: input.contextBundleReadout.retrievalTrace.injected,
      proposalOnly: true,
    },
    reputationCandidate: {
      candidateType: 'provider_reputation_candidate',
      provider: input.receipt.provider,
      model: input.receipt.model,
      routingDecision: input.receipt.routingDecision,
      decision: input.receipt.decision,
      evidenceMode: input.receipt.evidenceMode,
      proposalOnly: true,
    },
    proposalAction,
    findingToLearningRecord,
    requiresGovernanceWorkOrder: findingToLearningRecord.requiresGovernanceWorkOrder,
    autonomousMutationAuthorized: false,
    runtimeTruthMutationAuthorized: false,
    runtimeModelTuningAuthorized: false,
    rawOutputIncluded: false,
    rawContextIncluded: false,
    boundaries: [
      'receipt_refs_only',
      'context_bundle_hash_only',
      'no_raw_output_release',
      'no_raw_context_release',
      'proposal_only_learning_signal',
      'no_autonomous_mutation',
      'no_runtime_truth_model_mutation',
      'no_provider_routing_change',
    ],
  };
}
