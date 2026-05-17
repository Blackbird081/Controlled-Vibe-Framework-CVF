import { NextRequest, NextResponse } from 'next/server';
import { appendAuditEvent } from '@/lib/control-plane-events';
import { appendFalsePositiveReport, readFalsePositiveEvents } from '@/lib/false-positive-report';
import { computeEvtFalsePositiveStats } from '@/lib/evt-operator-metrics';
import { verifySessionCookie, withSessionAuditPayload } from '@/lib/middleware-auth';

export async function GET(request: NextRequest) {
  const session = await verifySessionCookie(request);
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: please login.' },
      { status: 401 },
    );
  }

  const events = await readFalsePositiveEvents();
  return NextResponse.json({
    success: true,
    stats: computeEvtFalsePositiveStats(events),
  });
}

export async function POST(request: NextRequest) {
  const session = await verifySessionCookie(request);
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: please login.' },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid input payload.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ success: false, error: 'Invalid input payload.' }, { status: 400 });
  }

  const input = body as Record<string, unknown>;

  try {
    const report = await appendFalsePositiveReport({
      receiptId: String(input.receiptId ?? ''),
      envelopeId: typeof input.envelopeId === 'string' ? input.envelopeId : undefined,
      decision: String(input.decision ?? ''),
      riskLevel: typeof input.riskLevel === 'string' ? input.riskLevel : undefined,
      reason: typeof input.reason === 'string' ? input.reason : undefined,
      templateId: typeof input.templateId === 'string' ? input.templateId : undefined,
      routeId: typeof input.routeId === 'string' ? input.routeId : '/api/execute',
      actorId: session.userId,
      actorRole: session.role,
      userComment: typeof input.userComment === 'string' ? input.userComment : undefined,
    });

    try {
      await appendAuditEvent({
        eventType: 'FALSE_POSITIVE_REPORTED',
        actorId: session.userId,
        actorRole: session.role,
        targetResource: report.receiptId,
        action: 'REPORT_GOVERNANCE_FALSE_POSITIVE',
        riskLevel: report.riskLevel,
        phase: 'PHASE D',
        outcome: 'REPORTED',
        payload: withSessionAuditPayload(session, {
          reportId: report.id,
          receiptId: report.receiptId,
          envelopeId: report.envelopeId,
          decision: report.decision,
          templateId: report.templateId,
          routeId: report.routeId,
        }),
      });
    } catch (auditError) {
      console.warn('False-positive audit event degraded:', auditError);
    }

    return NextResponse.json({
      success: true,
      reportId: report.id,
      receiptId: report.receiptId,
      decision: report.decision,
      reportedAt: report.reportedAt,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unable to record report.' },
      { status: 400 },
    );
  }
}
