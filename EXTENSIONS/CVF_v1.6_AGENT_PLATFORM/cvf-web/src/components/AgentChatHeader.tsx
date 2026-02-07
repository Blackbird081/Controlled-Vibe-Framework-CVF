'use client';

import { ChatMessage, CVFMode, MODE_CONFIG } from '@/lib/agent-chat';
import { ProviderKey } from '@/lib/quota-manager';
import { ExportMenu } from './ExportMenu';

interface AgentChatHeaderProps {
    currentMode: CVFMode;
    language: 'vi' | 'en';
    defaultProvider: ProviderKey;
    isStreaming: boolean;
    showExportMenu: boolean;
    onToggleExportMenu: () => void;
    messages: ChatMessage[];
    onClose?: () => void;
    onMinimize?: () => void;
    decisionLogCount: number;
    decisionLogOpen: boolean;
    onToggleDecisionLog: () => void;
}

export function AgentChatHeader({
    currentMode,
    language,
    defaultProvider,
    isStreaming,
    showExportMenu,
    onToggleExportMenu,
    messages,
    onClose,
    onMinimize,
    decisionLogCount,
    decisionLogOpen,
    onToggleDecisionLog,
}: AgentChatHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700
                       bg-gradient-to-r from-blue-600 to-purple-600">
            <div className="flex flex-wrap items-center gap-3">
                <span className="text-2xl">🤖</span>
                <div>
                    <h3 className="font-bold text-white">CVF Agent</h3>
                    <p className="text-xs text-blue-100">
                        {defaultProvider === 'gemini' && '✨ Gemini'}
                        {defaultProvider === 'openai' && '🤖 GPT-4'}
                        {defaultProvider === 'anthropic' && '🧠 Claude'}
                    </p>
                </div>
                {currentMode !== 'simple' && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${MODE_CONFIG[currentMode].color}`}>
                        {MODE_CONFIG[currentMode].icon} {language === 'vi' ? MODE_CONFIG[currentMode].label : MODE_CONFIG[currentMode].labelEn}
                    </span>
                )}
            </div>
            <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end">
                {isStreaming && (
                    <span className="px-2 py-1 bg-white/20 rounded-full text-xs text-white flex items-center gap-1">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                        Streaming...
                    </span>
                )}

                <button
                    onClick={onToggleDecisionLog}
                    className={`relative w-8 h-8 flex items-center justify-center rounded hover:bg-white/20 text-white/80 hover:text-white transition-all ${decisionLogOpen ? 'bg-white/20' : ''}`}
                    title={language === 'vi' ? 'Decision log' : 'Decision log'}
                >
                    🧾
                    {decisionLogCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5">
                            {decisionLogCount}
                        </span>
                    )}
                </button>

                <div className="relative">
                    <button
                        onClick={onToggleExportMenu}
                        className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/20 text-white/80 hover:text-white transition-all"
                        title="Export chat"
                    >
                        📥
                    </button>
                    {showExportMenu && (
                        <ExportMenu messages={messages} onClose={onToggleExportMenu} />
                    )}
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={onMinimize || onClose}
                        className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/20 text-white/80 hover:text-white transition-all"
                        title="Thu nhỏ"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M5 12h14" />
                        </svg>
                    </button>
                    <button
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent('cvf-chat-maximize'));
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/20 text-white/80 hover:text-white transition-all"
                        title="Phóng to"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <rect x="4" y="4" width="16" height="16" rx="1" />
                        </svg>
                    </button>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded hover:bg-red-500 text-white/80 hover:text-white transition-all"
                            title="Đóng"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
