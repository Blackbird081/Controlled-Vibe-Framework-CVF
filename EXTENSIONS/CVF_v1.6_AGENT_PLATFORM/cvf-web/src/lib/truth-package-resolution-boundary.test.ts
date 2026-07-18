import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('truth package resolution boundary', () => {
  it('maps the nested Truth Flow kernel import to committed source', () => {
    const tsconfig = JSON.parse(
      readFileSync(path.resolve(process.cwd(), 'tsconfig.json'), 'utf8'),
    ) as {
      compilerOptions?: { paths?: Record<string, string[]> };
    };

    expect(tsconfig.compilerOptions?.paths?.['cvf-truth-kernel']).toEqual([
      '../../CVF_TRUTH_KERNEL/src/index.ts',
    ]);
  });
});
