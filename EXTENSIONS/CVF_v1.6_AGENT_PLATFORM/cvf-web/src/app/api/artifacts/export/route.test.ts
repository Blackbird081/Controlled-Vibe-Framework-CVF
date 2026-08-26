import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { POST } from './route';
import { computeServiceRequestSignature } from '@/lib/service-token-auth';

const verifySessionCookieMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/middleware-auth', () => ({
  verifySessionCookie: verifySessionCookieMock,
}));

const BASE_REQUEST = {
  title: 'New Knowledge Review Packet',
  sourcePath: 'docs/reviews/new-knowledge.md',
  sourceContent: [
    '# New Knowledge Review Packet',
    '',
    'Record type: Complete review record',
    '',
    'Review status: Ready for review',
    '',
    '## Review Boundary',
    '',
    'This packet helps review and handoff. It is not final proof by itself.',
  ].join('\n'),
  memoryClass: 'FULL_RECORD',
  status: 'Ready for review',
  claimBoundary: 'HTML review packet only. Not final proof by itself.',
  receiptAnchor: 'receipt-new-knowledge-review',
};

const SERVICE_TOKEN = 'test-service-token';

// The route authorizes through authorizeRouteGovernanceProof, which requires a
// signed service token over the exact body; a bare token is rejected with 401.
function makeRequest(body: Record<string, unknown>) {
  const bodyText = JSON.stringify(body);
  const timestamp = String(Date.now());
  return new NextRequest('http://localhost/api/artifacts/export', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-cvf-service-token': SERVICE_TOKEN,
      'x-cvf-service-timestamp': timestamp,
      'x-cvf-service-signature': computeServiceRequestSignature(SERVICE_TOKEN, timestamp, bodyText),
    },
    body: bodyText,
  });
}

describe('/api/artifacts/export', () => {
  beforeEach(() => {
    process.env.CVF_SERVICE_TOKEN = SERVICE_TOKEN;
    verifySessionCookieMock.mockReset();
    verifySessionCookieMock.mockResolvedValue(null);
  });

  it('returns a self-contained HTML presentation candidate with visible boundaries', async () => {
    const response = await POST(makeRequest(BASE_REQUEST));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.routeGovernanceProof.authMode).toBe('service_token');
    expect(payload.data.filename).toBe('new-knowledge-review-packet.html');
    expect(payload.data.receiptAnchor).toBe('receipt-new-knowledge-review');
    expect(payload.data.html).toContain('CVF HTML Review Packet');
    expect(payload.data.html).toContain('Record type');
    expect(payload.data.html).toContain('Ready for review');
    expect(payload.data.html).toContain('Review boundary');
    expect(payload.data.html).toContain('receipt-new-knowledge-review');
    expect(payload.data.html).not.toMatch(/<script|https?:\/\/|@import/i);
    expect(payload.data.verification.every((item: { passed: boolean }) => item.passed)).toBe(true);
  });

  it('rejects missing required fields', async () => {
    const response = await POST(makeRequest({ ...BASE_REQUEST, receiptAnchor: '' }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.success).toBe(false);
    expect(payload.error).toMatch(/missing required/i);
  });

  it('rejects secret-like source content before rendering HTML', async () => {
    const response = await POST(makeRequest({
      ...BASE_REQUEST,
      sourceContent: `${BASE_REQUEST.sourceContent}\nOPENAI_API_KEY=hidden-value`,
    }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.success).toBe(false);
    expect(payload.error).toMatch(/secret-like/i);
    expect(payload.data).toBeUndefined();
  });
});
