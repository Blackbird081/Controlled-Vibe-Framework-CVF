'use client';

// Text Encoding Exception: the model picker and chat errors include Vietnamese UI copy.
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { useSettings } from './Settings';
import { PhaseGateModal } from './PhaseGateModal';
import { AgentChatHeader } from './AgentChatHeader';
import { AgentChatMessageBubble } from './AgentChatMessageBubble';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { DecisionLogSidebar } from './DecisionLogSidebar';
import { GovernanceBar } from './GovernanceBar';
import { GovernancePanel } from './GovernancePanel';
import { useAgentChat } from '@/lib/hooks/useAgentChat';
import { useModelPricing } from '@/lib/hooks/useModelPricing';
import { useQuotaManager, type ProviderKey } from '@/lib/quota-manager';
import { sanitizePrompt, evaluatePolicy, riskLevelToScore, type SanitizationResult } from '@/lib/safety-status';
import type { ChatMessage } from '@/lib/agent-chat';
import type { GovernanceState } from '@/lib/governance-context';
import { AGENT_CHAT_PROVIDERS, AVAILABLE_MODELS, PROVIDER_NAMES, type AgentModelSelection } from '@/lib/agent-model-catalog';

export interface AgentChatProps {
    initialPrompt?: string;
    initialDraft?: string;
    onClose?: () => void;
    onMinimize?: () => void;
    onComplete?: (messages: ChatMessage[]) => void;
    onMessagesChange?: (messages: ChatMessage[]) => void;
    existingMessages?: ChatMessage[];
    modelSelection?: AgentModelSelection | null;
    canUseConfiguredKeys?: boolean;
    verifySession?: (usesConfiguredKey: boolean) => Promise<boolean>;
    onModelSelect?: (value: string) => void;
    historyProvider?: ProviderKey;
    onStartModelChat?: () => void;
    selectedModelKey?: string;
    personalApiKey?: string;
    onPersonalApiKeyChange?: (value: string) => void;
}

