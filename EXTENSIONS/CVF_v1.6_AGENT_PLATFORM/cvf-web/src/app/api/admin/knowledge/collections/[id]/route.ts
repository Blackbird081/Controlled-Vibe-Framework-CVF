import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { name, description, orgId, teamId } = body as Record<string, unknown>;

  knowledgeStore.upsertCollection({
    ...existing,
    name: typeof name === 'string' && name.trim() ? name.trim() : existing.name,
    description: typeof description === 'string' ? description.trim() : existing.description,
    orgId: Object.hasOwn(body as object, 'orgId')
      ? (typeof orgId === 'string' && orgId.trim() ? orgId.trim() : null)
      : existing.orgId,
    teamId: Object.hasOwn(body as object, 'teamId')
      ? (typeof teamId === 'string' && teamId.trim() ? teamId.trim() : null)
      : existing.teamId,
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
  if (!knowledgeStore.getCollection(id)) {
    return NextResponse.json({ success: false, error: `Collection '${id}' not found.` }, { status: 404 });
  }

  knowledgeStore.deleteCollection(id);
  return NextResponse.json({ success: true, collectionId: id });
}
