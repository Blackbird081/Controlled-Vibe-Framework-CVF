// CVF v2.0 — Full Test Suite
// Tests: ModeMapper, IntentInterpreter, ConfirmationEngine

import { describe, it, expect } from 'vitest'
import { ModeMapper } from '../runtime/mode/mode.mapper.js'
import { IntentInterpreter } from '../runtime/intent/intent.classifier.js'
import { ConfirmationEngine } from '../runtime/confirm/confirmation.engine.js'

// ─── ModeMapper ──────────────────────────────────────────────────────────────

describe('ModeMapper — KernelPolicy mapping', () => {
    const mapper = new ModeMapper()

    it('SAFE → 2 files, 50 lines, R1 ceiling, confirmAll=true', () => {
        const p = mapper.toKernelPolicy('SAFE')
        expect(p.maxFiles).toBe(2)
        expect(p.maxLines).toBe(50)
        expect(p.riskCeiling).toBe('R1')
        expect(p.confirmAll).toBe(true)
    })

    it('BALANCED → 5 files, 150 lines, R2 ceiling, confirmAll=false, confirmR2=true', () => {
        const p = mapper.toKernelPolicy('BALANCED')
        expect(p.maxFiles).toBe(5)
        expect(p.maxLines).toBe(150)
        expect(p.riskCeiling).toBe('R2')
        expect(p.confirmAll).toBe(false)
        expect(p.confirmR2).toBe(true)
    })

    it('CREATIVE → 10 files, 300 lines, R3 ceiling, confirmR3=true', () => {
        const p = mapper.toKernelPolicy('CREATIVE')
        expect(p.maxFiles).toBe(10)
        expect(p.maxLines).toBe(300)
        expect(p.riskCeiling).toBe('R3')
        expect(p.confirmR3).toBe(true)
        expect(p.confirmAll).toBe(false)
    })

    it('SAFE rejects R2 (above ceiling)', () => {
        expect(mapper.isWithinCeiling('SAFE', 'R2')).toBe(false)
        expect(mapper.isWithinCeiling('SAFE', 'R3')).toBe(false)
    })

    it('SAFE allows R0 and R1', () => {
        expect(mapper.isWithinCeiling('SAFE', 'R0')).toBe(true)
        expect(mapper.isWithinCeiling('SAFE', 'R1')).toBe(true)
    })

    it('BALANCED allows R0–R2, rejects R3', () => {
        expect(mapper.isWithinCeiling('BALANCED', 'R0')).toBe(true)
        expect(mapper.isWithinCeiling('BALANCED', 'R2')).toBe(true)
        expect(mapper.isWithinCeiling('BALANCED', 'R3')).toBe(false)
    })

    it('CREATIVE allows R0–R3, rejects R3+', () => {
        expect(mapper.isWithinCeiling('CREATIVE', 'R3')).toBe(true)
        expect(mapper.isWithinCeiling('CREATIVE', 'R3+')).toBe(false)
    })

    it('SAFE always requires confirmation', () => {
        expect(mapper.requiresConfirmation('SAFE', 'R0')).toBe(true)
        expect(mapper.requiresConfirmation('SAFE', 'R1')).toBe(true)
        expect(mapper.requiresConfirmation('SAFE', 'R2')).toBe(true)
    })

    it('BALANCED requires confirmation only at R2+', () => {
        expect(mapper.requiresConfirmation('BALANCED', 'R0')).toBe(false)
        expect(mapper.requiresConfirmation('BALANCED', 'R1')).toBe(false)
        expect(mapper.requiresConfirmation('BALANCED', 'R2')).toBe(true)
        expect(mapper.requiresConfirmation('BALANCED', 'R3')).toBe(true)
    })

    it('CREATIVE requires confirmation only at R3', () => {
        expect(mapper.requiresConfirmation('CREATIVE', 'R0')).toBe(false)
        expect(mapper.requiresConfirmation('CREATIVE', 'R2')).toBe(false)
        expect(mapper.requiresConfirmation('CREATIVE', 'R3')).toBe(true)
    })
})

describe('ModeMapper — Stability Index override', () => {
    const mapper = new ModeMapper()

    it('stability >= 70 → no override', () => {
        expect(mapper.applyStabilityOverride('CREATIVE', 100)).toBe('CREATIVE')
        expect(mapper.applyStabilityOverride('BALANCED', 70)).toBe('BALANCED')
    })

    it('stability < 70 → force SAFE (non-SAFE modes)', () => {
        expect(mapper.applyStabilityOverride('CREATIVE', 69)).toBe('SAFE')
        expect(mapper.applyStabilityOverride('BALANCED', 60)).toBe('SAFE')
    })

    it('stability < 50 → CREATIVE forced to SAFE', () => {
        expect(mapper.applyStabilityOverride('CREATIVE', 49)).toBe('SAFE')
    })

    it('SAFE mode unaffected by stability', () => {
        expect(mapper.applyStabilityOverride('SAFE', 30)).toBe('SAFE')
    })

    it('returns complete policy map', () => {
        const policies = mapper.getAllPolicies()
        expect(Object.keys(policies).sort()).toEqual(['BALANCED', 'CREATIVE', 'SAFE'])
        expect(policies.SAFE.riskCeiling).toBe('R1')
    })
})

