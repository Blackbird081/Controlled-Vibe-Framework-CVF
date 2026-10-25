import { defineConfig } from '@playwright/test';
import { loadEnvConfig } from '@next/env';

// Load .env.local into test process env (gitignored — safe for local secrets).
// This makes NEXT_PUBLIC_* and API keys visible to test file module-level code.
// Use the same quote/expansion/precedence rules as the Next dev server. Copying
// raw quoted values into its inherited env can make a valid Redis URL invalid.
loadEnvConfig(__dirname, true, { info: () => {}, error: () => {
  throw new Error('CVF_PLAYWRIGHT_ENV_LOAD_FAILED: inspect local env syntax without printing secrets');
} });

// Live failure artifacts must not copy page content into an error snapshot.
process.env.PLAYWRIGHT_NO_COPY_PROMPT = '1';

const PLAYWRIGHT_PORT = Number(process.env.CVF_PLAYWRIGHT_PORT ?? 3001);

// Live config — real provider calls, governance pipeline active.
// For mock/CI-safe runs use: playwright.config.mock.ts
export default defineConfig({
    testDir: './tests/e2e',
    // Local live proof uses one Next dev compiler and controlled provider flow.
    // Parallel cold compilation can consume the readiness budget before handlers
    // exist; this is a sequential proof, not a concurrent-load certification.
    workers: 1,
    timeout: 180_000,
    expect: {
        timeout: 30_000,
    },
    use: {
        // ADIF-0035: keep browser navigation, Auth.js callbacks, and the
        // Playwright request context on one canonical host. Mixing localhost
        // and 127.0.0.1 splits cookies/origins and can strand useSession() in
        // its client bootstrap path under the live release suite.
        baseURL: process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PLAYWRIGHT_PORT}`,
        trace: 'off',
        screenshot: 'off',
        video: 'off',
    },
    webServer: {
        command: `npm run dev -- --port ${PLAYWRIGHT_PORT}`,
        port: PLAYWRIGHT_PORT,
        reuseExistingServer: false,
        timeout: 120_000,
    },
});
