import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testRoot = process.env.CVF_NCR_TEST_ROOT;
if (!testRoot || !path.isAbsolute(testRoot)) throw new Error('OWNED_TEST_ROOT_REQUIRED');

/** Worker-only pure/file/UI-structure suite. This is never a governance or provider proof. */
export default defineConfig({
  envDir: false,
  cacheDir: path.join(testRoot, 'vite-cache'),
  resolve: { alias: { '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src') } },
  test: {
    cache: false,
    environment: 'jsdom',
    setupFiles: ['src/test/ncr-html-pilot-isolated-setup.ts'],
    include: [
      'src/lib/receipt-integrity-anchor.test.ts',
      'src/lib/execute-prompt-contract.test.ts',
      'src/lib/html-job-contract.test.ts',
      'src/lib/html-draft-recovery-contract.test.ts',
      'src/lib/server/html-draft-snapshot-store.job.test.ts',
      'src/lib/server/html-execution-evidence.test.ts',
      'src/lib/server/ncr-html-pilot-operation-ledger.test.ts',
      'src/lib/server/ncr-html-pilot-auth.test.ts',
      'src/lib/html-cta-rendering.test.ts',
      'src/lib/execution-receipt-archive.test.ts',
      'src/components/ResultViewer.html-transfer.test.tsx',
      'src/app/(dashboard)/work-transfer/page.test.tsx',
      'src/components/HtmlDraftRecovery.job.test.tsx',
      'src/components/ProcessingScreen.ncr-html-pilot-structure.test.tsx',
      'src/components/ArtifactExportPanel.ncr-html-pilot-structure.test.tsx',
      'src/components/ReceiptEffectDisclosure.ncr-html-pilot-structure.test.tsx',
    ],
    maxWorkers: 1,
    fileParallelism: false,
    testTimeout: 10_000,
  },
});
