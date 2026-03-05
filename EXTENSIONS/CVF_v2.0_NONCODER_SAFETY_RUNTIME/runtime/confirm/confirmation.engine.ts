// CVF v2.0 — Confirmation Engine
// Decides when user confirmation is required before executing an AI action.
// Rules are derived per CREATIVE_MODE_SPEC.md.
//
// SAFE: always confirm
// BALANCED: confirm if R2
// CREATIVE: confirm if R3
// All modes: hard stop if R3+ regardless

import type { SafetyMode, ConfirmationRequest } from '../../types/index.js'
import { ModeMapper } from '../mode/mode.mapper.js'

const mapper = new ModeMapper()

export class ConfirmationEngine {
    /**
     * Build a ConfirmationRequest for the given context.
     * If requiresConfirm=false, execution may proceed without user input.
     */
    evaluate(
        executionId: string,
        mode: SafetyMode,
        riskLevel: string,
        action: string,
        stabilityIndex: number = 100
    ): ConfirmationRequest {
        // Apply stability override (may force SAFE)
        const effectiveMode = mapper.applyStabilityOverride(mode, stabilityIndex)

        // Hard stop for R3+
        if (riskLevel === 'R3+') {
            return {
                executionId,
                mode: effectiveMode,
                currentRisk: 'R3+',
                action,
                requiresConfirm: true,
                reason: 'R3+ is above all mode ceilings — HARD STOP. No execution allowed.',
            }
        }

        // Check ceiling violation
        if (!mapper.isWithinCeiling(effectiveMode, riskLevel)) {
            return {
                executionId,
                mode: effectiveMode,
                currentRisk: riskLevel as 'R0' | 'R1' | 'R2' | 'R3' | 'R3+',
                action,
                requiresConfirm: true,
                reason: `Risk ${riskLevel} exceeds ceiling for ${effectiveMode} mode. Cannot auto-execute.`,
            }
        }

        const requiresConfirm = mapper.requiresConfirmation(effectiveMode, riskLevel)

        const reason = this._buildReason(effectiveMode, riskLevel, requiresConfirm, stabilityIndex, mode)

        return {
            executionId,
            mode: effectiveMode,
            currentRisk: riskLevel as 'R0' | 'R1' | 'R2' | 'R3' | 'R3+',
            action,
            requiresConfirm,
            reason,
        }
    }

    private _buildReason(
        mode: SafetyMode,
        risk: string,
        requiresConfirm: boolean,
        stabilityIndex: number,
        originalMode: SafetyMode
    ): string {
        if (originalMode !== mode) {
            return `Stability Index ${stabilityIndex} < 70 — mode forced to SAFE. Confirmation required.`
        }
        if (!requiresConfirm) return `${mode} mode: ${risk} is within auto-execute threshold.`
        if (mode === 'SAFE') return `SAFE mode always requires confirmation before file changes.`
        return `${mode} mode: ${risk} risk requires confirmation.`
    }
}
