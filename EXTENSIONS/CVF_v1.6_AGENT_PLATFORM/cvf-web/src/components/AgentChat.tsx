'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '@/lib/i18n';
import { useSettings } from './Settings';
import { createAIProvider, AIMessage } from '@/lib/ai-providers';
import { useQuotaManager, ProviderKey, MODEL_PRICING } from '@/lib/quota-manager';
import {
    calculateQualityScore,
    getQualityBadgeColor,
    getQualityLabel,
    shouldRequireAcceptance,
    QualityScore,
    AcceptanceStatus
} from '@/lib/governance';
import { PhaseGateModal } from './PhaseGateModal';
import { detectCurrentPhase, CVFPhase } from '@/lib/cvf-checklists';

// Helper: Calculate cost for a message
function calculateMessageCost(model: string, tokens: number): number {
    const pricing = MODEL_PRICING[model] || { input: 1.00, output: 4.00 };
    // Approximate: 30% input, 70% output for typical chat
    const inputTokens = Math.floor(tokens * 0.3);
    const outputTokens = tokens - inputTokens;
    return (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output;
}

// Phase detection and styling
const PHASE_CONFIG = {
    Discovery: { color: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300', icon: '🔍', label: 'Phase A' },
    Design: { color: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300', icon: '✏️', label: 'Phase B' },
    Build: { color: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300', icon: '🔨', label: 'Phase C' },
    Review: { color: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300', icon: '✅', label: 'Phase D' },
    Processing: { color: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300', icon: '⚙️', label: '' },
};

// CVF Governance Mode detection and config
export type CVFMode = 'simple' | 'governance' | 'full';

const MODE_CONFIG = {
    simple: {
        color: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
        icon: '⚡',
        label: 'Đơn giản',
        labelEn: 'Simple'
    },
    governance: {
        color: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
        icon: '⚠️',
        label: 'Có Quy tắc',
        labelEn: 'With Rules'
    },
    full: {
        color: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
        icon: '🚦',
        label: 'CVF Full Mode',
        labelEn: 'CVF Full Mode'
    },
};

// Detect CVF mode from spec content
function detectSpecMode(content: string): CVFMode {
    if (!content) return 'simple';

    // Check for Full Mode markers
    if (
        content.includes('CVF FULL MODE PROTOCOL') ||
        content.includes('MANDATORY 4-PHASE PROCESS') ||
        content.includes('QUY TRÌNH 4-PHASE BẮT BUỘC') ||
        content.includes('Full Mode (4-Phase)')
    ) {
        return 'full';
    }

    // Check for Governance Mode markers
    if (
        content.includes('CVF GOVERNANCE RULES') ||
        content.includes('QUY TẮC CVF GOVERNANCE') ||
        content.includes('Stop Conditions') ||
        content.includes('Điều kiện dừng') ||
        content.includes('With Rules') ||
        content.includes('Có Quy Tắc)')
    ) {
        return 'governance';
    }

    return 'simple';
}

// Copy Button Component
function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className="absolute top-2 right-2 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 
                       text-gray-300 rounded transition-all opacity-0 group-hover:opacity-100"
            title="Copy code"
        >
            {copied ? '✓ Copied!' : '📋 Copy'}
        </button>
    );
}

// Types
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    status?: 'sending' | 'streaming' | 'complete' | 'error';
    metadata?: {
        tokens?: number;
        model?: string;
        phase?: string;
        qualityScore?: QualityScore;
        acceptanceStatus?: AcceptanceStatus;
    };
}

export interface AgentChatProps {
    initialPrompt?: string;
    onClose?: () => void;
    onMinimize?: () => void;
    onComplete?: (messages: ChatMessage[]) => void;
    onMessagesChange?: (messages: ChatMessage[]) => void;
    existingMessages?: ChatMessage[];
}

// Message Bubble Component
function MessageBubble({
    message,
    onAccept,
    onReject,
    onRetry,
    language = 'vi'
}: {
    message: ChatMessage;
    onAccept?: (id: string) => void;
    onReject?: (id: string) => void;
    onRetry?: (id: string) => void;
    language?: 'vi' | 'en';
}) {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';

    if (isSystem) {
        return (
            <div className="flex justify-center my-4">
                <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-xs text-gray-500">
                    {message.content}
                </div>
            </div>
        );
    }

    const qualityScore = message.metadata?.qualityScore;
    const acceptanceStatus = message.metadata?.acceptanceStatus;

    return (
        <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 
                               flex items-center justify-center text-white text-sm flex-shrink-0">
                    🤖
                </div>
            )}

            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isUser
                ? 'bg-blue-600 text-white rounded-br-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md'
                }`}>
                {isUser ? (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown
                            components={{
                                // Custom code block styling
                                code: ({ className, children, ...props }) => {
                                    const isInline = !className;
                                    const codeText = String(children).replace(/\n$/, '');
                                    if (isInline) {
                                        return (
                                            <code className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-sm" {...props}>
                                                {children}
                                            </code>
                                        );
                                    }
                                    return (
                                        <div className="relative group my-2">
                                            <CopyButton text={codeText} />
                                            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                                                <code className={className} {...props}>{children}</code>
                                            </pre>
                                        </div>
                                    );
                                },
                                // Custom link styling
                                a: ({ href, children }) => (
                                    <a href={href} target="_blank" rel="noopener noreferrer"
                                        className="text-blue-500 hover:underline">
                                        {children}
                                    </a>
                                ),
                            }}
                        >
                            {message.content}
                        </ReactMarkdown>
                    </div>
                )}

                {/* Streaming indicator */}
                {message.status === 'streaming' && (
                    <span className="inline-flex ml-1">
                        <span className="animate-pulse">▊</span>
                    </span>
                )}

                {/* Metadata with Phase, Quality & Cost */}
                {message.metadata && message.status === 'complete' && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-500 flex flex-wrap items-center gap-2">
                            {/* Phase Badge */}
                            {message.metadata.phase && (() => {
                                const phaseKey = message.metadata.phase as keyof typeof PHASE_CONFIG;
                                const config = PHASE_CONFIG[phaseKey] || PHASE_CONFIG.Processing;
                                return (
                                    <span className={`px-2 py-0.5 rounded-full flex items-center gap-1 ${config.color}`}>
                                        <span>{config.icon}</span>
                                        <span>{config.label} {message.metadata.phase}</span>
                                    </span>
                                );
                            })()}

                            {/* Quality Score Badge */}
                            {qualityScore && (
                                <span className={`px-2 py-0.5 rounded-full flex items-center gap-1 ${getQualityBadgeColor(qualityScore.overall)}`}>
                                    <span>⭐</span>
                                    <span>{qualityScore.overall}% {getQualityLabel(qualityScore.overall, language)}</span>
                                </span>
                            )}

                            {message.metadata.model && (
                                <span>🤖 {message.metadata.model}</span>
                            )}
                            {message.metadata.tokens && (
                                <span>
                                    📊 {message.metadata.tokens >= 1000
                                        ? `${(message.metadata.tokens / 1000).toFixed(1)}K`
                                        : message.metadata.tokens} tokens
                                    {message.metadata.model && (
                                        <span className="text-green-600 dark:text-green-400 ml-1">
                                            • ${calculateMessageCost(message.metadata.model, message.metadata.tokens).toFixed(4)}
                                        </span>
                                    )}
                                </span>
                            )}
                        </div>

                        {/* Accept/Reject Buttons for governance modes */}
                        {acceptanceStatus === 'pending' && (
                            <div className="mt-3 flex gap-2">
                                <button
                                    onClick={() => onAccept?.(message.id)}
                                    className="flex-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
                                >
                                    <span>✓</span>
                                    <span>{language === 'vi' ? 'Chấp nhận' : 'Accept'}</span>
                                </button>
                                <button
                                    onClick={() => onRetry?.(message.id)}
                                    className="flex-1 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
                                >
                                    <span>🔄</span>
                                    <span>{language === 'vi' ? 'Thử lại' : 'Retry'}</span>
                                </button>
                                <button
                                    onClick={() => onReject?.(message.id)}
                                    className="flex-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
                                >
                                    <span>✕</span>
                                    <span>{language === 'vi' ? 'Từ chối' : 'Reject'}</span>
                                </button>
                            </div>
                        )}

                        {/* Acceptance status indicator */}
                        {acceptanceStatus && acceptanceStatus !== 'pending' && (
                            <div className={`mt-2 text-xs px-2 py-1 rounded inline-flex items-center gap-1 ${acceptanceStatus === 'accepted' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                                acceptanceStatus === 'rejected' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' :
                                    'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                                }`}>
                                {acceptanceStatus === 'accepted' && '✓ '}
                                {acceptanceStatus === 'rejected' && '✕ '}
                                {acceptanceStatus === 'retry' && '🔄 '}
                                {language === 'vi'
                                    ? (acceptanceStatus === 'accepted' ? 'Đã chấp nhận' : acceptanceStatus === 'rejected' ? 'Đã từ chối' : 'Đang thử lại')
                                    : (acceptanceStatus === 'accepted' ? 'Accepted' : acceptanceStatus === 'rejected' ? 'Rejected' : 'Retrying')
                                }
                            </div>
                        )}
                    </div>
                )}
            </div>

            {isUser && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-600 
                               flex items-center justify-center text-white text-sm flex-shrink-0">
                    👤
                </div>
            )}
        </div>
    );
}

