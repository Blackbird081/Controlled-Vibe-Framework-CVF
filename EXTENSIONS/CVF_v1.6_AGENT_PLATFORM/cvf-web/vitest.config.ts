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
                statements: 90,
                branches: 80,
                functions: 90,
                lines: 90,
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
