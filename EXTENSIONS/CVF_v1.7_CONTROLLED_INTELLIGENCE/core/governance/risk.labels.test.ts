import { describe, it, expect } from 'vitest'
import { getRiskLabel, formatRiskDisplay, getAllRiskLabels } from './risk.labels'

describe('risk.labels — Non-Coder friendly labels', () => {
    describe('Vietnamese (default)', () => {
        it('R0 → An toàn', () => {
            const label = getRiskLabel('R0')
            expect(label.label).toBe('An toàn')
            expect(label.emoji).toBe('🟢')
        })

        it('R1 → Cần chú ý', () => {
            expect(getRiskLabel('R1').label).toBe('Cần chú ý')
        })

        it('R2 → Cần duyệt', () => {
            expect(getRiskLabel('R2').label).toBe('Cần duyệt')
        })

        it('R3 → Nguy hiểm', () => {
            const label = getRiskLabel('R3')
            expect(label.label).toBe('Nguy hiểm')
            expect(label.emoji).toBe('🔴')
        })
    })

    describe('English', () => {
        it('R0 → Safe', () => {
            expect(getRiskLabel('R0', 'en').label).toBe('Safe')
        })

        it('R3 → Dangerous', () => {
            expect(getRiskLabel('R3', 'en').label).toBe('Dangerous')
        })
    })

    describe('formatRiskDisplay', () => {
        it('formats R0 as "🟢 An toàn"', () => {
            expect(formatRiskDisplay('R0')).toBe('🟢 An toàn')
        })

        it('formats R3 as "🔴 Nguy hiểm"', () => {
            expect(formatRiskDisplay('R3')).toBe('🔴 Nguy hiểm')
        })

        it('formats R3 in English as "🔴 Dangerous"', () => {
            expect(formatRiskDisplay('R3', 'en')).toBe('🔴 Dangerous')
        })
    })

    describe('getAllRiskLabels', () => {
        it('returns all 4 levels', () => {
            const labels = getAllRiskLabels()
            expect(Object.keys(labels)).toEqual(['R0', 'R1', 'R2', 'R3'])
        })

        it('each label has emoji, label, description', () => {
            const labels = getAllRiskLabels('vi')
            for (const level of Object.values(labels)) {
                expect(level).toHaveProperty('emoji')
                expect(level).toHaveProperty('label')
                expect(level).toHaveProperty('description')
            }
        })
    })
})
