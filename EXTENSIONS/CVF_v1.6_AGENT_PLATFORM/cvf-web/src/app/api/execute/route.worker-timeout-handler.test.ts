import { describe, it, expect } from 'vitest';
import {
  buildWorkerTimeoutReadout,
  WORKER_TIMEOUT_READOUT_VERSION,
  type WorkerTimeoutReadout,
} from '@/lib/worker-timeout-handler';
import { WORKER_TIMEOUT_DEFAULT_MS } from '@/lib/pipeline-chain-orchestrator';

describe('buildWorkerTimeoutReadout', () => {
  it('returns not_triggered when elapsedMs is below threshold', () => {
    const readout = buildWorkerTimeoutReadout(1000);
    expect(readout.contractVersion).toBe(WORKER_TIMEOUT_READOUT_VERSION);
    expect(readout.triggered).toBe(false);
    expect(readout.nextAction).toBe('not_triggered');
    expect(readout.escalateToOrchestrator).toBe(false);
    expect(readout.runtimeExecutionAuthorized).toBe(false);
  });

  it('returns not_triggered at exactly one ms below threshold', () => {
    const readout = buildWorkerTimeoutReadout(WORKER_TIMEOUT_DEFAULT_MS - 1);
    expect(readout.triggered).toBe(false);
    expect(readout.nextAction).toBe('not_triggered');
  });

  it('returns triggered with retry when elapsedMs >= threshold and retryCount=0', () => {
    const readout = buildWorkerTimeoutReadout(WORKER_TIMEOUT_DEFAULT_MS, 0);
    expect(readout.triggered).toBe(true);
    expect(readout.retryCount).toBe(1);
    expect(readout.nextAction).toBe('retry');
    expect(readout.escalateToOrchestrator).toBe(false);
    expect(readout.runtimeExecutionAuthorized).toBe(false);
  });

  it('returns triggered with retry when elapsedMs >= threshold and retryCount=1', () => {
    const readout = buildWorkerTimeoutReadout(WORKER_TIMEOUT_DEFAULT_MS, 1);
    expect(readout.triggered).toBe(true);
    expect(readout.retryCount).toBe(2);
    expect(readout.nextAction).toBe('retry');
    expect(readout.escalateToOrchestrator).toBe(false);
  });

  it('escalates when retryCount >= max retries (2)', () => {
    const readout = buildWorkerTimeoutReadout(WORKER_TIMEOUT_DEFAULT_MS, 2);
    expect(readout.triggered).toBe(true);
    expect(readout.retryCount).toBe(3);
    expect(readout.nextAction).toBe('escalate');
    expect(readout.escalateToOrchestrator).toBe(true);
    expect(readout.runtimeExecutionAuthorized).toBe(false);
  });

  it('runtimeExecutionAuthorized is always false — invariant', () => {
    const notTriggered = buildWorkerTimeoutReadout(100);
    const triggered = buildWorkerTimeoutReadout(WORKER_TIMEOUT_DEFAULT_MS, 0);
    const escalated = buildWorkerTimeoutReadout(WORKER_TIMEOUT_DEFAULT_MS, 2);
    expect(notTriggered.runtimeExecutionAuthorized).toBe(false);
    expect(triggered.runtimeExecutionAuthorized).toBe(false);
    expect(escalated.runtimeExecutionAuthorized).toBe(false);
  });

  it('has correct contractVersion on every path', () => {
    const r1: WorkerTimeoutReadout = buildWorkerTimeoutReadout(100);
    const r2: WorkerTimeoutReadout = buildWorkerTimeoutReadout(WORKER_TIMEOUT_DEFAULT_MS, 0);
    expect(r1.contractVersion).toBe('cvf.workerTimeoutEnforcement.el2.v1');
    expect(r2.contractVersion).toBe('cvf.workerTimeoutEnforcement.el2.v1');
  });

  it('retryCount in not_triggered reflects input workerRetryCount', () => {
    const readout = buildWorkerTimeoutReadout(500, 3);
    expect(readout.triggered).toBe(false);
    expect(readout.retryCount).toBe(3);
  });

  it('workerRetryCount defaults to 0 when not provided', () => {
    const readout = buildWorkerTimeoutReadout(WORKER_TIMEOUT_DEFAULT_MS);
    expect(readout.retryCount).toBe(1);
    expect(readout.nextAction).toBe('retry');
  });
});
