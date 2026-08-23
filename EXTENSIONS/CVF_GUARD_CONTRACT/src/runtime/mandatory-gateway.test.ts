import { describe, it, expect, vi } from 'vitest';
import type { GuardPipelineResult, GuardRequestContext } from '../types';
import { MandatoryGateway } from './mandatory-gateway';

function makeCanonicalContext(overrides: Partial<GuardRequestContext> = {}): GuardRequestContext {
  return {
    requestId: 'canonical-req-1',
    phase: 'BUILD',
    riskLevel: 'R1',
    role: 'AI_AGENT',
    agentId: 'agent-1',
    action: 'execute:deploy',
    targetFiles: ['src/a.ts'],
    fileScope: ['src/'],
    mutationCount: 1,
    mutationBudget: 5,
    scope: 'route-scope',
    traceHash: 'trace-hash-1',
    channel: 'web',
    metadata: { userRole: 'admin' },
    ...overrides,
  };
}

function makePipelineResult(
  finalDecision: 'ALLOW' | 'BLOCK' | 'ESCALATE',
  requestId = 'req-1',
): GuardPipelineResult {
  return {
    requestId,
    finalDecision,
    results: [],
    executedAt: new Date().toISOString(),
    durationMs: 5,
    blockedBy: finalDecision === 'BLOCK' ? 'guard-block' : undefined,
    escalatedBy: finalDecision === 'ESCALATE' ? 'guard-esc' : undefined,
    agentGuidance: `Decision ${finalDecision}`,
  };
}

