'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, PHASE_CONFIG } from '@/lib/agent-chat';
import { AcceptRejectButtons } from './AcceptRejectButtons';
import { QualityScoreBadge } from './QualityScoreBadge';
import { autoCheckItems, calculatePhaseCompliance, CVFPhase } from '@/lib/cvf-checklists';

const DEFAULT_PRICING = { input: 1.00, output: 4.00 };

function calculateMessageCost(
    pricing: Record<string, { input: number; output: number }> | undefined,
    model: string,
    tokens: number
): number {
    const modelPricing = pricing?.[model] || DEFAULT_PRICING;
    const inputTokens = Math.floor(tokens * 0.3);
    const outputTokens = tokens - inputTokens;
    return (inputTokens / 1_000_000) * modelPricing.input + (outputTokens / 1_000_000) * modelPricing.output;
}

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

function ComplianceIndicator({
    phase,
    response,
    language,
}: {
    phase: CVFPhase;
    response: string;
    language: 'vi' | 'en';
}) {
    const checkedItems = autoCheckItems(phase, response);
    const compliance = calculatePhaseCompliance(phase, checkedItems);

    return (
        <span className={`px-2 py-0.5 rounded-full flex items-center gap-1 ${compliance.passed
            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
            : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
            }`}>
            <span>🧭</span>
            <span>{language === 'vi' ? 'Tuân thủ' : 'Compliance'} {compliance.score}%</span>
        </span>
    );
}

interface AgentChatMessageBubbleProps {
    message: ChatMessage;
    onAccept?: (id: string) => void;
    onReject?: (id: string) => void;
    onRetry?: (id: string) => void;
    language?: 'vi' | 'en';
    pricing?: Record<string, { input: number; output: number }>;
}

export function AgentChatMessageBubble({
    message,
    onAccept,
    onReject,
    onRetry,
    language = 'vi',
    pricing,
}: AgentChatMessageBubbleProps) {
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
    const phaseKey = message.metadata?.phase;
    const isKnownPhase = phaseKey && ['Discovery', 'Design', 'Build', 'Review'].includes(phaseKey);

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

                {message.status === 'streaming' && (
                    <span className="inline-flex ml-1">
                        <span className="animate-pulse">▊</span>
                    </span>
                )}

                {message.metadata && message.status === 'complete' && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-500 flex flex-wrap items-center gap-2">
                            {phaseKey && (() => {
                                const config = (PHASE_CONFIG as Record<string, { color: string; icon: string; label: string }>)[phaseKey] || PHASE_CONFIG.Processing;
                                return (
                                    <span className={`px-2 py-0.5 rounded-full flex items-center gap-1 ${config.color}`}>
                                        <span>{config.icon}</span>
                                        <span>{config.label} {phaseKey}</span>
                                    </span>
                                );
                            })()}

                            {isKnownPhase && (
                                <ComplianceIndicator phase={phaseKey as CVFPhase} response={message.content} language={language} />
                            )}

                            {qualityScore && (
                                <QualityScoreBadge score={qualityScore} language={language} />
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
                                            • ${calculateMessageCost(pricing, message.metadata.model, message.metadata.tokens).toFixed(4)}
                                        </span>
                                    )}
                                </span>
                            )}
                        </div>

                        {acceptanceStatus === 'pending' && (
                            <AcceptRejectButtons
                                onAccept={() => onAccept?.(message.id)}
                                onRetry={() => onRetry?.(message.id)}
                                onReject={() => onReject?.(message.id)}
                                language={language}
                            />
                        )}

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