// ─── IntentInterpreter ────────────────────────────────────────────────────────

describe('IntentInterpreter — action classification', () => {
    const interpreter = new IntentInterpreter()

    it('read actions → R0 risk', () => {
        const r = interpreter.interpret('show me the config file')
        expect(r.action).toBe('read')
        expect(r.estimatedRisk).toBe('R0')
    })

    it('analyze actions → R0 risk', () => {
        const r = interpreter.interpret('explain how this function works')
        expect(r.action).toBe('analyze')
        expect(r.estimatedRisk).toBe('R0')
    })

    it('fix actions → R1 risk', () => {
        const r = interpreter.interpret('fix the bug in login.ts')
        expect(r.action).toBe('fix')
        expect(r.estimatedRisk).toBe('R1')
    })

    it('refactor actions → R1 base risk', () => {
        const r = interpreter.interpret('refactor this function')
        expect(r.action).toBe('refactor')
        expect(r.estimatedRisk).toBe('R1')
    })

    it('add-feature actions → R2 risk', () => {
        const r = interpreter.interpret('add a new feature to the API')
        expect(r.action).toBe('add-feature')
        expect(r.estimatedRisk).toBe('R2')
    })

    it('restructure actions → R3 risk', () => {
        const r = interpreter.interpret('restructure the entire architecture')
        expect(r.action).toBe('restructure')
        expect(r.estimatedRisk).toBe('R3')
    })

    it('amplifiers elevate risk', () => {
        const r = interpreter.interpret('completely refactor all functions')
        expect(r.estimatedRisk).toBe('R2') // R1 elevated by 'completely'
    })

    it('global scope elevates risk', () => {
        const r = interpreter.interpret('fix all bugs everywhere in the system')
        // fix=R1, 'everywhere'+'system' → global scope → elevated to R2
        expect(r.estimatedRisk).toBe('R2')
    })

    it('empty input → unknown action, R0', () => {
        const r = interpreter.interpret('')
        expect(r.action).toBe('unknown')
        expect(r.confidence).toBe(0)
    })

    it('provides confidence and summary always', () => {
        const r = interpreter.interpret('refactor the auth module')
        expect(r.confidence).toBeGreaterThan(0)
        expect(r.summary).toContain('R')
    })
})

// ─── ConfirmationEngine ───────────────────────────────────────────────────────

describe('ConfirmationEngine', () => {
    const engine = new ConfirmationEngine()

    it('SAFE + R1 → requires confirmation (confirmAll)', () => {
        const req = engine.evaluate('exec-1', 'SAFE', 'R1', 'edit config.ts')
        expect(req.requiresConfirm).toBe(true)
        expect(req.mode).toBe('SAFE')
    })

    it('BALANCED + R0 → no confirmation needed', () => {
        const req = engine.evaluate('exec-2', 'BALANCED', 'R0', 'read index.ts')
        expect(req.requiresConfirm).toBe(false)
    })

    it('BALANCED + R2 → requires confirmation', () => {
        const req = engine.evaluate('exec-3', 'BALANCED', 'R2', 'add feature')
        expect(req.requiresConfirm).toBe(true)
        expect(req.currentRisk).toBe('R2')
    })

    it('CREATIVE + R2 → no confirmation needed', () => {
        const req = engine.evaluate('exec-4', 'CREATIVE', 'R2', 'extend service')
        expect(req.requiresConfirm).toBe(false)
    })

    it('CREATIVE + R3 → requires confirmation', () => {
        const req = engine.evaluate('exec-5', 'CREATIVE', 'R3', 'restructure all modules')
        expect(req.requiresConfirm).toBe(true)
    })

    it('R3+ → hard stop in all modes', () => {
        for (const mode of ['SAFE', 'BALANCED', 'CREATIVE'] as const) {
            const req = engine.evaluate(`exec-${mode}`, mode, 'R3+', 'dangerous action')
            expect(req.requiresConfirm).toBe(true)
            expect(req.reason).toContain('HARD STOP')
        }
    })

    it('CREATIVE + stability < 70 → forced to SAFE mode', () => {
        const req = engine.evaluate('exec-6', 'CREATIVE', 'R1', 'refactor', 60)
        expect(req.mode).toBe('SAFE')
        expect(req.reason).toContain('Stability Index')
    })

    it('SAFE exceeds ceiling with R2 action → requires confirm + reason reflects ceiling', () => {
        const req = engine.evaluate('exec-7', 'SAFE', 'R2', 'add-feature')
        expect(req.requiresConfirm).toBe(true)
        expect(req.reason).toContain('exceeds ceiling')
    })
})
