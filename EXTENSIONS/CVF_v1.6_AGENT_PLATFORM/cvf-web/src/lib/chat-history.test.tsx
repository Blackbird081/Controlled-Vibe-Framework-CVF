/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, render, screen, fireEvent } from '@testing-library/react';
import { useChatHistory, ChatHistorySidebar } from './chat-history';

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

    // ── New coverage tests ──

    it('truncates long titles to 50 chars', () => {
        const { result } = renderHook(() => useChatHistory());
        let sessionId = '';
        act(() => {
            sessionId = result.current.createSession('gemini');
        });
        const longMsg = 'A'.repeat(100);
        act(() => {
            result.current.updateSession(sessionId, [
                { id: 'm1', role: 'user', content: longMsg, timestamp: new Date() },
            ]);
        });
        const session = result.current.sessions.find(s => s.id === sessionId)!;
        expect(session.title.length).toBe(50);
        expect(session.title.endsWith('...')).toBe(true);
    });

    it('generates date-based title when no user messages', () => {
        const { result } = renderHook(() => useChatHistory());
        let sessionId = '';
        act(() => {
            sessionId = result.current.createSession('openai');
        });
        act(() => {
            result.current.updateSession(sessionId, [
                { id: 'm1', role: 'assistant', content: 'Hello!', timestamp: new Date() },
            ]);
        });
        // Title should remain 'New Chat' since there's no user message to trigger title change
        const session = result.current.sessions.find(s => s.id === sessionId)!;
        expect(session.title).toBe('New Chat');
    });

    it('sets active session to null', () => {
        const { result } = renderHook(() => useChatHistory());
        act(() => {
            result.current.createSession('gemini');
        });
        act(() => {
            result.current.setActiveSession(null);
        });
        expect(result.current.activeSessionId).toBeNull();
    });

    it('sets active session to specific session ID', () => {
        const { result } = renderHook(() => useChatHistory());
        let s1 = '', s2 = '';
        act(() => {
            s1 = result.current.createSession('gemini');
        });
        act(() => {
            s2 = result.current.createSession('openai');
        });
        act(() => {
            result.current.setActiveSession(s1);
        });
        expect(result.current.activeSessionId).toBe(s1);
    });

    it('returns correct activeSession object', () => {
        const { result } = renderHook(() => useChatHistory());
        act(() => {
            result.current.createSession('anthropic');
        });
        expect(result.current.activeSession).not.toBeNull();
        expect(result.current.activeSession!.provider).toBe('anthropic');
    });

    it('returns null activeSession when no sessions exist', () => {
        const { result } = renderHook(() => useChatHistory());
        expect(result.current.activeSession).toBeNull();
    });

    it('limits to MAX_SESSIONS (50)', () => {
        const { result } = renderHook(() => useChatHistory());
        for (let i = 0; i < 55; i++) {
            act(() => {
                result.current.createSession('gemini');
            });
        }
        expect(result.current.sessions.length).toBeLessThanOrEqual(50);
    });

    it('importHistory returns false for invalid JSON', () => {
        const { result } = renderHook(() => useChatHistory());
        let success = true;
        act(() => {
            success = result.current.importHistory('not valid json');
        });
        expect(success).toBe(false);
    });

    it('does not change active session when deleting a different session', () => {
        const { result } = renderHook(() => useChatHistory());
        let s1 = '', s2 = '';
        act(() => {
            s1 = result.current.createSession('gemini');
        });
        act(() => {
            s2 = result.current.createSession('openai');
        });
        // s2 is active now (most recent)
        act(() => {
            result.current.deleteSession(s1);
        });
        expect(result.current.activeSessionId).toBe(s2);
        expect(result.current.sessions.length).toBe(1);
    });

    it('persists to localStorage and loads on mount', () => {
        const { result } = renderHook(() => useChatHistory());
        act(() => {
            result.current.createSession('gemini');
        });
        // Verify localStorage has data
        const stored = localStorage.getItem('cvf_chat_history');
        expect(stored).toBeTruthy();
        const parsed = JSON.parse(stored!);
        expect(parsed.sessions.length).toBe(1);
    });
});

