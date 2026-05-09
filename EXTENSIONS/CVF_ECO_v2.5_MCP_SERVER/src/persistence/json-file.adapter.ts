/**
 * JSON File Persistence Adapter — M1.2
 * Persists audit log and session state to JSON files.
 * Works without any external database dependency.
 * @module persistence/json-file.adapter
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { existsSync } from 'node:fs';
import type { PersistenceAdapter, SessionState } from './persistence.interface.js';
import type { GuardAuditEntry } from '../guards/types.js';

export interface JsonFileAdapterOptions {
  /** Directory where JSON files are stored */
  dataDir: string;
  /** Pretty-print JSON (default: true) */
  prettyPrint?: boolean;
}

interface AuditStore {
  entries: GuardAuditEntry[];
  lastUpdated: string;
}

interface SessionStore {
  sessions: Record<string, SessionState>;
  lastUpdated: string;
}

export class JsonFileAdapter implements PersistenceAdapter {
  private dataDir: string;
  private prettyPrint: boolean;
  private auditFilePath: string;
  private sessionFilePath: string;
  private auditCache: AuditStore | null = null;
  private sessionCache: SessionStore | null = null;

  constructor(options: JsonFileAdapterOptions) {
    this.dataDir = options.dataDir;
    this.prettyPrint = options.prettyPrint ?? true;
    this.auditFilePath = join(this.dataDir, 'audit-log.json');
    this.sessionFilePath = join(this.dataDir, 'sessions.json');
  }

  async init(): Promise<void> {
    if (!existsSync(this.dataDir)) {
      await mkdir(this.dataDir, { recursive: true });
    }

    this.auditCache = await this.loadJson<AuditStore>(this.auditFilePath, {
      entries: [],
      lastUpdated: new Date().toISOString(),
    });

    this.sessionCache = await this.loadJson<SessionStore>(this.sessionFilePath, {
      sessions: {},
      lastUpdated: new Date().toISOString(),
    });
  }

  async saveAuditEntry(entry: GuardAuditEntry): Promise<void> {
    if (!this.auditCache) await this.init();
    this.auditCache!.entries.push(entry);
    this.auditCache!.lastUpdated = new Date().toISOString();
    await this.saveJson(this.auditFilePath, this.auditCache!);
  }

  async getAuditEntries(options?: {
    requestId?: string;
    limit?: number;
    offset?: number;
  }): Promise<GuardAuditEntry[]> {
    if (!this.auditCache) await this.init();
    let entries = [...this.auditCache!.entries];

    if (options?.requestId) {
      entries = entries.filter((e) => e.requestId === options.requestId);
    }

    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? entries.length;
    return entries.slice(offset, offset + limit);
  }

  async getAuditEntryCount(): Promise<number> {
    if (!this.auditCache) await this.init();
    return this.auditCache!.entries.length;
  }

  async clearAuditEntries(): Promise<void> {
    this.auditCache = { entries: [], lastUpdated: new Date().toISOString() };
    await this.saveJson(this.auditFilePath, this.auditCache);
  }

  async saveSessionState(state: SessionState): Promise<void> {
    if (!this.sessionCache) await this.init();
    state.updatedAt = new Date().toISOString();
    this.sessionCache!.sessions[state.sessionId] = state;
    this.sessionCache!.lastUpdated = new Date().toISOString();
    await this.saveJson(this.sessionFilePath, this.sessionCache!);
  }

  async getSessionState(sessionId: string): Promise<SessionState | null> {
    if (!this.sessionCache) await this.init();
    return this.sessionCache!.sessions[sessionId] ?? null;
  }

  async getOrCreateDefaultSession(): Promise<SessionState> {
    const defaultId = 'cvf-default-session';
    const existing = await this.getSessionState(defaultId);
    if (existing) return existing;

    const newSession: SessionState = {
      sessionId: defaultId,
      currentPhase: 'DISCOVERY',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await this.saveSessionState(newSession);
    return newSession;
  }

  async close(): Promise<void> {
    if (this.auditCache) {
      await this.saveJson(this.auditFilePath, this.auditCache);
    }
    if (this.sessionCache) {
      await this.saveJson(this.sessionFilePath, this.sessionCache);
    }
    this.auditCache = null;
    this.sessionCache = null;
  }

  private async loadJson<T>(filePath: string, defaultValue: T): Promise<T> {
    try {
      if (existsSync(filePath)) {
        const data = await readFile(filePath, 'utf-8');
        return JSON.parse(data) as T;
      }
    } catch {
      // File corrupt or unreadable, use default
    }
    return defaultValue;
  }

  private async saveJson(filePath: string, data: unknown): Promise<void> {
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
    const json = this.prettyPrint ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    await writeFile(filePath, json, 'utf-8');
  }
}
