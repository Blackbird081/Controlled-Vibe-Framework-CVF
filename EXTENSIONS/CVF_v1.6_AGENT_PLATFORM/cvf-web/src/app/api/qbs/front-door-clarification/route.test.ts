import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';
import { computeServiceRequestSignature } from '@/lib/service-token-auth';

// The route authorizes through authorizeRouteGovernanceProof, which requires a
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

describe('/api/qbs/front-door-clarification', () => {
  beforeEach(() => {
    vi.stubEnv('CVF_SERVICE_TOKEN', 'qbs-test-token');
    vi.stubEnv('NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR', 'true');
    vi.stubEnv('NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP', 'true');
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
});