describe('mandatory-gateway', () => {
  it('bypasses actions in the bypass list', () => {
    const engine = { evaluate: vi.fn() } as any;
    const gateway = new MandatoryGateway(engine);
    const result = gateway.check({ action: 'health-check' });
    expect(result.decision).toBe('BYPASS');
    expect(result.allowed).toBe(true);
    expect(engine.evaluate).not.toHaveBeenCalled();
    expect(gateway.getAuditLog().length).toBe(1);
    expect(result.controlMode).toBe('standard');
  });

  it('allows all when enforcement disabled', () => {
    const engine = { evaluate: vi.fn() } as any;
    const gateway = new MandatoryGateway(engine, { enforceAll: false });
    const result = gateway.check({ action: 'deploy' });
    expect(result.decision).toBe('ALLOW');
    expect(result.allowed).toBe(true);
    expect(engine.evaluate).not.toHaveBeenCalled();
  });

  it('blocks when hardBlock is enabled', () => {
    const engine = { evaluate: vi.fn().mockReturnValue(makePipelineResult('BLOCK')) } as any;
    const gateway = new MandatoryGateway(engine, { hardBlock: true });
    const result = gateway.check({ action: 'deploy' });
    expect(result.decision).toBe('BLOCK');
    expect(result.allowed).toBe(false);
  });

  it('allows when hardBlock is disabled', () => {
    const engine = { evaluate: vi.fn().mockReturnValue(makePipelineResult('BLOCK')) } as any;
    const gateway = new MandatoryGateway(engine, { hardBlock: false });
    const result = gateway.check({ action: 'deploy' });
    expect(result.decision).toBe('BLOCK');
    expect(result.allowed).toBe(true);
  });

  it('enforces hardEscalate', () => {
    const engine = { evaluate: vi.fn().mockReturnValue(makePipelineResult('ESCALATE')) } as any;
    const gateway = new MandatoryGateway(engine, { hardEscalate: true });
    const result = gateway.check({ action: 'risky-change' });
    expect(result.decision).toBe('ESCALATE');
    expect(result.allowed).toBe(false);
    expect(result.approvalRequired).toBe(false);
  });

  it('marks governed escalations as approval-required', () => {
    const engine = { evaluate: vi.fn().mockReturnValue(makePipelineResult('ESCALATE')) } as any;
    const gateway = new MandatoryGateway(engine, { hardEscalate: true });
    const result = gateway.check({
      action: 'risky-change',
      metadata: { controlMode: 'governed' },
    });
    expect(result.controlMode).toBe('governed');
    expect(result.approvalRequired).toBe(true);
    expect(result.evidence?.escalatedBy).toBe('guard-esc');
  });

  it('assertAllowed throws on blocked', () => {
    const engine = { evaluate: vi.fn().mockReturnValue(makePipelineResult('BLOCK')) } as any;
    const gateway = new MandatoryGateway(engine);
    expect(() => gateway.assertAllowed({ action: 'deploy' })).toThrow(/CVF Gateway BLOCK/);
  });

  it('updateConfig changes behavior', () => {
    const engine = { evaluate: vi.fn().mockReturnValue(makePipelineResult('BLOCK')) } as any;
    const gateway = new MandatoryGateway(engine, { hardBlock: true });
    expect(gateway.check({ action: 'deploy' }).allowed).toBe(false);
    gateway.updateConfig({ hardBlock: false });
    expect(gateway.check({ action: 'deploy' }).allowed).toBe(true);
  });

  describe('checkContext', () => {
    it('evaluates the exact context object exactly once and preserves requestId', () => {
      const engine = { evaluate: vi.fn().mockReturnValue(makePipelineResult('ALLOW', 'canonical-req-1')) } as any;
      const gateway = new MandatoryGateway(engine, { bypassActions: [] });
      const context = makeCanonicalContext();

      const result = gateway.checkContext(context);

      expect(engine.evaluate).toHaveBeenCalledTimes(1);
      expect(engine.evaluate).toHaveBeenCalledWith(context);
      expect(result.decision).toBe('ALLOW');
      expect(result.allowed).toBe(true);
      expect(result.evidence?.requestId).toBe('canonical-req-1');
    });

    it('does not rebuild, spread, or mutate the supplied context', () => {
      const engine = { evaluate: vi.fn().mockReturnValue(makePipelineResult('ALLOW')) } as any;
      const gateway = new MandatoryGateway(engine, { bypassActions: [] });
      const context = makeCanonicalContext();
      const snapshot = JSON.parse(JSON.stringify(context));

      gateway.checkContext(context);
      const [calledWith] = engine.evaluate.mock.calls[0];

      expect(calledWith).toBe(context);
      expect(context).toEqual(snapshot);
    });

    it('returns BYPASS with preserved requestId when bypassActions matches, without evaluating', () => {
      const engine = { evaluate: vi.fn() } as any;
      const gateway = new MandatoryGateway(engine, { bypassActions: ['health-check'] });
      const context = makeCanonicalContext({ action: 'health-check-ping', requestId: 'bypass-req' });

      const result = gateway.checkContext(context);

      expect(result.decision).toBe('BYPASS');
      expect(result.allowed).toBe(true);
      expect(result.evidence?.requestId).toBe('bypass-req');
      expect(engine.evaluate).not.toHaveBeenCalled();
    });

    it('returns ALLOW with preserved requestId when enforcement is disabled, without evaluating', () => {
      const engine = { evaluate: vi.fn() } as any;
      const gateway = new MandatoryGateway(engine, { enforceAll: false });
      const context = makeCanonicalContext({ requestId: 'disabled-req' });

      const result = gateway.checkContext(context);

      expect(result.decision).toBe('ALLOW');
      expect(result.evidence?.requestId).toBe('disabled-req');
      expect(engine.evaluate).not.toHaveBeenCalled();
    });

    it('fails closed on BLOCK with hardBlock enabled and exposes blockedBy', () => {
      const engine = { evaluate: vi.fn().mockReturnValue(makePipelineResult('BLOCK')) } as any;
      const gateway = new MandatoryGateway(engine, { hardBlock: true, bypassActions: [] });
      const result = gateway.checkContext(makeCanonicalContext());

      expect(result.decision).toBe('BLOCK');
      expect(result.allowed).toBe(false);
      expect(result.evidence?.blockedBy).toBe('guard-block');
    });

    it('fails closed on ESCALATE with hardEscalate enabled and exposes escalatedBy', () => {
      const engine = { evaluate: vi.fn().mockReturnValue(makePipelineResult('ESCALATE')) } as any;
      const gateway = new MandatoryGateway(engine, { hardEscalate: true, bypassActions: [] });
      const result = gateway.checkContext(makeCanonicalContext());

      expect(result.decision).toBe('ESCALATE');
      expect(result.allowed).toBe(false);
      expect(result.evidence?.escalatedBy).toBe('guard-esc');
    });

    it('respects an empty bypassActions list even for legacy default-bypass substrings', () => {
      const engine = { evaluate: vi.fn().mockReturnValue(makePipelineResult('ALLOW')) } as any;
      const gateway = new MandatoryGateway(engine, { bypassActions: [] });

      for (const action of ['health-check', 'ping', 'version', 'openapi']) {
        const result = gateway.checkContext(makeCanonicalContext({ action, requestId: `req-${action}` }));
        expect(result.decision).not.toBe('BYPASS');
      }
      expect(engine.evaluate).toHaveBeenCalledTimes(4);
    });
  });
});
