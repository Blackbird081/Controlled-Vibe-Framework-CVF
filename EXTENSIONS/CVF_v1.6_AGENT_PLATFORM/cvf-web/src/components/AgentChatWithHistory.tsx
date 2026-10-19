'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AgentChat, ChatMessage } from './AgentChat';
import { useChatHistory, ChatHistorySidebar, ChatSession } from '@/lib/chat-history';
import { useSettings } from './Settings';

interface AgentChatWithHistoryProps {
    initialPrompt?: string;
    onClose?: () => void;
    onMinimize?: () => void;
    onComplete?: (messages: ChatMessage[]) => void;
}

export function AgentChatWithHistory({ initialPrompt, onClose, onMinimize, onComplete }: AgentChatWithHistoryProps) {
    const { settings } = useSettings();
    const {
        sessions,
        activeSession,
        activeSessionId,
        createSession,
        updateSession,
        deleteSession,
        clearHistory,
        setActiveSession,
        isLoaded
    } = useChatHistory(initialPrompt ? settings.preferences.defaultProvider : undefined);

    const [showSidebar, setShowSidebar] = useState(true);
    const [isMaximized, setIsMaximized] = useState(false);
    const emptySessionPending = useRef(false);
    const [initialPromptSessionId] = useState(initialPrompt ? activeSessionId : null);

    // Sync messages to history
    const handleMessagesUpdate = useCallback((messages: ChatMessage[]) => {
        if (activeSessionId) {
            updateSession(activeSessionId, messages);
        }
    }, [activeSessionId, updateSession]);

    // Start new chat
    const handleNewChat = useCallback(() => {
        const provider = settings.preferences.defaultProvider;
        return createSession(provider);
    }, [createSession, settings.preferences.defaultProvider]);

    // Select existing session
    const handleSelectSession = useCallback((session: ChatSession) => {
        setActiveSession(session.id);
    }, [setActiveSession]);

    // This wrapper is the only history writer for the open panel: the sidebar reads these
    // sessions and calls these actions. Deleting the open session or clearing history falls
    // back to a survivor or one fresh empty session so the chat never keeps removed content.
    const handleDeleteSession = useCallback((sessionId: string) => {
        const survivors = sessions.filter(s => s.id !== sessionId);
        deleteSession(sessionId);
        if (sessionId !== activeSessionId) return;
        if (survivors.length > 0) setActiveSession(survivors[0].id);
        else createSession(settings.preferences.defaultProvider);
    }, [sessions, activeSessionId, deleteSession, setActiveSession, createSession, settings.preferences.defaultProvider]);

    const handleClearHistory = useCallback(() => {
        clearHistory();
        createSession(settings.preferences.defaultProvider);
    }, [clearHistory, createSession, settings.preferences.defaultProvider]);

    // Incoming prompts already own a session. Recover ordinary empty history
    // without duplicating session creation when React replays this effect.
    useEffect(() => {
        if (!isLoaded) return;
        if (sessions.length === 0) {
            if (!emptySessionPending.current) {
                emptySessionPending.current = true;
                handleNewChat();
            }
        } else {
            emptySessionPending.current = false;
            if (!sessions.some(s => s.id === activeSessionId)) setActiveSession(sessions[0].id);
        }
    }, [isLoaded, sessions, activeSessionId, handleNewChat, setActiveSession]);

    // Listen for maximize event from AgentChat header
    useEffect(() => {
        const handleMaximize = () => setIsMaximized(!isMaximized);
        window.addEventListener('cvf-chat-maximize', handleMaximize);
        return () => window.removeEventListener('cvf-chat-maximize', handleMaximize);
    }, [isMaximized]);

    return (
        <div className={`flex bg-white dark:bg-[#0d0f1a] rounded-xl overflow-hidden transition-all duration-300
                        ${isMaximized
                ? 'fixed inset-4 z-50 shadow-2xl'
                : 'h-full'
            }`}>

            {/* Sidebar Toggle for Mobile */}
            <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="md:hidden absolute top-4 left-4 z-10 p-2 bg-gray-100 dark:bg-white/[0.07]
                          rounded-lg hover:bg-gray-200 dark:hover:bg-white/[0.07] transition-colors"
            >
                {showSidebar ? '◀️' : '▶️'}
            </button>

            {/* History Sidebar */}
            <div className={`${showSidebar ? 'block' : 'hidden'} md:block 
                            transition-all duration-300 border-r border-gray-200 dark:border-white/[0.07]`}>
                <ChatHistorySidebar
                    onSelectSession={handleSelectSession}
                    onNewChat={handleNewChat}
                    currentSessionId={activeSessionId}
                    sessions={sessions}
                    onDeleteSession={handleDeleteSession}
                    onClearHistory={handleClearHistory}
                />
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Session Info Header */}
                {activeSession && (
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-white/[0.07] 
                                   bg-gray-50 dark:bg-[#1a1d2e]/80 flex items-center gap-2 text-sm">
                        <span>
                            {activeSession.provider === 'gemini' && '✨'}
                            {activeSession.provider === 'openai' && '🤖'}
                            {activeSession.provider === 'anthropic' && '🧠'}
                            {activeSession.provider === 'alibaba' && '🧭'}
                            {activeSession.provider === 'openrouter' && '🧩'}
                        </span>
                        <span className="font-medium truncate">{activeSession.title}</span>
                        <span className="text-gray-500 ml-auto text-xs">
                            {activeSession.metadata?.messageCount || 0} messages
                        </span>
                    </div>
                )}

                {/* Chat Component */}
                <div className="flex-1 min-h-0">
                    {isLoaded && activeSessionId && (!initialPrompt || initialPromptSessionId) && <AgentChat
                        key={activeSessionId}
                        initialPrompt={activeSessionId === initialPromptSessionId && activeSession?.messages.length === 0 ? initialPrompt : undefined}
                        onClose={onClose}
                        onMinimize={onMinimize}
                        onComplete={onComplete}
                        onMessagesChange={handleMessagesUpdate}
                        existingMessages={activeSession?.messages ?? []}
                    />}
                </div>
            </div>

            {/* Maximized backdrop */}
            {isMaximized && (
                <div
                    className="fixed inset-0 bg-black/30 -z-10"
                    onClick={() => setIsMaximized(false)}
                />
            )}
        </div>
    );
}

// Export history export/import functions
export { useChatHistory, ChatHistorySidebar } from '@/lib/chat-history';
export type { ChatSession } from '@/lib/chat-history';
