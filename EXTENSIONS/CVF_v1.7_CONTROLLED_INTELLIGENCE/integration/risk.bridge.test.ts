import { describe, it, expect } from 'vitest'
import { RiskEngine, type RiskLevel } from '../../CVF_v1.7.1_SAFETY_RUNTIME/policy/risk.engine'
import { scoreToRiskLevel, riskLevelToScore, type CVFRiskLevel } from '../core/governance/risk.mapping'
import { evaluatePolicy } from '../core/governance/policy.engine'
import { getRiskLabel, formatRiskDisplay } from '../core/governance/risk.labels'
import {
    runtimeToCVFRisk,
    cvfToRuntimeRisk,
    normalizeRuntimeScore,
    runtimeRiskToDisplay
} from './risk.bridge'

// ═══════════════════════════════════════════════════════════════
// Integration Test: Safety Runtime (v1.7.1) ↔ Intelligence (v1.7)
// CVF Doctrine: R3 = CRITICAL = "Nguy hiểm" = BLOCK — always.
// ═══════════════════════════════════════════════════════════════

describe('Integration: Safety Runtime ↔ Intelligence', () => {

    describe('risk level mapping — round-trip consistency', () => {
        const pairs: [RiskLevel, CVFRiskLevel][] = [
            ['LOW', 'R0'],
            ['MEDIUM', 'R1'],
            ['HIGH', 'R2'],
            ['CRITICAL', 'R3']
        ]

        it.each(pairs)('%s ↔ %s round-trip', (runtime, cvf) => {
            expect(runtimeToCVFRisk(runtime)).toBe(cvf)
            expect(cvfToRuntimeRisk(cvf)).toBe(runtime)
        })

        it('all 4 runtime levels map to unique CVF levels', () => {
            const mapped = new Set<CVFRiskLevel>()
            const levels: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
            for (const l of levels) mapped.add(runtimeToCVFRisk(l))
            expect(mapped.size).toBe(4)
        })
    })

    describe('Safety Runtime score → Intelligence normalized score', () => {
        it('low score → R0 range (0.1)', () => {
            expect(normalizeRuntimeScore(10)).toBe(0.1)
            expect(normalizeRuntimeScore(34)).toBe(0.1)
        })

        it('medium score → R1 range (0.45)', () => {
            expect(normalizeRuntimeScore(35)).toBe(0.45)
            expect(normalizeRuntimeScore(69)).toBe(0.45)
        })

        it('high score → R2 range (0.72)', () => {
            expect(normalizeRuntimeScore(70)).toBe(0.72)
            expect(normalizeRuntimeScore(119)).toBe(0.72)
        })

        it('critical score → R3 range (0.92)', () => {
            expect(normalizeRuntimeScore(120)).toBe(0.92)
            expect(normalizeRuntimeScore(250)).toBe(0.92)
        })
    })

    describe('end-to-end: Runtime assess → Intelligence policy → Non-coder label', () => {
        it('small code change → ALLOW → 🟢 An toàn', () => {
            const assessment = RiskEngine.assess({
                artifactType: 'CODE',
                changes: [{
                    filePath: 'src/utils.ts', diffSize: 10, isNewFile: false,
                    isDeleted: false, touchesDependencyFile: false,
                    touchesMigrationFile: false, touchesPolicyFile: false,
                    touchesCoreFile: false
                }]
            })
            const normalized = normalizeRuntimeScore(assessment.score)
            const policy = evaluatePolicy({ sessionId: 'test', role: 'agent', riskScore: normalized })
            const display = runtimeRiskToDisplay(assessment.level)

            expect(assessment.level).toBe('LOW')
            expect(policy.decision).toBe('ALLOW')
            expect(display).toBe('🟢 An toàn')
        })

        it('policy file change → BLOCK → 🔴 Nguy hiểm', () => {
            const assessment = RiskEngine.assess({
                artifactType: 'POLICY',
                changes: [{
                    filePath: 'policy/master.md', diffSize: 50, isNewFile: false,
                    isDeleted: false, touchesDependencyFile: false,
                    touchesMigrationFile: false, touchesPolicyFile: true,
                    touchesCoreFile: false
                }]
            })
            const normalized = normalizeRuntimeScore(assessment.score)
            const policy = evaluatePolicy({ sessionId: 'test', role: 'agent', riskScore: normalized })
            const display = runtimeRiskToDisplay(assessment.level)

            expect(assessment.level).toBe('CRITICAL')
            expect(policy.decision).toBe('BLOCK')
            expect(display).toBe('🔴 Nguy hiểm')
        })

        it('infra + core + migration change → ESCALATE or BLOCK', () => {
            const assessment = RiskEngine.assess({
                artifactType: 'INFRA',
                changes: [{
                    filePath: 'docker-compose.yml', diffSize: 200, isNewFile: false,
                    isDeleted: false, touchesDependencyFile: false,
                    touchesMigrationFile: true, touchesPolicyFile: false,
                    touchesCoreFile: true
                }]
            })
            const normalized = normalizeRuntimeScore(assessment.score)
            const policy = evaluatePolicy({ sessionId: 'test', role: 'agent', riskScore: normalized })

            expect(['ESCALATE', 'BLOCK']).toContain(policy.decision)
            expect(policy.decision).not.toBe('ALLOW')
        })
    })

    describe('CVF Doctrine: R3 = CRITICAL = BLOCK — always', () => {
        it('R3 maps to CRITICAL and BLOCK is enforced', () => {
            const cvfLevel: CVFRiskLevel = 'R3'
            const runtimeLevel = cvfToRuntimeRisk(cvfLevel)
            const score = riskLevelToScore(cvfLevel)
            const policy = evaluatePolicy({ sessionId: 'test', role: 'agent', riskScore: score })

            expect(runtimeLevel).toBe('CRITICAL')
            expect(policy.decision).toBe('BLOCK')
        })

        it('CRITICAL always shows 🔴 Nguy hiểm in Vietnamese', () => {
            expect(runtimeRiskToDisplay('CRITICAL', 'vi')).toBe('🔴 Nguy hiểm')
        })

        it('CRITICAL always shows 🔴 Dangerous in English', () => {
            expect(runtimeRiskToDisplay('CRITICAL', 'en')).toBe('🔴 Dangerous')
        })
    })

    describe('Non-coder display — full chain', () => {
        const displayCases: [RiskLevel, string][] = [
            ['LOW', '🟢 An toàn'],
            ['MEDIUM', '🟡 Cần chú ý'],
            ['HIGH', '🟠 Cần duyệt'],
            ['CRITICAL', '🔴 Nguy hiểm']
        ]

        it.each(displayCases)('%s → %s', (level, expected) => {
            expect(runtimeRiskToDisplay(level)).toBe(expected)
        })
    })
})