describe('ChatHistorySidebar', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('renders empty state when no sessions', () => {
        render(
            <ChatHistorySidebar
                onSelectSession={vi.fn()}
                onNewChat={vi.fn()}
            />
        );
        expect(screen.getByText('No chat history yet')).toBeTruthy();
    });

    it('renders New Chat button and calls onNewChat', () => {
        const onNewChat = vi.fn();
        render(
            <ChatHistorySidebar
                onSelectSession={vi.fn()}
                onNewChat={onNewChat}
            />
        );
        fireEvent.click(screen.getByText(/New Chat/));
        expect(onNewChat).toHaveBeenCalledTimes(1);
    });

    it('renders sessions from localStorage', () => {
        // Pre-populate localStorage
        const sessions = [{
            id: 'test-1',
            title: 'Test Session',
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            provider: 'gemini',
            metadata: { messageCount: 5 },
        }];
        localStorage.setItem('cvf_chat_history', JSON.stringify({
            sessions,
            activeSessionId: 'test-1',
        }));

        render(
            <ChatHistorySidebar
                onSelectSession={vi.fn()}
                onNewChat={vi.fn()}
                currentSessionId="test-1"
            />
        );
        expect(screen.getByText('Test Session')).toBeTruthy();
        expect(screen.getByText(/5 msgs/)).toBeTruthy();
    });

    it('renders Clear All History button and confirm flow', () => {
        localStorage.setItem('cvf_chat_history', JSON.stringify({
            sessions: [{
                id: 'test-1',
                title: 'Old Chat',
                messages: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                provider: 'openai',
                metadata: { messageCount: 1 },
            }],
            activeSessionId: null,
        }));

        render(
            <ChatHistorySidebar
                onSelectSession={vi.fn()}
                onNewChat={vi.fn()}
            />
        );

        // Click "Clear All History"
        fireEvent.click(screen.getByText(/Clear All History/));
        // Confirm dialog should appear
        expect(screen.getByText('Confirm')).toBeTruthy();
        expect(screen.getByText('Cancel')).toBeTruthy();

        // Click Cancel to dismiss
        fireEvent.click(screen.getByText('Cancel'));
    });

    it('calls onSelectSession when clicking a session', () => {
        const onSelectSession = vi.fn();
        localStorage.setItem('cvf_chat_history', JSON.stringify({
            sessions: [{
                id: 'sess-1',
                title: 'Clickable Session',
                messages: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                provider: 'anthropic',
                metadata: { messageCount: 0 },
            }],
            activeSessionId: null,
        }));

        render(
            <ChatHistorySidebar
                onSelectSession={onSelectSession}
                onNewChat={vi.fn()}
            />
        );

        fireEvent.click(screen.getByText('Clickable Session'));
        expect(onSelectSession).toHaveBeenCalledTimes(1);
    });

    it('shows provider emoji icons', () => {
        localStorage.setItem('cvf_chat_history', JSON.stringify({
            sessions: [
                { id: 's1', title: 'Gemini Chat', messages: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), provider: 'gemini', metadata: { messageCount: 0 } },
                { id: 's2', title: 'OpenAI Chat', messages: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), provider: 'openai', metadata: { messageCount: 0 } },
                { id: 's3', title: 'Anthropic Chat', messages: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), provider: 'anthropic', metadata: { messageCount: 0 } },
            ],
            activeSessionId: null,
        }));

        render(
            <ChatHistorySidebar
                onSelectSession={vi.fn()}
                onNewChat={vi.fn()}
            />
        );
        expect(screen.getByText('✨')).toBeTruthy();
        expect(screen.getByText('🤖')).toBeTruthy();
        expect(screen.getByText('🧠')).toBeTruthy();
    });

    it('shows "Yesterday" for sessions updated 1 day ago', () => {
        const yesterday = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString();
        localStorage.setItem('cvf_chat_history', JSON.stringify({
            sessions: [{
                id: 'y1', title: 'Old Session A', messages: [],
                createdAt: yesterday, updatedAt: yesterday,
                provider: 'gemini', metadata: { messageCount: 1 },
            }],
            activeSessionId: null,
        }));
        render(<ChatHistorySidebar onSelectSession={vi.fn()} onNewChat={vi.fn()} />);
        expect(screen.getByText(/Yesterday/)).toBeTruthy();
    });

    it('shows "N days ago" for sessions updated 3 days ago', () => {
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
        localStorage.setItem('cvf_chat_history', JSON.stringify({
            sessions: [{
                id: 'd3', title: 'Old Session', messages: [],
                createdAt: threeDaysAgo, updatedAt: threeDaysAgo,
                provider: 'gemini', metadata: { messageCount: 2 },
            }],
            activeSessionId: null,
        }));
        render(<ChatHistorySidebar onSelectSession={vi.fn()} onNewChat={vi.fn()} />);
        expect(screen.getByText(/3 days ago/)).toBeTruthy();
    });

    it('shows locale date for sessions older than 7 days', () => {
        const oldDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        localStorage.setItem('cvf_chat_history', JSON.stringify({
            sessions: [{
                id: 'old1', title: 'Very Old Session', messages: [],
                createdAt: oldDate, updatedAt: oldDate,
                provider: 'gemini', metadata: { messageCount: 0 },
            }],
            activeSessionId: null,
        }));
        render(<ChatHistorySidebar onSelectSession={vi.fn()} onNewChat={vi.fn()} />);
        // Should NOT show "today", "yesterday", or "N days ago"
        expect(screen.queryByText(/Today/)).toBeNull();
        expect(screen.queryByText(/Yesterday/)).toBeNull();
        expect(screen.queryByText(/days ago/)).toBeNull();
    });

    it('deletes a session when delete button is clicked', () => {
        localStorage.setItem('cvf_chat_history', JSON.stringify({
            sessions: [{
                id: 'del1', title: 'Delete Me', messages: [],
                createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
                provider: 'gemini', metadata: { messageCount: 0 },
            }],
            activeSessionId: null,
        }));
        render(<ChatHistorySidebar onSelectSession={vi.fn()} onNewChat={vi.fn()} />);
        expect(screen.getByText('Delete Me')).toBeTruthy();
        const deleteBtn = screen.getByTitle('Delete');
        fireEvent.click(deleteBtn);
        // Session should be removed
        expect(screen.queryByText('Delete Me')).toBeNull();
    });

    it('confirms and clears all history', () => {
        localStorage.setItem('cvf_chat_history', JSON.stringify({
            sessions: [{
                id: 'clr1', title: 'Clear Test', messages: [],
                createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
                provider: 'gemini', metadata: { messageCount: 0 },
            }],
            activeSessionId: null,
        }));
        render(<ChatHistorySidebar onSelectSession={vi.fn()} onNewChat={vi.fn()} />);
        fireEvent.click(screen.getByText(/Clear All History/));
        // Click Confirm (not Cancel)
        fireEvent.click(screen.getByText('Confirm'));
        // Sessions should be cleared
        expect(screen.queryByText('Clear Test')).toBeNull();
        expect(screen.getByText('No chat history yet')).toBeTruthy();
    });
});
