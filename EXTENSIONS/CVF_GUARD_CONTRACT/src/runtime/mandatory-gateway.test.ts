import { describe, it, expect, vi } from 'vitest';
import type { GuardPipelineResult } from '../types';
import { MandatoryGateway } from './mandatory-gateway';

function makePipelineResult(finalDecision: 'ALLOW' | 'BLOCK' | 'ESCALATE'): GuardPipelineResult {
  return {
    requestId: 'req-1',
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
});
