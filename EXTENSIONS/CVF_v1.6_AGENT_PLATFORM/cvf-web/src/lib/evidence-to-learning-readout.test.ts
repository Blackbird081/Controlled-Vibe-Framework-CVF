import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildContextBundleReadout } from '@/lib/context-bundle-readout';
import { buildEvidenceToLearningReadout } from '@/lib/evidence-to-learning-readout';
import { buildLearningPlaneReadout } from '@/lib/learning-plane-readout';
import { buildRouteRequestContextReadout } from '@/lib/route-request-context-readout';

describe('evidence to learning readout', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes receipt and context bundle metadata into proposal-only learning signal', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_780_000_000_000);
    const requestContextReadout = buildRouteRequestContextReadout({
      request: {
        templateName: 'Knowledge Query',
        intent: 'Analyze tenant-a alpha-scope partition details for users with constraints',
        inputs: {
          question: 'What is the tenant-a codename?',
          audience: 'Tenant A users',
          constraints: 'Use scoped retrieval only.',
        },
      },
      retrievedChunkCount: 1,
    });
    const receipt = {
      receiptId: 'receipt-1',
      envelopeId: 'env-1',
      evidenceMode: 'live' as const,
      routeId: '/api/execute',
      decision: 'ALLOW',
      provider: 'alibaba',
      model: 'qwen-plus',
      routingDecision: 'selected',
      policySnapshotId: 'policy-1',
      generatedAt: '2026-06-05T00:00:00.000Z',
    };
    const contextBundleReadout = buildContextBundleReadout({
      receipt,
      requestContextReadout,
      retrievalResult: {
        chunks: [],
        matchedChunkCount: 1,
        allowedChunkCount: 1,
        droppedChunkCount: 0,
        allowedCollectionIds: ['tenant-org-a-private'],
        droppedCollectionIds: [],
      },
      requestedKnowledgeCollectionId: null,
      knowledgeSource: 'retrieval',
      knowledgeInjected: true,
    });
    const first = buildEvidenceToLearningReadout({
      receipt,
      contextBundleReadout,
      learningPlaneReadout: buildLearningPlaneReadout('operator'),
      nowFn: () => '2026-06-05T00:00:00.000Z',
    });
    const second = buildEvidenceToLearningReadout({
      receipt,
      contextBundleReadout,
      learningPlaneReadout: buildLearningPlaneReadout('operator'),
      nowFn: () => '2026-06-05T00:00:00.000Z',
    });

    expect(first).toMatchObject({
      readoutVersion: 'cvf.mlw3.evidenceToLearningReadout.rt1.v1',
      proposalAction: 'REVIEW',
      autonomousMutationAuthorized: false,
      runtimeTruthMutationAuthorized: false,
      runtimeModelTuningAuthorized: false,
      rawOutputIncluded: false,
      rawContextIncluded: false,
      requiresGovernanceWorkOrder: false,
      evidenceReceiptRefs: {
        governanceReceiptId: 'receipt-1',
        envelopeId: 'env-1',
        contextBundleId: 'mlw2-receipt-1',
        contextBundleHash: contextBundleReadout.bundleHash,
      },
      truthCandidate: {
        evidenceMode: 'live',
        decision: 'ALLOW',
        contextBundleHash: contextBundleReadout.bundleHash,
        rawOutputIncluded: false,
        rawContextIncluded: false,
      },
      evaluationCandidate: {
        basis: 'receipt_context_bundle_metadata',
        retrievedChunkCount: 1,
        knowledgeInjected: true,
        proposalOnly: true,
      },
      reputationCandidate: {
        provider: 'alibaba',
        model: 'qwen-plus',
        proposalOnly: true,
      },
      findingToLearningRecord: {
        bridgeVersion: 'cvf.findingToLearningSignalBridge.rt2.v1',
        lane: 'GOVERNANCE_CONTROL_PLANE',
        defectClass: 'RUNTIME_SIGNAL_GAP',
        disposition: 'N/A_WITH_REASON',
        feedbackClass: 'ACCEPT',
        autonomousMutationAuthorized: false,
      },
    });
    expect(first.signalId).toBe(second.signalId);
    expect(first.findingToLearningRecord.evidenceBasis).toBe(
      `receipt:receipt-1;contextBundle:${contextBundleReadout.bundleHash}`,
    );
    expect(first.boundaries).toEqual(expect.arrayContaining([
      'context_bundle_hash_only',
      'proposal_only_learning_signal',
      'no_runtime_truth_model_mutation',
    ]));
    expect(JSON.stringify(first)).not.toMatch(/TENANT-A-SIGNAL|SHADOW-BETA|openai-test-key|raw context/i);
  });
});
