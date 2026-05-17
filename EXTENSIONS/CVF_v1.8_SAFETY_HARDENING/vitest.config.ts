import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['core/**/*.ts', 'telemetry/**/*.ts'],
            exclude: ['**/*.types.ts', '**/index.ts'],
            thresholds: {
                statements: 96,
                branches: 90,
                functions: 96,
                lines: 96,
            },
        },
    },
})
