import { defineConfig } from 'vitest/config';
import path from 'node:path';

// EAFR-R1D. Live/real-provider tests are selectable only through a deliberate
// selection opt-in: `--mode live` may collect live tests but never grants
// provider execution. Provider calls require a separate orchestrator-issued
// capability enforced by the shared test setup.
const DEFAULT_IGNORED_PATHS = [
    '**/node_modules/**',
    '**/dist/**',
    '**/.next/**',
];

const LIVE_TEST_PATTERNS = [
    'src/**/*.live.test.{ts,tsx}',
    'src/**/*.live.spec.{ts,tsx}',
];

export default defineConfig(({ mode }) => {
    const liveSelectionEnabled = mode === 'live';

    return {
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        test: {
            environment: 'jsdom',
            setupFiles: ['./src/test/setup.ts'],
            include: ['src/**/*.{test,spec}.{ts,tsx}'],
            // EAFR-R1D selection barrier. Real-provider and other live tests must
            // never be collected by a default (non-live) run. A filename convention
            // alone proved insufficient once, so this config-level exclusion is the
            // second barrier and does not depend on any script string staying
            // correct. The exclusion lifts only under an explicit live opt-in, which
            // the live runner passes and no default run ever supplies.
            exclude: liveSelectionEnabled
                ? [...DEFAULT_IGNORED_PATHS]
                : [...DEFAULT_IGNORED_PATHS, ...LIVE_TEST_PATTERNS],
            // This value authorizes collection only. It is deliberately not a
            // provider-execution capability.
            env: {
                CVF_LIVE_TEST_SELECTION: liveSelectionEnabled ? '1' : '0',
            },
            testTimeout: 15000,
            hookTimeout: 15000,
            coverage: {
                provider: 'v8',
                reporter: ['text', 'json-summary', 'html'],
                thresholds: {
                    statements: 80,
                    branches: 70,
                    functions: 80,
                    lines: 82,
                },
                exclude: [
                    'node_modules/',
                    '.next/',
                    'src/test/',
                    '**/*.d.ts',
                ],
            },
        },
    };
});
