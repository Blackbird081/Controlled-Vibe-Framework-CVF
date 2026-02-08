/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatHistory } from './chat-history';

describe('useChatHistory', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('creates a session and sets active session', () => {
        const { result } = renderHook(() => useChatHistory());
        act(() => {
            result.current.createSession('gemini');
        });
        expect(result.current.sessions.length).toBe(1);
        expect(result.current.activeSessionId).toBe(result.current.sessions[0].id);
    });

    it('updates session title and metadata', () => {
        const { result } = renderHook(() => useChatHistory());
        let sessionId = '';
        act(() => {
            sessionId = result.current.createSession('openai');
        });

        act(() => {
            result.current.updateSession(sessionId, [
                { id: 'm1', role: 'user', content: 'Hello world', timestamp: new Date() },
            ]);
        });

        const session = result.current.sessions.find(s => s.id === sessionId)!;
        expect(session.title).toBe('Hello world');
        expect(session.metadata?.messageCount).toBe(1);
    });

    it('deletes session and clears active session when needed', () => {
        const { result } = renderHook(() => useChatHistory());
        let sessionId = '';
        act(() => {
            sessionId = result.current.createSession('anthropic');
        });
        act(() => {
            result.current.deleteSession(sessionId);
        });
        expect(result.current.sessions.length).toBe(0);
        expect(result.current.activeSessionId).toBeNull();
    });

    it('exports and imports history', () => {
        const { result } = renderHook(() => useChatHistory());
        act(() => {
            result.current.createSession('gemini');
        });
        const exported = result.current.exportHistory();
        expect(exported).toContain('session_');

        act(() => {
            result.current.clearHistory();
        });
        expect(result.current.sessions.length).toBe(0);

        act(() => {
            const success = result.current.importHistory(exported);
            expect(success).toBe(true);
        });
        expect(result.current.sessions.length).toBe(1);
    });
});
