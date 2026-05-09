/**
 * JSON File Persistence Adapter — M1.2
 * Persists audit log and session state to JSON files.
 * Works without any external database dependency.
 * @module persistence/json-file.adapter
 */
import type { PersistenceAdapter, SessionState } from './persistence.interface.js';
import type { GuardAuditEntry } from '../guards/types.js';
export interface JsonFileAdapterOptions {
    /** Directory where JSON files are stored */
    dataDir: string;
    /** Pretty-print JSON (default: true) */
    prettyPrint?: boolean;
}
export declare class JsonFileAdapter implements PersistenceAdapter {
    private dataDir;
    private prettyPrint;
    private auditFilePath;
    private sessionFilePath;
    private auditCache;
    private sessionCache;
    constructor(options: JsonFileAdapterOptions);
    init(): Promise<void>;
    saveAuditEntry(entry: GuardAuditEntry): Promise<void>;
    getAuditEntries(options?: {
        requestId?: string;
        limit?: number;
        offset?: number;
    }): Promise<GuardAuditEntry[]>;
    getAuditEntryCount(): Promise<number>;
    clearAuditEntries(): Promise<void>;
    saveSessionState(state: SessionState): Promise<void>;
    getSessionState(sessionId: string): Promise<SessionState | null>;
    getOrCreateDefaultSession(): Promise<SessionState>;
    close(): Promise<void>;
    private loadJson;
    private saveJson;
}
//# sourceMappingURL=json-file.adapter.d.ts.map