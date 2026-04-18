import { NextRequest, NextResponse } from 'next/server';

import { requireAdminApiSession, withAdminAuditPayload } from '@/lib/admin-session';
import { appendAuditEvent } from '@/lib/control-plane-events';
import { MOCK_TEAMS } from '@/lib/mock-enterprise-db';
import { appendQuotaPolicyEvent } from '@/lib/policy-events';

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  return Number.NaN;
}

export async function POST(request: NextRequest) {
  const session = await requireAdminApiSession(request, '/api/admin/quota/policy');
  if (session instanceof NextResponse) {
    return session;
  }

  const body = await request.json().catch(() => null);
  const teamId = typeof body?.teamId === 'string' ? body.teamId : '';
  const period = body?.period;
  const softCapUSD = toNumber(body?.softCapUSD);
  const hardCapUSD = toNumber(body?.hardCapUSD);

  const team = MOCK_TEAMS.find(candidate => candidate.id === teamId);
  if (!team) {
    return NextResponse.json({ success: false, error: 'Unknown teamId.' }, { status: 400 });
  }

  if (!['daily', 'weekly', 'monthly'].includes(period)) {
    return NextResponse.json({ success: false, error: 'Invalid quota period.' }, { status: 400 });
  }

  if (!Number.isFinite(softCapUSD) || !Number.isFinite(hardCapUSD) || softCapUSD <= 0 || hardCapUSD <= softCapUSD) {
    return NextResponse.json(
      { success: false, error: 'Quota values must be positive and hardCapUSD must be greater than softCapUSD.' },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const record = await appendQuotaPolicyEvent({
    teamId,
    orgId: team.orgId,
    softCapUSD,
    hardCapUSD,
    period,
    setBy: session.userId,
    setAt: now,
    timestamp: now,
  });

  await appendAuditEvent({
    timestamp: now,
    eventType: 'QUOTA_POLICY_SET',
    actorId: session.userId,
    actorRole: session.role,
    targetResource: teamId,
    action: 'SET_TEAM_QUOTA_POLICY',
    riskLevel: 'R1',
    phase: 'PHASE C',
    outcome: 'SUCCESS',
    payload: withAdminAuditPayload(session, {
      teamName: team.name,
      softCapUSD,
      hardCapUSD,
      period,
    }),
  });

  return NextResponse.json({ success: true, data: record }, { status: 201 });
}
