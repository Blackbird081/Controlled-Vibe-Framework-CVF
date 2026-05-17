import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json'],
            include: ['*.ts'],
            exclude: ['vitest.config.ts'],
            thresholds: {
                statements: 95,
                branches: 85,
                functions: 95,
                lines: 95,
            },
        },
    },
})
