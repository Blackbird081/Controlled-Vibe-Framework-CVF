/**
 * CVF Session Store
 * ==================
 * Server-side session persistence for conversation history.
 * Stores conversations in a local JSON file so users don't lose
 * chat history when they close the browser.
 *
 * Sprint 7 — Task 7.2
 *
 * @module lib/session-store
 */

import { promises as fs } from 'fs';
import path from 'path';

// ─── Types ───────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  provider?: string;
  model?: string;
}

export interface ChatSession {
  sessionId: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  metadata?: {
    provider?: string;
    model?: string;
    phase?: string;
    template?: string;
  };
}

// ─── Session Store ───────────────────────────────────────────────────

const STORE_DIR = path.join(process.cwd(), 'data', 'sessions');

async function ensureDir(): Promise<void> {
  try {
    await fs.mkdir(STORE_DIR, { recursive: true });
  } catch {
    // Directory already exists
  }
}

function sessionPath(sessionId: string): string {
  // Sanitize sessionId to prevent path traversal
  const safe = sessionId.replace(/[^a-zA-Z0-9_-]/g, '');
  return path.join(STORE_DIR, `${safe}.json`);
}

/**
 * Save a chat session to disk.
 */
export async function saveSession(session: ChatSession): Promise<void> {
  await ensureDir();
  const filePath = sessionPath(session.sessionId);
  session.updatedAt = new Date().toISOString();
  await fs.writeFile(filePath, JSON.stringify(session, null, 2), 'utf-8');
}

/**
 * Load a chat session by ID.
 */
export async function loadSession(sessionId: string): Promise<ChatSession | null> {
  try {
    const filePath = sessionPath(sessionId);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as ChatSession;
  } catch {
    return null;
  }
}

/**
 * List all sessions for a user (sorted by updatedAt desc).
 */
export async function listSessions(userId: string, limit = 20): Promise<{
  sessionId: string;
  title: string;
  updatedAt: string;
  messageCount: number;
}[]> {
  await ensureDir();
  try {
    const files = await fs.readdir(STORE_DIR);
    const sessions: { sessionId: string; title: string; updatedAt: string; messageCount: number }[] = [];

    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      try {
        const data = await fs.readFile(path.join(STORE_DIR, file), 'utf-8');
        const session = JSON.parse(data) as ChatSession;
        if (session.userId === userId) {
          sessions.push({
            sessionId: session.sessionId,
            title: session.title,
            updatedAt: session.updatedAt,
            messageCount: session.messages.length,
          });
        }
      } catch {
        // Skip corrupted files
      }
    }

    return sessions
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Delete a session by ID.
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
  try {
    const filePath = sessionPath(sessionId);
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Add a message to an existing session.
 */
export async function addMessage(sessionId: string, message: ChatMessage): Promise<ChatSession | null> {
  const session = await loadSession(sessionId);
  if (!session) return null;

  session.messages.push(message);
  session.updatedAt = new Date().toISOString();

  // Auto-update title from first user message if title is generic
  if (session.title === 'New Chat' && message.role === 'user') {
    session.title = message.content.slice(0, 60) + (message.content.length > 60 ? '...' : '');
  }

  await saveSession(session);
  return session;
}

/**
 * Create a new session.
 */
export function createSession(userId: string, title = 'New Chat', metadata?: ChatSession['metadata']): ChatSession {
  return {
    sessionId: `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId,
    title,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata,
  };
}
