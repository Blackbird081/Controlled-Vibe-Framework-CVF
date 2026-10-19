import { beforeEach, describe, expect, it, vi } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { POST } from './route';
import { resolve } from 'node:path';
import { isPathInside, normalizePath, resolveCorpusInputPath } from '@/lib/lpci/intake-boundary';

const repoRoot = resolve(process.cwd(), '..', '..', '..');

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  const methods = { existsSync: vi.fn(() => false), readFileSync: vi.fn() };
  return { ...actual, ...methods, default: { ...actual, ...methods } };
});
vi.mock('@/lib/route-governance-proof', () => ({
  authorizeRouteGovernanceProof: vi.fn(async () => ({ allowed: true, proof: { authMode: 'service_token' } })),
  getRouteGovernanceProofConfig: vi.fn(() => ({})),
}));

describe('LPCI intake request shape', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it.each([
    null, [], 42, 'corpus',
    { corpusRoot: {}, manifestPath: 'docs/manifest.json' },
    { corpusRoot: 'docs', manifestPath: [] },
    { corpusRoot: 42, manifestPath: true },
    { corpusRoot: '   ', manifestPath: 'docs/manifest.json' },
  ])('rejects malformed payload before filesystem access %#', async (payload) => {
    const response = await POST(new Request('http://localhost/api/lpci/intake', {
      method: 'POST', body: JSON.stringify(payload),
    }) as never);
    expect(response.status).toBe(400);
    expect(existsSync).not.toHaveBeenCalled();
    expect(readFileSync).not.toHaveBeenCalled();
  });
  it('keeps the valid path request on the existing manifest lookup path', async () => {
    const response = await POST(new Request('http://localhost/api/lpci/intake', {
      method: 'POST', body: JSON.stringify({ corpusRoot: 'docs', manifestPath: 'docs/manifest.json' }),
    }) as never);
    expect(response.status).toBe(400);
    expect((await response.json()).receiptType).toBe('MANIFEST_NOT_FOUND');
    expect(existsSync).toHaveBeenCalledOnce();
  });
});

describe('LPCI intake route boundary helpers', () => {
  it('normalizes corpus paths per NR-05', () => {
    expect(normalizePath('\\Policies\\Leave Policy.PDF\\')).toBe('policies/leave policy.pdf');
  });

  it('allows files inside the resolved corpus root', () => {
    const root = resolveCorpusInputPath('docs/corpus-intelligence', repoRoot);
    const candidate = resolveCorpusInputPath('docs/corpus-intelligence/GOVERNANCE_PILOT_NO_LEGAL_CORPUS-index.json', repoRoot);
    expect(isPathInside(root, candidate)).toBe(true);
  });

  it('blocks path traversal outside the corpus root', () => {
    const root = resolveCorpusInputPath('docs/corpus-intelligence', repoRoot);
    const candidate = resolveCorpusInputPath('docs/reference/CVF_LPCI1_T4_RETRIEVAL_BOUNDARY_SPEC_2026-06-03.md', repoRoot);
    expect(isPathInside(root, candidate)).toBe(false);
  });
});
