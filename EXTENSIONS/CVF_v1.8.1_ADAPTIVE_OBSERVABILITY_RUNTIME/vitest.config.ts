import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json'],
            include: [
                'governance/adaptive.policy.ts',
                'governance/runtime.guard.ts',
                'governance/skill.risk.score.ts',
                'observability/invocation.logger.ts',
                'observability/regression.detector.ts',
                'runtime/edge_security/**/*.ts',
                'sdk/cvf.client.ts',
                'storage/**/*.ts',
                'ui/dashboards/risk.dashboard.tsx',
            ],
            thresholds: {
                statements: 85,
                branches: 75,
                functions: 85,
                lines: 85,
            },
        },
    },
})
