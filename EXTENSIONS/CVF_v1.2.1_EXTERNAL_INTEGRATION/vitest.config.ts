import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json'],
            include: ['**/*.ts'],
            exclude: [
                'tests/**',
                'vitest.config.ts',
                'dist/**',
                // Type-only contracts (no runtime behavior to execute)
                'models/cvf-skill.certified.ts',
                'models/cvf-skill.draft.ts',
                'models/external-skill.raw.ts',
            ],
            thresholds: { statements: 90, branches: 85, functions: 90, lines: 90 },
        },
    },
})
