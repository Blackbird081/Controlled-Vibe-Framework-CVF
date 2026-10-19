import path from 'node:path';
import { defineConfig } from '@playwright/test';

if (process.env.CVF_NCR_RUNNER_PROFILE !== 'LOCAL_SYNTHETIC' || process.env.NEXTAUTH_URL !== ''
  || process.env.AUTH_URL !== 'http://localhost:3033' || process.env.PLAYWRIGHT_BASE_URL !== 'http://localhost:3033'
  || !process.env.CVF_NCR_RUN_ROOT || !path.isAbsolute(process.env.CVF_NCR_RUN_ROOT)) {
  throw new Error('NCR_RUNNER_PROFILE_REQUIRED');
}
export default defineConfig({
  testDir: path.resolve(__dirname, '../../..'),
  outputDir: path.join(process.env.CVF_NCR_RUN_ROOT, 'test-results'),
  workers: 1, retries: 0, timeout: 180_000,
  expect: { timeout: 20_000 },
  use: { baseURL: 'http://localhost:3033', trace: 'off', screenshot: 'off', video: 'off' },
  reporter: [['list']],
});
