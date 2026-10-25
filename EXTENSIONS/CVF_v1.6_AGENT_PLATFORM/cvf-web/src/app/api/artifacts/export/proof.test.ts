import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchGovernanceReceipt } from './proof';

// Protocol fixtures only: no provider or live-governance proof.
beforeEach(() => {
  vi.stubEnv('NEXTAUTH_URL', 'http://localhost:3000');
  vi.stubGlobal('fetch', vi.fn());
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

interface ReceiptFixture {
  report: {
    request_summary: { request_id: string; artifact_id: string };
    decision_analysis: { final_decision: string };
    cvf_enforcement: { action: string }; integrity: { has_ledger_reference: boolean };
    report_metadata: { generated_at: string }; cvf_risk_level: string;
  };
  execution_record: { final_decision: string; ledger_attached: boolean };
}
function respond(change?: (data: ReceiptFixture) => void) {
  vi.mocked(fetch).mockImplementationOnce(async (_url, init) => {
    const request = JSON.parse(String(init?.body));
    const data = {
      report: {
        request_summary: { request_id: request.request_id, artifact_id: request.artifact_id },
        decision_analysis: { final_decision: 'ALLOW' },
        cvf_enforcement: { action: 'ALLOW' },
        integrity: { has_ledger_reference: true },
        report_metadata: { generated_at: '2026-05-16T10:00:00.000Z' },
        cvf_risk_level: 'R0',
      },
      execution_record: { final_decision: 'ALLOW', ledger_attached: true },
    };
    change?.(data);
    return { ok: true, json: async () => ({ success: true, data }) } as Response;
  });
}

describe('fetchGovernanceReceipt protocol', () => {
  it('binds a current engine receipt to the actual request and artifact', async () => {
    respond();
    const check = await fetchGovernanceReceipt('fixture-artifact', 'source', 'fixture-token');
    const request = JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body));
    expect(check).toEqual({ status: 'PRESENT', requestId: request.request_id, receipt: {
      receiptId: request.request_id, decision: 'ALLOW', riskLevel: 'R0',
      evaluatedAt: '2026-05-16T10:00:00.000Z',
    } });
    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/governance/evaluate',
      expect.objectContaining({ headers: expect.objectContaining({ 'x-cvf-service-token': 'fixture-token' }) }));
  });

  it.each([
    (data: ReceiptFixture) => { data.report.request_summary.request_id = 'foreign'; },
    (data: ReceiptFixture) => { data.report.request_summary.artifact_id = 'foreign'; },
    (data: ReceiptFixture) => { data.execution_record.ledger_attached = false; },
    (data: ReceiptFixture) => { data.report.integrity.has_ledger_reference = false; },
    (data: ReceiptFixture) => { data.report.cvf_enforcement.action = 'BLOCK'; },
    (data: ReceiptFixture) => { data.execution_record.final_decision = 'DENY'; },
  ])('rejects an unbound or inconsistent response (%#)', async change => {
    respond(change);
    expect(await fetchGovernanceReceipt('fixture-artifact', 'source'))
      .toEqual(expect.objectContaining({ status: 'INVALID_RESPONSE', receipt: null }));
  });

  it('reports HTTP failure without manufacturing a receipt', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 503 } as Response);
    expect(await fetchGovernanceReceipt('fixture-artifact', 'source'))
      .toEqual(expect.objectContaining({ status: 'UNAVAILABLE', receipt: null }));
  });
  it('reports network failure without manufacturing a receipt', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('fixture-network-failure'));
    expect(await fetchGovernanceReceipt('fixture-artifact', 'source'))
      .toEqual(expect.objectContaining({ status: 'UNAVAILABLE', receipt: null }));
  });
  it('makes no request when the endpoint is not configured', async () => {
    vi.stubEnv('NEXTAUTH_URL', '');
    expect(await fetchGovernanceReceipt('fixture-artifact', 'source'))
      .toEqual({ status: 'NOT_CONFIGURED', receipt: null });
    expect(fetch).not.toHaveBeenCalled();
  });
});
