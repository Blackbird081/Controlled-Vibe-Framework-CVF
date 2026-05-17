import { describe, expect, it, vi, beforeEach } from 'vitest';

const verifySessionCookieMock = vi.hoisted(() => vi.fn());
const appendFalsePositiveReportMock = vi.hoisted(() => vi.fn());
const readFalsePositiveEventsMock = vi.hoisted(() => vi.fn());
const appendAuditEventMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/middleware-auth', () => ({
  verifySessionCookie: verifySessionCookieMock,
  withSessionAuditPayload: (_session: unknown, payload?: Record<string, unknown>) => payload,
}));

vi.mock('@/lib/false-positive-report', () => ({
  appendFalsePositiveReport: appendFalsePositiveReportMock,
  readFalsePositiveEvents: readFalsePositiveEventsMock,
}));

vi.mock('@/lib/control-plane-events', () => ({
  appendAuditEvent: appendAuditEventMock,
}));

import { GET, POST } from './route';

describe('POST /api/governance/false-positive-report', () => {
  beforeEach(() => {
    verifySessionCookieMock.mockReset();
    appendFalsePositiveReportMock.mockReset();
    readFalsePositiveEventsMock.mockReset();
    appendAuditEventMock.mockReset();
    verifySessionCookieMock.mockResolvedValue({
      userId: 'usr_1',
      role: 'admin',
      orgId: 'org_1',
      teamId: 'team_1',
    });
  });

  it('returns false-positive operator stats for authenticated sessions', async () => {
    readFalsePositiveEventsMock.mockResolvedValue([
      { eventType: 'REPORTABLE_DECISION_OBSERVED', receiptId: 'rcpt-001', decision: 'BLOCK' },
      { eventType: 'REPORTABLE_DECISION_OBSERVED', receiptId: 'rcpt-002', decision: 'CLARIFY' },
      { eventType: 'FALSE_POSITIVE_REPORTED', receiptId: 'rcpt-002', decision: 'CLARIFY' },
    ]);

    const response = await GET(new Request('http://localhost/api/governance/false-positive-report') as never);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toMatchObject({
      success: true,
      stats: {
        observedReportableDecisions: 2,
        falsePositiveReports: 1,
        falsePositiveRatePct: 50,
        evidenceMode: 'observed_and_reported',
      },
    });
  });

  it('records a false-positive report linked to an existing receipt', async () => {
    appendFalsePositiveReportMock.mockResolvedValue({
      id: 'fp-001',
      reportedAt: '2026-05-14T00:00:00.000Z',
      receiptId: 'rcpt-001',
      envelopeId: 'env-001',
      decision: 'BLOCK',
      riskLevel: 'R2',
      templateId: 'strategy',
      routeId: '/api/execute',
    });

    const response = await POST(new Request('http://localhost/api/governance/false-positive-report', {
      method: 'POST',
      body: JSON.stringify({
        receiptId: 'rcpt-001',
        envelopeId: 'env-001',
        decision: 'BLOCK',
        riskLevel: 'R2',
        templateId: 'strategy',
      }),
    }) as never);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toMatchObject({
      success: true,
      reportId: 'fp-001',
      receiptId: 'rcpt-001',
      decision: 'BLOCK',
    });
    expect(appendFalsePositiveReportMock).toHaveBeenCalledWith(expect.objectContaining({
      receiptId: 'rcpt-001',
      decision: 'BLOCK',
      actorId: 'usr_1',
      actorRole: 'admin',
    }));
    expect(appendAuditEventMock).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'FALSE_POSITIVE_REPORTED',
      targetResource: 'rcpt-001',
      outcome: 'REPORTED',
    }));
  });

  it('rejects unauthenticated reports', async () => {
    verifySessionCookieMock.mockResolvedValueOnce(null);

    const response = await POST(new Request('http://localhost/api/governance/false-positive-report', {
      method: 'POST',
      body: JSON.stringify({ receiptId: 'rcpt-001', decision: 'BLOCK' }),
    }) as never);

    expect(response.status).toBe(401);
    expect(appendFalsePositiveReportMock).not.toHaveBeenCalled();
  });

  it('returns 400 when the report is not valid', async () => {
    appendFalsePositiveReportMock.mockRejectedValueOnce(new Error('Only BLOCK and CLARIFY decisions can be reported as false positives'));

    const response = await POST(new Request('http://localhost/api/governance/false-positive-report', {
      method: 'POST',
      body: JSON.stringify({ receiptId: 'rcpt-001', decision: 'NEEDS_APPROVAL' }),
    }) as never);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toMatch(/Only BLOCK and CLARIFY/);
  });
});
