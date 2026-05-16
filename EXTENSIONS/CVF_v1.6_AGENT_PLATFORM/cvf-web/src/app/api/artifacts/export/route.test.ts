import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import { POST } from './route';

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

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/artifacts/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/artifacts/export', () => {
  it('returns a self-contained HTML presentation candidate with visible boundaries', async () => {
    const response = await POST(makeRequest(BASE_REQUEST));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
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
