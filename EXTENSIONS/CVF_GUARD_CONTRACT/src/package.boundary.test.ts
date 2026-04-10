import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

function loadPackageJson() {
  const packageUrl = new URL('../package.json', import.meta.url);
  return JSON.parse(readFileSync(packageUrl, 'utf8')) as {
    exports?: Record<string, string>;
    files?: string[];
  };
}

describe('package boundary', () => {
  it('keeps the public runtime surface limited to the selected helper subpaths', () => {
    const packageJson = loadPackageJson();

    expect(packageJson.exports).toEqual({
      '.': './src/index.ts',
      './types': './src/types.ts',
      './engine': './src/engine.ts',
      './enterprise': './src/enterprise/enterprise.ts',
      './guards/*': './src/guards/*.ts',
      './runtime/agent-handoff': './src/runtime/agent-handoff.ts',
      './runtime/agent-coordination': './src/runtime/agent-coordination.ts',
    });
  });

  it('ships only the bounded files needed by the first-wave guard surface', () => {
    const packageJson = loadPackageJson();

    expect(packageJson.files).toEqual([
      'README.md',
      'src/index.ts',
      'src/types.ts',
      'src/engine.ts',
      'src/enterprise/enterprise.ts',
      'src/guards',
      'src/enterprise',
      'src/runtime/agent-handoff.ts',
      'src/runtime/agent-coordination.ts',
    ]);
  });
});
