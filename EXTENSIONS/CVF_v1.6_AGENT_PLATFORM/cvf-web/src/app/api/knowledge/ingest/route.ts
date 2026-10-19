import { NextRequest, NextResponse } from 'next/server';
import { InvalidRequestBodyEncodingError, readBoundedRequestBody } from '@/lib/bounded-request-body';
import { knowledgeStore } from '@/lib/knowledge-store';
import type { KnowledgeChunk } from '@/lib/knowledge-retrieval';
import { authorizeRouteGovernanceProof, getRouteGovernanceProofConfig } from '@/lib/route-governance-proof';

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
  let bodyText: string | null;
  try { bodyText = await readBoundedRequestBody(req, 4 * 1024 * 1024); }
  catch (error) {
    if (error instanceof InvalidRequestBodyEncodingError) return NextResponse.json({ error: error.message }, { status: 400 });
    throw error;
  }
  if (bodyText === null) return NextResponse.json({ error: 'Knowledge ingest body exceeds 4 MiB limit.' }, { status: 413 });
  const routeAuth = await authorizeRouteGovernanceProof(
    req,
    bodyText,
    getRouteGovernanceProofConfig('/api/knowledge/ingest'),
  );
  if (!routeAuth.allowed && routeAuth.response) return routeAuth.response;

  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body', routeGovernanceProof: routeAuth.proof }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Body must be a JSON object', routeGovernanceProof: routeAuth.proof }, { status: 400 });
  }

  const parsed = body as Partial<KnowledgeIngestRequest>;

  if (!parsed.collectionId || typeof parsed.collectionId !== 'string') {
    return NextResponse.json({ error: 'collectionId is required', routeGovernanceProof: routeAuth.proof }, { status: 400 });
  }

  if (parsed.collectionName != null && typeof parsed.collectionName !== 'string') {
    return NextResponse.json({ error: 'collectionName must be a string', routeGovernanceProof: routeAuth.proof }, { status: 400 });
  }

  if (!Array.isArray(parsed.chunks) || parsed.chunks.length === 0) {
    return NextResponse.json({ error: 'chunks must be a non-empty array', routeGovernanceProof: routeAuth.proof }, { status: 400 });
  }

  const validChunks: KnowledgeChunk[] = [];
  for (const chunk of parsed.chunks) {
    if (
      !chunk || typeof chunk !== 'object' || Array.isArray(chunk) ||
      typeof chunk.id !== 'string' ||
      typeof chunk.content !== 'string' ||
      !Array.isArray(chunk.keywords) ||
      !chunk.keywords.every(keyword => typeof keyword === 'string')
    ) {
      return NextResponse.json(
        { error: 'Each chunk must have id (string), content (string), keywords (string[])', routeGovernanceProof: routeAuth.proof },
        { status: 400 },
      );
    }
    validChunks.push({ id: chunk.id, content: chunk.content, keywords: chunk.keywords });
  }

  knowledgeStore.registerEphemeral({
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

  return NextResponse.json({ ...response, routeGovernanceProof: routeAuth.proof }, { status: 200 });
}
