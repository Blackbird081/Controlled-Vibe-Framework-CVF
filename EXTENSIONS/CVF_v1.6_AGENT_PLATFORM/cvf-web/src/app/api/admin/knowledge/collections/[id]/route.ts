import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { canAdminAccessResourceScope, resolveAdminResourceScope } from '@/lib/admin-resource-scope';
import { knowledgeStore } from '@/lib/knowledge-store';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApiSession(request, '/api/admin/knowledge/collections/[id]');
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const existing = knowledgeStore.getCollection(id);
  if (!existing) {
    return NextResponse.json({ success: false, error: `Collection '${id}' not found.` }, { status: 404 });
  }

  const accessResult = canAdminAccessResourceScope(session, {
    orgId: existing.orgId,
    teamId: existing.teamId,
  });
  if (!accessResult.ok) {
    return NextResponse.json({ success: false, error: accessResult.error }, { status: accessResult.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { name, description, orgId, teamId } = body as Record<string, unknown>;
  const scopeResult = resolveAdminResourceScope(session, {
    orgId: Object.hasOwn(body as object, 'orgId') ? (typeof orgId === 'string' ? orgId : null) : existing.orgId,
    teamId: Object.hasOwn(body as object, 'teamId') ? (typeof teamId === 'string' ? teamId : null) : existing.teamId,
  });
  if (!scopeResult.ok) {
    return NextResponse.json({ success: false, error: scopeResult.error }, { status: scopeResult.status });
  }

  knowledgeStore.upsertCollection({
    ...existing,
    name: typeof name === 'string' && name.trim() ? name.trim() : existing.name,
    description: typeof description === 'string' ? description.trim() : existing.description,
    orgId: scopeResult.scope.orgId,
    teamId: scopeResult.scope.teamId,
  });

  return NextResponse.json({ success: true, collectionId: id });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApiSession(request, '/api/admin/knowledge/collections/[id]');
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const existing = knowledgeStore.getCollection(id);
  if (!existing) {
    return NextResponse.json({ success: false, error: `Collection '${id}' not found.` }, { status: 404 });
  }

  const accessResult = canAdminAccessResourceScope(session, {
    orgId: existing.orgId,
    teamId: existing.teamId,
  });
  if (!accessResult.ok) {
    return NextResponse.json({ success: false, error: accessResult.error }, { status: accessResult.status });
  }

  knowledgeStore.deleteCollection(id);
  return NextResponse.json({ success: true, collectionId: id });
}
