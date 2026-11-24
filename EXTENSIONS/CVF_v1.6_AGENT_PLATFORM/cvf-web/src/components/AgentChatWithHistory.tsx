'use client';

// Text Encoding Exception: the chat history control includes Vietnamese UI copy and navigation symbols.
import { useState, useEffect, useCallback, useRef } from 'react';
import { AgentChat, ChatMessage } from './AgentChat';
import { useChatHistory, ChatHistorySidebar, ChatSession } from '@/lib/chat-history';
import { useSettings } from './Settings';
import { type AgentChatProvider } from '@/lib/agent-model-catalog';
import { useAgentModelSelection } from '@/lib/hooks/useAgentModelSelection';
import { verifyAgentChatAccount } from '@/lib/hooks/useAuth';

interface AgentChatWithHistoryProps {
    initialPrompt?: string;
    initialDraft?: string;
    language?: 'vi' | 'en';
    accountScope?: string;
    canUseConfiguredKeys?: boolean;
    onClose?: () => void;
    onMinimize?: () => void;
    onComplete?: (messages: ChatMessage[]) => void;
}

export function AgentChatWithHistory({ initialPrompt, initialDraft, language = 'en', accountScope, canUseConfiguredKeys, onClose, onMinimize, onComplete }: AgentChatWithHistoryProps) {
    const { settings, isLoaded: settingsLoaded } = useSettings();
    const { model, ready, selectModel } = useAgentModelSelection(accountScope);
    const [personalKeys, setPersonalKeys] = useState<Partial<Record<AgentChatProvider, string>>>({});
    const provider = model?.provider ?? settings.preferences.defaultProvider;
    const personalApiKey = model ? personalKeys[model.provider] ?? '' : '';
    const configuredApiKey = model && canUseConfiguredKeys ? settings.providers[model.provider]?.apiKey : undefined;
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
    } = useChatHistory(initialPrompt || initialDraft ? provider : undefined, accountScope ?? (canUseConfiguredKeys === undefined ? undefined : null));

    const verifySession = useCallback(async (usesConfiguredKey: boolean) => {
        if (!accountScope) return false;
        const allowed = await verifyAgentChatAccount(accountScope, usesConfiguredKey);
        if (!allowed) setPersonalKeys({});
        return allowed;
    }, [accountScope]);

    const [showSidebar, setShowSidebar] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const emptySessionPending = useRef(false);
    const [initialPromptSessionId] = useState(initialPrompt || initialDraft ? activeSessionId : null);

    // Sync messages to history
    const handleMessagesUpdate = useCallback((messages: ChatMessage[]) => {
        if (activeSessionId) {
            updateSession(activeSessionId, messages, accountScope ? provider : undefined);
        }
    }, [accountScope, activeSessionId, provider, updateSession]);

    // Start new chat
    const handleNewChat = useCallback(() => {
        return createSession(provider);
    }, [createSession, provider]);

    // Select existing session
    const handleSelectSession = useCallback((session: ChatSession) => {
        setActiveSession(session.id);
        setShowSidebar(false);
    }, [setActiveSession]);

    // This wrapper is the only history writer for the open panel: the sidebar reads these
    // sessions and calls these actions. Deleting the open session or clearing history falls
    // back to a survivor or one fresh empty session so the chat never keeps removed content.
    const handleDeleteSession = useCallback((sessionId: string) => {
        const survivors = sessions.filter(s => s.id !== sessionId);
        deleteSession(sessionId);
        if (sessionId !== activeSessionId) return;
        if (survivors.length > 0) setActiveSession(survivors[0].id);
        else createSession(provider);
    }, [sessions, activeSessionId, deleteSession, setActiveSession, createSession, provider]);

    const handleClearHistory = useCallback(() => {
        clearHistory();
        createSession(provider);
    }, [clearHistory, createSession, provider]);

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
                : 'relative h-full'
            }`}>

            {/* History Sidebar */}
            <div id="agent-chat-history" className={`${showSidebar ? 'absolute inset-y-0 left-0 top-11 z-20 block' : 'hidden'} md:static md:block
                            transition-all duration-300 border-r border-gray-200 dark:border-white/[0.07]`}>
                <ChatHistorySidebar
                    onSelectSession={handleSelectSession}
                    onNewChat={() => {
                        setShowSidebar(false);
                        return handleNewChat();
                    }}
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
                    <div className="min-h-11 px-4 border-b border-gray-200 dark:border-white/[0.07]
                                   bg-gray-50 dark:bg-[#1a1d2e]/80 flex items-center gap-2 text-sm">
                        <button
                            type="button"
                            onClick={() => setShowSidebar(open => !open)}
                            aria-controls="agent-chat-history"
                            aria-expanded={showSidebar}
                            aria-label={language === 'vi' ? 'Lịch sử chat' : 'Chat history'}
                            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-gray-200 dark:hover:bg-white/[0.07] md:hidden"
                        >
                            <span aria-hidden="true">{showSidebar ? '←' : '☰'}</span>
                        </button>
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
                    {ready && settingsLoaded !== false && isLoaded && activeSessionId && (!(initialPrompt || initialDraft) || initialPromptSessionId) && <AgentChat
                        key={activeSessionId}
                        initialPrompt={activeSessionId === initialPromptSessionId && activeSession?.messages.length === 0 ? initialPrompt : undefined}
                        initialDraft={activeSessionId === initialPromptSessionId && activeSession?.messages.length === 0 ? initialDraft : undefined}
                        onClose={onClose}
                        onMinimize={onMinimize}
                        onComplete={onComplete}
                        onMessagesChange={handleMessagesUpdate}
                        existingMessages={activeSession?.messages ?? []}
                        modelSelection={model}
                        canUseConfiguredKeys={canUseConfiguredKeys}
                        verifySession={accountScope || canUseConfiguredKeys !== undefined ? verifySession : undefined}
                        onModelSelect={accountScope ? selectModel : undefined}
                        historyProvider={accountScope && activeSession?.messages.some(message => message.role !== 'system') ? activeSession.provider : undefined}
                        onStartModelChat={() => { handleNewChat(); }}
                        selectedModelKey={personalApiKey.trim() || configuredApiKey}
                        personalApiKey={personalApiKey}
                        onPersonalApiKeyChange={model
                            ? value => setPersonalKeys(keys => ({ ...keys, [model.provider]: value }))
                            : undefined}
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
