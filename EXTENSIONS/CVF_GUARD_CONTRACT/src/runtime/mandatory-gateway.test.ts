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

  it('updateConfig rejects post-bootstrap authority-changing updates and leaves behavior unchanged', () => {
    const engine = { evaluate: vi.fn().mockReturnValue(makePipelineResult('BLOCK')) } as any;
    const gateway = new MandatoryGateway(engine, { hardBlock: true });
    expect(gateway.check({ action: 'deploy' }).allowed).toBe(false);

    expect(() => gateway.updateConfig({ hardBlock: false })).toThrow(/immutable/i);
    expect(() => gateway.updateConfig({ enforceAll: false })).toThrow(/immutable/i);
    expect(() => gateway.updateConfig({ hardEscalate: false })).toThrow(/immutable/i);
    expect(() => gateway.updateConfig({ bypassActions: ['deploy'] })).toThrow(/immutable/i);

    // Behavior is unchanged after every rejected update attempt.
    expect(gateway.check({ action: 'deploy' }).allowed).toBe(false);
  });

  it('getConfig returns a defensively frozen snapshot whose mutation cannot affect gateway behavior', () => {
    const engine = { evaluate: vi.fn().mockReturnValue(makePipelineResult('ALLOW')) } as any;
    const gateway = new MandatoryGateway(engine, { bypassActions: ['deploy'] });

    const snapshot = gateway.getConfig();
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.bypassActions)).toBe(true);
    expect(() => {
      (snapshot as { hardBlock: boolean }).hardBlock = false;
    }).toThrow();
    expect(() => {
      (snapshot.bypassActions as string[]).push('hacked');
    }).toThrow();

    // A fresh snapshot after the rejected mutation attempts is unaffected.
    const secondSnapshot = gateway.getConfig();
    expect(secondSnapshot.bypassActions).toEqual(['deploy']);
    expect(gateway.check({ action: 'deploy' }).decision).toBe('BYPASS');
  });

  it('mutating the caller-supplied constructor config object and bypass array after construction has no effect', () => {
    const engine = { evaluate: vi.fn().mockReturnValue(makePipelineResult('ALLOW')) } as any;
    const callerBypass = ['deploy'];
    const callerConfig = { hardBlock: true, bypassActions: callerBypass };

    const gateway = new MandatoryGateway(engine, callerConfig);

    // Mutate the caller's own objects after construction.
    callerConfig.hardBlock = false;
    callerBypass.push('anything-else');
    callerBypass[0] = 'tampered';

    expect(gateway.getConfig().hardBlock).toBe(true);
    expect(gateway.getConfig().bypassActions).toEqual(['deploy']);
    expect(gateway.check({ action: 'deploy' }).decision).toBe('BYPASS');
    expect(gateway.check({ action: 'tampered' }).decision).not.toBe('BYPASS');
    expect(gateway.check({ action: 'anything-else' }).decision).not.toBe('BYPASS');
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

    it('returns BYPASS with preserved requestId on an exact canonical bypassActions match, without evaluating', () => {
      const engine = { evaluate: vi.fn() } as any;
      const gateway = new MandatoryGateway(engine, { bypassActions: ['health-check'] });
      const context = makeCanonicalContext({ action: 'health-check', requestId: 'bypass-req' });

      const result = gateway.checkContext(context);

      expect(result.decision).toBe('BYPASS');
      expect(result.allowed).toBe(true);
      expect(result.evidence?.requestId).toBe('bypass-req');
      expect(engine.evaluate).not.toHaveBeenCalled();
    });

    it('does not bypass a prefix/suffix/segment collision against a configured bypass value', () => {
      const engine = { evaluate: vi.fn().mockReturnValue(makePipelineResult('ALLOW')) } as any;
      const gateway = new MandatoryGateway(engine, { bypassActions: ['health-check'] });

      const collisions = ['health-check-ping', 'pre-health-check', 'health-check:admin', 'healthcheck'];
      for (const action of collisions) {
        const result = gateway.checkContext(makeCanonicalContext({ action, requestId: `req-${action}` }));
        expect(result.decision).not.toBe('BYPASS');
      }
      expect(engine.evaluate).toHaveBeenCalledTimes(collisions.length);
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

describe('mandatory-gateway -- F4 exact canonical bypass matching', () => {
  it('matches exact case-fold and whitespace-trimmed variants of a configured bypass value', () => {
    const engine = { evaluate: vi.fn() } as any;
    const gateway = new MandatoryGateway(engine, { bypassActions: ['Health-Check'] });

    for (const action of ['health-check', 'HEALTH-CHECK', '  health-check  ', 'Health-Check']) {
      const result = gateway.check({ action });
      expect(result.decision).toBe('BYPASS');
    }
    expect(engine.evaluate).not.toHaveBeenCalled();
  });

  it('rejects prefix, suffix, delimiter, and substring collisions for openapi-v2 and pre/post health-check', () => {
    const engine = { evaluate: vi.fn().mockReturnValue(makePipelineResult('ALLOW')) } as any;
    const gateway = new MandatoryGateway(engine, { bypassActions: ['openapi', 'health-check'] });

    const collisions = ['openapi-v2', 'v2-openapi', 'openapi:v2', 'health-check-ping', 'pre-health-check', 'health-check:admin'];
    for (const action of collisions) {
      const result = gateway.check({ action });
      expect(result.decision).not.toBe('BYPASS');
    }
    expect(engine.evaluate).toHaveBeenCalledTimes(collisions.length);
  });

  it('deterministically ignores empty and whitespace-only configured bypass entries', () => {
    const engine = { evaluate: vi.fn().mockReturnValue(makePipelineResult('ALLOW')) } as any;
    const gateway = new MandatoryGateway(engine, { bypassActions: ['', '   ', 'ping'] });

    expect(gateway.check({ action: '' }).decision).not.toBe('BYPASS');
    expect(gateway.check({ action: '   ' }).decision).not.toBe('BYPASS');
    expect(gateway.check({ action: 'ping' }).decision).toBe('BYPASS');
  });

  it('fails closed without engine execution on a malformed action passed through an untyped caller', () => {
    const engine = { evaluate: vi.fn().mockReturnValue(makePipelineResult('ALLOW')) } as any;
    const gateway = new MandatoryGateway(engine, { bypassActions: ['ping'] });

    const malformedActions: unknown[] = [null, undefined, 123, {}, [], '', '   '];

    for (const action of malformedActions) {
      const direct = gateway.check({ action } as { action: string });
      expect(direct.allowed).toBe(false);
      expect(direct.decision).toBe('BLOCK');
      expect(direct.bypassed).toBe(false);

      const context = makeCanonicalContext({ action: action as string, requestId: 'malformed-req' });
      const contextual = gateway.checkContext(context);
      expect(contextual.allowed).toBe(false);
      expect(contextual.decision).toBe('BLOCK');
      expect(contextual.bypassed).toBe(false);
      expect(contextual.evidence?.requestId).toBe('malformed-req');
    }

    expect(engine.evaluate).not.toHaveBeenCalled();
  });

  it('applies identical exact-match bypass behavior across check() and checkContext()', () => {
    const engine = { evaluate: vi.fn().mockReturnValue(makePipelineResult('ALLOW')) } as any;
    const gateway = new MandatoryGateway(engine, { bypassActions: ['ping'] });

    const exactResult = gateway.check({ action: 'ping' });
    const exactContextResult = gateway.checkContext(makeCanonicalContext({ action: 'ping' }));
    expect(exactResult.decision).toBe('BYPASS');
    expect(exactContextResult.decision).toBe('BYPASS');

    const collisionResult = gateway.check({ action: 'pinging' });
    const collisionContextResult = gateway.checkContext(makeCanonicalContext({ action: 'pinging' }));
    expect(collisionResult.decision).not.toBe('BYPASS');
    expect(collisionContextResult.decision).not.toBe('BYPASS');
  });
});
