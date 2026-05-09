/**
 * Session Memory — M5.2
 *
 * Cross-request state persistence for CVF sessions.
 * Tracks phase transitions, guard decisions, mutation counts,
 * and conversation context across multiple tool calls.
 *
 * @module memory/session-memory
 */
import type { CVFPhase, CVFRiskLevel, GuardPipelineResult } from '../guards/types.js';
export interface MemoryEntry {
    id: string;
    timestamp: string;
    type: MemoryEntryType;
    key: string;
    value: unknown;
    ttlMs?: number;
    expiresAt?: string;
}
export type MemoryEntryType = 'phase_transition' | 'guard_decision' | 'mutation_count' | 'user_preference' | 'context' | 'constraint' | 'custom';
export interface SessionMemoryConfig {
    maxEntries: number;
    defaultTtlMs: number;
    enableExpiry: boolean;
}
export interface SessionSnapshot {
    sessionId: string;
    currentPhase: CVFPhase;
    currentRisk: CVFRiskLevel;
    mutationCount: number;
    totalDecisions: number;
    blockedCount: number;
    escalatedCount: number;
    allowedCount: number;
    entryCount: number;
    createdAt: string;
    lastActivityAt: string;
    phaseHistory: {
        phase: CVFPhase;
        timestamp: string;
    }[];
}
export declare class SessionMemory {
    private entries;
    private config;
    private sessionId;
    private currentPhase;
    private currentRisk;
    private mutationCount;
    private phaseHistory;
    private decisionCounts;
    private createdAt;
    private lastActivityAt;
    constructor(sessionId?: string, config?: Partial<SessionMemoryConfig>);
    set(key: string, value: unknown, type?: MemoryEntryType, ttlMs?: number): void;
    get<T = unknown>(key: string): T | undefined;
    has(key: string): boolean;
    delete(key: string): boolean;
    getEntry(key: string): MemoryEntry | undefined;
    getByType(type: MemoryEntryType): MemoryEntry[];
    getAllEntries(): MemoryEntry[];
    clear(): void;
    size(): number;
    advancePhase(newPhase: CVFPhase): void;
    getPhase(): CVFPhase;
    getPhaseHistory(): {
        phase: CVFPhase;
        timestamp: string;
    }[];
    setRisk(risk: CVFRiskLevel): void;
    getRisk(): CVFRiskLevel;
    incrementMutations(count?: number): number;
    getMutationCount(): number;
    resetMutations(): void;
    recordDecision(result: GuardPipelineResult): void;
    getDecisionCounts(): {
        allowed: number;
        blocked: number;
        escalated: number;
    };
    setPreference(key: string, value: unknown): void;
    getPreference<T = unknown>(key: string): T | undefined;
    setContext(key: string, value: unknown): void;
    getContext<T = unknown>(key: string): T | undefined;
    addConstraint(key: string, description: string): void;
    getConstraints(): {
        key: string;
        description: string;
    }[];
    snapshot(): SessionSnapshot;
    getSessionId(): string;
    private evictExpired;
    private evictOldest;
}
//# sourceMappingURL=session-memory.d.ts.map