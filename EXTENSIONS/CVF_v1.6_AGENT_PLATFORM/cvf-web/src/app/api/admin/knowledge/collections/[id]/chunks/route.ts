import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { canAdminAccessResourceScope } from '@/lib/admin-resource-scope';
import { knowledgeStore } from '@/lib/knowledge-store';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApiSession(request, '/api/admin/knowledge/collections/[id]/chunks');
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const collection = knowledgeStore.getCollection(id);
  if (!collection) {
    return NextResponse.json({ success: false, error: `Collection '${id}' not found.` }, { status: 404 });
  }

  const accessResult = canAdminAccessResourceScope(session, {
    orgId: collection.orgId,
    teamId: collection.teamId,
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

  const { id: chunkId, content, keywords } = body as Record<string, unknown>;

  if (typeof chunkId !== 'string' || !chunkId.trim()) {
    return NextResponse.json({ success: false, error: 'chunk id is required.' }, { status: 400 });
  }
  if (typeof content !== 'string' || !content.trim()) {
    return NextResponse.json({ success: false, error: 'chunk content is required.' }, { status: 400 });
  }
  if (!Array.isArray(keywords) || keywords.some(k => typeof k !== 'string')) {
    return NextResponse.json({ success: false, error: 'keywords must be a string array.' }, { status: 400 });
  }

  knowledgeStore.addChunk(id, {
    id: chunkId.trim(),
    content: content.trim(),
    keywords: keywords as string[],
  });

  return NextResponse.json({ success: true, collectionId: id, chunkId: chunkId.trim() });
}
