import { NextRequest, NextResponse } from 'next/server';

import { requireAdminApiSession, withAdminAuditPayload } from '@/lib/admin-session';
import { appendAuditEvent } from '@/lib/control-plane-events';
import { MOCK_ORGANIZATIONS, MOCK_TEAMS } from '@/lib/mock-enterprise-db';
import { appendKnowledgeCollectionScopeEvent } from '@/lib/policy-events';
import { listKnowledgeCollections } from '@/lib/knowledge-retrieval';

export async function POST(request: NextRequest) {
  const session = await requireAdminApiSession(request, '/api/admin/tool-registry/knowledge-scope');
  if (session instanceof NextResponse) {
    return session;
  }

  const body = await request.json() as {
    collectionId?: string;
    orgId?: string | null;
    teamId?: string | null;
  };

  const collectionId = typeof body.collectionId === 'string' ? body.collectionId.trim() : '';
  const requestedOrgId = typeof body.orgId === 'string' ? body.orgId.trim() : '';
  const requestedTeamId = typeof body.teamId === 'string' ? body.teamId.trim() : '';

  const collections = await listKnowledgeCollections();
  const targetCollection = collections.find(collection => collection.id === collectionId);
  if (!targetCollection) {
    return NextResponse.json({ success: false, error: 'Unknown knowledge collection.' }, { status: 400 });
  }

  const team = requestedTeamId ? MOCK_TEAMS.find(candidate => candidate.id === requestedTeamId) : null;
  if (requestedTeamId && !team) {
    return NextResponse.json({ success: false, error: 'Unknown teamId.' }, { status: 400 });
  }

  const derivedOrgId = team?.orgId ?? requestedOrgId;
  if (derivedOrgId && !MOCK_ORGANIZATIONS.some(org => org.id === derivedOrgId)) {
    return NextResponse.json({ success: false, error: 'Unknown orgId.' }, { status: 400 });
  }

  if (team && requestedOrgId && requestedOrgId !== team.orgId) {
    return NextResponse.json({ success: false, error: 'teamId does not belong to the selected orgId.' }, { status: 400 });
  }

  const timestamp = new Date().toISOString();
  const policy = await appendKnowledgeCollectionScopeEvent({
    timestamp,
    collectionId,
    orgId: derivedOrgId || null,
    teamId: team?.id ?? null,
    setBy: session.userId,
    setAt: timestamp,
  });

  await appendAuditEvent({
    eventType: 'KNOWLEDGE_COLLECTION_SCOPE_UPDATED',
    actorId: session.userId,
    actorRole: session.role,
    targetResource: collectionId,
    action: 'SET_KNOWLEDGE_COLLECTION_SCOPE',
    riskLevel: 'R2',
    phase: 'PHASE C',
    outcome: 'SUCCESS',
    payload: withAdminAuditPayload(session, {
      orgId: policy.orgId,
      teamId: policy.teamId,
    }),
  });

  return NextResponse.json({ success: true, data: policy }, { status: 201 });
}
