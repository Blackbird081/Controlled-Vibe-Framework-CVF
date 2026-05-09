import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock all telemetry dependencies
vi.mock('./mistake_rate_tracker', () => ({
    getMistakeRateInWindow: vi.fn().mockReturnValue(0)
}))
vi.mock('./elegance_score_tracker', () => ({
    getEleganceTrend: vi.fn().mockReturnValue({ recent: 0.8, overall: 0.8, improving: true })
}))
vi.mock('./verification_metrics', () => ({
    getVerificationScoreInWindow: vi.fn().mockReturnValue(0.9)
}))
vi.mock('./governance_audit_log', () => ({
    logGovernanceEvent: vi.fn()
}))

import { detectAnomalies } from './anomaly.detector'
import { getMistakeRateInWindow } from './mistake_rate_tracker'
import { getEleganceTrend } from './elegance_score_tracker'
import { getVerificationScoreInWindow } from './verification_metrics'

describe('anomaly.detector — detectAnomalies', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Reset to healthy defaults
        vi.mocked(getMistakeRateInWindow).mockReturnValue(0)
        vi.mocked(getEleganceTrend).mockReturnValue({ recent: 0.8, overall: 0.8, improving: true })
        vi.mocked(getVerificationScoreInWindow).mockReturnValue(0.9)
    })

    it('NORMAL when all metrics are healthy', () => {
        const result = detectAnomalies()
        expect(result.recommendedMode).toBe('NORMAL')
        expect(result.governanceLockTriggered).toBe(false)
        expect(result.anomalies).toHaveLength(0)
    })

    it('WARNING when mistake rate exceeds warning threshold', () => {
        vi.mocked(getMistakeRateInWindow).mockReturnValue(0.2)
        const result = detectAnomalies()
        expect(result.anomalies.length).toBe(1)
        expect(result.anomalies[0].severity).toBe('WARNING')
        expect(result.anomalies[0].metric).toBe('mistake_rate')
    })

    it('STRICT when mistake rate is CRITICAL', () => {
        vi.mocked(getMistakeRateInWindow).mockReturnValue(0.35)
        const result = detectAnomalies()
        expect(result.recommendedMode).toBe('STRICT')
        expect(result.anomalies[0].severity).toBe('CRITICAL')
    })

    it('WARNING on elegance degradation', () => {
        vi.mocked(getEleganceTrend).mockReturnValue({ recent: 0.5, overall: 0.8, improving: false })
        const result = detectAnomalies()
        expect(result.anomalies.some(a => a.metric === 'elegance_degradation')).toBe(true)
    })

    it('WARNING when verification score below warning threshold', () => {
        vi.mocked(getVerificationScoreInWindow).mockReturnValue(0.65)
        const result = detectAnomalies()
        expect(result.anomalies.some(a => a.metric === 'verification_score')).toBe(true)
    })

    it('CRITICAL when verification score below critical threshold', () => {
        vi.mocked(getVerificationScoreInWindow).mockReturnValue(0.4)
        const result = detectAnomalies()
        expect(result.anomalies.find(a => a.metric === 'verification_score')?.severity).toBe('CRITICAL')
    })

    it('LOCKDOWN on 2+ critical anomalies', () => {
        vi.mocked(getMistakeRateInWindow).mockReturnValue(0.35)
        vi.mocked(getVerificationScoreInWindow).mockReturnValue(0.4)
        const result = detectAnomalies()
        expect(result.recommendedMode).toBe('LOCKDOWN')
        expect(result.governanceLockTriggered).toBe(true)
    })

    it('STRICT on 1 critical + 0 warnings', () => {
        vi.mocked(getMistakeRateInWindow).mockReturnValue(0.35)
        const result = detectAnomalies()
        expect(result.recommendedMode).toBe('STRICT')
    })

    it('STRICT on 0 critical + 2 warnings', () => {
        vi.mocked(getMistakeRateInWindow).mockReturnValue(0.2) // WARNING
        vi.mocked(getEleganceTrend).mockReturnValue({ recent: 0.5, overall: 0.8, improving: false }) // WARNING (delta = -0.3)
        vi.mocked(getVerificationScoreInWindow).mockReturnValue(0.9) // OK
        const result = detectAnomalies()
        expect(result.recommendedMode).toBe('STRICT')
    })

    it('telemetry can only restrict, never grant more autonomy', () => {
        // CVF Doctrine: telemetry escalates NORMAL→STRICT→LOCKDOWN, never downgrade
        vi.mocked(getMistakeRateInWindow).mockReturnValue(0.35)
        vi.mocked(getVerificationScoreInWindow).mockReturnValue(0.4)
        const result = detectAnomalies()
        expect(['STRICT', 'LOCKDOWN']).toContain(result.recommendedMode)
        // There is no path to return lower mode when anomalies are present
    })
})
