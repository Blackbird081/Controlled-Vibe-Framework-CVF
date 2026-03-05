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
                'core/**/*.ts',
                'runtime/execution.engine.ts',
                'internal_ledger/cost.ledger.ts',
                'internal_ledger/execution.log.ts',
                'skill_system/execution/**/*.ts',
                'skill_system/governance/approval.workflow.ts',
                'skill_system/governance/domain.guard.ts',
                'skill_system/governance/risk.scorer.ts',
                'skill_system/governance/skill.normalizer.ts',
                'skill_system/governance/skill.validator.ts',
            ],
            exclude: [
                '**/*.json',
                '**/*.yaml',
            ],
            thresholds: {
                statements: 80,
                branches: 70,
                functions: 75,
                lines: 80,
            },
        },
    },
})
