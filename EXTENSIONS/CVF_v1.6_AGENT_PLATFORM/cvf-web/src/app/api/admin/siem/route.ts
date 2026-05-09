import { NextRequest, NextResponse } from 'next/server';

import { requireAdminApiSession, withAdminAuditPayload } from '@/lib/admin-session';
import { appendAuditEvent } from '@/lib/control-plane-events';
import { appendSIEMConfigEvent, type SIEMEventFilter } from '@/lib/policy-events';
import { getActiveSIEMConfig } from '@/lib/policy-reader';

type SIEMConfigPayload = {
  webhookUrl?: string;
  signingSecret?: string;
  enabled?: boolean;
  eventTypes?: SIEMEventFilter;
};

function isValidEventType(value: unknown): value is SIEMEventFilter {
  return value === 'audit' || value === 'cost' || value === 'all';
}

export async function GET(request: NextRequest) {
  const session = await requireAdminApiSession(request, '/api/admin/siem');
  if (session instanceof NextResponse) {
    return session;
  }

  const config = await getActiveSIEMConfig();
  return NextResponse.json({ success: true, data: config ?? null });
}

export async function POST(request: NextRequest) {
  const session = await requireAdminApiSession(request, '/api/admin/siem');
  if (session instanceof NextResponse) {
    return session;
  }

  const body = await request.json().catch(() => null) as SIEMConfigPayload | null;
  const webhookUrl = String(body?.webhookUrl || '').trim();
  const signingSecret = String(body?.signingSecret || '').trim();
  const enabled = body?.enabled === true;
  const eventTypes = body?.eventTypes;

  if (!webhookUrl) {
    return NextResponse.json({ success: false, error: 'webhookUrl is required.' }, { status: 400 });
  }

  if (!signingSecret) {
    return NextResponse.json({ success: false, error: 'signingSecret is required.' }, { status: 400 });
  }

  if (!isValidEventType(eventTypes)) {
    return NextResponse.json({ success: false, error: 'eventTypes must be audit, cost, or all.' }, { status: 400 });
  }

  let webhookHost = '';
  try {
    webhookHost = new URL(webhookUrl).host;
  } catch {
    return NextResponse.json({ success: false, error: 'webhookUrl must be a valid URL.' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const record = await appendSIEMConfigEvent({
    timestamp: now,
    webhookUrl,
    signingSecret,
    enabled,
    eventTypes,
    setBy: session.userId,
    setAt: now,
  });

  await appendAuditEvent({
    timestamp: now,
    eventType: 'SIEM_CONFIG_UPDATED',
    actorId: session.userId,
    actorRole: session.role,
    targetResource: 'siem-config',
    action: 'SET_SIEM_CONFIG',
    riskLevel: 'R2',
    phase: 'PHASE D',
    outcome: 'SUCCESS',
    payload: withAdminAuditPayload(session, {
      enabled,
      eventTypes,
      webhookHost,
    }),
  });

  return NextResponse.json({ success: true, data: record }, { status: 201 });
}
