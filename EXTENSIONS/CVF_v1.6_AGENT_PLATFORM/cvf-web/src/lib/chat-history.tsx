'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChatMessage } from '@/components/AgentChat';

// Types
export interface ChatSession {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: Date;
    updatedAt: Date;
    provider: 'gemini' | 'openai' | 'anthropic';
    metadata?: {
        totalTokens?: number;
        messageCount: number;
    };
}

export interface ChatHistoryState {
    sessions: ChatSession[];
    activeSessionId: string | null;
}

const STORAGE_KEY = 'cvf_chat_history';
const MAX_SESSIONS = 50;

// Load from localStorage
function loadHistory(): ChatHistoryState {
    if (typeof window === 'undefined') {
        return { sessions: [], activeSessionId: null };
    }

    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const data = JSON.parse(saved);
            data.sessions = data.sessions.map((s: ChatSession) => ({
                ...s,
                createdAt: new Date(s.createdAt),
                updatedAt: new Date(s.updatedAt),
                messages: s.messages.map(m => ({
                    ...m,
                    timestamp: new Date(m.timestamp),
                })),
            }));
            return data;
        }
    } catch (error) {
        console.error('Failed to load chat history:', error);
    }

    return { sessions: [], activeSessionId: null };
}

// Save to localStorage
function saveHistory(state: ChatHistoryState): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        console.error('Failed to save chat history:', error);
    }
}

// Generate title from first user message
function generateTitle(messages: ChatMessage[]): string {
    const firstUserMessage = messages.find(m => m.role === 'user');
    if (firstUserMessage) {
        const content = firstUserMessage.content;
        return content.length > 50 ? content.substring(0, 47) + '...' : content;
    }
    return `Chat ${new Date().toLocaleDateString()}`;
}

// Hook for managing chat history
export function useChatHistory() {
    const [state, setState] = useState<ChatHistoryState>({ sessions: [], activeSessionId: null });
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const loaded = loadHistory();
        setState(loaded);
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (isLoaded) {
            saveHistory(state);
        }
    }, [state, isLoaded]);

    const createSession = useCallback((provider: 'gemini' | 'openai' | 'anthropic'): string => {
        const newSession: ChatSession = {
            id: `session_${Date.now()}`,
            title: 'New Chat',
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            provider,
            metadata: { messageCount: 0 },
        };

        setState(prev => ({
            sessions: [newSession, ...prev.sessions].slice(0, MAX_SESSIONS),
            activeSessionId: newSession.id,
        }));

        return newSession.id;
    }, []);

    const updateSession = useCallback((sessionId: string, messages: ChatMessage[]) => {
        setState(prev => ({
            ...prev,
            sessions: prev.sessions.map(s =>
                s.id === sessionId
                    ? {
                        ...s,
                        messages,
                        title: s.messages.length === 0 ? generateTitle(messages) : s.title,
                        updatedAt: new Date(),
                        metadata: { ...s.metadata, messageCount: messages.length },
                    }
                    : s
            ),
        }));
    }, []);

    const deleteSession = useCallback((sessionId: string) => {
        setState(prev => ({
            sessions: prev.sessions.filter(s => s.id !== sessionId),
            activeSessionId: prev.activeSessionId === sessionId ? null : prev.activeSessionId,
        }));
    }, []);

    const setActiveSession = useCallback((sessionId: string | null) => {
        setState(prev => ({ ...prev, activeSessionId: sessionId }));
    }, []);

    const activeSession = state.sessions.find(s => s.id === state.activeSessionId) || null;

    const clearHistory = useCallback(() => {
        setState({ sessions: [], activeSessionId: null });
    }, []);

    const exportHistory = useCallback((): string => {
        return JSON.stringify(state.sessions, null, 2);
    }, [state.sessions]);

    const importHistory = useCallback((json: string) => {
        try {
            const sessions = JSON.parse(json) as ChatSession[];
            setState(prev => ({
                ...prev,
                sessions: [...sessions, ...prev.sessions].slice(0, MAX_SESSIONS),
            }));
            return true;
        } catch {
            return false;
        }
    }, []);

    return {
        sessions: state.sessions,
        activeSession,
        activeSessionId: state.activeSessionId,
        isLoaded,
        createSession,
        updateSession,
        deleteSession,
        setActiveSession,
        clearHistory,
        exportHistory,
        importHistory,
    };
}

// Chat History Sidebar Component
export function ChatHistorySidebar({
    onSelectSession,
    onNewChat,
    currentSessionId
}: {
    onSelectSession: (session: ChatSession) => void;
    onNewChat: () => void;
    currentSessionId?: string | null;
}) {
    const { sessions, deleteSession, clearHistory } = useChatHistory();
    const [showConfirmClear, setShowConfirmClear] = useState(false);

    const formatDate = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={onNewChat}
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                    <span>➕</span> New Chat
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {sessions.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                        No chat history yet
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {sessions.map(session => (
                            <div
                                key={session.id}
                                className={`p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors group ${currentSessionId === session.id ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500' : ''}`}
                                onClick={() => onSelectSession(session)}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm">
                                                {session.provider === 'gemini' && '✨'}
                                                {session.provider === 'openai' && '🤖'}
                                                {session.provider === 'anthropic' && '🧠'}
                                            </span>
                                            <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                                                {session.title}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {formatDate(session.updatedAt)} · {session.metadata?.messageCount || 0} msgs
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all"
                                        title="Delete"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {sessions.length > 0 && (
                <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                    {showConfirmClear ? (
                        <div className="flex gap-2">
                            <button
                                onClick={() => { clearHistory(); setShowConfirmClear(false); }}
                                className="flex-1 py-1.5 bg-red-600 text-white text-sm rounded"
                            >
                                Confirm
                            </button>
                            <button
                                onClick={() => setShowConfirmClear(false)}
                                className="flex-1 py-1.5 bg-gray-200 dark:bg-gray-700 text-sm rounded"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowConfirmClear(true)}
                            className="w-full py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        >
                            🗑️ Clear All History
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
