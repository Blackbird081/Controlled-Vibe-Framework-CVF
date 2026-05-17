// CVF v1.8 — Risk Lock
// Enforces immutability of RiskObject after RISK_ASSESSMENT phase.
// Once locked, any attempt to modify throws an error.

import type { RiskObject } from '../../types/index.js'

const _lockedRisks = new Map<string, Readonly<RiskObject>>()

export class RiskLock {
    /**
     * Lock a RiskObject to its executionId.
     * Cannot be unlocked. Throws if already locked.
     */
    lock(risk: RiskObject): Readonly<RiskObject> {
        if (_lockedRisks.has(risk.executionId)) {
            throw new Error(
                `[CVF v1.8] RiskLock: executionId=${risk.executionId} is already locked. ` +
                'AI cannot modify risk after RISK_ASSESSMENT phase.'
            )
        }

        const locked: Readonly<RiskObject> = Object.freeze({ ...risk, locked: true })
        _lockedRisks.set(risk.executionId, locked)
        return locked
    }

    /**
     * Retrieve a locked RiskObject. Throws if not locked.
     */
    get(executionId: string): Readonly<RiskObject> {
        const risk = _lockedRisks.get(executionId)
        if (!risk) {
            throw new Error(
                `[CVF v1.8] RiskLock: No locked risk found for executionId=${executionId}. ` +
                'RISK_ASSESSMENT phase must complete before accessing risk.'
            )
        }
        return risk
    }

    has(executionId: string): boolean {
        return _lockedRisks.has(executionId)
    }

    /** For testing only — clear all locks */
    _clearAll(): void {
        _lockedRisks.clear()
    }
}
