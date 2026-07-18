import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildContextBundleReadout } from '@/lib/context-bundle-readout';
import { buildEvidenceToLearningReadout } from '@/lib/evidence-to-learning-readout';
import { buildLearningPlaneReadout } from '@/lib/learning-plane-readout';
import {
  buildAuditFeedbackValidationReadout,
  buildExecutionContinuityHandoffReadout,
  buildSimulationFailureGateReadout,
} from '@/lib/mlw-runtime-chain-readouts';
import { buildRouteRequestContextReadout } from '@/lib/route-request-context-readout';

describe('MLW4-MLW6 runtime chain readouts', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('links continuity, audit feedback, and simulation gates without authorizing mutation', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_780_000_000_000);
    const receipt = {
      receiptId: 'receipt-chain-1',
      envelopeId: 'env-chain-1',
      evidenceMode: 'live' as const,
      routeId: '/api/execute',
      decision: 'ALLOW',
      provider: 'alibaba',
      model: 'qwen-plus',
      routingDecision: 'selected',
      policySnapshotId: 'policy-chain-1',
      generatedAt: '2026-06-05T00:00:00.000Z',
    };
    const requestContextReadout = buildRouteRequestContextReadout({
      request: {
        templateName: 'Knowledge Query',
        intent: 'Summarize scoped learning-plane governance evidence for operator review',
        inputs: {
          question: 'Which metadata gates are present?',
          audience: 'Governance operator',
          constraints: 'Use scoped metadata only.',
        },
      },
      retrievedChunkCount: 1,
    });
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
    const evidenceToLearningReadout = buildEvidenceToLearningReadout({
      receipt,
      contextBundleReadout,
      learningPlaneReadout: buildLearningPlaneReadout('operator'),
      nowFn: () => '2026-06-05T00:00:00.000Z',
    });
    const continuityReadout = buildExecutionContinuityHandoffReadout({
      receipt,
      contextBundleReadout,
      evidenceToLearningReadout,
    });
    const auditReadout = buildAuditFeedbackValidationReadout({
      receipt,
      contextBundleReadout,
      evidenceToLearningReadout,
      executionContinuityHandoffReadout: continuityReadout,
      nowFn: () => '2026-06-05T00:00:00.000Z',
    });
    const simulationReadout = buildSimulationFailureGateReadout({
      receipt,
      contextBundleReadout,
      evidenceToLearningReadout,
      executionContinuityHandoffReadout: continuityReadout,
      auditFeedbackValidationReadout: auditReadout,
    });

    expect(continuityReadout).toMatchObject({
      readoutVersion: 'cvf.mlw4.executionContinuityHandoffReadout.rt1.v1',
      stalenessVerdict: 'CURRENT',
      missingEvidence: [],
      runtimeRestoreAuthorized: false,
      runtimeHandoffMutationAuthorized: false,
      rawHandoffStored: false,
      autonomousMutationAuthorized: false,
      handoffValidation: {
        decision: 'ALLOW',
        contextCarried: true,
      },
    });
    expect(continuityReadout.learningSignalRefs).toEqual([evidenceToLearningReadout.signalId]);
    expect(continuityReadout.legacyRuntimeRecordClaimsRejected).toEqual([
      'W7ArtifactRecord',
      'W7TraceRecord',
      'AgentLedger',
    ]);
    expect(auditReadout).toMatchObject({
      readoutVersion: 'cvf.mlw5.auditFeedbackValidationReadout.rt1.v1',
      feedbackSource: 'GOVERNANCE_GATE',
      requiresSimulation: false,
      mutationAuthorized: false,
      runtimeTrustMutationAuthorized: false,
      runtimePolicyMutationAuthorized: false,
      autonomousMutationAuthorized: false,
      evidenceReceiptRefs: {
        governanceReceiptId: 'receipt-chain-1',
        evidenceSignalId: evidenceToLearningReadout.signalId,
        continuityGateId: continuityReadout.continuityGateId,
      },
      policyCandidate: {
        action: 'NO_MUTATION_REVIEW_ONLY',
        directMutationRequested: false,
        proposalOnly: true,
      },
    });
    expect(simulationReadout).toMatchObject({
      readoutVersion: 'cvf.mlw6.simulationFailureGateReadout.rt1.v1',
      candidateRef: auditReadout.auditFeedbackId,
      scenarioSetId: 'cvf.mlw6.defaultScenarioSet.rt1.v1',
      criticalFailureCount: 0,
      automaticPromotionAuthorized: false,
      runtimeSimulationMutationAuthorized: false,
      runtimeTruthMutationAuthorized: false,
      autonomousMutationAuthorized: false,
      liveSimulationExecuted: false,
    });
    expect(simulationReadout.passCount).toBeGreaterThanOrEqual(simulationReadout.minimumPassThreshold);
    expect(simulationReadout.promotionVerdict).toMatch(/RECOMMEND_REVIEW|DEFER/);
    expect(JSON.stringify({ continuityReadout, auditReadout, simulationReadout })).not.toMatch(
      /TENANT-A-SIGNAL|SHADOW-BETA|openai-test-key|raw context/i,
    );
  });
});
