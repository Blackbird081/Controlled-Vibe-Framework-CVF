import path from 'node:path';
import { defineConfig } from '@playwright/test';

/** Root-only real provider consumer. Worker never starts this configuration. */
const env = process.env;
if (env.CVF_NCR_HTML_PILOT_LIVE_CONSUMER !== 'ROOT_REAL_PROVIDER'
  || !env.CVF_NCR_HTML_PILOT_RUN_ROOT || !path.isAbsolute(env.CVF_NCR_HTML_PILOT_RUN_ROOT)
  || !env.CVF_NCR_HTML_PILOT_CONTROL_DIR || !path.isAbsolute(env.CVF_NCR_HTML_PILOT_CONTROL_DIR)
  || !env.CVF_NCR_HTML_PILOT_MANIFEST_PATH || !path.isAbsolute(env.CVF_NCR_HTML_PILOT_MANIFEST_PATH)
  || !env.CVF_NCR_HTML_PILOT_SOURCE_HEAD || !/^[a-f0-9]{40}$/.test(env.CVF_NCR_HTML_PILOT_SOURCE_HEAD)
  || !env.CVF_NCR_HTML_PILOT_INITIAL_GOAL || !env.CVF_NCR_HTML_PILOT_REVISION_GOAL
  || !env.CVF_NCR_HTML_PILOT_USER || !env.CVF_NCR_HTML_PILOT_PASS
  || !env.PLAYWRIGHT_BASE_URL || !/^http:\/\/(?:localhost|127\.0\.0\.1):\d+$/.test(env.PLAYWRIGHT_BASE_URL)
  || env.CVF_NCR_DRAFT_PROFILE || env.CVF_NCR_HTML_JOB_PROFILE || env.CVF_NCR_RECEIPT_OPERATION_PROFILE) {
  throw new Error('ROOT_REAL_PROVIDER_PILOT_PROFILE_REQUIRED');
}

export default defineConfig({
  testDir: path.resolve(__dirname, 'tests/e2e'),
  testMatch: 'ncr-html-pilot-live-consumer.spec.ts',
  outputDir: path.join(env.CVF_NCR_HTML_PILOT_RUN_ROOT, 'playwright-results'),
  workers: 1, retries: 0, timeout: 900_000,
  expect: { timeout: 30_000 },
  use: { baseURL: env.PLAYWRIGHT_BASE_URL, trace: 'off', screenshot: 'off', video: 'off' },
  reporter: [['list']],
});
