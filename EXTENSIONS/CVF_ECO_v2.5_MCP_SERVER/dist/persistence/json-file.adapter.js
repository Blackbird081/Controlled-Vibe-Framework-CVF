/**
 * JSON File Persistence Adapter — M1.2
 * Persists audit log and session state to JSON files.
 * Works without any external database dependency.
 * @module persistence/json-file.adapter
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { existsSync } from 'node:fs';
export class JsonFileAdapter {
    dataDir;
    prettyPrint;
    auditFilePath;
    sessionFilePath;
    auditCache = null;
    sessionCache = null;
    constructor(options) {
        this.dataDir = options.dataDir;
        this.prettyPrint = options.prettyPrint ?? true;
        this.auditFilePath = join(this.dataDir, 'audit-log.json');
        this.sessionFilePath = join(this.dataDir, 'sessions.json');
    }
    async init() {
        if (!existsSync(this.dataDir)) {
            await mkdir(this.dataDir, { recursive: true });
        }
        this.auditCache = await this.loadJson(this.auditFilePath, {
            entries: [],
            lastUpdated: new Date().toISOString(),
        });
        this.sessionCache = await this.loadJson(this.sessionFilePath, {
            sessions: {},
            lastUpdated: new Date().toISOString(),
        });
    }
    async saveAuditEntry(entry) {
        if (!this.auditCache)
            await this.init();
        this.auditCache.entries.push(entry);
        this.auditCache.lastUpdated = new Date().toISOString();
        await this.saveJson(this.auditFilePath, this.auditCache);
    }
    async getAuditEntries(options) {
        if (!this.auditCache)
            await this.init();
        let entries = [...this.auditCache.entries];
        if (options?.requestId) {
            entries = entries.filter((e) => e.requestId === options.requestId);
        }
        const offset = options?.offset ?? 0;
        const limit = options?.limit ?? entries.length;
        return entries.slice(offset, offset + limit);
    }
    async getAuditEntryCount() {
        if (!this.auditCache)
            await this.init();
        return this.auditCache.entries.length;
    }
    async clearAuditEntries() {
        this.auditCache = { entries: [], lastUpdated: new Date().toISOString() };
        await this.saveJson(this.auditFilePath, this.auditCache);
    }
    async saveSessionState(state) {
        if (!this.sessionCache)
            await this.init();
        state.updatedAt = new Date().toISOString();
        this.sessionCache.sessions[state.sessionId] = state;
        this.sessionCache.lastUpdated = new Date().toISOString();
        await this.saveJson(this.sessionFilePath, this.sessionCache);
    }
    async getSessionState(sessionId) {
        if (!this.sessionCache)
            await this.init();
        return this.sessionCache.sessions[sessionId] ?? null;
    }
    async getOrCreateDefaultSession() {
        const defaultId = 'cvf-default-session';
        const existing = await this.getSessionState(defaultId);
        if (existing)
            return existing;
        const newSession = {
            sessionId: defaultId,
            currentPhase: 'DISCOVERY',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        await this.saveSessionState(newSession);
        return newSession;
    }
    async close() {
        if (this.auditCache) {
            await this.saveJson(this.auditFilePath, this.auditCache);
        }
        if (this.sessionCache) {
            await this.saveJson(this.sessionFilePath, this.sessionCache);
        }
        this.auditCache = null;
        this.sessionCache = null;
    }
    async loadJson(filePath, defaultValue) {
        try {
            if (existsSync(filePath)) {
                const data = await readFile(filePath, 'utf-8');
                return JSON.parse(data);
            }
        }
        catch {
            // File corrupt or unreadable, use default
        }
        return defaultValue;
    }
    async saveJson(filePath, data) {
        const dir = dirname(filePath);
        if (!existsSync(dir)) {
            await mkdir(dir, { recursive: true });
        }
        const json = this.prettyPrint ? JSON.stringify(data, null, 2) : JSON.stringify(data);
        await writeFile(filePath, json, 'utf-8');
    }
}
//# sourceMappingURL=json-file.adapter.js.map