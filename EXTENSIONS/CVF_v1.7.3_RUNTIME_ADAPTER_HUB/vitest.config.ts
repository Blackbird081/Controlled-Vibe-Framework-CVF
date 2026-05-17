import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        include: ['tests/**/*.test.ts'],
        globals: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json'],
            include: [
                'adapters/**/*.ts',
                'explainability/**/*.ts',
                'policy/**/*.ts',
                'edge_security/**/*.ts',
            ],
            exclude: ['**/index.ts'],
            thresholds: {
                statements: 90,
                branches: 80,
                functions: 90,
                lines: 90,
            },
        },
    },
})
