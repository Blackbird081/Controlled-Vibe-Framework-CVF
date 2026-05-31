import type { Template } from '@/types';
import type { AIProvider, ExecutionRequest, GovernanceEvidenceReceipt } from '@/lib/ai';
import { buildSpecFirstMediationReadout } from '@/lib/spec-first-mediation';
import { buildEnglishSpecFreezeReadout } from '@/lib/spec-english-freeze';
import { buildVi5LanguageReadout } from '@/lib/vi5-language-readout';
import { buildPipelineChainReadout } from '@/lib/pipeline-chain-readout';
import { buildWorkerTimeoutReadout } from '@/lib/worker-timeout-handler';
import { buildReviewerDeadlockReadout } from '@/lib/reviewer-deadlock-handler';
import { buildContextBudgetReadout } from '@/lib/context-budget-readout';
import { buildOrchestratorFeedbackSummary } from '@/lib/orchestrator-feedback-bus';
import { buildLearningPlaneReadout } from '@/lib/learning-plane-readout';
import { buildFindingToLearningRecord } from '@/lib/finding-to-learning-bridge';

export function buildExecuteResponseReadouts(input: {
  request: Partial<ExecutionRequest>;
  template?: Template;
  routeStartedAtMs: number;
  success: boolean;
  output?: string;
  provider: AIProvider | string;
  model: string;
  decision: string;
  receipt: Pick<GovernanceEvidenceReceipt, 'receiptId' | 'envelopeId'>;
  workflowId?: string | null;
  permissionRole?: string | null;
}) {
  const role = input.permissionRole ?? 'OPERATOR';
  const specFirstMediation = buildSpecFirstMediationReadout({
    request: input.request,
    template: input.template,
    routeOutcome: {
      success: input.success,
      provider: input.provider,
      model: input.model,
      decision: input.decision,
      receipt: input.receipt,
      rawTechnicalEvidenceAvailable: true,
    },
  });
  const englishSpecFreeze = buildEnglishSpecFreezeReadout({
    request: input.request,
    specFirstMediation,
    providerOutput: input.output,
  });
  const pipelineChainReadout = buildPipelineChainReadout(input.request.intent ?? '');
  const workerTimeoutReadout = buildWorkerTimeoutReadout(Date.now() - input.routeStartedAtMs);
  const reviewerDeadlockReadout = buildReviewerDeadlockReadout();
  const contextBudgetReadout = buildContextBudgetReadout(role);
  const orchestratorFeedback = buildOrchestratorFeedbackSummary(
    workerTimeoutReadout,
    reviewerDeadlockReadout,
    contextBudgetReadout,
  );
  const learningPlaneReadout = buildLearningPlaneReadout(role);
  const findingToLearningReadout = buildFindingToLearningRecord({
    sourceId: `exec-${input.receipt.envelopeId}`,
    sourceArtifact: 'api/execute',
    sourceSummary: `Governed execution ALLOW. Role: ${role}.`,
    lane: 'GOVERNANCE_CONTROL_PLANE',
    defectClass: 'RULE_GAP',
    severity: 'low',
    disposition: 'N/A_WITH_REASON',
    nextControlAction: 'Advisory only - no action required.',
    evidenceBasis: `receipt:${input.receipt.receiptId}`,
  });
  const vi5LanguageReadout = buildVi5LanguageReadout({
    request: input.request,
    specFirstMediation,
    englishSpecFreeze,
    workflowId: input.workflowId,
  });

  return {
    specFirstMediation,
    englishSpecFreeze,
    ...vi5LanguageReadout,
    pipelineChainReadout,
    workerTimeoutReadout,
    reviewerDeadlockReadout,
    contextBudgetReadout,
    orchestratorFeedback,
    learningPlaneReadout,
    findingToLearningReadout,
  };
}
