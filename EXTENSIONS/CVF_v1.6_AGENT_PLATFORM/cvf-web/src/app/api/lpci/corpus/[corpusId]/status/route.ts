import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REGISTRY_PATH = join(process.cwd(), '..', '..', '..', 'docs', 'corpus-intelligence', 'CVF_CORPUS_SCAN_REGISTRY.json');

interface CorpusEntry {
  id: string;
  displayName?: string;
  status?: string;
  fileCount?: number;
  corpusType?: string;
}

interface RegistryData {
  corpora: CorpusEntry[];
}

function loadRegistry(): RegistryData | null {
  try {
    const raw = readFileSync(REGISTRY_PATH, 'utf-8');
    return JSON.parse(raw) as RegistryData;
  } catch {
    return null;
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ corpusId: string }> },
) {
  const { corpusId } = await params;
  const registry = loadRegistry();

  if (!registry) {
    return NextResponse.json({ registered: false, classificationStatus: 'REGISTRY_UNAVAILABLE', rowCount: 0 }, { status: 503 });
  }

  const entry = registry.corpora.find((c) => c.id === corpusId);
  if (!entry) {
    return NextResponse.json({ registered: false, classificationStatus: 'NOT_REGISTERED', rowCount: 0 });
  }

  return NextResponse.json({
    registered: true,
    classificationStatus: entry.status ?? 'UNKNOWN',
    rowCount: entry.fileCount ?? 0,
    displayName: entry.displayName,
    corpusType: entry.corpusType,
  });
}
