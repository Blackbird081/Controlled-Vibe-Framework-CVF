import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
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

  knowledgeStore.upsertCollection({
    id: collectionId,
    name: (name as string).trim(),
    description: typeof description === 'string' ? description.trim() : '',
    orgId: typeof orgId === 'string' && orgId.trim() ? orgId.trim() : null,
    teamId: typeof teamId === 'string' && teamId.trim() ? teamId.trim() : null,
    chunks: [],
  });

  return NextResponse.json({ success: true, collectionId });
}
