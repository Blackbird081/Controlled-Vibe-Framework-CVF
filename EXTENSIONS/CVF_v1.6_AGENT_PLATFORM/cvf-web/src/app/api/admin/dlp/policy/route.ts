import { NextRequest, NextResponse } from 'next/server';

import { requireAdminApiSession, withAdminAuditPayload } from '@/lib/admin-session';
import { resolveAdminResourceScope } from '@/lib/admin-resource-scope';
import { appendAuditEvent } from '@/lib/control-plane-events';
import { appendDLPPolicyEvent } from '@/lib/policy-events';
import { getActiveDLPPolicy } from '@/lib/policy-reader';

type DLPPolicyPayload = {
  orgId?: string | null;
  teamId?: string | null;
  patterns?: Array<{
    id?: string;
    label?: string;
    regex?: string;
    enabled?: boolean;
  }>;
};

function normalizePatterns(body: DLPPolicyPayload['patterns']) {
  if (!Array.isArray(body)) return null;

  const normalized = body.map(pattern => ({
    id: String(pattern?.id || '').trim(),
    label: String(pattern?.label || '').trim(),
    regex: String(pattern?.regex || '').trim(),
    enabled: pattern?.enabled !== false,
  }));

  if (normalized.some(pattern => !pattern.id || !pattern.label || !pattern.regex)) {
    return null;
  }

  for (const pattern of normalized) {
    try {
      new RegExp(pattern.regex, 'u');
    } catch {
      return null;
    }
  }

  return normalized;
}

export async function GET(request: NextRequest) {
  const session = await requireAdminApiSession(request, '/api/admin/dlp/policy');
  if (session instanceof NextResponse) {
    return session;
  }

  const policy = await getActiveDLPPolicy();
  return NextResponse.json({ success: true, data: policy ?? { patterns: [] } });
}

export async function POST(request: NextRequest) {
  const session = await requireAdminApiSession(request, '/api/admin/dlp/policy');
  if (session instanceof NextResponse) {
    return session;
  }

  const body = await request.json().catch(() => null) as DLPPolicyPayload | null;
  const patterns = normalizePatterns(body?.patterns);
  if (!patterns) {
    return NextResponse.json({ success: false, error: 'Invalid DLP policy payload.' }, { status: 400 });
  }

  const scopeResult = resolveAdminResourceScope(session, { orgId: body?.orgId, teamId: body?.teamId });
  if (!scopeResult.ok) {
    return NextResponse.json({ success: false, error: scopeResult.error }, { status: scopeResult.status });
  }

  const now = new Date().toISOString();
  const record = await appendDLPPolicyEvent({
    timestamp: now,
    orgId: scopeResult.scope.orgId,
    teamId: scopeResult.scope.teamId,
    patterns,
    setBy: session.userId,
    setAt: now,
  });

  await appendAuditEvent({
    timestamp: now,
    eventType: 'DLP_POLICY_UPDATED',
    actorId: session.userId,
    actorRole: session.role,
    targetResource: 'dlp-policy',
    action: 'SET_DLP_POLICY',
    riskLevel: 'R2',
    phase: 'PHASE D',
    outcome: 'SUCCESS',
    payload: withAdminAuditPayload(session, {
      orgId: scopeResult.scope.orgId,
      teamId: scopeResult.scope.teamId,
      patternCount: patterns.length,
      enabledPatternCount: patterns.filter(pattern => pattern.enabled).length,
    }),
  });

  return NextResponse.json({ success: true, data: record }, { status: 201 });
}
