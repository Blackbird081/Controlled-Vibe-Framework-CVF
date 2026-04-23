import { NextRequest, NextResponse } from 'next/server';
import { registerRuntimeCollection, KnowledgeChunk } from '@/lib/knowledge-retrieval';

export interface KnowledgeIngestRequest {
  collectionId: string;
  collectionName?: string;
  chunks: KnowledgeChunk[];
}

export interface KnowledgeIngestResponse {
  accepted: number;
  collectionId: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = body as Partial<KnowledgeIngestRequest>;

  if (!parsed.collectionId || typeof parsed.collectionId !== 'string') {
    return NextResponse.json({ error: 'collectionId is required' }, { status: 400 });
  }

  if (!Array.isArray(parsed.chunks) || parsed.chunks.length === 0) {
    return NextResponse.json({ error: 'chunks must be a non-empty array' }, { status: 400 });
  }

  const validChunks: KnowledgeChunk[] = [];
  for (const chunk of parsed.chunks) {
    if (
      typeof chunk.id !== 'string' ||
      typeof chunk.content !== 'string' ||
      !Array.isArray(chunk.keywords)
    ) {
      return NextResponse.json(
        { error: 'Each chunk must have id (string), content (string), keywords (string[])' },
        { status: 400 },
      );
    }
    validChunks.push({ id: chunk.id, content: chunk.content, keywords: chunk.keywords });
  }

  registerRuntimeCollection({
    id: parsed.collectionId,
    name: parsed.collectionName ?? parsed.collectionId,
    description: `Downstream project knowledge — ${parsed.collectionId}`,
    orgId: null,
    teamId: null,
    chunks: validChunks,
  });

  const response: KnowledgeIngestResponse = {
    accepted: validChunks.length,
    collectionId: parsed.collectionId,
  };

  return NextResponse.json(response, { status: 200 });
}
