import path from 'node:path';
import { defineConfig } from '@playwright/test';

/**
 * No-key browser structure and serialization preflight. It runs against a loopback dev server that has no provider
 * credential, recordings are off before any context exists, and the spec intercepts every execute request in the
 * browser so the production handler and the artifact stores are never reached. It is never a provider or
 * governance proof, and it is never the Root live configuration.
 */
const env = process.env;
const FORBIDDEN_ENV = ['DASHSCOPE_API_KEY', 'ALIBABA_API_KEY', 'DEEPSEEK_API_KEY', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY',
  'CVF_NCR_HTML_PILOT_LIVE_CONSUMER', 'CVF_NCR_HTML_PILOT_MANIFEST_PATH', 'CVF_NCR_HTML_PILOT_PASS'];
if (env.CVF_NCR_HTML_PILOT_PREFLIGHT !== 'WORKER_NO_KEY'
  || !env.CVF_NCR_PREFLIGHT_OUT || !path.isAbsolute(env.CVF_NCR_PREFLIGHT_OUT)
  || !env.PLAYWRIGHT_BASE_URL || !/^http:\/\/(?:localhost|127\.0\.0\.1):\d+$/.test(env.PLAYWRIGHT_BASE_URL)
  || FORBIDDEN_ENV.some(name => env[name])) {
  throw new Error('NO_KEY_PREFLIGHT_PROFILE_REQUIRED');
}

export default defineConfig({
  testDir: path.resolve(__dirname, 'tests/e2e'),
  testMatch: 'ncr-html-pilot-preflight.spec.ts',
  outputDir: path.join(env.CVF_NCR_PREFLIGHT_OUT, 'playwright-results'),
  workers: 1, retries: 0, timeout: 240_000,
  expect: { timeout: 30_000 },
  use: { baseURL: env.PLAYWRIGHT_BASE_URL, trace: 'off', screenshot: 'off', video: 'off' },
  reporter: [['list']],
});
