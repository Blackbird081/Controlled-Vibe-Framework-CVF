import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testRoot = process.env.CVF_NCR_TEST_ROOT;
if (!testRoot || !path.isAbsolute(testRoot)) throw new Error('OWNED_TEST_ROOT_REQUIRED');

/**
 * Consumer-completion pure/UI suite: exactly the four files below, no env file, the existing network-denial setup
 * before any product import, an owned cache and one worker. It does not discover or replay the older offline suites,
 * and passing it is a source check, never provider or governance proof.
 */
export default defineConfig({
  envDir: false,
  cacheDir: path.join(testRoot, 'vite-cache'),
  resolve: { alias: { '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src') } },
  test: {
    cache: false,
    environment: 'jsdom',
    setupFiles: ['src/test/ncr-html-pilot-isolated-setup.ts'],
    include: [
      // Bracket classes: an unescaped route-group parenthesis is a glob group and would match nothing.
      'src/app/[(]dashboard[)]/home/page.pilot-completion.test.tsx',
      'src/components/HtmlJobControls.pilot-completion.test.tsx',
      'src/app/api/execute/route-context-selection.test.ts',
      'tests/helpers/ncr-html-pilot-proof-assertions.test.ts',
    ],
    maxWorkers: 1,
    fileParallelism: false,
    testTimeout: 10_000,
  },
});
