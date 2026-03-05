// CVF v1.9 — Context Freezer
// Locks the execution context (files + env + policy) before ANALYSIS phase.
// Produces a frozenContextHash that makes the execution reproducible.
//
// Design: If context changes between original and replay,
// frozenContextHash will differ → drift is detected.

import { createHash } from 'crypto'
import type { ContextSnapshot } from '../types/index.js'

const _frozenContexts = new Map<string, ContextSnapshot>()

export class ContextFreezer {
    /**
     * Freeze the execution context for an executionId.
     * Must be called BEFORE ANALYSIS phase (at end of INTENT).
     * Returns the frozenContextHash — deterministic from content.
     */
    freeze(
        executionId: string,
        fileHashes: Record<string, string>,
        policyVersion: string,
        envMeta: Record<string, string> = {}
    ): string {
        if (_frozenContexts.has(executionId)) {
            throw new Error(
                `[CVF v1.9] ContextFreezer: already frozen for executionId=${executionId}`
            )
        }

        const snapshot: ContextSnapshot = {
            fileHashes,
            policyVersion,
            envMeta,
            frozenAt: Date.now(),
        }

        _frozenContexts.set(executionId, snapshot)
        return this._computeHash(snapshot)
    }

    /**
     * Get a previously frozen context.
     */
    get(executionId: string): ContextSnapshot {
        const snap = _frozenContexts.get(executionId)
        if (!snap) {
            throw new Error(
                `[CVF v1.9] ContextFreezer: no frozen context for executionId=${executionId}`
            )
        }
        return snap
    }

    has(executionId: string): boolean {
        return _frozenContexts.has(executionId)
    }

    /**
     * Compare a new context against the frozen one.
     * Returns list of files that have changed (drift).
     */
    detectDrift(executionId: string, currentFileHashes: Record<string, string>): string[] {
        const frozen = this.get(executionId)
        const drifted: string[] = []

        // Files that existed before and changed
        for (const [path, hash] of Object.entries(frozen.fileHashes)) {
            if (currentFileHashes[path] !== hash) {
                drifted.push(path)
            }
        }

        // Files that are new (not in frozen context)
        for (const path of Object.keys(currentFileHashes)) {
            if (!(path in frozen.fileHashes)) {
                drifted.push(path)
            }
        }

        return drifted
    }

    computeHashForSnapshot(snapshot: ContextSnapshot): string {
        return this._computeHash(snapshot)
    }

    private _computeHash(snapshot: ContextSnapshot): string {
        // Sort keys for determinism
        const payload = JSON.stringify({
            fileHashes: Object.fromEntries(
                Object.entries(snapshot.fileHashes).sort(([a], [b]) => a.localeCompare(b))
            ),
            policyVersion: snapshot.policyVersion,
            envMeta: Object.fromEntries(
                Object.entries(snapshot.envMeta).sort(([a], [b]) => a.localeCompare(b))
            ),
        })
        return createHash('sha256').update(payload).digest('hex').slice(0, 16)
    }

    /** For testing only */
    _clearAll(): void {
        _frozenContexts.clear()
    }
}
