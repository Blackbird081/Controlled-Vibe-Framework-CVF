/**
 * Session Memory — M5.2
 *
 * Cross-request state persistence for CVF sessions.
 * Tracks phase transitions, guard decisions, mutation counts,
 * and conversation context across multiple tool calls.
 *
 * @module memory/session-memory
 */
const DEFAULT_CONFIG = {
    maxEntries: 1000,
    defaultTtlMs: 3600000, // 1 hour
    enableExpiry: true,
};
export class SessionMemory {
    entries = new Map();
    config;
    sessionId;
    currentPhase = 'DISCOVERY';
    currentRisk = 'R0';
    mutationCount = 0;
    phaseHistory = [];
    decisionCounts = { allowed: 0, blocked: 0, escalated: 0 };
    createdAt;
    lastActivityAt;
    constructor(sessionId, config) {
        this.sessionId = sessionId || `session-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.createdAt = new Date().toISOString();
        this.lastActivityAt = this.createdAt;
        this.phaseHistory.push({ phase: 'DISCOVERY', timestamp: this.createdAt });
    }
    // ─── Core Memory Operations ──────────────────────────────────────
    set(key, value, type = 'custom', ttlMs) {
        this.evictExpired();
        if (this.entries.size >= this.config.maxEntries && !this.entries.has(key)) {
            this.evictOldest();
        }
        const now = new Date();
        const effectiveTtl = ttlMs ?? this.config.defaultTtlMs;
        const entry = {
            id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: now.toISOString(),
            type,
            key,
            value,
            ttlMs: effectiveTtl,
            expiresAt: this.config.enableExpiry
                ? new Date(now.getTime() + effectiveTtl).toISOString()
                : undefined,
        };
        this.entries.set(key, entry);
        this.lastActivityAt = now.toISOString();
    }
    get(key) {
        this.evictExpired();
        const entry = this.entries.get(key);
        if (!entry)
            return undefined;
        return entry.value;
    }
    has(key) {
        this.evictExpired();
        return this.entries.has(key);
    }
    delete(key) {
        return this.entries.delete(key);
    }
    getEntry(key) {
        this.evictExpired();
        return this.entries.get(key);
    }
    getByType(type) {
        this.evictExpired();
        return Array.from(this.entries.values()).filter((e) => e.type === type);
    }
    getAllEntries() {
        this.evictExpired();
        return Array.from(this.entries.values());
    }
    clear() {
        this.entries.clear();
    }
    size() {
        this.evictExpired();
        return this.entries.size;
    }
    // ─── Phase Tracking ──────────────────────────────────────────────
    advancePhase(newPhase) {
        const now = new Date().toISOString();
        this.set(`phase:${this.currentPhase}:end`, now, 'phase_transition');
        this.currentPhase = newPhase;
        this.phaseHistory.push({ phase: newPhase, timestamp: now });
        this.set(`phase:${newPhase}:start`, now, 'phase_transition');
        this.lastActivityAt = now;
    }
    getPhase() {
        return this.currentPhase;
    }
    getPhaseHistory() {
        return [...this.phaseHistory];
    }
    // ─── Risk Tracking ──────────────────────────────────────────────
    setRisk(risk) {
        this.currentRisk = risk;
        this.lastActivityAt = new Date().toISOString();
    }
    getRisk() {
        return this.currentRisk;
    }
    // ─── Mutation Tracking ──────────────────────────────────────────
    incrementMutations(count = 1) {
        this.mutationCount += count;
        this.set('mutation_count', this.mutationCount, 'mutation_count');
        return this.mutationCount;
    }
    getMutationCount() {
        return this.mutationCount;
    }
    resetMutations() {
        this.mutationCount = 0;
        this.set('mutation_count', 0, 'mutation_count');
    }
    // ─── Guard Decision Tracking ────────────────────────────────────
    recordDecision(result) {
        const now = new Date().toISOString();
        switch (result.finalDecision) {
            case 'ALLOW':
                this.decisionCounts.allowed++;
                break;
            case 'BLOCK':
                this.decisionCounts.blocked++;
                break;
            case 'ESCALATE':
                this.decisionCounts.escalated++;
                break;
        }
        this.set(`decision:${result.requestId}`, {
            decision: result.finalDecision,
            blockedBy: result.blockedBy,
            escalatedBy: result.escalatedBy,
            durationMs: result.durationMs,
        }, 'guard_decision');
        this.lastActivityAt = now;
    }
    getDecisionCounts() {
        return { ...this.decisionCounts };
    }
    // ─── User Preferences ──────────────────────────────────────────
    setPreference(key, value) {
        this.set(`pref:${key}`, value, 'user_preference');
    }
    getPreference(key) {
        return this.get(`pref:${key}`);
    }
    // ─── Context ────────────────────────────────────────────────────
    setContext(key, value) {
        this.set(`ctx:${key}`, value, 'context');
    }
    getContext(key) {
        return this.get(`ctx:${key}`);
    }
    // ─── Constraints ────────────────────────────────────────────────
    addConstraint(key, description) {
        this.set(`constraint:${key}`, description, 'constraint');
    }
    getConstraints() {
        return this.getByType('constraint').map((e) => ({
            key: e.key.replace('constraint:', ''),
            description: e.value,
        }));
    }
    // ─── Snapshot ───────────────────────────────────────────────────
    snapshot() {
        this.evictExpired();
        return {
            sessionId: this.sessionId,
            currentPhase: this.currentPhase,
            currentRisk: this.currentRisk,
            mutationCount: this.mutationCount,
            totalDecisions: this.decisionCounts.allowed + this.decisionCounts.blocked + this.decisionCounts.escalated,
            blockedCount: this.decisionCounts.blocked,
            escalatedCount: this.decisionCounts.escalated,
            allowedCount: this.decisionCounts.allowed,
            entryCount: this.entries.size,
            createdAt: this.createdAt,
            lastActivityAt: this.lastActivityAt,
            phaseHistory: this.getPhaseHistory(),
        };
    }
    getSessionId() {
        return this.sessionId;
    }
    // ─── Internal ───────────────────────────────────────────────────
    evictExpired() {
        if (!this.config.enableExpiry)
            return;
        const now = Date.now();
        for (const [key, entry] of this.entries) {
            if (entry.expiresAt && new Date(entry.expiresAt).getTime() <= now) {
                this.entries.delete(key);
            }
        }
    }
    evictOldest() {
        let oldestKey = null;
        let oldestTime = Infinity;
        for (const [key, entry] of this.entries) {
            const time = new Date(entry.timestamp).getTime();
            if (time < oldestTime) {
                oldestTime = time;
                oldestKey = key;
            }
        }
        if (oldestKey) {
            this.entries.delete(oldestKey);
        }
    }
}
//# sourceMappingURL=session-memory.js.map