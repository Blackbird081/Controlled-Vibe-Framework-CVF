import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

function loadPackageJson() {
    const packageUrl = new URL('../package.json', import.meta.url)
    return JSON.parse(readFileSync(packageUrl, 'utf8')) as {
        exports?: Record<string, string>
        files?: string[]
    }
}

describe('package boundary', () => {
    it('keeps the adapter-hub surface explicit and named', () => {
        const packageJson = loadPackageJson()

        expect(packageJson.exports).toEqual({
            '.': './index.ts',
            './contracts': './contracts/index.ts',
            './adapters': './adapters/index.ts',
            './policy': './policy/natural.policy.parser.ts',
            './explainability': './explainability/explainability.layer.ts',
            './risk-models/risk-matrix': './risk_models/risk.matrix.json',
            './risk-models/destructive-rules': './risk_models/destructive.rules.json',
            './risk-models/external-comm-rules': './risk_models/external.comm.rules.json',
            './risk-models/escalation-thresholds': './risk_models/escalation.thresholds.json',
        })
    })

    it('ships only the bounded first-wave adapter-hub files', () => {
        const packageJson = loadPackageJson()

        expect(packageJson.files).toEqual([
            'README.md',
            'index.ts',
            'contracts',
            'adapters',
            'policy/natural.policy.parser.ts',
            'explainability/explainability.layer.ts',
            'risk_models/risk.matrix.json',
            'risk_models/destructive.rules.json',
            'risk_models/external.comm.rules.json',
            'risk_models/escalation.thresholds.json',
        ])
    })
})
