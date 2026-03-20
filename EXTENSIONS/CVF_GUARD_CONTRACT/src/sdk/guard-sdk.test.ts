import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CVFGuardClient, createCVFGuard } from './guard-sdk';

describe('guard-sdk', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('calls evaluate endpoint with defaults and headers', async () => {
    fetchMock.mockResolvedValue({
      json: vi.fn().mockResolvedValue({ success: true }),
    });

    const client = new CVFGuardClient({
      baseUrl: 'https://cvf.example/',
      serviceToken: 'svc-token',
      agentId: 'agent-1',
      timeout: 5000,
    });

    await client.evaluate({ action: 'deploy' });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://cvf.example/api/guards/evaluate');
    expect(init.headers['x-cvf-service-token']).toBe('svc-token');
    expect(init.headers['x-cvf-agent-id']).toBe('agent-1');

    const body = JSON.parse(init.body);
    expect(body.action).toBe('deploy');
    expect(body.phase).toBe('BUILD');
    expect(body.riskLevel).toBe('R0');
    expect(body.role).toBe('AI_AGENT');
    expect(body.agentId).toBe('agent-1');
    expect(body.requestId).toMatch(/^sdk-/);
  });

  it('normalizes legacy DISCOVERY input to canonical INTAKE', async () => {
    fetchMock.mockResolvedValue({
      json: vi.fn().mockResolvedValue({ success: true }),
    });

    const client = new CVFGuardClient({ baseUrl: 'https://cvf.example' });
    await client.evaluate({ action: 'clarify scope', phase: 'DISCOVERY' });

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.phase).toBe('INTAKE');
  });

  it('checks phase gate with default phase', async () => {
    fetchMock.mockResolvedValue({
      json: vi.fn().mockResolvedValue({ success: true }),
    });

    const client = createCVFGuard({ baseUrl: 'https://cvf.example' });
    await client.checkPhaseGate('build-app');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://cvf.example/api/guards/phase-gate');
    const body = JSON.parse(init.body);
    expect(body.phase).toBe('BUILD');
  });

  it('normalizes legacy DISCOVERY phase gate input to INTAKE', async () => {
    fetchMock.mockResolvedValue({
      json: vi.fn().mockResolvedValue({ success: true }),
    });

    const client = createCVFGuard({ baseUrl: 'https://cvf.example' });
    await client.checkPhaseGate('clarify-scope', 'DISCOVERY');

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.phase).toBe('INTAKE');
  });

  it('requests audit log with query parameters', async () => {
    fetchMock.mockResolvedValue({
      json: vi.fn().mockResolvedValue({ success: true }),
    });

    const client = new CVFGuardClient({ baseUrl: 'https://cvf.example' });
    await client.getAuditLog({ requestId: 'req-123', limit: 10 });

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/guards/audit-log');
    expect(url).toContain('requestId=req-123');
    expect(url).toContain('limit=10');
  });

  it('returns healthy status on success and false on failure', async () => {
    fetchMock.mockResolvedValueOnce({
      json: vi.fn().mockResolvedValue({ success: true, data: { guardsLoaded: 5 } }),
    });
    const client = new CVFGuardClient({ baseUrl: 'https://cvf.example' });
    const ok = await client.healthCheck();
    expect(ok.healthy).toBe(true);
    expect(ok.guardsLoaded).toBe(5);

    fetchMock.mockRejectedValueOnce(new Error('offline'));
    const bad = await client.healthCheck();
    expect(bad.healthy).toBe(false);
    expect(bad.error).toMatch(/offline/);
  });

  it('assertAllowed throws when blocked or errored', async () => {
    const client = new CVFGuardClient({ baseUrl: 'https://cvf.example' });
    vi.spyOn(client, 'evaluate').mockResolvedValueOnce({ success: false, error: 'nope' });
    await expect(client.assertAllowed({ action: 'deploy' })).rejects.toThrow(/CVF Guard error/);

    vi.spyOn(client, 'evaluate').mockResolvedValueOnce({
      success: true,
      data: { finalDecision: 'BLOCK', agentGuidance: 'Stop', requestId: '1', durationMs: 1, guardsEvaluated: 1, results: [] },
    });
    await expect(client.assertAllowed({ action: 'deploy' })).rejects.toThrow(/CVF Guard BLOCKED/);

    vi.spyOn(client, 'evaluate').mockResolvedValueOnce({
      success: true,
      data: { finalDecision: 'ALLOW', requestId: '1', durationMs: 1, guardsEvaluated: 1, results: [] },
    });
    await expect(client.assertAllowed({ action: 'deploy' })).resolves.toBeUndefined();
  });
});
