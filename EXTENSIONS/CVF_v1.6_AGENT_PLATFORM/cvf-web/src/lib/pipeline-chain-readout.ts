// Pipeline Chain Readout — Delta D1 contract
// cvf.pipelineChainReadout.delta.d1.v1
//
// Advisory readout only. Derives visible pipeline state from EL-1 types.
// Does NOT enforce pipeline stage transitions or block any route decision.
// runtimeExecutionAuthorized is always false.
//
// EL-1 source contract: cvf.pipelineChainOrchestrator.el1.v1
//   EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/pipeline-chain-orchestrator.ts

import {
  type PipelineStage,
  createPipelineState,
} from '@/lib/pipeline-chain-orchestrator';

export const PIPELINE_CHAIN_READOUT_VERSION =
  'cvf.pipelineChainReadout.delta.d1.v1' as const;

export const EL1_CONTRACT_VERSION =
  'cvf.pipelineChainOrchestrator.el1.v1' as const;

export interface PipelineChainReadout {
  contractVersion: typeof PIPELINE_CHAIN_READOUT_VERSION;
  el1ContractVersion: typeof EL1_CONTRACT_VERSION;
  currentStage: PipelineStage;
  running: boolean;
  workerRetryCount: number;
  reviewerRetryCount: number;
  humanInterventionRequired: boolean;
  runtimeExecutionAuthorized: false;
}

export function buildPipelineChainReadout(operatorPrompt: string): PipelineChainReadout {
  const state = createPipelineState(operatorPrompt);
  return {
    contractVersion: PIPELINE_CHAIN_READOUT_VERSION,
    el1ContractVersion: EL1_CONTRACT_VERSION,
    currentStage: state.currentStage,
    running: state.running,
    workerRetryCount: state.workerRetryCount,
    reviewerRetryCount: state.reviewerRetryCount,
    humanInterventionRequired: state.humanInterventionRequired,
    runtimeExecutionAuthorized: false,
  };
}
