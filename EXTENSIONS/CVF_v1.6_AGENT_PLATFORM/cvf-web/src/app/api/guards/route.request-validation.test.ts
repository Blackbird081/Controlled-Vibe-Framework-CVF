import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { PhaseGateGuard } from 'cvf-guard-contract';
import { POST as evaluate } from './evaluate/route';
import { POST as phaseGate } from './phase-gate/route';

const engine = vi.hoisted(() => vi.fn(() => ({ requestId: 'request', finalDecision: 'BLOCK', results: [], durationMs: 0 })));
vi.mock('@/lib/guard-engine-singleton', () => ({ getSharedGuardEngine: () => ({ evaluate: engine }) }));
vi.mock('@/lib/rate-limiter', () => ({ guardsRateLimiter: { middleware: () => null } }));

function request(payload: unknown, raw = false) {
  return new Request('http://localhost/api/guards/test', { method: 'POST', body: raw ? String(payload) : JSON.stringify(payload) });
}

describe('guard route request admission only', () => {
  beforeEach(() => {
    engine.mockClear();
    vi.spyOn(PhaseGateGuard.prototype, 'evaluate').mockReturnValue({ decision: 'BLOCK' } as never);
  });
  afterEach(() => { vi.restoreAllMocks(); });

  for (const route of [evaluate, phaseGate]) {
    it.each([{ value: null }, { value: [] }, { value: 42 }, { value: true }, { value: 'text' }])('rejects non-object JSON before evaluation %#', async ({ value }) => {
      const response = await route(request(value) as never);
      expect(response.status).toBe(400);
      expect(engine).not.toHaveBeenCalled();
      expect(PhaseGateGuard.prototype.evaluate).not.toHaveBeenCalled();
    });
    it('rejects invalid JSON with 400', async () => {
      expect((await route(request('{', true) as never)).status).toBe(400);
      expect(engine).not.toHaveBeenCalled();
      expect(PhaseGateGuard.prototype.evaluate).not.toHaveBeenCalled();
    });
    it.each([{ phase: false }, { phase: 0 }, { phase: '' }, { role: false }, { role: null }, { role: '' }])('does not default malformed supplied enums %#', async (override) => {
      const response = await route(request({ requestId: 'request', action: 'read', ...override }) as never);
      expect(response.status).toBe(400);
      expect(engine).not.toHaveBeenCalled();
      expect(PhaseGateGuard.prototype.evaluate).not.toHaveBeenCalled();
    });
  }

  it.each([
    { requestId: {} }, { action: ['read'] }, { requestId: '   ' }, { agentId: 42 },
    { riskLevel: false }, { traceHash: {} }, { targetFiles: 'file' }, { targetFiles: [42] },
    { fileScope: [false] }, { mutationCount: '1' }, { mutationBudget: null },
    { metadata: [] }, { metadata: null },
  ])('rejects malformed pipeline fields before engine %#', async (override) => {
    expect((await evaluate(request({ requestId: 'request', action: 'read', ...override }) as never)).status).toBe(400);
    expect(engine).not.toHaveBeenCalled();
  });
  it('rejects overflowing mutation count before engine', async () => {
    const response = await evaluate(request('{"requestId":"request","action":"read","mutationCount":1e309}', true) as never);
    expect(response.status).toBe(400);
    expect(engine).not.toHaveBeenCalled();
  });
  it('preserves omitted defaults and DISCOVERY alias for valid requests', async () => {
    expect((await evaluate(request({ requestId: 'request', action: 'read', phase: 'DISCOVERY', mutationCount: 0, targetFiles: [] }) as never)).status).toBe(200);
    expect(engine).toHaveBeenCalledWith(expect.objectContaining({ phase: 'INTAKE', riskLevel: 'R0', role: 'AI_AGENT', mutationCount: 0 }));
    expect((await phaseGate(request({}) as never)).status).toBe(200);
    expect(PhaseGateGuard.prototype.evaluate).toHaveBeenCalledWith(expect.objectContaining({ phase: 'BUILD', role: 'AI_AGENT' }));
  });
});
