'use client';

import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { useSettings } from './Settings';
import { PhaseGateModal } from './PhaseGateModal';
import { AgentChatHeader } from './AgentChatHeader';
import { AgentChatMessageBubble } from './AgentChatMessageBubble';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { DecisionLogSidebar } from './DecisionLogSidebar';
import { useAgentChat } from '@/lib/hooks/useAgentChat';
import { useModelPricing } from '@/lib/hooks/useModelPricing';
import type { ChatMessage } from '@/lib/agent-chat';

export interface AgentChatProps {
    initialPrompt?: string;
    onClose?: () => void;
    onMinimize?: () => void;
    onComplete?: (messages: ChatMessage[]) => void;
    onMessagesChange?: (messages: ChatMessage[]) => void;
    existingMessages?: ChatMessage[];
}

export function AgentChat({
    initialPrompt,
    onClose,
    onMinimize,
    onComplete,
    onMessagesChange,
    existingMessages,
}: AgentChatProps) {
    const { language } = useLanguage();
    const { settings } = useSettings();
    const { pricing } = useModelPricing();

    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showDecisionLog, setShowDecisionLog] = useState(false);

    const labels = {
        vi: {
            placeholder: 'Nhập tin nhắn...',
            send: 'Gửi',
            cancel: 'Hủy',
            complete: 'Hoàn thành',
            noApiKey: 'Chưa cấu hình API key. Vui lòng vào Settings để thêm.',
            connectionError: 'Lỗi kết nối. Vui lòng thử lại.',
            modelLabel: 'Model',
            retryMessage: '[Retry: Vui lòng cải thiện response trước đó]',
        },
        en: {
            placeholder: 'Type a message...',
            send: 'Send',
            cancel: 'Cancel',
            complete: 'Complete',
            noApiKey: 'No API key configured. Please add one in Settings.',
            connectionError: 'Connection error. Please try again.',
            modelLabel: 'Model',
            retryMessage: '[Retry: Please improve the previous response]',
        },
    };
    const l = labels[language];

    const {
        messages,
        input,
        setInput,
        isLoading,
        isStreaming,
        attachedFile,
        currentMode,
        phaseGate,
        decisionLog,
        handleSendMessage,
        handleAccept,
        handleReject,
        handleRetry,
        handleFileSelected,
        handleRemoveAttachment,
        handlePhaseGateApprove,
        handlePhaseGateReject,
        handlePhaseGateClose,
        handleComplete,
        clearDecisionLog,
    } = useAgentChat({
        initialPrompt,
        existingMessages,
        language,
        settings,
        labels: l,
        onComplete,
        onClose,
        onMessagesChange,
    });

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <>
            {phaseGate.show && phaseGate.phase && (
                <PhaseGateModal
                    phase={phaseGate.phase}
                    response={phaseGate.response}
                    language={language}
                    onApprove={handlePhaseGateApprove}
                    onReject={handlePhaseGateReject}
                    onClose={handlePhaseGateClose}
                />
            )}

            <div className="relative flex h-full bg-white dark:bg-gray-900 rounded-xl overflow-hidden">
                <div className="flex flex-col h-full flex-1 overflow-hidden min-h-0">
                    <AgentChatHeader
                        currentMode={currentMode}
                        language={language}
                        defaultProvider={settings.preferences.defaultProvider}
                        isStreaming={isStreaming}
                        showExportMenu={showExportMenu}
                        onToggleExportMenu={() => setShowExportMenu(prev => !prev)}
                        messages={messages}
                        onClose={onClose}
                        onMinimize={onMinimize}
                        decisionLogCount={decisionLog.length}
                        decisionLogOpen={showDecisionLog}
                        onToggleDecisionLog={() => setShowDecisionLog(prev => !prev)}
                    />

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {messages.map(message => (
                            <AgentChatMessageBubble
                                key={message.id}
                                message={message}
                                onAccept={handleAccept}
                                onReject={handleReject}
                                onRetry={handleRetry}
                                language={language}
                                pricing={pricing}
                            />
                        ))}

                        {isLoading && !isStreaming && <TypingIndicator />}

                        <div ref={messagesEndRef} />
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900
                                    sticky bottom-0 sm:static safe-area-pb">
                        <ChatInput
                            input={input}
                            onInputChange={setInput}
                            onSend={() => handleSendMessage()}
                            isLoading={isLoading}
                            attachedFile={attachedFile}
                            onRemoveAttachment={handleRemoveAttachment}
                            onFileSelected={handleFileSelected}
                            language={language}
                            placeholder={l.placeholder}
                            sendLabel={l.send}
                        />

                        {messages.length > 0 && (
                            <div className="flex justify-end gap-2 mt-3">
                                <button
                                    onClick={handleComplete}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white 
                                          rounded-lg text-sm font-medium transition-colors"
                                >
                                    ✓ {l.complete}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {showDecisionLog && (
                    <DecisionLogSidebar
                        entries={decisionLog}
                        onClose={() => setShowDecisionLog(false)}
                        onClear={clearDecisionLog}
                        language={language}
                    />
                )}
            </div>
        </>
    );
}

export type { ChatMessage } from '@/lib/agent-chat';

export function AgentChatButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-6 right-6 flex items-center gap-3 px-5 py-4
                      bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500
                      rounded-2xl shadow-2xl hover:shadow-purple-500/50 
                      transition-all duration-300 hover:scale-105
                      text-white font-bold z-50
                      animate-pulse hover:animate-none
                      border-2 border-white/20"
            title="Open CVF Agent"
        >
            <span className="text-3xl">🤖</span>
            <div className="flex flex-col items-start">
                <span className="text-lg font-bold">AI Agent</span>
                <span className="text-xs opacity-80">Chat with CVF</span>
            </div>
            <svg className="w-5 h-5 ml-2 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        </button>
    );
}
