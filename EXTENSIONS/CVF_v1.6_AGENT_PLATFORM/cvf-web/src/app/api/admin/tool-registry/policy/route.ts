import { NextRequest, NextResponse } from 'next/server';
import type { TeamRole } from 'cvf-guard-contract/enterprise';

import { verifySessionCookie } from '@/lib/middleware-auth';
import { canAccessAdmin } from '@/lib/enterprise-access';
import { appendAuditEvent } from '@/lib/control-plane-events';
import { appendToolPolicyEvent } from '@/lib/policy-events';

const VALID_ROLES: TeamRole[] = ['owner', 'admin', 'developer', 'reviewer', 'viewer'];

export async function POST(request: NextRequest) {
  const session = await verifySessionCookie(request);
  if (!session || !canAccessAdmin(session.role)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json() as {
    toolId?: string;
    allowedRoles?: string[];
  };

  const toolId = String(body.toolId || '').trim();
  const allowedRoles = Array.isArray(body.allowedRoles)
    ? VALID_ROLES.filter(role => body.allowedRoles?.includes(role))
    : [];

  if (!toolId) {
    return NextResponse.json({ success: false, error: 'toolId is required.' }, { status: 400 });
  }

  if (allowedRoles.length === 0) {
    return NextResponse.json({ success: false, error: 'At least one allowed role is required.' }, { status: 400 });
  }

  if (!allowedRoles.includes('owner')) {
    return NextResponse.json({ success: false, error: 'Owner role cannot be removed from a tool.' }, { status: 400 });
  }

  const timestamp = new Date().toISOString();
  const policy = await appendToolPolicyEvent({
    timestamp,
    toolId,
    allowedRoles,
    setBy: session.userId,
    setAt: timestamp,
  });

  await appendAuditEvent({
    eventType: 'TOOL_POLICY_UPDATED',
    actorId: session.userId,
    actorRole: session.role,
    targetResource: toolId,
    action: 'SET_TOOL_POLICY',
    riskLevel: 'R1',
    phase: 'PHASE C',
    outcome: 'SUCCESS',
    payload: { allowedRoles },
  });

  return NextResponse.json({ success: true, data: policy }, { status: 201 });
}
