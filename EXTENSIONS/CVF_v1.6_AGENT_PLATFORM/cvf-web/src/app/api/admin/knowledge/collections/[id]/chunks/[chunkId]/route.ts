import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { knowledgeStore } from '@/lib/knowledge-store';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chunkId: string }> },
) {
  const session = await requireAdminApiSession(request, '/api/admin/knowledge/collections/[id]/chunks/[chunkId]');
  if (session instanceof NextResponse) return session;

  const { id, chunkId } = await params;
  if (!knowledgeStore.getCollection(id)) {
    return NextResponse.json({ success: false, error: `Collection '${id}' not found.` }, { status: 404 });
  }

  knowledgeStore.deleteChunk(id, chunkId);
  return NextResponse.json({ success: true, collectionId: id, chunkId });
}
