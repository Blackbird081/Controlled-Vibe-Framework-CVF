import { describe, expect, it, vi } from 'vitest';
import type { GuardRuntimeEngine } from '../engine';
import { AgentExecutionRuntime, type ExecutionProvider } from './agent-execution-runtime';
import { ApprovalExecutionBridge } from './approval-execution-bridge';

function binding() {
  return {
    command: 'deploy: deploy service',
    cwd: '/workspace',
    environment: { TARGET: 'staging' },
    actorId: 'worker-1',
    sessionId: 'session-1',
  };
}

describe('ApprovalExecutionBridge', () => {
  const escalationEngine = {
    evaluate: () => ({
      requestId: 'approval-runtime-request', finalDecision: 'ESCALATE', results: [],
      executedAt: '2026-08-29T00:00:00.000Z', durationMs: 0,
      escalatedBy: 'approval-test-guard', agentGuidance: 'review required',
    }),
  } as unknown as GuardRuntimeEngine;

  it('settles exactly once and cleans pending state on decision, abort, and timeout', async () => {
    vi.useFakeTimers();
    const bridge = new ApprovalExecutionBridge({ defaultTimeoutMs: 10 });
    const decided = bridge.request(binding());
    expect(bridge.settle(decided.requestId, 'approved', 'reviewer-1')).toBe(true);
    expect(bridge.settle(decided.requestId, 'denied', 'reviewer-2')).toBe(false);
    await expect(decided.result).resolves.toMatchObject({ decision: 'approved', reviewerId: 'reviewer-1' });

    const controller = new AbortController();
    const aborted = bridge.request(binding(), { signal: controller.signal });
    controller.abort();
    await expect(aborted.result).resolves.toMatchObject({ decision: 'aborted' });

    const timedOut = bridge.request(binding());
    await vi.advanceTimersByTimeAsync(11);
    await expect(timedOut.result).resolves.toMatchObject({ decision: 'timed_out' });
    expect(bridge.listPending()).toEqual([]);
    vi.useRealTimers();
  });

  it('binds approval to command, cwd, environment, actor, and session in stable order', () => {
    const bridge = new ApprovalExecutionBridge();
    const expected = bridge.hashBinding(binding());
    expect(bridge.hashBinding({ ...binding(), environment: { TARGET: 'staging' } })).toBe(expected);
    for (const changed of [
      { ...binding(), command: 'deploy: other' },
      { ...binding(), cwd: '/other' },
      { ...binding(), environment: { TARGET: 'prod' } },
      { ...binding(), actorId: 'worker-2' },
      { ...binding(), sessionId: 'session-2' },
    ]) expect(bridge.hashBinding(changed)).not.toBe(expected);
  });

  it('is consumed by the governed runtime and blocks a post-approval context swap', async () => {
    let calls = 0;
    const provider: ExecutionProvider = {
      name: 'counting-provider',
      execute: async () => { calls += 1; return 'executed'; },
    };
    const bridge = new ApprovalExecutionBridge();
    const runtime = new AgentExecutionRuntime(escalationEngine, provider, {
      phase: 'BUILD', riskLevel: 'R2', role: 'AI_AGENT', agentId: 'worker-1', channel: 'cli',
      liveExecution: false, controlMode: 'governed', sessionId: 'session-1', cwd: '/workspace',
      environment: { TARGET: 'staging' }, approvalBridge: bridge,
      buildAuthority: {
        specStatus: 'ACCEPTED', acceptedSpecRef: 'spec.md', workOrderStatus: 'VALID',
        workOrderRef: 'work-order.md', revoked: false, allowedScope: ['src'],
      },
      metadata: { ai_commit: { commitId: 'commit-1', agentId: 'worker-1', timestamp: 1 } },
    });

    const pendingRun = runtime.runAwaitingApproval('deploy service');
    const approval = bridge.listPending()[0];
    expect(approval).toBeDefined();
    runtime.updateConfig({ cwd: '/swapped' });
    expect(bridge.settle(approval.requestId, 'approved', 'reviewer-1')).toBe(true);
    await expect(pendingRun).resolves.toMatchObject({ status: 'BLOCKED' });
    expect(calls).toBe(0);
  });

  it('executes the provider exactly once after an unchanged bound approval', async () => {
    let calls = 0;
    const bridge = new ApprovalExecutionBridge();
    const runtime = new AgentExecutionRuntime(escalationEngine, {
      name: 'representative-provider',
      execute: async () => { calls += 1; return 'approved execution'; },
    }, {
      phase: 'BUILD', riskLevel: 'R2', role: 'AI_AGENT', agentId: 'worker-1', channel: 'cli',
      liveExecution: false, controlMode: 'governed', sessionId: 'session-1', cwd: '/workspace',
      environment: { TARGET: 'staging' }, approvalBridge: bridge,
    });

    const run = runtime.runAwaitingApproval('deploy service');
    const pending = bridge.listPending()[0];
    expect(bridge.settle(pending.requestId, 'approved', 'reviewer-1')).toBe(true);
    await expect(run).resolves.toMatchObject({
      status: 'COMPLETED',
      output: 'approved execution',
      metadata: { approvalSettlement: { decision: 'approved' } },
    });
    expect(calls).toBe(1);
    expect(bridge.listPending()).toEqual([]);
  });
});
