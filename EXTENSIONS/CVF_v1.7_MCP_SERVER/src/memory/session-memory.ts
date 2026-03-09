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

export type MemoryEntryType =
  | 'phase_transition'
  | 'guard_decision'
  | 'mutation_count'
  | 'user_preference'
  | 'context'
  | 'constraint'
  | 'custom';

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
  phaseHistory: { phase: CVFPhase; timestamp: string }[];
}

const DEFAULT_CONFIG: SessionMemoryConfig = {
  maxEntries: 1000,
  defaultTtlMs: 3600000, // 1 hour
  enableExpiry: true,
};

export class SessionMemory {
  private entries: Map<string, MemoryEntry> = new Map();
  private config: SessionMemoryConfig;
  private sessionId: string;
  private currentPhase: CVFPhase = 'DISCOVERY';
  private currentRisk: CVFRiskLevel = 'R0';
  private mutationCount = 0;
  private phaseHistory: { phase: CVFPhase; timestamp: string }[] = [];
  private decisionCounts = { allowed: 0, blocked: 0, escalated: 0 };
  private createdAt: string;
  private lastActivityAt: string;

  constructor(sessionId?: string, config?: Partial<SessionMemoryConfig>) {
    this.sessionId = sessionId || `session-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.createdAt = new Date().toISOString();
    this.lastActivityAt = this.createdAt;
    this.phaseHistory.push({ phase: 'DISCOVERY', timestamp: this.createdAt });
  }

  // ─── Core Memory Operations ──────────────────────────────────────

  set(key: string, value: unknown, type: MemoryEntryType = 'custom', ttlMs?: number): void {
    this.evictExpired();

    if (this.entries.size >= this.config.maxEntries && !this.entries.has(key)) {
      this.evictOldest();
    }

    const now = new Date();
    const effectiveTtl = ttlMs ?? this.config.defaultTtlMs;

    const entry: MemoryEntry = {
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

  get<T = unknown>(key: string): T | undefined {
    this.evictExpired();
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    return entry.value as T;
  }

  has(key: string): boolean {
    this.evictExpired();
    return this.entries.has(key);
  }

  delete(key: string): boolean {
    return this.entries.delete(key);
  }

  getEntry(key: string): MemoryEntry | undefined {
    this.evictExpired();
    return this.entries.get(key);
  }

  getByType(type: MemoryEntryType): MemoryEntry[] {
    this.evictExpired();
    return Array.from(this.entries.values()).filter((e) => e.type === type);
  }

  getAllEntries(): MemoryEntry[] {
    this.evictExpired();
    return Array.from(this.entries.values());
  }

  clear(): void {
    this.entries.clear();
  }

  size(): number {
    this.evictExpired();
    return this.entries.size;
  }

  // ─── Phase Tracking ──────────────────────────────────────────────

  advancePhase(newPhase: CVFPhase): void {
    const now = new Date().toISOString();
    this.set(`phase:${this.currentPhase}:end`, now, 'phase_transition');
    this.currentPhase = newPhase;
    this.phaseHistory.push({ phase: newPhase, timestamp: now });
    this.set(`phase:${newPhase}:start`, now, 'phase_transition');
    this.lastActivityAt = now;
  }

  getPhase(): CVFPhase {
    return this.currentPhase;
  }

  getPhaseHistory(): { phase: CVFPhase; timestamp: string }[] {
    return [...this.phaseHistory];
  }

  // ─── Risk Tracking ──────────────────────────────────────────────

  setRisk(risk: CVFRiskLevel): void {
    this.currentRisk = risk;
    this.lastActivityAt = new Date().toISOString();
  }

  getRisk(): CVFRiskLevel {
    return this.currentRisk;
  }

  // ─── Mutation Tracking ──────────────────────────────────────────

  incrementMutations(count: number = 1): number {
    this.mutationCount += count;
    this.set('mutation_count', this.mutationCount, 'mutation_count');
    return this.mutationCount;
  }

  getMutationCount(): number {
    return this.mutationCount;
  }

  resetMutations(): void {
    this.mutationCount = 0;
    this.set('mutation_count', 0, 'mutation_count');
  }

  // ─── Guard Decision Tracking ────────────────────────────────────

  recordDecision(result: GuardPipelineResult): void {
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

    this.set(
      `decision:${result.requestId}`,
      {
        decision: result.finalDecision,
        blockedBy: result.blockedBy,
        escalatedBy: result.escalatedBy,
        durationMs: result.durationMs,
      },
      'guard_decision',
    );
    this.lastActivityAt = now;
  }

  getDecisionCounts(): { allowed: number; blocked: number; escalated: number } {
    return { ...this.decisionCounts };
  }

  // ─── User Preferences ──────────────────────────────────────────

  setPreference(key: string, value: unknown): void {
    this.set(`pref:${key}`, value, 'user_preference');
  }

  getPreference<T = unknown>(key: string): T | undefined {
    return this.get<T>(`pref:${key}`);
  }

  // ─── Context ────────────────────────────────────────────────────

  setContext(key: string, value: unknown): void {
    this.set(`ctx:${key}`, value, 'context');
  }

  getContext<T = unknown>(key: string): T | undefined {
    return this.get<T>(`ctx:${key}`);
  }

  // ─── Constraints ────────────────────────────────────────────────

  addConstraint(key: string, description: string): void {
    this.set(`constraint:${key}`, description, 'constraint');
  }

  getConstraints(): { key: string; description: string }[] {
    return this.getByType('constraint').map((e) => ({
      key: e.key.replace('constraint:', ''),
      description: e.value as string,
    }));
  }

  // ─── Snapshot ───────────────────────────────────────────────────

  snapshot(): SessionSnapshot {
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

  getSessionId(): string {
    return this.sessionId;
  }

  // ─── Internal ───────────────────────────────────────────────────

  private evictExpired(): void {
    if (!this.config.enableExpiry) return;
    const now = Date.now();
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt && new Date(entry.expiresAt).getTime() <= now) {
        this.entries.delete(key);
      }
    }
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
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
