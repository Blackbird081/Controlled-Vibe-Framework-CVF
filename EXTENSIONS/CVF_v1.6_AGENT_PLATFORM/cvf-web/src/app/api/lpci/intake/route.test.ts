import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { isPathInside, normalizePath, resolveCorpusInputPath } from '@/lib/lpci/intake-boundary';

const repoRoot = resolve(process.cwd(), '..', '..', '..');

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
