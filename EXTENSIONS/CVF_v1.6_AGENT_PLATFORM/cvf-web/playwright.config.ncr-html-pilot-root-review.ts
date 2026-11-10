import path from 'node:path';
import { defineConfig } from '@playwright/test';

const env = process.env;
const providerAliases = ['ALIBABA_API_KEY', 'DASHSCOPE_API_KEY', 'DEEPSEEK_API_KEY', 'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY', 'GEMINI_API_KEY'];
if (env.CVF_NCR_HTML_PILOT_REVIEW_MODE !== 'HUMAN'
  || !env.CVF_NCR_HTML_PILOT_REVIEW_CONTROL_DIR || !path.isAbsolute(env.CVF_NCR_HTML_PILOT_REVIEW_CONTROL_DIR)
  || !env.CVF_NCR_HTML_PILOT_REVIEW_CONTEXT || !path.isAbsolute(env.CVF_NCR_HTML_PILOT_REVIEW_CONTEXT)
  || !env.CVF_NCR_HTML_PILOT_SOURCE_HEAD || !/^[a-f0-9]{40}$/.test(env.CVF_NCR_HTML_PILOT_SOURCE_HEAD)
  || !env.CVF_NCR_HTML_PILOT_USER || !env.CVF_NCR_HTML_PILOT_PASS
  || !env.PLAYWRIGHT_BASE_URL || !/^http:\/\/(?:localhost|127\.0\.0\.1):\d+$/.test(env.PLAYWRIGHT_BASE_URL)
  || providerAliases.some(name => Object.prototype.hasOwnProperty.call(env, name))
  || env.CVF_NCR_DRAFT_PROFILE || env.CVF_NCR_HTML_JOB_PROFILE || env.CVF_NCR_RECEIPT_OPERATION_PROFILE) {
  throw new Error('ROOT_HUMAN_REVIEW_PROFILE_REQUIRED');
}

export default defineConfig({
  testDir: path.resolve(__dirname, 'tests/e2e'),
  testMatch: 'ncr-html-pilot-root-review.spec.ts',
  outputDir: path.resolve(env.CVF_NCR_HTML_PILOT_REVIEW_CONTROL_DIR, '..', 'results', 'playwright'),
  workers: 1, retries: 0, timeout: 1_200_000,
  expect: { timeout: 30_000 },
  use: { baseURL: env.PLAYWRIGHT_BASE_URL, headless: false, trace: 'off', screenshot: 'off', video: 'off' },
  reporter: [['list']],
});
