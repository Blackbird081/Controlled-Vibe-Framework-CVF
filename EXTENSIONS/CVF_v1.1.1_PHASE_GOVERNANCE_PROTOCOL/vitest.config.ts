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
                'governance/state_enforcement/**/*.ts',
                'governance/scenario_simulator/**/*.ts',
                'governance/phase_gate/**/*.ts',
                'governance/phase_protocol/artifact.registry.ts',
                'governance/diagram_validation/diagram.validator.ts',
                'governance/structural_diff/structural.diff.ts',
                'runtime/governance.executor.ts',
            ],
            thresholds: {
                statements: 90,
                branches: 80,
                functions: 90,
                lines: 90,
            },
        },
    },
})
