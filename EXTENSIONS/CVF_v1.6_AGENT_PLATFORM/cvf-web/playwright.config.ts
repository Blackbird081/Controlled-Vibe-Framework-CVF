import { defineConfig } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Load .env.local into test process env (gitignored — safe for local secrets).
// This makes NEXT_PUBLIC_* and API keys visible to test file module-level code.
const envLocalPath = join(__dirname, '.env.local');
if (existsSync(envLocalPath)) {
  for (const line of readFileSync(envLocalPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (key && !process.env[key]) process.env[key] = val;
  }
}

// Live config — real provider calls, governance pipeline active.
// For mock/CI-safe runs use: playwright.config.mock.ts
export default defineConfig({
    testDir: './tests/e2e',
    timeout: 180_000,
    expect: {
        timeout: 30_000,
    },
    use: {
        baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3001',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    webServer: {
        command: 'npm run dev -- --port 3001',
        port: 3001,
        reuseExistingServer: false,
        timeout: 120_000,
    },
});