export function AgentChat({
    initialPrompt,
    initialDraft,
    onClose,
    onMinimize,
    onComplete,
    onMessagesChange,
    existingMessages,
    modelSelection,
    canUseConfiguredKeys,
    verifySession,
    onModelSelect,
    historyProvider,
    onStartModelChat,
    selectedModelKey,
    personalApiKey,
    onPersonalApiKeyChange,
}: AgentChatProps) {
    const { language } = useLanguage();
    const { settings } = useSettings();
    const { pricing } = useModelPricing();
    const { checkBudget, trackUsage } = useQuotaManager();
    const provider = modelSelection?.provider ?? settings.preferences.defaultProvider;
    const providerSettings = settings.providers[provider];
    const modelId = modelSelection?.model ?? providerSettings?.selectedModel;
    const modelName = AVAILABLE_MODELS[provider]?.find(option => option.id === modelId)?.name;
    const usesPersonalKey = !!modelSelection && !!personalApiKey?.trim();
    const providerChanged = historyProvider !== undefined && historyProvider !== provider;
    const chatKey = modelSelection ? selectedModelKey : canUseConfiguredKeys !== false ? providerSettings?.apiKey : undefined;
    const demoWithoutKey = process.env.NEXT_PUBLIC_CVF_MOCK_AI === '1' && canUseConfiguredKeys !== false;
    const missingChatKey = !chatKey?.trim() && !demoWithoutKey;
    const revealLinkDestination = onMinimize ?? onClose;

    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showDecisionLog, setShowDecisionLog] = useState(false);
    const [showGovernancePanel, setShowGovernancePanel] = useState(false);
    const [governanceState, setGovernanceState] = useState<GovernanceState | undefined>(undefined);
    const [lastSanitization, setLastSanitization] = useState<SanitizationResult | null>(null);
    const [safetyBlocked, setSafetyBlocked] = useState(false);

    const handleGovernanceStateChange = useCallback((state: GovernanceState) => {
        setGovernanceState(state);
    }, []);

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
        initialDraft,
        existingMessages,
        language,
        settings,
        modelSelection,
        canUseConfiguredKeys,
        verifySession,
        usesPersonalKey,
        historyProvider,
        selectedModelKey,
        labels: l,
        onComplete,
        onClose,
        onMessagesChange,
        governanceState,
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
                        defaultProvider={provider}
                        modelName={modelName}
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
                    {(missingChatKey || provider === 'alibaba') && <p role="status" className="px-4 py-2 text-sm">
                        {provider === 'alibaba' ? (language === 'vi' ? 'Trợ lý này chưa hỗ trợ nhà cung cấp đã chọn. Hãy chọn model khác.' : 'This assistant does not support the selected provider. Choose another model.') : (language === 'vi' ? 'Chưa có khóa AI dùng được cho model này.' : 'No usable AI key is configured for this model.')} {' '}
                        <Link href="/help/setup" onClick={revealLinkDestination} className="underline text-indigo-600 dark:text-indigo-300">{language === 'vi' ? 'Xem hướng dẫn cài đặt' : 'View setup instructions'}</Link>
                    </p>}
                    {onModelSelect && (
                        <div className="shrink-0 border-b border-gray-200 px-4 py-2 dark:border-white/[0.07]">
                            <label className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-gray-800 dark:text-gray-100">
                                <span>{language === 'vi' ? 'Model trợ lý' : 'Assistant model'}</span>
                                <select
                                    value={modelSelection ? `${modelSelection.provider}:${modelSelection.model}` : ''}
                                    onChange={event => onModelSelect(event.target.value)}
                                    disabled={isLoading || isStreaming}
                                    className="min-h-11 min-w-0 max-w-full rounded-lg border border-gray-300 bg-white px-2 dark:border-gray-700 dark:bg-gray-900"
                                >
                                    <option value="">{language === 'vi' ? 'Theo cài đặt hiện tại' : 'Use current settings'}</option>
                                    {AGENT_CHAT_PROVIDERS.map(id => (
                                        <optgroup key={id} label={PROVIDER_NAMES[id]}>
                                            {AVAILABLE_MODELS[id].map(option => (
                                                <option key={option.id} value={`${id}:${option.id}`}>{option.name}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </label>
                            {providerChanged && (
                                <div role="status" className="flex flex-wrap items-center gap-x-3 text-sm text-gray-700 dark:text-gray-300">
                                    {language === 'vi'
                                        ? 'Mở cuộc trò chuyện mới để dùng nhà cung cấp vừa chọn.'
                                        : 'Start a new chat to use the selected provider.'}
                                    <button type="button" onClick={onStartModelChat} className="min-h-11 font-semibold underline">
                                        {language === 'vi' ? 'Mở chat mới' : 'Start a new chat'}
                                    </button>
                                </div>
                            )}
                            {modelSelection && onPersonalApiKeyChange && (
                                <details className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                                    <summary className="cursor-pointer py-2">
                                        {selectedModelKey
                                            ? language === 'vi' ? 'Đổi khóa API cho lượt chat này' : 'Use a different API key for this chat'
                                            : language === 'vi' ? 'Nhập khóa API để dùng model này' : 'Enter an API key to use this model'}
                                    </summary>
                                    <label className="block">
                                        <span>{PROVIDER_NAMES[modelSelection.provider]} API key</span>
                                        <input
                                            type="password"
                                            value={personalApiKey ?? ''}
                                            autoComplete="off"
                                            onChange={event => onPersonalApiKeyChange(event.target.value)}
                                            className="mt-1 block min-h-11 w-full rounded-lg border border-gray-300 bg-white px-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                        />
                                    </label>
                                    <p className="mt-1">
                                        {language === 'vi'
                                            ? 'Khóa chỉ giữ đến khi đóng chat. Lượt chạy dùng hạn mức và giá của tài khoản API.'
                                            : 'The key is kept until you close the chat. Runs use your API account’s limits and pricing.'}
                                    </p>
                                </details>
                            )}
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-4 space-y-2" aria-live="polite">
                        {messages.length === 0 && !isLoading && (
                            <div className="flex flex-col items-center justify-center h-full text-center px-4">
                                <div className="text-5xl mb-4">🤖</div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                    {language === 'vi' ? 'Bạn cần giúp gì?' : 'What can I help with?'}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                                    {language === 'vi'
                                        ? 'Hãy hỏi bất cứ điều gì — tôi có thể giúp bạn lập kế hoạch, phân tích, viết nội dung và nhiều hơn nữa.'
                                        : 'Ask me anything — I can help you plan, analyze, write content, and much more.'}
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                                    {(language === 'vi' ? [
                                        '📝 Viết kế hoạch kinh doanh cho startup',
                                        '🔍 Phân tích SWOT cho dự án mới',
                                        '💡 Gợi ý chiến lược marketing',
                                        '📊 Tạo báo cáo phân tích dữ liệu',
                                        '🎨 Thiết kế giao diện ứng dụng',
                                        '🛡️ Đánh giá bảo mật hệ thống',
                                    ] : [
                                        '📝 Write a business plan for a startup',
                                        '🔍 SWOT analysis for a new project',
                                        '💡 Suggest a marketing strategy',
                                        '📊 Create a data analysis report',
                                        '🎨 Design an application interface',
                                        '🛡️ Security assessment for a system',
                                    ]).map((prompt, i) => (
                                        <button
                                            key={i}
                                            onClick={() => { const text = prompt.replace(/^[^\s]+\s/, ''); setInput(text); setTimeout(() => handleSendMessage(), 100); }}
                                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const text = prompt.replace(/^[^\s]+\s/, ''); setInput(text); setTimeout(() => handleSendMessage(), 100); } }}
                                            className="text-left text-sm px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 
                                                       hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-700
                                                       text-gray-700 dark:text-gray-300 transition-colors"
                                            title={language === 'vi' ? 'Nhấn Enter để chọn' : 'Press Enter to select'}
                                        >
                                            {prompt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map(message => (
                            <AgentChatMessageBubble
                                key={message.id}
                                message={message}
                                onAccept={handleAccept}
                                onReject={handleReject}
                                onRetry={handleRetry}
                                onFollowLink={revealLinkDestination}
                                language={language}
                                pricing={pricing}
                            />
                        ))}

                        {isLoading && !isStreaming && <TypingIndicator />}

                        <div ref={messagesEndRef} />
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900
                                    sticky bottom-0 sm:static safe-area-pb">
                        {/* CVF Governance Toolbar */}
                        <div className="mb-3">
                            <GovernanceBar
                                onStateChange={handleGovernanceStateChange}
                                compact
                                plainLabels
                                lastMessage={input}
                            />
                        </div>

                        {/* Safety Status Indicator */}
                        {lastSanitization && lastSanitization.threats.length > 0 && (
                            <div className={`mb-2 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 ${safetyBlocked ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'}`}>
                                <span>{safetyBlocked ? '🔴' : '🟡'}</span>
                                <span>
                                    {safetyBlocked
                                        ? (language === 'vi' ? 'Prompt bị chặn — phát hiện mối đe dọa nghiêm trọng' : 'Prompt blocked — critical threat detected')
                                        : (language === 'vi' ? `Phát hiện ${lastSanitization.threats.length} patterns cần chú ý` : `${lastSanitization.threats.length} suspicious pattern(s) detected`)}
                                </span>
                            </div>
                        )}
                        {lastSanitization && lastSanitization.threats.length === 0 && (
                            <div className="mb-2 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                                <span>🛡️</span>
                                <span>{language === 'vi' ? 'Prompt đã được kiểm tra — An toàn' : 'Prompt checked — Safe'}</span>
                            </div>
                        )}

                        <ChatInput
                            input={input}
                            onInputChange={(val) => { setInput(val); setLastSanitization(null); setSafetyBlocked(false); }}
                            onSend={() => {
                                // Safety check before sending
                                const result = sanitizePrompt(input);
                                setLastSanitization(result);
                                if (result.blocked) {
                                    setSafetyBlocked(true);
                                    return; // Don't send blocked prompts
                                }
                                // Also check governance policy
                                if (governanceState) {
                                    const safeRisk = (governanceState.riskLevel === 'R4' ? 'R3' : governanceState.riskLevel) as 'R0' | 'R1' | 'R2' | 'R3';
                                    const score = riskLevelToScore(safeRisk);
                                    const policy = evaluatePolicy(score);
                                    if (policy.decision === 'BLOCK') {
                                        setSafetyBlocked(true);
                                        return;
                                    }
                                }
                                setSafetyBlocked(false);
                                // Send sanitized content to enforce strip/block policy
                                handleSendMessage(result.sanitized);
                            }}
                            isLoading={isLoading}
                            attachedFile={attachedFile}
                            onRemoveAttachment={handleRemoveAttachment}
                            onFileSelected={handleFileSelected}
                            language={language}
                            placeholder={l.placeholder}
                            sendLabel={l.send}
                        />

                        {messages.length > 0 && (
                            <div className="flex justify-between items-center mt-3">
                                <button
                                    onClick={() => setShowGovernancePanel(prev => !prev)}
                                    aria-expanded={showGovernancePanel}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                                        ${governanceState?.toolkitEnabled
                                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200'
                                        }`}
                                >
                                    <span aria-hidden="true">🛡️</span> {language === 'vi' ? 'Kiểm tra kết quả' : 'Review checks'}
                                </button>
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

            {/* Governance Panel (Self-UAT sidebar) */}
            {governanceState && (
                <GovernancePanel
                    governanceState={governanceState}
                    onRunSelfUAT={async (prompt: string) => {
                        if (providerChanged) {
                            throw new Error(language === 'vi' ? 'Hãy mở chat mới để đổi nhà cung cấp.' : 'Start a new chat to change provider.');
                        }
                        if (provider === 'alibaba') {
                            throw new Error(language === 'vi' ? 'Hãy dùng Qwen từ Trang chủ để kiểm tra hạn mức miễn phí.' : 'Use Qwen from Home to enforce the free quota.');
                        }
                        const apiKey = modelSelection
                            ? selectedModelKey
                            : canUseConfiguredKeys !== false ? providerSettings?.apiKey : undefined;
                        if (!apiKey) {
                            throw new Error(language === 'vi' ? 'Chưa cấu hình API key' : 'No API key configured');
                        }
                        if (!checkBudget().ok) {
                            throw new Error(language === 'vi' ? 'Đã vượt ngân sách sử dụng AI.' : 'AI usage budget exceeded.');
                        }
                        if (verifySession && !await verifySession(!usesPersonalKey)) {
                            throw new Error(language === 'vi' ? 'Phiên đăng nhập đã thay đổi. Hãy mở lại trợ lý AI.' : 'Your session changed. Reopen the AI assistant.');
                        }
                        const { createAIProvider } = await import('@/lib/ai-providers');
                        const { buildGovernanceSystemPrompt } = await import('@/lib/governance-context');
                        const aiProvider = createAIProvider(provider, { apiKey, model: modelId, language });
                        const systemPrompt = buildGovernanceSystemPrompt(governanceState, language);
                        const msgs = [
                            { role: 'system' as const, content: systemPrompt },
                            { role: 'user' as const, content: prompt },
                        ];
                        let response = '';
                        const result = await aiProvider.chat(msgs, (chunk) => { response += chunk.text; });
                        trackUsage(
                            provider,
                            modelId || result.model,
                            result.usage?.promptTokens ?? Math.ceil((systemPrompt.length + prompt.length) / 4),
                            result.usage?.completionTokens ?? Math.ceil((result.text || response).length / 4),
                        );
                        return result.text || response;
                    }}
                    isOpen={showGovernancePanel}
                    onClose={() => setShowGovernancePanel(false)}
                />
            )}
        </>
    );
}

export type { ChatMessage } from '@/lib/agent-chat';

export function AgentChatButton({ onClick }: { onClick: () => void }) {
    const { language } = useLanguage();
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
            title={language === 'vi' ? 'Mở trợ lý AI' : 'Open AI assistant'}
        >
            <span aria-hidden="true" className="text-3xl">🤖</span>
            <span className="text-lg font-bold">{language === 'vi' ? 'Trợ lý AI' : 'AI assistant'}</span>
            <svg aria-hidden="true" className="w-5 h-5 ml-2 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        </button>
    );
}
