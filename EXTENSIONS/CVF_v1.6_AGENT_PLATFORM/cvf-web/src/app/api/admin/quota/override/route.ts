import { NextRequest, NextResponse } from 'next/server';

import { requireAdminApiSession, withAdminAuditPayload } from '@/lib/admin-session';
import { appendAuditEvent } from '@/lib/control-plane-events';
import { MOCK_TEAMS } from '@/lib/mock-enterprise-db';
import { appendQuotaOverrideEvent } from '@/lib/policy-events';
import { getActiveQuotaOverride } from '@/lib/policy-reader';

export async function POST(request: NextRequest) {
  const session = await requireAdminApiSession(request, '/api/admin/quota/override', { ownerOnly: true });
  if (session instanceof NextResponse) {
    return session;
  }

  const body = await request.json().catch(() => null);
  const teamId = typeof body?.teamId === 'string' ? body.teamId : '';
  const reason = typeof body?.reason === 'string' ? body.reason.trim() : '';
  const team = MOCK_TEAMS.find(candidate => candidate.id === teamId);

  if (!team) {
    return NextResponse.json({ success: false, error: 'Unknown teamId.' }, { status: 400 });
  }

  if (!reason) {
    return NextResponse.json({ success: false, error: 'Override reason is required.' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString();

  const record = await appendQuotaOverrideEvent({
    teamId,
    orgId: team.orgId,
    status: 'granted',
    grantedBy: session.userId,
    grantedAt: now,
    expiresAt,
    reason,
    timestamp: now,
  });

  await appendAuditEvent({
    timestamp: now,
    eventType: 'QUOTA_OVERRIDE_GRANTED',
    actorId: session.userId,
    actorRole: session.role,
    targetResource: teamId,
    action: 'GRANT_TEAM_QUOTA_OVERRIDE',
    riskLevel: 'R2',
    phase: 'PHASE C',
    outcome: 'SUCCESS',
    payload: withAdminAuditPayload(session, {
      teamName: team.name,
      expiresAt,
      reason,
    }),
  });

  return NextResponse.json({ success: true, data: record }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await requireAdminApiSession(request, '/api/admin/quota/override', { ownerOnly: true });
  if (session instanceof NextResponse) {
    return session;
  }

  const body = await request.json().catch(() => null);
  const teamId = typeof body?.teamId === 'string' ? body.teamId : '';
  const reason = typeof body?.reason === 'string' && body.reason.trim()
    ? body.reason.trim()
    : 'Manual revoke from enterprise console.';
  const team = MOCK_TEAMS.find(candidate => candidate.id === teamId);

  if (!team) {
    return NextResponse.json({ success: false, error: 'Unknown teamId.' }, { status: 400 });
  }

  const activeOverride = await getActiveQuotaOverride(teamId);
  if (!activeOverride) {
    return NextResponse.json({ success: false, error: 'No active override found for team.' }, { status: 404 });
  }

  const now = new Date().toISOString();
  const record = await appendQuotaOverrideEvent({
    teamId,
    orgId: team.orgId,
    status: 'revoked',
    grantedBy: activeOverride.grantedBy,
    grantedAt: activeOverride.grantedAt,
    revokedBy: session.userId,
    revokedAt: now,
    expiresAt: activeOverride.expiresAt,
    reason,
    timestamp: now,
  });

  await appendAuditEvent({
    timestamp: now,
    eventType: 'QUOTA_OVERRIDE_REVOKED',
    actorId: session.userId,
    actorRole: session.role,
    targetResource: teamId,
    action: 'REVOKE_TEAM_QUOTA_OVERRIDE',
    riskLevel: 'R2',
    phase: 'PHASE C',
    outcome: 'SUCCESS',
    payload: withAdminAuditPayload(session, {
      teamName: team.name,
      previousExpiresAt: activeOverride.expiresAt,
      reason,
    }),
  });

  return NextResponse.json({ success: true, data: record });
}
