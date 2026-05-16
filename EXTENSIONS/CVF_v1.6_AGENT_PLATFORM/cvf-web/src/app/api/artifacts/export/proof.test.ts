import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchGovernanceReceipt } from './proof';

const LIVE_RESPONSE = {
  success: true,
  data: {
    request_id: 'artifact-proof-test-123',
    decision: 'ALLOW',
    risk_level: 'R0',
    evaluated_at: '2026-05-16T10:00:00.000Z',
  },
};

beforeEach(() => {
  process.env.NEXTAUTH_URL = 'http://localhost:3000';
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  delete process.env.NEXTAUTH_URL;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('fetchGovernanceReceipt', () => {
  it('returns a receipt when the governance evaluate endpoint responds with success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => LIVE_RESPONSE,
    } as Response);

    const receipt = await fetchGovernanceReceipt('test-artifact', 'source content', 'svc-token');

    expect(receipt).not.toBeNull();
    expect(receipt?.receiptId).toBe('artifact-proof-test-123');
    expect(receipt?.decision).toBe('ALLOW');
    expect(receipt?.riskLevel).toBe('R0');
    expect(receipt?.evaluatedAt).toBe('2026-05-16T10:00:00.000Z');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/governance/evaluate',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'x-cvf-service-token': 'svc-token' }),
      }),
    );
  });

  it('returns null and does not throw when the endpoint returns non-2xx', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({ success: false, error: 'unavailable' }),
    } as Response);

    const receipt = await fetchGovernanceReceipt('test-artifact', 'source content');
    expect(receipt).toBeNull();
  });

  it('returns null and does not throw when fetch rejects (network error)', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('network error'));

    const receipt = await fetchGovernanceReceipt('test-artifact', 'source content');
    expect(receipt).toBeNull();
  });

  it('returns null without calling fetch when NEXTAUTH_URL is not set', async () => {
    delete process.env.NEXTAUTH_URL;

    const receipt = await fetchGovernanceReceipt('test-artifact', 'source content');
    expect(receipt).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
});
