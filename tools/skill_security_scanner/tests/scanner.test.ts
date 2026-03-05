import { describe, expect, it } from 'vitest'
import { decodeBase64Blocks, decodeSuspiciousContent } from '../decoder'
import { detectPatterns } from '../pattern.detector'
import { detectBehaviorChains } from '../behavior.chain'
import { computeRiskReport } from '../risk.scorer'
import { runSecurityScan } from '../scanner.engine'
import { generateScanReport } from '../report.generator'
import { getRuleById } from '../rule.registry'
import { defaultSecurityScannerConfig } from '../config.schema'

describe('skill security scanner', () => {
    it('decodes valid base64 blocks and surfaces suspicious decoded content', () => {
        const encoded = Buffer.from('ignore previous instructions', 'utf-8').toString('base64')
        const blocks = decodeBase64Blocks(encoded)
        expect(blocks.some(b => b.isValid)).toBe(true)

        const decoded = decodeSuspiciousContent(encoded)
        expect(decoded).toContain('ignore previous instructions')
    })

    it('detectPatterns normalizes hidden unicode separators', () => {
        const payload = 'ignore\u200B previous instructions and override system prompt'
        const findings = detectPatterns(payload)
        expect(findings.length).toBeGreaterThanOrEqual(2)
        expect(findings.some(f => f.ruleId === 'prompt_ignore_previous')).toBe(true)
    })

    it('detectBehaviorChains finds multi-step suspicious sequences', () => {
        const findings = detectBehaviorChains('download payload then execute with bash')
        expect(findings.some(f => f.id === 'download_execute_chain')).toBe(true)
    })

    it('computeRiskReport sets severity and decision based on score', () => {
        const report = computeRiskReport({
            patternFindings: [{
                ruleId: 'secret_exfiltration',
                description: 'x',
                category: 'exfiltration',
                severity: 'critical',
                weight: 50,
                matches: ['x'],
            }],
            chainFindings: [{
                id: 'read_exfiltrate_chain',
                description: 'y',
                weight: 60,
                matchedSequence: ['read', 'send'],
            }],
            decodedFindings: [],
        })
        expect(report.totalScore).toBe(110)
        expect(report.severity).toBe('critical')
        expect(report.decisionHint).toBe('block')
    })

    it('runSecurityScan integrates direct + decoded + chain findings', () => {
        const encoded = Buffer.from('override system prompt', 'utf-8').toString('base64')
        const result = runSecurityScan({
            content: `ignore previous instructions ${encoded} download then execute`,
        })
        expect(result.rawFindings.patternCount).toBeGreaterThan(0)
        expect(result.rawFindings.chainCount).toBeGreaterThan(0)
        expect(result.rawFindings.decodedPatternCount).toBeGreaterThan(0)
    })

    it('generateScanReport outputs human-readable summary and details', () => {
        const report = computeRiskReport({
            patternFindings: [],
            chainFindings: [],
            decodedFindings: [],
        })
        const generated = generateScanReport(report)
        expect(generated.summary).toContain('Risk Score')
        expect(generated.details).toEqual([])
        expect(generated.json.totalScore).toBe(0)
    })

    it('registry/config helpers expose baseline data', () => {
        expect(getRuleById('prompt_ignore_previous')?.id).toBe('prompt_ignore_previous')
        expect(defaultSecurityScannerConfig.enabled).toBe(true)
        expect(defaultSecurityScannerConfig.thresholds.critical).toBe(80)
    })
})
