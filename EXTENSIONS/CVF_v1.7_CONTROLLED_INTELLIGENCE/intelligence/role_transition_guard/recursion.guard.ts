// recursion.guard.ts
// Prevents role oscillation and infinite transition loops.
// Tracks per-session transition history and enforces limits.

import { AgentRole } from "../role_transition_guard/role.types"

export interface RecursionGuardConfig {
    maxTransitionDepth: number       // max total transitions per session (default 20)
    maxSameRoleRepetition: number    // max consecutive same-role transitions (default 3)
    maxOscillationCount: number      // max A→B→A→B pattern repetitions (default 2)
}

export interface RecursionCheckResult {
    allowed: boolean
    reason?: string
    currentDepth: number
    locked: boolean
}

const DEFAULT_CONFIG: RecursionGuardConfig = {
    maxTransitionDepth: 20,
    maxSameRoleRepetition: 3,
    maxOscillationCount: 2
}

// Per-session transition history
const sessionHistory: Map<string, AgentRole[]> = new Map()
const lockedSessions: Set<string> = new Set()

/**
 * Record a role transition and check if it violates recursion limits.
 */
export function checkTransition(
    sessionId: string,
    newRole: AgentRole,
    config: Partial<RecursionGuardConfig> = {}
): RecursionCheckResult {

    const cfg = { ...DEFAULT_CONFIG, ...config }

    // Already locked?
    if (lockedSessions.has(sessionId)) {
        return {
            allowed: false,
            reason: `Session ${sessionId} is LOCKED due to recursion violation`,
            currentDepth: getDepth(sessionId),
            locked: true
        }
    }

    const history = sessionHistory.get(sessionId) ?? []

    // Check 1: Max total transitions
    if (history.length >= cfg.maxTransitionDepth) {
        lockedSessions.add(sessionId)
        return {
            allowed: false,
            reason: `Max transition depth ${cfg.maxTransitionDepth} exceeded`,
            currentDepth: history.length,
            locked: true
        }
    }

    // Check 2: Same-role repetition (e.g., BUILD→BUILD→BUILD)
    const consecutiveSame = countTrailingRepeats(history, newRole)
    if (consecutiveSame >= cfg.maxSameRoleRepetition) {
        return {
            allowed: false,
            reason: `Same role ${newRole} repeated ${consecutiveSame + 1} times (max ${cfg.maxSameRoleRepetition})`,
            currentDepth: history.length,
            locked: false
        }
    }

    // Check 3: Oscillation pattern (e.g., PLAN→DEBUG→PLAN→DEBUG)
    if (history.length >= 3) {
        const oscillationCount = countOscillations(history, newRole)
        if (oscillationCount >= cfg.maxOscillationCount) {
            lockedSessions.add(sessionId)
            return {
                allowed: false,
                reason: `Oscillation detected: ${history[history.length - 1]}→${newRole} repeated ${oscillationCount} times`,
                currentDepth: history.length,
                locked: true
            }
        }
    }

    // Allowed — record transition
    history.push(newRole)
    sessionHistory.set(sessionId, history)

    return {
        allowed: true,
        currentDepth: history.length,
        locked: false
    }
}

function countTrailingRepeats(history: AgentRole[], newRole: AgentRole): number {
    let count = 0
    for (let i = history.length - 1; i >= 0; i--) {
        if (history[i] === newRole) count++
        else break
    }
    return count
}

function countOscillations(history: AgentRole[], newRole: AgentRole): number {
    if (history.length < 2) return 0
    const prev = history[history.length - 1]
    const prevPrev = history[history.length - 2]
    // Pattern: prevPrev → prev → newRole where prevPrev === newRole (A→B→A)
    if (prevPrev === newRole && prev !== newRole) {
        let count = 0
        for (let i = history.length - 1; i >= 1; i -= 2) {
            if (history[i] === prev && history[i - 1] === newRole) count++
            else break
        }
        return count
    }
    return 0
}

function getDepth(sessionId: string): number {
    return sessionHistory.get(sessionId)?.length ?? 0
}

export function isSessionLocked(sessionId: string): boolean {
    return lockedSessions.has(sessionId)
}

export function getSessionHistory(sessionId: string): AgentRole[] {
    return [...(sessionHistory.get(sessionId) ?? [])]
}

export function resetSession(sessionId: string): void {
    sessionHistory.delete(sessionId)
    lockedSessions.delete(sessionId)
}
