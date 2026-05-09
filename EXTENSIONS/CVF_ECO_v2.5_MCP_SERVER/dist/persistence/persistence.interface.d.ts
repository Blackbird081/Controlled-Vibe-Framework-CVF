/**
 * Persistence Adapter Interface — M1.2
 * Defines the contract for audit log and session state persistence.
 * @module persistence/persistence.interface
 */
import type { GuardAuditEntry } from '../guards/types.js';
export interface SessionState {
    sessionId: string;
    currentPhase: string;
    createdAt: string;
    updatedAt: string;
    metadata?: Record<string, unknown>;
}
export interface PersistenceAdapter {
    /** Initialize the persistence store (create tables/files if needed) */
    init(): Promise<void>;
    /** Save an audit entry */
    saveAuditEntry(entry: GuardAuditEntry): Promise<void>;
    /** Get all audit entries, optionally filtered */
    getAuditEntries(options?: {
        requestId?: string;
        limit?: number;
        offset?: number;
    }): Promise<GuardAuditEntry[]>;
    /** Get total audit entry count */
    getAuditEntryCount(): Promise<number>;
    /** Clear all audit entries */
    clearAuditEntries(): Promise<void>;
    /** Save session state */
    saveSessionState(state: SessionState): Promise<void>;
    /** Get the latest session state */
    getSessionState(sessionId: string): Promise<SessionState | null>;
    /** Get or create a default session */
    getOrCreateDefaultSession(): Promise<SessionState>;
    /** Close the persistence store */
    close(): Promise<void>;
}
//# sourceMappingURL=persistence.interface.d.ts.map