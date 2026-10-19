// Text Encoding Exception: Vietnamese data fixtures verify UTF-8 fidelity and accepted user input.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
function makeRequest(body: Record<string, unknown>, extraHeaders: Record<string, string> = {}) {
  const bodyText = JSON.stringify(body);
  const timestamp = String(Date.now() + requestSequence++);
  return new NextRequest('http://localhost/api/artifacts/export', {
    method: 'POST',
    headers: {
      ...extraHeaders,
      'Content-Type': 'application/json',
      'x-cvf-service-token': SERVICE_TOKEN,
      'x-cvf-service-timestamp': timestamp,
      'x-cvf-service-signature': computeServiceRequestSignature(SERVICE_TOKEN, timestamp, bodyText),
    },
    body: bodyText,
  });
}

function makeStreamRequest(bodyText: string, chunks: Uint8Array[], contentLength?: string) {
  const timestamp = String(Date.now() + requestSequence++);
  let cursor = 0;
  const cancel = vi.fn();
  const pull = vi.fn((controller: ReadableStreamDefaultController<Uint8Array>) => {
    if (cursor < chunks.length) controller.enqueue(chunks[cursor++]);
    else controller.close();
  });
  const stream = new ReadableStream<Uint8Array>({ pull, cancel }, { highWaterMark: 0 });
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-cvf-service-token': SERVICE_TOKEN,
    'x-cvf-service-timestamp': timestamp,
    'x-cvf-service-signature': computeServiceRequestSignature(SERVICE_TOKEN, timestamp, bodyText),
  };
  if (contentLength !== undefined) headers['content-length'] = contentLength;
  const init = { method: 'POST', headers, body: stream, duplex: 'half' as const };
  return { request: new NextRequest('http://localhost/api/artifacts/export', init), cancel, pull };
}

