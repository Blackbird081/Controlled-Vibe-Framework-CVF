// tests/explainability.test.ts
// Explainability layer output tests

import { describe, it, expect } from 'vitest'
import { ExplainabilityLayer } from '../explainability/explainability.layer.js'
import type { ExplainInput } from '../explainability/explainability.layer.js'

describe('ExplainabilityLayer', () => {

    describe('English locale', () => {
        const layer = new ExplainabilityLayer('en')

        it('explains BLOCKED action', () => {
            const input: ExplainInput = {
                intentType: 'FILE_DELETE',
                riskLevel: 'CRITICAL',
                riskScore: 85,
                action: 'BLOCK',
            }
            const result = layer.explain(input)

            expect(result.summary).toBe('Action blocked.')
            expect(result.details).toContain('delete file')
            expect(result.riskMessage).toContain('85/100')
            expect(result.recommendation).toBeDefined()
        })

        it('explains ESCALATED action', () => {
            const input: ExplainInput = {
                intentType: 'EMAIL_SEND',
                riskLevel: 'HIGH',
                riskScore: 70,
                action: 'ESCALATE',
            }
            const result = layer.explain(input)

            expect(result.summary).toBe('Action requires approval.')
            expect(result.details).toContain('send email')
            expect(result.recommendation).toBeDefined()
        })

        it('explains EXECUTE action', () => {
            const input: ExplainInput = {
                intentType: 'FILE_READ',
                riskLevel: 'LOW',
                riskScore: 20,
                action: 'EXECUTE',
            }
            const result = layer.explain(input)

            expect(result.summary).toBe('Action approved.')
            expect(result.details).toContain('read data from file')
            expect(result.recommendation).toBeUndefined()
        })

        it('describes all intent types', () => {
            const intents: ExplainInput['intentType'][] = [
                'FILE_READ', 'FILE_WRITE', 'FILE_DELETE', 'EMAIL_SEND',
                'API_CALL', 'CODE_EXECUTION', 'DATA_EXPORT', 'UNKNOWN',
            ]

            for (const intent of intents) {
                const result = layer.explain({
                    intentType: intent,
                    riskLevel: 'MEDIUM',
                    riskScore: 50,
                    action: 'EXECUTE',
                })
                expect(result.details).toBeTruthy()
            }
        })

        it('describes all risk levels', () => {
            const levels: ExplainInput['riskLevel'][] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

            for (const level of levels) {
                const result = layer.explain({
                    intentType: 'FILE_READ',
                    riskLevel: level,
                    riskScore: 50,
                    action: 'EXECUTE',
                })
                expect(result.riskMessage).toContain('50/100')
            }
        })
    })

    describe('Vietnamese locale', () => {
        const layer = new ExplainabilityLayer('vi')

        it('produces Vietnamese output for BLOCK', () => {
            const result = layer.explain({
                intentType: 'FILE_DELETE',
                riskLevel: 'CRITICAL',
                riskScore: 90,
                action: 'BLOCK',
            })

            expect(result.summary).toBe('Hành động đã bị chặn.')
            expect(result.details).toContain('xóa tệp')
            expect(result.riskMessage).toContain('90/100')
        })

        it('produces Vietnamese recommendation', () => {
            const result = layer.explain({
                intentType: 'CODE_EXECUTION',
                riskLevel: 'HIGH',
                riskScore: 75,
                action: 'ESCALATE',
            })

            expect(result.summary).toBe('Hành động cần phê duyệt.')
            expect(result.recommendation).toContain('xác nhận')
        })
    })

    describe('Locale switching', () => {
        const layer = new ExplainabilityLayer('en')

        it('can switch locale at runtime', () => {
            const input: ExplainInput = {
                intentType: 'FILE_DELETE',
                riskLevel: 'HIGH',
                riskScore: 80,
                action: 'BLOCK',
            }

            const en = layer.explain(input)
            expect(en.summary).toBe('Action blocked.')

            layer.setLocale('vi')
            const vi = layer.explain(input)
            expect(vi.summary).toBe('Hành động đã bị chặn.')
        })
    })
})
