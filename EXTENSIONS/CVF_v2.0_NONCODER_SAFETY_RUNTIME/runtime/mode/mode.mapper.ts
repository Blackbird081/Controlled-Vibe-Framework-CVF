// CVF v2.0 — Mode Mapper
// Maps user's SafetyMode selection → KernelPolicy for v1.8 LifecycleController.
// The kernel treats these as immutable hard limits.

import type { SafetyMode, KernelPolicy } from '../types/index.js'

const POLICIES: Record<SafetyMode, KernelPolicy> = {
    SAFE: {
        mode: 'SAFE',
        maxFiles: 2,
        maxLines: 50,
        riskCeiling: 'R1',   // Auto-reject any action > R1
        confirmAll: true,     // Always confirm before any file change
        confirmR2: true,
        confirmR3: true,
    },
    BALANCED: {
        mode: 'BALANCED',
        maxFiles: 5,
        maxLines: 150,
        riskCeiling: 'R2',   // Auto-reject any action > R2
        confirmAll: false,
        confirmR2: true,      // Confirm for R2 actions
        confirmR3: true,
    },
    CREATIVE: {
        mode: 'CREATIVE',
        maxFiles: 10,
        maxLines: 300,
        riskCeiling: 'R3',   // Auto-reject R3+ (score 16+)
        confirmAll: false,
        confirmR2: false,
        confirmR3: true,      // Confirm for R3 actions
    },
}

export class ModeMapper {
    /**
     * Returns the KernelPolicy for a given SafetyMode.
     * This is the authoritative SAFE/BALANCED/CREATIVE definition per CREATIVE_MODE_SPEC.md.
     */
    toKernelPolicy(mode: SafetyMode): KernelPolicy {
        return POLICIES[mode]!
    }

    /**
     * Check if an action with given risk is within the mode's ceiling.
     */
    isWithinCeiling(mode: SafetyMode, riskLevel: string): boolean {
        const policy = this.toKernelPolicy(mode)
        const ceilings: Record<string, number> = { R0: 0, R1: 1, R2: 2, R3: 3, 'R3+': 4 }
        const ceilingNum = ceilings[policy.riskCeiling] ?? 3
        const riskNum = ceilings[riskLevel] ?? 4
        return riskNum <= ceilingNum
    }

    /**
     * Determine if confirmation is needed for this mode + risk combo.
     */
    requiresConfirmation(mode: SafetyMode, riskLevel: string): boolean {
        const policy = this.toKernelPolicy(mode)
        if (policy.confirmAll) return true
        if (riskLevel === 'R2' && policy.confirmR2) return true
        if ((riskLevel === 'R3' || riskLevel === 'R3+') && policy.confirmR3) return true
        return false
    }

    /**
     * Apply Stability Index override.
     * If stability < 70 → force SAFE mode.
     * If stability < 50 → disable CREATIVE entirely.
     */
    applyStabilityOverride(requestedMode: SafetyMode, stabilityIndex: number): SafetyMode {
        if (stabilityIndex < 50 && requestedMode === 'CREATIVE') return 'SAFE'
        if (stabilityIndex < 70 && requestedMode !== 'SAFE') return 'SAFE'
        return requestedMode
    }

    getAllPolicies(): Record<SafetyMode, KernelPolicy> {
        return POLICIES
    }
}
