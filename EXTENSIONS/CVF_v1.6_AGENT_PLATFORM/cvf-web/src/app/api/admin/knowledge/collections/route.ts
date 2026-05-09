import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { resolveAdminResourceScope } from '@/lib/admin-resource-scope';
import { knowledgeStore } from '@/lib/knowledge-store';

export async function POST(request: NextRequest) {
  const session = await requireAdminApiSession(request, '/api/admin/knowledge/collections');
  if (session instanceof NextResponse) return session;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { id, name, description, orgId, teamId } = body as Record<string, unknown>;

  if (typeof id !== 'string' || !id.trim()) {
    return NextResponse.json({ success: false, error: 'id is required.' }, { status: 400 });
  }
  if (typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ success: false, error: 'name is required.' }, { status: 400 });
  }

  const collectionId = id.trim();
  if (knowledgeStore.getCollection(collectionId)) {
    return NextResponse.json({ success: false, error: `Collection '${collectionId}' already exists.` }, { status: 409 });
  }

  const scopeResult = resolveAdminResourceScope(session, {
    orgId: typeof orgId === 'string' ? orgId : null,
    teamId: typeof teamId === 'string' ? teamId : null,
  });
  if (!scopeResult.ok) {
    return NextResponse.json({ success: false, error: scopeResult.error }, { status: scopeResult.status });
  }

  knowledgeStore.upsertCollection({
    id: collectionId,
    name: (name as string).trim(),
    description: typeof description === 'string' ? description.trim() : '',
    orgId: scopeResult.scope.orgId,
    teamId: scopeResult.scope.teamId,
    chunks: [],
  });

  return NextResponse.json({ success: true, collectionId });
}
