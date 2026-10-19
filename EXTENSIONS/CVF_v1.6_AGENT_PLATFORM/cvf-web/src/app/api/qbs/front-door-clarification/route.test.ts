import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';
import { computeServiceRequestSignature, _testOnlyResetReplayLedger } from '@/lib/service-token-auth';
import * as intentRouter from '@/lib/intent-router';

// The route authorizes through verifyServiceTokenRequest, which requires a
// signed service token over the exact body; a bare token is rejected with 401.
function signedQbsRequest(body: unknown, token = 'qbs-test-token'): Request {
  const bodyText = JSON.stringify(body);
  const timestamp = String(Date.now());
  return new Request('http://localhost/api/qbs/front-door-clarification', {
    method: 'POST',
    headers: {
      'x-cvf-service-token': token,
      'x-cvf-service-timestamp': timestamp,
      'x-cvf-service-signature': computeServiceRequestSignature(token, timestamp, bodyText),
    },
    body: bodyText,
  });
}

/**
 * Build a signed QBS request with an explicit fixed timestamp so the exact
 * same Request can be replayed byte-for-byte.
 */
function signedQbsRequestFixedTs(body: unknown, token = 'qbs-test-token', ts = String(Date.now())): { request: Request; bodyText: string } {
  const bodyText = JSON.stringify(body);
  return {
    bodyText,
    request: new Request('http://localhost/api/qbs/front-door-clarification', {
      method: 'POST',
      headers: {
        'x-cvf-service-token': token,
        'x-cvf-service-timestamp': ts,
        'x-cvf-service-signature': computeServiceRequestSignature(token, ts, bodyText),
      },
      body: bodyText,
    }),
  };
}

describe('/api/qbs/front-door-clarification', () => {
  beforeEach(() => {
    vi.stubEnv('CVF_SERVICE_TOKEN', 'qbs-test-token');
    vi.stubEnv('NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR', 'true');
    vi.stubEnv('NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP', 'true');
    _testOnlyResetReplayLedger();
  });

  it.each([
    { userPrompt: { idea: 'Make my app better' } },
    { userPrompt: ['Make my app better'] },
    { userPrompt: 42 },
    { taskId: { id: 'task' } },
    { taskId: ['task'] },
    { expectedDecision: { decision: 'CLARIFY' } },
    { repeat: '1' },
    { repeat: null },
  ])('rejects malformed field types before routing %#', async (override) => {
    const routeSpy = vi.spyOn(intentRouter, 'routeIntent');
    try {
      const response = await POST(signedQbsRequest({ taskId: 'task', userPrompt: 'Make my app better', ...override }) as never);
      expect(response.status).toBe(400);
      expect(routeSpy).not.toHaveBeenCalled();
    } finally { routeSpy.mockRestore(); }
  });

  it('rejects an overflowing JSON repeat number before routing', async () => {
    const bodyText = '{"taskId":"task","userPrompt":"Make my app better","repeat":1e309}';
    const timestamp = String(Date.now());
    const routeSpy = vi.spyOn(intentRouter, 'routeIntent');
    try {
      const response = await POST(new Request('http://localhost/api/qbs/front-door-clarification', {
        method: 'POST', body: bodyText,
        headers: {
          'x-cvf-service-token': 'qbs-test-token',
          'x-cvf-service-timestamp': timestamp,
          'x-cvf-service-signature': computeServiceRequestSignature('qbs-test-token', timestamp, bodyText),
        },
      }) as never);
      expect(response.status).toBe(400);
      expect(routeSpy).not.toHaveBeenCalled();
    } finally { routeSpy.mockRestore(); }
  });

  it('returns useful clarification for weak-confidence prompts', async () => {
    const response = await POST(signedQbsRequest({ taskId: 'QBS1-F7-T01', userPrompt: 'Make my app better', expectedDecision: 'CLARIFY', repeat: 0 }) as never);
    const body = await response.json() as Record<string, unknown>;
    const receipt = body.governanceEvidenceReceipt as Record<string, unknown>;
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.output).toContain('CVF Clarification Needed');
    expect(body.output).toContain('Question:');
    expect(body.output).toContain('Choose the closest option');
    expect(receipt.decision).toBe('CLARIFY');
  });

  it('returns 401 on exact replay of a previously accepted request', async () => {
    const ts = String(Date.now());
    const payload = { taskId: 'QBS1-F7-T02', userPrompt: 'Make my app better', expectedDecision: 'CLARIFY', repeat: 0 };

    // First request -> accepted
    const first = signedQbsRequestFixedTs(payload, 'qbs-test-token', ts);
    const firstResponse = await POST(first.request as never);
    expect(firstResponse.status).toBe(200);

    // Exact replay -> replay-protected 401
    const replay = signedQbsRequestFixedTs(payload, 'qbs-test-token', ts);
    const replayResponse = await POST(replay.request as never);
    expect(replayResponse.status).toBe(401);
  });
});
