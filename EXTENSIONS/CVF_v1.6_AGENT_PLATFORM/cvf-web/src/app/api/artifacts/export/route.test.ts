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
let requestSequence = 0;

// The route authorizes through authorizeRouteGovernanceProof, which requires a
// signed service token over the exact body; a bare token is rejected with 401.
function makeRequest(body: Record<string, unknown>) {
  const bodyText = JSON.stringify(body);
  const timestamp = String(Date.now() + requestSequence++);
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
    delete process.env.NEXTAUTH_URL;
    delete process.env.CVF_GOVERNANCE_RECEIPT_TIMEOUT_MS;
    vi.unstubAllGlobals();
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
    expect(payload.data.governanceState).toBe('DRAFT_UNACCEPTED');
    expect(payload.data.html).toContain('DRAFT / UNACCEPTED');
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

  it.each(['title', 'sourcePath', 'status', 'claimBoundary', 'receiptAnchor'])(
    'rejects a common secret pattern in rendered %s before the receipt hop', async field => {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      const response = await POST(makeRequest({ ...BASE_REQUEST, [field]: 'OPENAI_API_KEY=synthetic-secret' }));
      expect(response.status).toBe(400);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each([
    'Authorization: Bearer synthetic-secret-token',
    'github_pat_abcdefghijklmnopqrstuvwxyz012345',
    '-----BEGIN PRIVATE KEY-----',
    'ACCESS_TOKEN: synthetic-long-token',
  ])('rejects another common credential shape in source before the receipt hop', async sourceContent => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    const response = await POST(makeRequest({ ...BASE_REQUEST, sourceContent }));
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects invalid type, record class, and oversized fields before the receipt hop', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    for (const body of [
      { ...BASE_REQUEST, title: 42 },
      { ...BASE_REQUEST, memoryClass: 'UNKNOWN' },
      { ...BASE_REQUEST, title: 'a'.repeat(201) },
      { ...BASE_REQUEST, unexpected: 'value' },
    ]) {
      const response = await POST(makeRequest(body));
      expect(response.status).toBe(400);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects an oversized request body before the receipt hop', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    const response = await POST(makeRequest({ ...BASE_REQUEST, sourceContent: 'x'.repeat(130_000) }));
    expect(response.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not turn an incomplete evaluate response into an ALLOW receipt', async () => {
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, data: {} }) }));
    const payload = await (await POST(makeRequest(BASE_REQUEST))).json();
    expect(payload.data.governanceReceipt).toBeUndefined();
    expect(payload.data.governanceReceiptStatus).toBe('INVALID_RESPONSE');
    expect(payload.data.governanceState).toBe('DRAFT_UNACCEPTED');
  });

  it('joins the current Governance Engine response to an evaluated, unaccepted receipt', async () => {
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (_url: string, options: RequestInit) => {
      const sent = JSON.parse(String(options.body));
      return { ok: true, json: async () => ({ success: true, data: {
        report: {
          request_summary: { request_id: sent.request_id, artifact_id: sent.artifact_id },
          decision_analysis: { final_decision: 'ALLOW' },
          report_metadata: { generated_at: '2026-09-28T00:00:00.000Z' },
          cvf_risk_level: 'R0',
          cvf_enforcement: { action: 'ALLOW' },
          integrity: { has_ledger_reference: true },
        },
        execution_record: { final_decision: 'ALLOW', ledger_attached: true },
      } }) };
    }));
    const payload = await (await POST(makeRequest(BASE_REQUEST))).json();
    expect(payload.data.governanceReceipt).toMatchObject({
      decision: 'ALLOW', riskLevel: 'R0', evaluatedAt: '2026-09-28T00:00:00.000Z',
    });
    expect(payload.data.governanceReceipt.receiptId).toMatch(/^artifact-proof-receipt-new-knowledge-review-/);
    expect(payload.data.governanceReceiptStatus).toBe('PRESENT');
    expect(payload.data.governanceState).toBe('DRAFT_UNACCEPTED');
  });

  it.each(['request-id', 'artifact-id', 'decision', 'ledger', 'enforcement']) (
    'rejects a current-engine receipt with mismatched %s', async failure => {
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      vi.stubGlobal('fetch', vi.fn().mockImplementation(async (_url: string, options: RequestInit) => {
        const sent = JSON.parse(String(options.body));
        return { ok: true, json: async () => ({ success: true, data: {
          report: {
            request_summary: {
              request_id: failure === 'request-id' ? 'other' : sent.request_id,
              artifact_id: failure === 'artifact-id' ? 'other' : sent.artifact_id,
            },
            decision_analysis: { final_decision: 'ALLOW' },
            report_metadata: { generated_at: '2026-09-28T00:00:00.000Z' },
            cvf_risk_level: 'R0',
            cvf_enforcement: { action: failure === 'enforcement' ? 'LOG_ONLY' : 'ALLOW' },
            integrity: { has_ledger_reference: true },
          },
          execution_record: {
            final_decision: failure === 'decision' ? 'DENY' : 'ALLOW',
            ledger_attached: failure !== 'ledger',
          },
        } }) };
      }));
      const payload = await (await POST(makeRequest(BASE_REQUEST))).json();
      expect(payload.data.governanceReceipt).toBeUndefined();
      expect(payload.data.governanceReceiptStatus).toBe('INVALID_RESPONSE');
      expect(payload.data.governanceState).toBe('DRAFT_UNACCEPTED');
    },
  );

  it('reports a timed-out check without promoting the HTML or losing its attempt ID', async () => {
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    process.env.CVF_GOVERNANCE_RECEIPT_TIMEOUT_MS = '1000';
    vi.stubGlobal('fetch', vi.fn().mockImplementation((_url: string, options: RequestInit) =>
      new Promise((_resolve, reject) => {
        options.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
      })));
    const payload = await (await POST(makeRequest(BASE_REQUEST))).json();
    expect(payload.data.governanceReceiptStatus).toBe('TIMED_OUT');
    expect(payload.data.governanceReceiptAttemptId).toMatch(/^artifact-proof-receipt-new-knowledge-review-/);
    expect(payload.data.governanceReceipt).toBeUndefined();
    expect(payload.data.governanceState).toBe('DRAFT_UNACCEPTED');
  });

  it.each(['APPROVED', 'MANUAL_REVIEW', 'REJECTED'])(
    'interprets the older explicit %s approval envelope without inventing acceptance', async status => {
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      vi.stubGlobal('fetch', vi.fn().mockImplementation(async (_url: string, options: RequestInit) => {
        const sent = JSON.parse(String(options.body));
        return { ok: true, json: async () => ({ success: true, data: {
          report: { status, risk_level: 'R0', cvf_enforcement: { action: status === 'APPROVED' ? 'ALLOW' : 'BLOCK' } },
          execution_record: { request_id: sent.request_id, timestamp: '2026-09-28T00:00:00.000Z' },
        } }) };
      }));
      const response = await POST(makeRequest(BASE_REQUEST));
      expect(response.status).toBe(200);
      const payload = await response.json();
      expect(payload.data.governanceReceipt.decision).toBe(status);
      expect(payload.data.governanceState).toBe(status === 'APPROVED' ? 'RECEIPT_ALLOW_REVIEW_REQUIRED' : 'DRAFT_UNACCEPTED');
    },
  );

  it.each(['string-success', 'request-id-mismatch', 'approved-without-allow'])(
    'rejects malformed governance receipt case %s', async failure => {
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      vi.stubGlobal('fetch', vi.fn().mockImplementation(async (_url: string, options: RequestInit) => {
        const sent = JSON.parse(String(options.body));
        return { ok: true, json: async () => ({
          success: failure === 'string-success' ? 'false' : true,
          data: {
            report: { status: 'APPROVED', risk_level: 'R0', cvf_enforcement: {
              action: failure === 'approved-without-allow' ? 'BLOCK' : 'ALLOW',
            } },
            execution_record: {
              request_id: failure === 'request-id-mismatch' ? 'wrong-id' : sent.request_id,
              timestamp: '2026-09-28T00:00:00.000Z',
            },
          },
        }) };
      }));
      const response = await POST(makeRequest(BASE_REQUEST));
      expect(response.status).toBe(200);
      const payload = await response.json();
      expect(payload.data.governanceReceipt).toBeUndefined();
      expect(payload.data.governanceState).toBe('DRAFT_UNACCEPTED');
    },
  );

  it('keeps an APPROVED receipt while presentation verification leaves the artifact draft', async () => {
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (_url: string, options: RequestInit) => {
      const sent = JSON.parse(String(options.body));
      return { ok: true, json: async () => ({ success: true, data: {
        report: { status: 'APPROVED', risk_level: 'R0', cvf_enforcement: { action: 'ALLOW' } },
        execution_record: { request_id: sent.request_id, timestamp: '2026-09-28T00:00:00.000Z' },
      } }) };
    }));
    const payload = await (await POST(makeRequest({ ...BASE_REQUEST, sourceContent: 'Ordinary reference: https://example.test' }))).json();
    expect(payload.data.governanceReceipt.decision).toBe('APPROVED');
    expect(payload.data.governanceState).toBe('DRAFT_UNACCEPTED');
    expect(payload.data.verification.some((item: { passed: boolean }) => !item.passed)).toBe(true);
  });
});
