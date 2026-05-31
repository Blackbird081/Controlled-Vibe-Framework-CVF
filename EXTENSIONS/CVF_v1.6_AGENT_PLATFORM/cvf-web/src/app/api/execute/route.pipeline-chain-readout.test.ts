import { describe, it, expect } from 'vitest';
import {
  buildPipelineChainReadout,
  PIPELINE_CHAIN_READOUT_VERSION,
  EL1_CONTRACT_VERSION,
} from '@/lib/pipeline-chain-readout';

const VALID_STAGES = new Set([
  'intake_gate',
  'orchestrator',
  'worker',
  'reviewer',
  'closure_gate',
]);

describe('buildPipelineChainReadout', () => {
  it('returns the correct D1 contract version', () => {
    const readout = buildPipelineChainReadout('test prompt');
    expect(readout.contractVersion).toBe('cvf.pipelineChainReadout.delta.d1.v1');
    expect(readout.contractVersion).toBe(PIPELINE_CHAIN_READOUT_VERSION);
  });

  it('cites the EL-1 contract version', () => {
    const readout = buildPipelineChainReadout('test prompt');
    expect(readout.el1ContractVersion).toBe('cvf.pipelineChainOrchestrator.el1.v1');
    expect(readout.el1ContractVersion).toBe(EL1_CONTRACT_VERSION);
  });

  it('currentStage is a valid PipelineStage value', () => {
    const readout = buildPipelineChainReadout('test prompt');
    expect(VALID_STAGES.has(readout.currentStage)).toBe(true);
  });

  it('initializes at intake_gate stage', () => {
    const readout = buildPipelineChainReadout('test prompt');
    expect(readout.currentStage).toBe('intake_gate');
  });

  it('runtimeExecutionAuthorized is always false', () => {
    const readout = buildPipelineChainReadout('test prompt');
    expect(readout.runtimeExecutionAuthorized).toBe(false);
  });

  it('running is true at intake_gate', () => {
    const readout = buildPipelineChainReadout('test prompt');
    expect(readout.running).toBe(true);
  });

  it('retry counts start at zero', () => {
    const readout = buildPipelineChainReadout('test prompt');
    expect(readout.workerRetryCount).toBe(0);
    expect(readout.reviewerRetryCount).toBe(0);
  });

  it('humanInterventionRequired starts false', () => {
    const readout = buildPipelineChainReadout('test prompt');
    expect(readout.humanInterventionRequired).toBe(false);
  });

  it('works with empty string prompt', () => {
    const readout = buildPipelineChainReadout('');
    expect(readout.contractVersion).toBe(PIPELINE_CHAIN_READOUT_VERSION);
    expect(readout.runtimeExecutionAuthorized).toBe(false);
  });

  it('route.ts final line count is <= 1000', async () => {
    const { readFileSync } = await import('node:fs');
    const { join, resolve } = await import('node:path');
    const routePath = resolve(
      join(import.meta.dirname ?? __dirname, './route.ts'),
    );
    const content = readFileSync(routePath, 'utf8');
    const lineCount = content.split('\n').length;
    expect(lineCount).toBeLessThanOrEqual(1000);
  });
});
