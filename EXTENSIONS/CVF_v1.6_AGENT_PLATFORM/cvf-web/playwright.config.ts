import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    timeout: 60_000,
    expect: {
        timeout: 10_000,
    },
    use: {
        baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    webServer: {
        command: 'npm run dev -- --port 3001',
        port: 3001,
        reuseExistingServer: false,
        timeout: 120_000,
        env: {
            NEXT_PUBLIC_CVF_MOCK_AI: '1',
        },
    },
});
