import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { isPathInside, normalizePath, resolveCorpusInputPath } from '@/lib/lpci/intake-boundary';
import type { CorpusManifest, IntakeReport } from '@/lib/lpci/types';
import { authorizeRouteGovernanceProof, getRouteGovernanceProofConfig } from '@/lib/route-governance-proof';

const REPO_ROOT = resolve(process.cwd(), '..', '..', '..');
const REGISTRY_PATH = join(REPO_ROOT, 'docs', 'corpus-intelligence', 'CVF_CORPUS_SCAN_REGISTRY.json');

const ALLOWED_DOCTYPE_ENUM = new Set([
  'law', 'decree', 'circular', 'policy', 'notice', 'decision', 'sop', 'contract', 'other',
]);

interface RegistryCorpus {
  id: string;
  scopePaths?: string[];
}

function normalizeForCompare(pathValue: string): string {
  return normalizePath(pathValue);
}

function loadRegistry(): { corpora: RegistryCorpus[] } | null {
  try {
    const raw = readFileSync(REGISTRY_PATH, 'utf-8');
    return JSON.parse(raw) as { corpora: RegistryCorpus[] };
  } catch {
    return null;
  }
}

function scopeRoot(scopePath: string): string {
  return scopePath.endsWith('/') || scopePath.endsWith('\\') ? scopePath : dirname(scopePath);
}

function isCorpusRootRegistered(corpusId: string, corpusRootAbs: string): boolean {
  const registry = loadRegistry();
  const corpus = registry?.corpora.find((c) => c.id === corpusId);
  if (!corpus?.scopePaths?.length) return false;

  const normalizedRootAbs = normalizeForCompare(corpusRootAbs);
  return corpus.scopePaths.some((scopePath) => {
    const root = scopeRoot(scopePath);
    const scopeRootAbs = resolveCorpusInputPath(root, REPO_ROOT);
    return normalizedRootAbs === normalizeForCompare(scopeRootAbs);
  });
}

export async function POST(request: NextRequest) {
  const bodyText = await request.text();
  const routeAuth = await authorizeRouteGovernanceProof(
    request,
    bodyText,
    getRouteGovernanceProofConfig('/api/lpci/intake'),
  );
  if (!routeAuth.allowed && routeAuth.response) return routeAuth.response;

  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body', routeGovernanceProof: routeAuth.proof }, { status: 400 });
  }

  const { corpusRoot, manifestPath } = body as { corpusRoot?: string; manifestPath?: string };

  if (!corpusRoot || !manifestPath) {
    return NextResponse.json({ error: 'corpusRoot and manifestPath are required', routeGovernanceProof: routeAuth.proof }, { status: 400 });
  }

  // GC-051: verify corpus is registered
  const rootAbs = resolveCorpusInputPath(corpusRoot, REPO_ROOT);
  const manifestAbs = resolveCorpusInputPath(manifestPath, REPO_ROOT);

  if (!isPathInside(rootAbs, manifestAbs)) {
    return NextResponse.json({
      error: 'manifestPath must be inside corpusRoot',
      receiptType: 'MANIFEST_OUTSIDE_CORPUS_ROOT',
      routeGovernanceProof: routeAuth.proof,
    }, { status: 400 });
  }

  if (!existsSync(manifestAbs)) {
    return NextResponse.json({ error: 'manifestPath not found', receiptType: 'MANIFEST_NOT_FOUND', routeGovernanceProof: routeAuth.proof }, { status: 400 });
  }

  let manifest: CorpusManifest;
  try {
    manifest = JSON.parse(readFileSync(manifestAbs, 'utf-8')) as CorpusManifest;
  } catch {
    return NextResponse.json({ error: 'Failed to parse manifest JSON', routeGovernanceProof: routeAuth.proof }, { status: 400 });
  }

  if (!isCorpusRootRegistered(manifest.corpusId, rootAbs)) {
    return NextResponse.json({
      error: 'corpusRoot is not registered for this corpus in GC-051 registry',
      receiptType: 'NOT_REGISTERED',
      corpusId: manifest.corpusId,
      routeGovernanceProof: routeAuth.proof,
    }, { status: 403 });
  }

  const gaps: string[] = [];
  let hashMode = 'per-file';

  if (manifest.manifestHashProxy) {
    hashMode = `manifest-proxy: ${manifest.manifestProxyException ?? 'no exception documented'}`;
    if (!manifest.manifestProxyException) {
      gaps.push('NR-04: manifestHashProxy=true but manifestProxyException not documented');
    }
  }

  const intakeRows: Array<{ normalizedPath: string; sourceHash: string; documentType: string; gap?: string }> = [];

  for (const entry of manifest.files ?? []) {
    const normalizedPath = normalizePath(entry.relativePath);
    const absPath = resolve(rootAbs, entry.relativePath);
    let sourceHash: string;

    if (!isPathInside(rootAbs, absPath)) {
      sourceHash = 'PATH_ESCAPE_BLOCKED';
      gaps.push(`NR-05: path escapes corpusRoot at ${entry.relativePath}`);
      const docType = (entry.documentType ?? '').toLowerCase();
      if (!ALLOWED_DOCTYPE_ENUM.has(docType)) {
        gaps.push(`documentType '${entry.documentType}' not in allowed enum for ${normalizedPath}`);
      }
      intakeRows.push({ normalizedPath, sourceHash, documentType: entry.documentType, gap: 'PATH_ESCAPE_BLOCKED' });
      continue;
    }

    // NR-04: compute hash or accept proxy
    if (manifest.manifestHashProxy && manifest.manifestProxyException) {
      sourceHash = entry.hash ?? 'PROXY';
    } else {
      if (existsSync(absPath)) {
        const bytes = readFileSync(absPath);
        sourceHash = createHash('sha256').update(bytes).digest('hex');
      } else {
        sourceHash = 'FILE_NOT_FOUND';
        gaps.push(`NR-04: file not found at ${absPath}`);
      }
    }

    // documentType validation
    const docType = (entry.documentType ?? '').toLowerCase();
    if (!ALLOWED_DOCTYPE_ENUM.has(docType)) {
      gaps.push(`documentType '${entry.documentType}' not in allowed enum for ${normalizedPath}`);
    }

    intakeRows.push({ normalizedPath, sourceHash, documentType: entry.documentType });
  }

  const report: IntakeReport = {
    rowCount: intakeRows.length,
    gaps,
    sourceHashSummary: hashMode,
  };

  return NextResponse.json({ ...report, routeGovernanceProof: routeAuth.proof });
}
