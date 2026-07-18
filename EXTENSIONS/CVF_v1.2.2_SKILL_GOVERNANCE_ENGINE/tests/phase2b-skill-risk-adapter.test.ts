import { describe, expect, it } from 'vitest'

import {
    SKILL_RISK_SCORER_ADAPTER_VERSION,
    RiskScorer,
} from '../skill_system/governance/risk.scorer.js'

describe('Phase 2.B skill risk scorer adapter', () => {
    it('computeWithAdapter preserves bounded skill risk score', () => {
        const skill = {
            risk_profile: {
                base_score: 50,
                factors: ['data_access', 'external_dependency'],
            },
        }
        const wrapped = RiskScorer.computeWithAdapter(skill)

        expect(wrapped.version).toBe(SKILL_RISK_SCORER_ADAPTER_VERSION)
        expect(wrapped.source).toBe('skill-governance-engine:risk-scorer')
        expect(wrapped.baseScore).toBe(50)
        expect(wrapped.factors).toEqual(['data_access', 'external_dependency'])
        expect(wrapped.score).toBe(RiskScorer.compute(skill))
    })
})
