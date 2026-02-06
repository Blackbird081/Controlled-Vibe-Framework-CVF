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
        setActiveSession,
        isLoaded
    } = useChatHistory();

    const [showSidebar, setShowSidebar] = useState(true);
    const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
    const [isMaximized, setIsMaximized] = useState(false);
    const hasHandledInitialMount = useRef(false);

    // Sync messages to history
    const handleMessagesUpdate = useCallback((messages: ChatMessage[]) => {
        if (activeSessionId) {
            updateSession(activeSessionId, messages);
        }
        setCurrentMessages(messages);
    }, [activeSessionId, updateSession]);

    // Start new chat
    const handleNewChat = useCallback(() => {
        const provider = settings.preferences.defaultProvider;
        const newId = createSession(provider);
        setCurrentMessages([]);
    }, [createSession, settings.preferences.defaultProvider]);

    // Select existing session
    const handleSelectSession = useCallback((session: ChatSession) => {
        setActiveSession(session.id);
        setCurrentMessages(session.messages);
    }, [setActiveSession]);

    // Create session on first load if none exists
    useEffect(() => {
        if (isLoaded && sessions.length === 0) {
            handleNewChat();
        } else if (isLoaded && !activeSessionId && sessions.length > 0) {
            // Auto-select most recent session
            setActiveSession(sessions[0].id);
            setCurrentMessages(sessions[0].messages);
        }
    }, [isLoaded, sessions, activeSessionId, handleNewChat, setActiveSession]);

    // Sync currentMessages when activeSession changes
    useEffect(() => {
        if (activeSession) {
            setCurrentMessages(activeSession.messages);
        }
    }, [activeSession]);

    // Handle initial prompt - only on first mount with initialPrompt
    useEffect(() => {
        if (initialPrompt && isLoaded && !hasHandledInitialMount.current) {
            console.log('[AgentChatWithHistory] Creating NEW session for initialPrompt');
            hasHandledInitialMount.current = true;
            // Create new session for initial prompt
            handleNewChat();
            // Force clear messages to ensure clean slate
            setCurrentMessages([]);
        }
    }, [initialPrompt, isLoaded, handleNewChat]);

    // Listen for maximize event from AgentChat header
    useEffect(() => {
        const handleMaximize = () => setIsMaximized(!isMaximized);
        window.addEventListener('cvf-chat-maximize', handleMaximize);
        return () => window.removeEventListener('cvf-chat-maximize', handleMaximize);
    }, [isMaximized]);

    return (
        <div className={`flex bg-white dark:bg-gray-900 rounded-xl overflow-hidden transition-all duration-300
                        ${isMaximized
                ? 'fixed inset-4 z-50 shadow-2xl'
                : 'h-full'
            }`}>

            {/* Sidebar Toggle for Mobile */}
            <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="md:hidden absolute top-4 left-4 z-10 p-2 bg-gray-100 dark:bg-gray-800
                          rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
                {showSidebar ? '◀️' : '▶️'}
            </button>

            {/* History Sidebar */}
            <div className={`${showSidebar ? 'block' : 'hidden'} md:block 
                            transition-all duration-300 border-r border-gray-200 dark:border-gray-700`}>
                <ChatHistorySidebar
                    onSelectSession={handleSelectSession}
                    onNewChat={handleNewChat}
                    currentSessionId={activeSessionId}
                />
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Session Info Header */}
                {activeSession && (
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 
                                   bg-gray-50 dark:bg-gray-800/50 flex items-center gap-2 text-sm">
                        <span>
                            {activeSession.provider === 'gemini' && '✨'}
                            {activeSession.provider === 'openai' && '🤖'}
                            {activeSession.provider === 'anthropic' && '🧠'}
                        </span>
                        <span className="font-medium truncate">{activeSession.title}</span>
                        <span className="text-gray-500 ml-auto text-xs">
                            {activeSession.metadata?.messageCount || 0} messages
                        </span>
                    </div>
                )}

                {/* Chat Component */}
                <div className="flex-1 min-h-0">
                    <AgentChat
                        key={activeSessionId || 'new'}
                        initialPrompt={initialPrompt}
                        onClose={onClose}
                        onMinimize={onMinimize}
                        onComplete={onComplete}
                        onMessagesChange={handleMessagesUpdate}
                        existingMessages={currentMessages}
                    />
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
