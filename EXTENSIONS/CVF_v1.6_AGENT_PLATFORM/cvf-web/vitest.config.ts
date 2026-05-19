import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    test: {
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
        testTimeout: 15000,
        hookTimeout: 15000,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json-summary', 'html'],
            thresholds: {
                // Public-sync baseline floor. Raise this with focused coverage work;
                // do not let the CI threshold drift above the measured public surface.
                statements: 79,
                branches: 69,
                functions: 78,
                lines: 80,
            },
            exclude: [
                'node_modules/',
                '.next/',
                'src/test/',
                '**/*.d.ts',
            ],
        },
    },
});
