// freeze.protocol.ts
// CVF Toolkit — Freeze Protocol Runtime Implementation
// Implements freeze.protocol.md spec.

import { auditLogger } from "../02_TOOLKIT_CORE/audit.logger"
import { RiskLevel } from "../02_TOOLKIT_CORE/interfaces"
import {
    RISK_ORDER,
    RISK_REQUIRES_FREEZE
} from "../02_TOOLKIT_CORE/cvf.config"
import { FreezeViolationError } from "../02_TOOLKIT_CORE/errors"

// --- Types ---

export interface FreezeState {
    skillId: string
    version: string
    riskLevel: RiskLevel
    frozenAt: string
    frozenBy: string
    reason: string
    active: boolean
}

export interface FreezeBreakRequest {
    skillId: string
    requestedBy: string
    changeRequestId: string
    justification: string
}

// --- Freeze Controller ---

class FreezeProtocol {

    private freezes: Map<string, FreezeState> = new Map()

    isFreezeRequired(riskLevel: RiskLevel): boolean {
        return RISK_REQUIRES_FREEZE[riskLevel]
    }

    activate(
        skillId: string,
        version: string,
        riskLevel: RiskLevel,
        frozenBy: string,
        reason: string
    ): FreezeState {

        const key = `${skillId}@${version}`

        if (this.freezes.has(key) && this.freezes.get(key)!.active) {
            throw new FreezeViolationError(`Skill ${key} is already frozen`)
        }

        const state: FreezeState = {
            skillId,
            version,
            riskLevel,
            frozenAt: new Date().toISOString(),
            frozenBy,
            reason,
            active: true
        }

        this.freezes.set(key, state)

        auditLogger.log({
            eventType: "FREEZE_APPLIED",
            operatorId: frozenBy,
            skillId,
            riskLevel,
            details: { version, reason, action: "freeze_activated" }
        })

        return Object.freeze({ ...state })
    }

    isActive(skillId: string, version: string): boolean {
        const key = `${skillId}@${version}`
        const state = this.freezes.get(key)
        return state?.active === true
    }

    getState(skillId: string, version: string): Readonly<FreezeState> | null {
        const key = `${skillId}@${version}`
        const state = this.freezes.get(key)
        return state ? Object.freeze({ ...state }) : null
    }

    breakFreeze(request: FreezeBreakRequest, adminRole: string): void {
        if (adminRole !== "ADMIN") {
            throw new FreezeViolationError(
                "Only ADMIN role may break freeze"
            )
        }

        const key = `${request.skillId}@*`
        let found = false

        for (const [k, state] of this.freezes) {
            if (k.startsWith(request.skillId) && state.active) {
                state.active = false
                found = true

                auditLogger.log({
                    eventType: "FREEZE_APPLIED",
                    operatorId: request.requestedBy,
                    skillId: request.skillId,
                    details: {
                        action: "freeze_broken",
                        changeRequestId: request.changeRequestId,
                        justification: request.justification
                    }
                })
            }
        }

        if (!found) {
            throw new FreezeViolationError(
                `No active freeze found for skill ${request.skillId}`
            )
        }
    }

    listActive(): ReadonlyArray<Readonly<FreezeState>> {
        const active: FreezeState[] = []
        for (const state of this.freezes.values()) {
            if (state.active) active.push(Object.freeze({ ...state }))
        }
        return active
    }
}

export const freezeProtocol = new FreezeProtocol()
