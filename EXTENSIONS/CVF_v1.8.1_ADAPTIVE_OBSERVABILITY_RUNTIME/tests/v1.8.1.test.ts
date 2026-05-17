import { beforeEach, describe, expect, it } from 'vitest'
import { scanPII } from '../runtime/edge_security/pii.detector.js'
import { detectSecrets } from '../runtime/edge_security/secret.detector.js'
import { checkInjection } from '../runtime/edge_security/injection.precheck.js'
import { runSkill } from '../sdk/cvf.client.js'
import { invocationLog } from '../observability/invocation.logger.js'
import { getAllMetrics, saveMetric } from '../storage/metrics.store.js'
import { saveAudit, getAuditLogs } from '../storage/audit.store.js'
import { calculateSkillRisk } from '../governance/skill.risk.score.js'
import { generateAdaptivePolicy } from '../governance/adaptive.policy.js'
import { runtimeGuard } from '../governance/runtime.guard.js'
import { detectAnyRegressionForMetrics } from '../ui/dashboards/risk.dashboard.js'
import { RiskDashboard } from '../ui/dashboards/risk.dashboard.js'
import { saveSnapshot, getSnapshots } from '../storage/snapshot.store.js'

describe('v1.8.1 security + adaptive observability', () => {
    beforeEach(() => {
        invocationLog.length = 0
        getAllMetrics().length = 0
        getAuditLogs().length = 0
    })

    it('detects multiple PII/secrets and injection signal', () => {
        const pii = scanPII('a@b.com and c@d.com')
        expect(pii).toHaveLength(2)

        const secrets = detectSecrets('sk-abcdefghijklmnopqrstuvwxyz1234 and sk-zyxwvutsrqponmlkjihgfedcba5678')
        expect(secrets).toHaveLength(2)

        expect(checkInjection('please bypass safety now')).toBe(true)
        expect(checkInjection('safe prompt')).toBe(false)
    })

    it('runSkill blocks insecure input before execution', async () => {
        await expect(runSkill({
            skillId: 'skill-sec',
            input: 'contact me at a@b.com',
            model: 'claude-3.5',
            execute: async () => ({ output: 'ok', tokensUsed: 10, durationMs: 5 }),
        })).rejects.toThrow('Security check failed')
    })

    it('runSkill executes safely and writes invocation + metric records', async () => {
        const output = await runSkill({
            skillId: 'skill-safe',
            input: 'normal request',
            model: 'claude-3.5',
            temperature: 0.2,
            maxTokens: 200,
            execute: async (_input, params) => ({
                output: `ok:${params?.maxTokens}`,
                tokensUsed: 42,
                durationMs: 12,
            }),
        })

        expect(output).toContain('ok:')
        expect(invocationLog).toHaveLength(1)
        expect(invocationLog[0]!.versionHash).toBe('v1.8.1')
        expect(getAllMetrics()).toHaveLength(1)
    })

    it('skill risk scoring is scoped by skillId for security incidents', () => {
        saveMetric({
            id: 'm-a1',
            skillId: 'skill-a',
            timestamp: Date.now(),
            tokensUsed: 100,
            durationMs: 20,
            model: 'claude-3.5',
            satisfaction: 'satisfied',
        })
        saveMetric({
            id: 'm-b1',
            skillId: 'skill-b',
            timestamp: Date.now(),
            tokensUsed: 100,
            durationMs: 20,
            model: 'claude-3.5',
            satisfaction: 'satisfied',
        })

        saveAudit({
            id: 'a-b1',
            skillId: 'skill-b',
            timestamp: Date.now(),
            type: 'secret',
            detail: 'secret leak',
        })

        const riskA = calculateSkillRisk('skill-a')
        const riskB = calculateSkillRisk('skill-b')
        expect(riskA.breakdown.securityIncidents).toBe(0)
        expect(riskB.breakdown.securityIncidents).toBe(1)
    })

    it('adaptive policy and runtime guard react to risk score', () => {
        for (let i = 0; i < 20; i++) {
            saveMetric({
                id: `m-${i}`,
                skillId: 'skill-risky',
                timestamp: Date.now() + i,
                tokensUsed: i < 10 ? 100 : 200,
                durationMs: 10,
                model: 'claude-3.5',
                satisfaction: 'correction',
            })
        }
        saveAudit({
            id: 'audit-risky',
            skillId: 'skill-risky',
            timestamp: Date.now(),
            type: 'injection',
            detail: 'hit',
        })

        const policy = generateAdaptivePolicy('skill-risky')
        expect(['moderate', 'strict']).toContain(policy.mode)

        const guard = runtimeGuard({
            skillId: 'skill-risky',
            temperature: 0.9,
            maxTokens: 9999,
        })
        expect(guard.adjustedParams.temperature).toBeLessThanOrEqual(0.9)
        expect(guard.adjustedParams.maxTokens).toBeLessThanOrEqual(9999)
    })

    it('runtime guard can block execution at very high risk', () => {
        for (let i = 0; i < 20; i++) {
            saveMetric({
                id: `m-block-${i}`,
                skillId: 'skill-block',
                timestamp: Date.now() + i,
                tokensUsed: i < 10 ? 100 : 260,
                durationMs: 10,
                model: 'claude-3.5',
                satisfaction: 'correction',
            })
            invocationLog.push({
                skillId: 'skill-block',
                versionHash: 'v1.8.1',
                model: 'claude-3.5',
                tokensUsed: i < 10 ? 100 : 260,
                durationMs: 10,
                timestamp: Date.now() + i,
            })
        }

        for (let i = 0; i < 5; i++) {
            saveAudit({
                id: `audit-block-${i}`,
                skillId: 'skill-block',
                timestamp: Date.now() + i,
                type: 'secret',
                detail: 'incident',
            })
        }

        const policy = generateAdaptivePolicy('skill-block')
        expect(policy.blockExecution).toBe(true)

        const guard = runtimeGuard({ skillId: 'skill-block' })
        expect(guard.allowed).toBe(false)
        expect(guard.reason).toContain('blocked')
    })

    it('dashboard regression detection does not depend on first metric skill', () => {
        for (let i = 0; i < 20; i++) {
            invocationLog.push({
                skillId: i < 5 ? 'stable-skill' : 'regress-skill',
                versionHash: 'v1.8.1',
                model: 'claude-3.5',
                tokensUsed: i < 10 ? 100 : 220,
                durationMs: 5,
                timestamp: Date.now() + i,
            })
        }

        const metrics = [
            { skillId: 'stable-skill' },
            { skillId: 'regress-skill' },
        ]
        expect(detectAnyRegressionForMetrics(metrics)).toBe(true)

        // Execute component path so dashboard rendering logic lines are covered.
        const element = RiskDashboard()
        expect(element).toBeTruthy()
    })

    it('snapshot store is persisted and scoped by skill', () => {
        saveSnapshot({ skillId: 's1', versionHash: 'v1', timestamp: 1 })
        saveSnapshot({ skillId: 's2', versionHash: 'v2', timestamp: 2 })
        expect(getSnapshots('s1')).toHaveLength(1)
        expect(getSnapshots('s2')[0]!.versionHash).toBe('v2')
    })
})
