import { describe, expect, it } from 'vitest'

import {
    RISK_SCORER_ADAPTER_VERSION,
    RiskScorer,
} from '../core/risk/risk.scorer.js'
import {
    RISK_LOCK_ADAPTER_VERSION,
    RiskLock,
} from '../core/risk/risk.lock.js'

describe('Phase 2.B safety hardening risk adapters', () => {
    it('RiskScorer.scoreWithAdapter wraps the same unlocked risk object', () => {
        const scorer = new RiskScorer()
        const adapter = scorer.scoreWithAdapter('exec-tail-risk-001', {
            impact: 2,
            scope: 2,
            uncertainty: 2,
            reversibility: 0,
        })
        const direct = scorer.score('exec-tail-risk-001', {
            impact: 2,
            scope: 2,
            uncertainty: 2,
            reversibility: 0,
        })

        expect(adapter.version).toBe(RISK_SCORER_ADAPTER_VERSION)
        expect(adapter.source).toBe('safety-hardening:risk-scorer')
        expect(adapter.risk).toEqual(direct)
        expect(adapter.risk.locked).toBe(false)
    })

    it('RiskLock.lockWithAdapter exposes immutable lock metadata', () => {
        const scorer = new RiskScorer()
        const riskLock = new RiskLock()
        riskLock._clearAll()

        const risk = scorer.score('exec-tail-risk-lock-001', {
            impact: 1,
            scope: 1,
            uncertainty: 1,
            reversibility: -2,
        })
        const wrapped = riskLock.lockWithAdapter({ ...risk, locked: true })

        expect(wrapped.adapter.version).toBe(RISK_LOCK_ADAPTER_VERSION)
        expect(wrapped.adapter.source).toBe('safety-hardening:risk-lock')
        expect(wrapped.adapter.executionId).toBe('exec-tail-risk-lock-001')
        expect(wrapped.adapter.hash).toBe(wrapped.locked.hash)
        expect(Object.isFrozen(wrapped.locked)).toBe(true)
    })
})
