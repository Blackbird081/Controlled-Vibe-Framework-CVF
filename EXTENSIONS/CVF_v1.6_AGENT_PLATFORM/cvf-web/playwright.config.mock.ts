import { defineConfig } from '@playwright/test';

const PLAYWRIGHT_PORT = Number(process.env.CVF_PLAYWRIGHT_PORT ?? 3001);

export default defineConfig({
    testDir: './tests/e2e',
    timeout: 60_000,
    workers: 1,
    expect: {
        timeout: 15_000,
    },
    use: {
        baseURL: process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${PLAYWRIGHT_PORT}`,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    webServer: {
        command: `npm run dev -- --port ${PLAYWRIGHT_PORT}`,
        port: PLAYWRIGHT_PORT,
        reuseExistingServer: false,
        timeout: 120_000,
        env: {
            NEXT_PUBLIC_CVF_MOCK_AI: '1',
        },
    },
});
