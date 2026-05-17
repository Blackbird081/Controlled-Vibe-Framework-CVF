// CVF v2.0 — Intent Interpreter
// Translates natural language user input → structured ParsedIntent.
// Uses pattern matching — no LLM calls, no external dependencies.
//
// The interpreted intent is used to:
// 1. Estimate risk before kernel assessment
// 2. Pre-validate against the active mode's ceiling
// 3. Provide a human-readable summary in the UI

import type { IntentAction, ParsedIntent, EstimatedRiskLevel } from '../../types/index.js'

// ─── Pattern Maps ──────────────────────────────────────────────────────────────

const ACTION_PATTERNS: Array<{ patterns: RegExp[]; action: IntentAction; baseRisk: EstimatedRiskLevel }> = [
    {
        patterns: [/\bread\b/i, /\bshow\b/i, /\bdisplay\b/i, /\blist\b/i, /\bprint\b/i, /\bcheck\b/i],
        action: 'read',
        baseRisk: 'R0',
    },
    {
        patterns: [/\banalyz/i, /\binspect/i, /\bexplain\b/i, /\bdescribe\b/i, /\brevie\b/i],
        action: 'analyze',
        baseRisk: 'R0',
    },
    {
        patterns: [/\bfix\b/i, /\bbug\b/i, /\berror\b/i, /\bissue\b/i, /\bpatch\b/i, /\bresolve\b/i],
        action: 'fix',
        baseRisk: 'R1',
    },
    {
        patterns: [/\brefactor\b/i, /\bclean.?up\b/i, /\boptimize\b/i, /\bimprove\b/i, /\bsimplify\b/i],
        action: 'refactor',
        baseRisk: 'R1',
    },
    {
        patterns: [/\badd\b/i, /\bcreate\b/i, /\bimpleme?n?t\b/i, /\bbuild\b/i, /\bnew feature\b/i, /\bextend\b/i],
        action: 'add-feature',
        baseRisk: 'R2',
    },
    {
        patterns: [/\brestructure\b/i, /\barchitect/i, /\bmigrate\b/i, /\boverhaul\b/i, /\brewrite\b/i],
        action: 'restructure',
        baseRisk: 'R3',
    },
    {
        patterns: [/\bdelete\b/i, /\bremove all\b/i, /\bdrop\b/i, /\bpurge\b/i],
        action: 'delete',
        baseRisk: 'R2',
    },
]

const SCOPE_INDICATORS: Array<{ pattern: RegExp; scope: ParsedIntent['scope'] }> = [
    { pattern: /\bfile\b|\bfunction\b|\bmethod\b|\bclass\b/i, scope: 'single-file' },
    { pattern: /\bmodule\b|\bpackage\b|\bfolder\b|\bdirectory\b/i, scope: 'module' },
    { pattern: /\bapi\b|\bintegration\b|\binterface\b|\bservice\b/i, scope: 'cross-module' },
    { pattern: /\bsystem\b|\ball\b|\beverywhere\b|\bentire\b|\bglobal\b/i, scope: 'global' },
]

const AMPLIFIERS: RegExp[] = [
    /\bcompletely\b/i, /\bentirely\b/i, /\beverywhere\b/i, /\ball files\b/i,
]

// ─── Interpreter ──────────────────────────────────────────────────────────────

export class IntentInterpreter {
    /**
     * Parse a natural language user input into a structured ParsedIntent.
     */
    interpret(rawInput: string): ParsedIntent {
        const input = rawInput.trim()

        if (!input) {
            return {
                rawInput,
                action: 'unknown',
                scope: 'single-file',
                estimatedRisk: 'R0',
                confidence: 0,
                summary: 'Empty input — no intent detected',
            }
        }

        // Detect action
        let action: IntentAction = 'unknown'
        let baseRisk: EstimatedRiskLevel = 'R1'
        let confidence = 0.5

        for (const entry of ACTION_PATTERNS) {
            if (entry.patterns.some(p => p.test(input))) {
                action = entry.action
                baseRisk = entry.baseRisk
                confidence = 0.8
                break
            }
        }

        // Detect scope
        let scope: ParsedIntent['scope'] = 'single-file'
        for (const { pattern, scope: s } of SCOPE_INDICATORS) {
            if (pattern.test(input)) {
                scope = s
                break
            }
        }

        // Elevate risk for amplifiers + scope combination
        let estimatedRisk = baseRisk
        const hasAmplifier = AMPLIFIERS.some(p => p.test(input))
        if (hasAmplifier || scope === 'global') {
            estimatedRisk = this._elevateRisk(estimatedRisk)
        }
        if (scope === 'cross-module' && estimatedRisk === 'R1') {
            estimatedRisk = 'R2'
        }

        const summary = this._buildSummary(action, scope, estimatedRisk)

        return { rawInput, action, scope, estimatedRisk, confidence, summary }
    }

    private _elevateRisk(risk: EstimatedRiskLevel): EstimatedRiskLevel {
        const levels: EstimatedRiskLevel[] = ['R0', 'R1', 'R2', 'R3']
        const idx = levels.indexOf(risk)
        return levels[Math.min(idx + 1, levels.length - 1)] ?? 'R3'
    }

    private _buildSummary(
        action: IntentAction,
        scope: ParsedIntent['scope'],
        risk: EstimatedRiskLevel
    ): string {
        const actionLabels: Record<IntentAction, string> = {
            read: 'Read-only analysis',
            analyze: 'Code analysis',
            fix: 'Bug fix',
            refactor: 'Code refactor',
            'add-feature': 'New feature',
            restructure: 'Structural change',
            delete: 'Deletion',
            unknown: 'Unknown action',
        }
        return `${actionLabels[action]} at ${scope.replace('-', ' ')} scope — estimated ${risk}`
    }
}
