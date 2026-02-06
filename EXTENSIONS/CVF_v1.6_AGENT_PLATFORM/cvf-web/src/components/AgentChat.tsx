'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '@/lib/i18n';
import { useSettings } from './Settings';
import { createAIProvider, AIMessage } from '@/lib/ai-providers';

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
function MessageBubble({ message }: { message: ChatMessage }) {
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
                                    if (isInline) {
                                        return (
                                            <code className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-sm" {...props}>
                                                {children}
                                            </code>
                                        );
                                    }
                                    return (
                                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-2">
                                            <code className={className} {...props}>{children}</code>
                                        </pre>
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

                {/* Metadata */}
                {message.metadata && message.status === 'complete' && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 
                                   text-xs text-gray-500 flex items-center gap-2">
                        {message.metadata.model && (
                            <span>🤖 {message.metadata.model}</span>
                        )}
                        {message.metadata.tokens && (
                            <span>📊 {message.metadata.tokens} tokens</span>
                        )}
                        {message.metadata.phase && (
                            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 
                                           text-purple-700 dark:text-purple-300 rounded-full">
                                {message.metadata.phase}
                            </span>
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

// Typing Indicator
function TypingIndicator() {
    return (
        <div className="flex gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 
                           flex items-center justify-center text-white text-sm flex-shrink-0">
                🤖
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        </div>
    );
}

// Main Agent Chat Component
export function AgentChat({ initialPrompt, onClose, onMinimize, onComplete, onMessagesChange, existingMessages }: AgentChatProps) {
    const { language } = useLanguage();
    const { settings } = useSettings();
    const [messages, setMessages] = useState<ChatMessage[]>(existingMessages || []);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Handle initial prompt
    useEffect(() => {
        if (initialPrompt && messages.length === 0) {
            const systemMessage: ChatMessage = {
                id: `msg_${Date.now()}`,
                role: 'system',
                content: language === 'vi' ? '🚀 CVF Agent Mode bắt đầu' : '🚀 CVF Agent Mode started',
                timestamp: new Date(),
            };
            setMessages([systemMessage]);

            // Auto-send initial prompt
            setTimeout(() => {
                handleSendMessage(initialPrompt);
            }, 500);
        }
    }, [initialPrompt]);

    // Send message
    const handleSendMessage = async (messageContent?: string) => {
        const content = messageContent || input.trim();
        if (!content || isLoading) return;

        // Check API key
        const provider = settings.preferences.defaultProvider;
        const apiKey = settings.providers[provider]?.apiKey;

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
                model: provider === 'gemini' ? 'gemini-2.0-flash' : provider === 'openai' ? 'gpt-4o' : 'claude-3.5-sonnet',
            },
        };

        setMessages(prev => [...prev, assistantMessage]);
        setIsStreaming(true);

        try {
            // Call real AI API
            await callRealAI(assistantId, content, provider as 'gemini' | 'openai' | 'anthropic', apiKey);
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
        apiKey: string
    ) => {
        // Build message history for context
        const aiMessages: AIMessage[] = messages
            .filter(m => m.role !== 'system')
            .map(m => ({ role: m.role, content: m.content }));
        aiMessages.push({ role: 'user', content: userContent });

        const aiProvider = createAIProvider(provider, { apiKey });
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
                        }
                    }
                    : m
            )
        );
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

    return (
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
                </div>
                <div className="flex items-center gap-2">
                    {isStreaming && (
                        <span className="px-2 py-1 bg-white/20 rounded-full text-xs text-white animate-pulse">
                            Streaming...
                        </span>
                    )}
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
                    <MessageBubble key={message.id} message={message} />
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
