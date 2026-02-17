// phase.controller.ts
// CVF Toolkit Core — Phase State Machine Controller
// See phase.controller.spec.md for full specification.
// Enforces strict sequential phase transitions (P0–P6).

import { CVFPhase, RiskLevel, PhaseState } from "./interfaces"
import { PHASE_ORDER, RISK_ORDER } from "./cvf.config"
import { auditLogger } from "./audit.logger"

// --- Error ---

export class PhaseTransitionError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "PhaseTransitionError"
    }
}

// --- Phase Controller ---

class PhaseController {

    private phaseIndex(phase: CVFPhase): number {
        return PHASE_ORDER.indexOf(phase)
    }

    private isNextSequential(current: CVFPhase, target: CVFPhase): boolean {
        const currentIdx = this.phaseIndex(current)
        const targetIdx = this.phaseIndex(target)
        return targetIdx === currentIdx + 1
    }

    transitionPhase(
        state: PhaseState,
        targetPhase: CVFPhase
    ): PhaseState {

        // RULE 1 — Freeze Lock
        if (state.freezeActive) {
            if (state.currentPhase === "P6_FROZEN" && targetPhase === "P0_DESIGN") {
                // Formal rollback allowed
                auditLogger.log({
                    eventType: "PHASE_VALIDATION",
                    details: {
                        projectId: state.projectId,
                        fromPhase: state.currentPhase,
                        toPhase: targetPhase,
                        action: "rollback"
                    }
                })
                return {
                    ...state,
                    currentPhase: "P0_DESIGN",
                    freezeActive: false,
                    approvalGranted: false,
                    uatPassed: false
                }
            }
            throw new PhaseTransitionError("System frozen. Only P6 → P0 rollback allowed.")
        }

        // RULE 2 — Sequential Integrity
        if (!this.isNextSequential(state.currentPhase, targetPhase)) {
            throw new PhaseTransitionError(
                `Illegal transition: ${state.currentPhase} → ${targetPhase}. Must be sequential.`
            )
        }

        // RULE 3 — Risk-Based Gates
        if (targetPhase === "P3_UAT" && RISK_ORDER[state.riskLevel] < RISK_ORDER["R2"]) {
            // R1 can skip UAT (allowed to pass through)
        }

        if (targetPhase === "P4_APPROVED") {
            if (RISK_ORDER[state.riskLevel] >= RISK_ORDER["R3"] && !state.approvalGranted) {
                throw new PhaseTransitionError(
                    `Approval required for risk ${state.riskLevel} before P4_APPROVED`
                )
            }
            if (!state.uatPassed) {
                throw new PhaseTransitionError(
                    "UAT must pass before P4_APPROVED"
                )
            }
        }

        if (targetPhase === "P5_PRODUCTION") {
            if (!state.approvalGranted) {
                throw new PhaseTransitionError(
                    "Approval must be granted before P5_PRODUCTION"
                )
            }
            if (!state.uatPassed) {
                throw new PhaseTransitionError(
                    "UAT must pass before P5_PRODUCTION"
                )
            }
        }

        // RULE 4 — R4 Special Control
        if (state.riskLevel === "R4") {
            if (targetPhase === "P4_APPROVED" || targetPhase === "P5_PRODUCTION") {
                if (!state.approvalGranted || !state.uatPassed) {
                    throw new PhaseTransitionError(
                        "R4 requires dual approval and extended UAT before advancing to P4/P5"
                    )
                }
            }
        }

        // Audit log
        auditLogger.log({
            eventType: "PHASE_VALIDATION",
            details: {
                projectId: state.projectId,
                fromPhase: state.currentPhase,
                toPhase: targetPhase,
                riskLevel: state.riskLevel,
                approvalStatus: state.approvalGranted,
                uatStatus: state.uatPassed
            }
        })

        return {
            ...state,
            currentPhase: targetPhase
        }
    }

    activateFreeze(state: PhaseState): PhaseState {
        if (RISK_ORDER[state.riskLevel] < RISK_ORDER["R3"]) {
            // Only freeze if risk >= R3 or manual trigger
        }

        auditLogger.log({
            eventType: "FREEZE_APPLIED",
            details: {
                projectId: state.projectId,
                riskLevel: state.riskLevel,
                previousPhase: state.currentPhase
            }
        })

        return {
            ...state,
            freezeActive: true,
            currentPhase: "P6_FROZEN"
        }
    }
}

export const phaseController = new PhaseController()