describe('/api/artifacts/export', () => {
  // The retained legacy helper is reachable only through the explicit non-production server value; absence of any value denies.
  beforeEach(() => {
    process.env.CVF_SERVICE_TOKEN = SERVICE_TOKEN;
    process.env.CVF_NCR_RECEIPT_OPERATION_PROFILE = 'LEGACY_COMPATIBILITY_ONLY';
    delete process.env.NEXTAUTH_URL;
    delete process.env.CVF_GOVERNANCE_RECEIPT_TIMEOUT_MS;
    vi.unstubAllGlobals();
    verifySessionCookieMock.mockReset();
    verifySessionCookieMock.mockResolvedValue(null);
  });
  afterEach(() => {
    delete process.env.CVF_NCR_RECEIPT_OPERATION_PROFILE;
    vi.unstubAllEnvs();
  });

  it.each([
    ['missing', undefined, 'POSTURE_UNDECLARED'], ['DISABLED', 'DISABLED', 'DISABLED'], ['empty', '', 'INVALID_SELECTOR'],
    ['lowercase legacy', 'legacy_compatibility_only', 'INVALID_SELECTOR'], ['legacy plus a second value', 'LEGACY_COMPATIBILITY_ONLY,DISABLED', 'INVALID_SELECTOR'],
    ['held controlled activation', 'INJECTED_SYNTHETIC_RECEIPT', 'ACTIVATION_HELD_UNSUPPORTED'],
  ])('denies a %s receipt-operation posture before auth, body parsing or any receipt fetch', async (_label, value, reason) => {
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    if (value === undefined) delete process.env.CVF_NCR_RECEIPT_OPERATION_PROFILE; else process.env.CVF_NCR_RECEIPT_OPERATION_PROFILE = value;
    const response = await POST(makeRequest(BASE_REQUEST));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ success: false, error: 'RECEIPT_OPERATION_DENIED', reason });
    expect(verifySessionCookieMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('denies the explicit legacy value in production, and with any job selector, without reaching auth or the receipt fetch', async () => {
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    const selector = { 'x-cvf-job-id': '123e4567-e89b-42d3-a456-426614174001', 'x-cvf-source-record-id': 'ncr-synthetic-route-1' };
    const denied = async (headers: Record<string, string>) => { const response = await POST(makeRequest(BASE_REQUEST, headers)); return [response.status, (await response.json()).reason]; };
    expect(await denied(selector)).toEqual([403, 'LEGACY_SELECTORS_CONFLICT']);
    expect(await denied({ 'x-cvf-job-id': selector['x-cvf-job-id'] })).toEqual([400, 'SELECTOR_INVALID']);
    vi.stubEnv('NODE_ENV', 'production');
    expect(await denied({})).toEqual([403, 'PRODUCTION_DENIED']);
    expect(verifySessionCookieMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects malformed UTF-8 before auth or receipt fetch', async () => {
    const bytes = new TextEncoder().encode(JSON.stringify({ ...BASE_REQUEST, title: '~' }));
    bytes[bytes.indexOf(126)] = 255;
    const fixture = makeStreamRequest(new TextDecoder().decode(bytes), [bytes]);
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    expect((await POST(fixture.request)).status).toBe(400);
    expect(verifySessionCookieMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
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

  it.each([undefined, '1'])('stops reading an oversized stream with Content-Length %s', async contentLength => {
    const bodyText = JSON.stringify({ ...BASE_REQUEST, sourceContent: 'x'.repeat(200_000) });
    const bytes = new TextEncoder().encode(bodyText);
    const { request, cancel, pull } = makeStreamRequest(bodyText, [
      bytes.slice(0, 64_000), bytes.slice(64_000, 128_001), bytes.slice(128_001),
    ], contentLength);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    process.env.NEXTAUTH_URL = 'http://localhost:3000';

    const response = await POST(request);

    expect(response.status).toBe(413);
    expect(cancel).toHaveBeenCalledOnce();
    expect(pull).toHaveBeenCalledTimes(2);
    expect(verifySessionCookieMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('counts streamed UTF-8 bytes rather than characters', async () => {
    const bodyText = JSON.stringify({ ...BASE_REQUEST, sourceContent: 'ế'.repeat(43_000) });
    const bytes = new TextEncoder().encode(bodyText);
    expect(bodyText.length).toBeLessThan(128_000);
    expect(bytes.length).toBeGreaterThan(128_000);
    const { request, cancel } = makeStreamRequest(bodyText, [bytes]);

    const response = await POST(request);

    expect(response.status).toBe(413);
    expect(cancel).toHaveBeenCalledOnce();
  });

  it('preserves signed raw text when a Vietnamese UTF-8 sequence spans chunks', async () => {
    const sourceContent = '# Tiếng Việt\nLịch hẹn đã chốt, ngày giờ không đổi.';
    // Leading/trailing JSON whitespace must survive body capture for signing.
    const bodyText = ` \n${JSON.stringify({ ...BASE_REQUEST, sourceContent })}\n `;
    const bytes = new TextEncoder().encode(bodyText);
    const split = bytes.indexOf(0xe1) + 1;
    expect(split).toBeGreaterThan(1);
    const { request, cancel } = makeStreamRequest(bodyText, [bytes.slice(0, split), bytes.slice(split)]);

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.html).toContain('Tiếng Việt');
    expect(payload.data.html).toContain('Lịch hẹn đã chốt, ngày giờ không đổi.');
    expect(cancel).not.toHaveBeenCalled();
  });

  it('accepts a signed body exactly at the 128000-byte boundary', async () => {
    const raw = JSON.stringify(BASE_REQUEST);
    const bodyText = raw + ' '.repeat(128_000 - new TextEncoder().encode(raw).length);
    const bytes = new TextEncoder().encode(bodyText);
    expect(bytes.length).toBe(128_000);
    const { request, cancel } = makeStreamRequest(bodyText, [bytes.slice(0, 64_000), bytes.slice(64_000)]);

    expect((await POST(request)).status).toBe(200);
    expect(cancel).not.toHaveBeenCalled();
  });

  it('still returns 413 when the oversized producer rejects cancellation', async () => {
    const bodyText = 'x'.repeat(128_001);
    const { request, cancel } = makeStreamRequest(bodyText, [new TextEncoder().encode(bodyText)]);
    cancel.mockRejectedValue(new Error('Producer cancellation failed'));

    expect((await POST(request)).status).toBe(413);
    expect(cancel).toHaveBeenCalledOnce();
    expect(request.body?.locked).toBe(false);
  });

  it('returns 413 without waiting for unfinished producer cancellation', async () => {
    const bodyText = 'x'.repeat(128_001);
    const { request, cancel } = makeStreamRequest(bodyText, [new TextEncoder().encode(bodyText)]);
    cancel.mockImplementation(() => new Promise(() => {}));

    expect((await POST(request)).status).toBe(413);
    expect(cancel).toHaveBeenCalledOnce();
    expect(request.body?.locked).toBe(false);
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