// Typing Indicator - Improved
function TypingIndicator() {
    return (
        <div className="flex gap-3 mb-4 animate-fadeIn">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 
                           flex items-center justify-center text-white text-sm flex-shrink-0 animate-pulse">
                🤖
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Thinking...</span>
                </div>
            </div>
        </div>
    );
}

// Export Menu Component
function ExportMenu({ messages, onClose }: { messages: ChatMessage[]; onClose: () => void }) {
    const exportToMarkdown = () => {
        const content = messages.map(m => {
            const role = m.role === 'user' ? '👤 User' : '🤖 Assistant';
            const metadata = m.metadata ? `\n\n_${m.metadata.model || ''} | ${m.metadata.tokens || 0} tokens_` : '';
            return `## ${role}\n\n${m.content}${metadata}`;
        }).join('\n\n---\n\n');

        const blob = new Blob([`# Chat Export\n\n${content}`], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
        onClose();
    };

    const exportToJSON = () => {
        const data = {
            exportedAt: new Date().toISOString(),
            messageCount: messages.length,
            messages: messages.map(m => ({
                role: m.role,
                content: m.content,
                timestamp: m.timestamp,
                metadata: m.metadata
            }))
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        onClose();
    };

    const copyAll = async () => {
        const content = messages.map(m => {
            const role = m.role === 'user' ? 'User' : 'Assistant';
            return `[${role}]\n${m.content}`;
        }).join('\n\n---\n\n');

        try {
            await navigator.clipboard.writeText(content);
            alert('Copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy:', err);
        }
        onClose();
    };

    return (
        <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-[140px] z-50">
            <button onClick={exportToMarkdown} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                📄 Markdown
            </button>
            <button onClick={exportToJSON} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                📦 JSON
            </button>
            <button onClick={copyAll} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                📋 Copy All
            </button>
        </div>
    );
}

// Main Agent Chat Component
export function AgentChat({ initialPrompt, onClose, onMinimize, onComplete, onMessagesChange, existingMessages }: AgentChatProps) {
    const { language } = useLanguage();
    const { settings } = useSettings();
    const { trackUsage } = useQuotaManager();
    const [messages, setMessages] = useState<ChatMessage[]>(existingMessages || []);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
    const [currentMode, setCurrentMode] = useState<CVFMode>('simple'); // CVF Governance mode
    const [phaseGate, setPhaseGate] = useState<{ show: boolean; phase: CVFPhase | null; response: string }>({
        show: false,
        phase: null,
        response: '',
    });
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const handledPromptRef = useRef<string | null>(null); // Track exact prompt that was handled

    // Labels
    const labels = {
        vi: {
            placeholder: 'Nhập tin nhắn...',
            send: 'Gửi',
            cancel: 'Hủy',
            complete: 'Hoàn thành',
            noApiKey: 'Chưa cấu hình API key. Vui lòng vào Settings để thêm.',
            connectionError: 'Lỗi kết nối. Vui lòng thử lại.',
            modelLabel: 'Model',
        },
        en: {
            placeholder: 'Type a message...',
            send: 'Send',
            cancel: 'Cancel',
            complete: 'Complete',
            noApiKey: 'No API key configured. Please add one in Settings.',
            connectionError: 'Connection error. Please try again.',
            modelLabel: 'Model',
        },
    };
    const l = labels[language];

    // Scroll to bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Sync messages to parent (for history persistence)
    useEffect(() => {
        if (onMessagesChange && messages.length > 0) {
            onMessagesChange(messages);
        }
    }, [messages, onMessagesChange]);

    // Handle initial prompt - only send if this exact prompt hasn't been handled
    useEffect(() => {
        console.log('[AgentChat] Effect check:', {
            initialPrompt: initialPrompt ? initialPrompt.substring(0, 50) + '...' : 'none',
            handledPrompt: handledPromptRef.current ? handledPromptRef.current.substring(0, 50) + '...' : 'none',
        });

        // Only auto-send if this exact prompt hasn't been handled
        if (initialPrompt && handledPromptRef.current !== initialPrompt) {
            console.log('[AgentChat] AUTO-SENDING initialPrompt!');
            handledPromptRef.current = initialPrompt;

            // Detect CVF governance mode from spec
            const detectedMode = detectSpecMode(initialPrompt);
            setCurrentMode(detectedMode);
            console.log('[AgentChat] Detected mode:', detectedMode);

            const modeInfo = language === 'vi'
                ? MODE_CONFIG[detectedMode].label
                : MODE_CONFIG[detectedMode].labelEn;

            const systemMessage: ChatMessage = {
                id: `msg_${Date.now()}`,
                role: 'system',
                content: language === 'vi'
                    ? `🚀 CVF Agent Mode bắt đầu | ${MODE_CONFIG[detectedMode].icon} ${modeInfo}`
                    : `🚀 CVF Agent Mode started | ${MODE_CONFIG[detectedMode].icon} ${modeInfo}`,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, systemMessage]);

            // Auto-send initial prompt
            setTimeout(() => {
                console.log('[AgentChat] Calling handleSendMessage...');
                handleSendMessage(initialPrompt);
            }, 500);
        }
    }, [initialPrompt, language]);

    // Send message
    const handleSendMessage = async (messageContent?: string) => {
        const content = messageContent || input.trim();
        if (!content || isLoading) return;

        // Check API key - read DIRECTLY from localStorage (useSettings may have stale state)
        let provider = settings.preferences.defaultProvider;
        let apiKey = settings.providers[provider]?.apiKey;

        // If hook state is stale, read fresh from localStorage
        if (!apiKey) {
            try {
                const freshSettings = JSON.parse(localStorage.getItem('cvf_settings') || '{}');
                provider = freshSettings.preferences?.defaultProvider || 'gemini';
                apiKey = freshSettings.providers?.[provider]?.apiKey;
                console.log('[AgentChat] Fallback to localStorage:', { provider, hasKey: !!apiKey });
            } catch {
                apiKey = '';
            }
        }

        // Get selected model from settings
        const selectedModel = settings.providers[provider]?.selectedModel || 'gemini-2.5-flash';

        console.log('[AgentChat] API check:', {
            provider,
            apiKey: apiKey ? 'EXISTS' : 'MISSING',
        });

        if (!apiKey) {
            const errorMsg: ChatMessage = {
                id: `msg_${Date.now()}`,
                role: 'system',
                content: `⚠️ ${l.noApiKey}`,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMsg]);
            return;
        }

        // Build message content including file attachment if present
        let finalContent = content;
        if (attachedFile) {
            finalContent = `${content}

---

📎 **File: ${attachedFile.name}**

\`\`\`
${attachedFile.content}
\`\`\``;
        }

        // Add user message
        const userMessage: ChatMessage = {
            id: `msg_${Date.now()}`,
            role: 'user',
            content: finalContent,
            timestamp: new Date(),
            status: 'complete',
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setAttachedFile(null);
        setIsLoading(true);

        // Create placeholder for assistant message
        const assistantId = `msg_${Date.now() + 1}`;
        const assistantMessage: ChatMessage = {
            id: assistantId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            status: 'streaming',
            metadata: {
                model: selectedModel,
            },
        };

        setMessages(prev => [...prev, assistantMessage]);
        setIsStreaming(true);

        try {
            // Call real AI API
            await callRealAI(assistantId, content, provider as 'gemini' | 'openai' | 'anthropic', apiKey, selectedModel);
        } catch (error) {
            setMessages(prev => prev.map(m =>
                m.id === assistantId
                    ? { ...m, content: `❌ ${l.connectionError}`, status: 'error' }
                    : m
            ));
        } finally {
            setIsLoading(false);
            setIsStreaming(false);
        }
    };

    // Real AI API call with streaming
    const callRealAI = async (
        messageId: string,
        userContent: string,
        provider: 'gemini' | 'openai' | 'anthropic',
        apiKey: string,
        model: string
    ) => {
        // Build message history for context
        const aiMessages: AIMessage[] = messages
            .filter(m => m.role !== 'system')
            .map(m => ({ role: m.role, content: m.content }));
        aiMessages.push({ role: 'user', content: userContent });

        const aiProvider = createAIProvider(provider, { apiKey, language, model });
        let fullText = '';

        const response = await aiProvider.chat(aiMessages, (chunk) => {
            if (!chunk.isComplete && chunk.text) {
                fullText += chunk.text;
                setMessages(prev =>
                    prev.map(m =>
                        m.id === messageId
                            ? { ...m, content: fullText }
                            : m
                    )
                );
            }
        });

        // Detect phase from response
        let phase = 'Processing';
        if (response.text.includes('PHASE A') || response.text.includes('Discovery')) phase = 'Discovery';
        else if (response.text.includes('PHASE B') || response.text.includes('Design')) phase = 'Design';
        else if (response.text.includes('PHASE C') || response.text.includes('Build')) phase = 'Build';
        else if (response.text.includes('PHASE D') || response.text.includes('Review')) phase = 'Review';

        // Calculate quality score for governance modes
        const qualityScore = shouldRequireAcceptance(currentMode)
            ? calculateQualityScore(response.text || fullText, currentMode)
            : undefined;

        // Set acceptance status for governance modes
        const acceptanceStatus: AcceptanceStatus | undefined = shouldRequireAcceptance(currentMode)
            ? 'pending'
            : undefined;

        // Mark as complete
        setMessages(prev =>
            prev.map(m =>
                m.id === messageId
                    ? {
                        ...m,
                        content: response.text || fullText,
                        status: 'complete',
                        metadata: {
                            ...m.metadata,
                            tokens: response.usage?.totalTokens || Math.floor(fullText.length / 4),
                            phase,
                            qualityScore,
                            acceptanceStatus,
                        }
                    }
                    : m
            )
        );

        // Track quota usage
        const inputTokens = aiMessages.reduce((sum, m) => sum + Math.ceil(m.content.length / 4), 0);
        const outputTokens = response.usage?.totalTokens || Math.ceil(fullText.length / 4);
        trackUsage(provider as ProviderKey, model, inputTokens, outputTokens);

        // Show Phase Gate Modal for Full CVF Mode
        if (currentMode === 'full') {
            const detectedPhase = detectCurrentPhase(response.text || fullText);
            if (detectedPhase) {
                setPhaseGate({
                    show: true,
                    phase: detectedPhase,
                    response: response.text || fullText,
                });
            }
        }
    };

    // Handle key press
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Handle complete
    const handleComplete = () => {
        onComplete?.(messages);
        onClose?.();
    };

    // Handle acceptance actions for governance modes
    const handleAccept = (messageId: string) => {
        setMessages(prev =>
            prev.map(m =>
                m.id === messageId
                    ? { ...m, metadata: { ...m.metadata, acceptanceStatus: 'accepted' as AcceptanceStatus } }
                    : m
            )
        );
    };

    const handleReject = (messageId: string) => {
        setMessages(prev =>
            prev.map(m =>
                m.id === messageId
                    ? { ...m, metadata: { ...m.metadata, acceptanceStatus: 'rejected' as AcceptanceStatus } }
                    : m
            )
        );
    };

    const handleRetry = (messageId: string) => {
        // Mark current message as retry
        setMessages(prev =>
            prev.map(m =>
                m.id === messageId
                    ? { ...m, metadata: { ...m.metadata, acceptanceStatus: 'retry' as AcceptanceStatus } }
                    : m
            )
        );

        // Find the last user message and resend
        const lastUserMessage = messages.filter(m => m.role === 'user').pop();
        if (lastUserMessage) {
            setTimeout(() => {
                handleSendMessage(lastUserMessage.content + '\n\n[Retry: Vui lòng cải thiện response trước đó]');
            }, 100);
        }
    };

    // Handle file upload
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Limit file types
        const allowedTypes = ['.txt', '.md', '.json', '.js', '.ts', '.tsx', '.css', '.html', '.py', '.yaml', '.yml'];
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (!allowedTypes.includes(ext)) {
            alert(language === 'vi'
                ? `Chỉ hỗ trợ các định dạng: ${allowedTypes.join(', ')}`
                : `Only these formats are supported: ${allowedTypes.join(', ')}`
            );
            return;
        }

        // Limit file size (100KB)
        if (file.size > 100 * 1024) {
            alert(language === 'vi'
                ? 'File quá lớn (tối đa 100KB)'
                : 'File too large (max 100KB)'
            );
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setAttachedFile({ name: file.name, content });
        };
        reader.readAsText(file);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Handle Phase Gate actions
    const handlePhaseGateApprove = () => {
        setPhaseGate({ show: false, phase: null, response: '' });
        // Add system message about approval
        const approvalMessage: ChatMessage = {
            id: `msg_${Date.now()}`,
            role: 'system',
            content: `✅ Phase ${phaseGate.phase} approved. AI may proceed to next phase.`,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, approvalMessage]);
    };

    const handlePhaseGateReject = () => {
        setPhaseGate({ show: false, phase: null, response: '' });
        // Request revision
        const revisionMessage = `[Revision Request] Phase ${phaseGate.phase} needs revision. Please address the checklist requirements.`;
        handleSendMessage(revisionMessage);
    };

    return (
        <>
            {/* Phase Gate Modal */}
            {phaseGate.show && phaseGate.phase && (
                <PhaseGateModal
                    phase={phaseGate.phase}
                    response={phaseGate.response}
                    language={language}
                    onApprove={handlePhaseGateApprove}
                    onReject={handlePhaseGateReject}
                    onClose={() => setPhaseGate({ show: false, phase: null, response: '' })}
                />
            )}

            <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700
                           bg-gradient-to-r from-blue-600 to-purple-600">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🤖</span>
                        <div>
                            <h3 className="font-bold text-white">CVF Agent</h3>
                            <p className="text-xs text-blue-100">
                                {settings.preferences.defaultProvider === 'gemini' && '✨ Gemini'}
                                {settings.preferences.defaultProvider === 'openai' && '🤖 GPT-4'}
                                {settings.preferences.defaultProvider === 'anthropic' && '🧠 Claude'}
                            </p>
                        </div>
                        {/* CVF Mode Badge */}
                        {currentMode !== 'simple' && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${MODE_CONFIG[currentMode].color}`}>
                                {MODE_CONFIG[currentMode].icon} {language === 'vi' ? MODE_CONFIG[currentMode].label : MODE_CONFIG[currentMode].labelEn}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {isStreaming && (
                            <span className="px-2 py-1 bg-white/20 rounded-full text-xs text-white flex items-center gap-1">
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                Streaming...
                            </span>
                        )}
                        {/* Export Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/20 text-white/80 hover:text-white transition-all"
                                title="Export chat"
                            >
                                📥
                            </button>
                            {showExportMenu && (
                                <ExportMenu messages={messages} onClose={() => setShowExportMenu(false)} />
                            )}
                        </div>
                        {/* Window controls - like Windows titlebar */}
                        <div className="flex items-center gap-1">
                            {/* Minimize */}
                            <button
                                onClick={onMinimize || onClose}
                                className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/20 text-white/80 hover:text-white transition-all"
                                title="Thu nhỏ"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path d="M5 12h14" />
                                </svg>
                            </button>
                            {/* Maximize */}
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
                            {/* Close */}
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

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {messages.map(message => (
                        <MessageBubble
                            key={message.id}
                            message={message}
                            onAccept={handleAccept}
                            onReject={handleReject}
                            onRetry={handleRetry}
                            language={language}
                        />
                    ))}

                    {isLoading && !isStreaming && <TypingIndicator />}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                    {/* Attached file indicator */}
                    {attachedFile && (
                        <div className="mb-2 flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-sm">
                            <span>📎</span>
                            <span className="flex-1 truncate text-blue-700 dark:text-blue-300">{attachedFile.name}</span>
                            <button
                                onClick={() => setAttachedFile(null)}
                                className="text-red-500 hover:text-red-700"
                                title={language === 'vi' ? 'Xóa file' : 'Remove file'}
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    <div className="flex gap-2">
                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".txt,.md,.json,.js,.ts,.tsx,.css,.html,.py,.yaml,.yml"
                            onChange={handleFileUpload}
                            className="hidden"
                        />

                        {/* File upload button */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading}
                            className="p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800
                                  hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                            title={language === 'vi' ? 'Đính kèm file' : 'Attach file'}
                        >
                            📎
                        </button>

                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder={attachedFile
                                ? (language === 'vi' ? `Nhập tin nhắn về ${attachedFile.name}...` : `Type about ${attachedFile.name}...`)
                                : l.placeholder}
                            disabled={isLoading}
                            rows={1}
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600
                                  bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white
                                  focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none
                                  disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <button
                            onClick={() => handleSendMessage()}
                            disabled={(!input.trim() && !attachedFile) || isLoading}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 
                                  disabled:cursor-not-allowed text-white rounded-xl font-medium
                                  transition-colors flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            {l.send}
                        </button>
                    </div>

                    {/* Action buttons */}
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
        </>
    );
}

// Prominent floating Agent button with label
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

