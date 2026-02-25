// lib/storage/sessionStorage.ts
/**
 * localStorage-based session persistence adapter.
 */
import type { SerializedSession, SessionSummary } from "./sessionSerializer";
import { toSessionSummary } from "./sessionSerializer";

const STORAGE_KEY_PREFIX = "cvf_session_";
const INDEX_KEY = "cvf_session_index";

/**
 * Get the list of saved session IDs.
 */
function getIndex(): string[] {
    try {
        const raw = localStorage.getItem(INDEX_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function setIndex(ids: string[]) {
    localStorage.setItem(INDEX_KEY, JSON.stringify(ids));
}

/**
 * Save a session to localStorage.
 */
export function saveSession(data: SerializedSession): void {
    const key = STORAGE_KEY_PREFIX + data.sessionInfo.sessionId;
    localStorage.setItem(key, JSON.stringify(data));

    // Update index
    const index = getIndex();
    if (!index.includes(data.sessionInfo.sessionId)) {
        index.push(data.sessionInfo.sessionId);
        setIndex(index);
    }
}

/**
 * Load a session from localStorage.
 */
export function loadSession(sessionId: string): SerializedSession | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_PREFIX + sessionId);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

/**
 * List all saved session summaries.
 */
export function listSessions(): SessionSummary[] {
    const index = getIndex();
    const summaries: SessionSummary[] = [];

    for (const id of index) {
        const data = loadSession(id);
        if (data) {
            summaries.push(toSessionSummary(data));
        }
    }

    return summaries.sort((a, b) => b.startedAt - a.startedAt);
}

/**
 * Delete a session from localStorage.
 */
export function deleteSession(sessionId: string): void {
    localStorage.removeItem(STORAGE_KEY_PREFIX + sessionId);
    const index = getIndex().filter((id) => id !== sessionId);
    setIndex(index);
}

/**
 * Get the most recent session ID (for restore on load).
 */
export function getLastSessionId(): string | null {
    const index = getIndex();
    if (index.length === 0) return null;

    // Find the most recent by startedAt
    let latest: { id: string; startedAt: number } | null = null;
    for (const id of index) {
        const data = loadSession(id);
        if (data && (!latest || data.sessionInfo.startedAt > latest.startedAt)) {
            latest = { id, startedAt: data.sessionInfo.startedAt };
        }
    }

    return latest?.id ?? null;
}
