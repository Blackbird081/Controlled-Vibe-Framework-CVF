'use client';

// Text Encoding Exception: existing bilingual user-facing mode labels are preserved.

import { useCallback, useEffect, useRef, useState } from 'react';
import { createAIProvider, AIMessage, AIProvider } from '@/lib/ai-providers';
import {
    AssistantRateLimitError,
    assistantRateLimitMessage,
    assistantRetryDelaySeconds,
    MAX_ASSISTANT_RETRY_DELAY_SECONDS,
    waitForAssistantRetry,
} from '@/lib/assistant-rate-limit';
import { useQuotaManager, ProviderKey } from '@/lib/quota-manager';
import { checkResponseGovernance } from '@/lib/governance-post-check';
import { GOVERNED_ROUTE_DEFAULT_MODEL, GOVERNED_ROUTE_DEFAULT_PROVIDER } from '@/lib/governed-route-providers';
import { type AgentModelSelection } from '@/lib/agent-model-catalog';
import { hasPhysicalSafetyConcern, normalizeRequestText, PHYSICAL_SAFETY_GUIDANCE } from '@/lib/physical-safety';
import {
    calculateQualityScore,
    shouldRequireAcceptance,
    AcceptanceStatus,
} from '@/lib/governance';
import {
    createDecisionLogEntry,
    CVFPhase,
    detectCurrentPhase,
    DecisionLogEntry,
    autoCheckItems,
    calculatePhaseCompliance,
} from '@/lib/cvf-checklists';
import { ChatMessage, CVFMode, MODE_CONFIG, detectSpecMode } from '@/lib/agent-chat';
import { evaluateEnforcement } from '@/lib/enforcement';
import { calculateFactualScore } from '@/lib/factual-scoring';
import { logEnforcementDecision, logPreUatFailure } from '@/lib/enforcement-log';
import { usePhaseDetection } from './usePhaseDetection';
import {
    GovernanceState,
    DEFAULT_GOVERNANCE_STATE,
    buildGovernanceSystemPrompt,
    loadGovernanceState,
} from '@/lib/governance-context';

interface AgentChatSettings {
    preferences: { defaultProvider: ProviderKey };
    providers: Record<ProviderKey, { apiKey: string; selectedModel: string }>;
}

interface AgentChatLabels {
    placeholder: string;
    send: string;
    complete: string;
    noApiKey: string;
    connectionError: string;
    modelLabel: string;
    retryMessage: string;
}

interface UseAgentChatOptions {
    initialPrompt?: string;
    initialDraft?: string;
    existingMessages?: ChatMessage[];
    language: 'vi' | 'en';
    settings: AgentChatSettings;
    modelSelection?: AgentModelSelection | null;
    canUseConfiguredKeys?: boolean;
    verifySession?: (usesConfiguredKey: boolean) => Promise<boolean>;
    usesPersonalKey?: boolean;
    historyProvider?: ProviderKey;
    selectedModelKey?: string;
    labels: AgentChatLabels;
    onComplete?: (messages: ChatMessage[]) => void;
    onClose?: () => void;
    onMessagesChange?: (messages: ChatMessage[]) => void;
    governanceState?: GovernanceState;
}

const ALLOWED_FILE_TYPES = ['.txt', '.md', '.json', '.js', '.ts', '.tsx', '.css', '.html', '.py', '.yaml', '.yml'];
const MAX_FILE_SIZE_BYTES = 100 * 1024;

function budgetExceededMessage(language: 'vi' | 'en'): string {
    return language === 'vi'
        ? '🚫 Đã vượt ngân sách. Hãy tăng ngân sách hoặc chờ đến kỳ tiếp theo.'
        : '🚫 Budget exceeded. Please increase budget or wait for reset before continuing.';
}

export function useAgentChat({
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
    labels,
    onComplete,
    onClose,
    onMessagesChange,
    governanceState: externalGovernanceState,
}: UseAgentChatOptions) {
    const [governanceState, setGovernanceState] = useState<GovernanceState>(() =>
        externalGovernanceState || loadGovernanceState() || DEFAULT_GOVERNANCE_STATE
    );
    const governanceStateRef = useRef<GovernanceState>(governanceState);

    useEffect(() => {
        governanceStateRef.current = governanceState;
    }, [governanceState]);

    const [previousExternalGovernanceState, setPreviousExternalGovernanceState] = useState(externalGovernanceState);
    if (previousExternalGovernanceState !== externalGovernanceState) {
        setPreviousExternalGovernanceState(externalGovernanceState);
        if (externalGovernanceState) setGovernanceState(externalGovernanceState);
    }
    const { trackUsage, checkBudget } = useQuotaManager();
    const { detectPhase } = usePhaseDetection();

    const [messages, setMessages] = useState<ChatMessage[]>(existingMessages || []);
    const [input, setInput] = useState(initialDraft ?? '');
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
    const [currentMode, setCurrentMode] = useState<CVFMode>('simple');
    const currentModeRef = useRef<CVFMode>('simple');
    const [phaseGate, setPhaseGate] = useState<{ show: boolean; phase: CVFPhase | null; response: string }>({
        show: false,
        phase: null,
        response: '',
    });
    const [decisionLog, setDecisionLog] = useState<DecisionLogEntry[]>([]);

    const handledPromptRef = useRef<string | null>(null);
    const chatLifetimeRef = useRef<AbortController | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        chatLifetimeRef.current = controller;
        return () => controller.abort();
    }, []);

    useEffect(() => {
        if (onMessagesChange && messages.length > 0) {
            onMessagesChange(messages);
        }
    }, [messages, onMessagesChange]);

    useEffect(() => {
        currentModeRef.current = currentMode;
    }, [currentMode]);

    const addDecisionEntry = useCallback((entry: DecisionLogEntry | null) => {
        if (!entry) return;
        setDecisionLog(prev => [entry, ...prev]);
    }, []);

    const resolvePhaseForMessage = useCallback((messageId: string): CVFPhase | null => {
        const message = messages.find(m => m.id === messageId);
        const metaPhase = message?.metadata?.phase;
        if (metaPhase && ['INTAKE', 'DESIGN', 'BUILD', 'REVIEW', 'FREEZE'].includes(metaPhase)) {
            return metaPhase as CVFPhase;
        }
        if (message?.content) {
            return detectCurrentPhase(message.content);
        }
        return null;
    }, [messages]);

    const callRealAI = useCallback(async (
        messageId: string,
        userContent: string,
        provider: AIProvider,
        apiKey: string,
        model: string
    ) => {
        const lifetime = chatLifetimeRef.current;
        if (!lifetime || lifetime.signal.aborted) return;
        const { signal } = lifetime;
        const aiMessages: AIMessage[] = messages
            .filter(m => m.role !== 'system')
            .map(m => ({ role: m.role, content: m.content }));

        // Inject CVF Governance Toolkit system prompt
        const govState = governanceStateRef.current;
        if (govState.toolkitEnabled) {
            aiMessages.unshift({
                role: 'system' as const,
                content: buildGovernanceSystemPrompt(govState, language),
            });
        }

        aiMessages.push({ role: 'user', content: userContent });

        const aiProvider = createAIProvider(provider, { apiKey, language, model });
        let fullText = '';

        async function sendToProvider(allowRetry: boolean): Promise<Awaited<ReturnType<typeof aiProvider.chat>> | null> {
            if (verifySession && !await verifySession(!usesPersonalKey)) {
                throw new Error('Agent account no longer verified');
            }
            if (signal.aborted) return null;
            if (!allowRetry && !checkBudget().ok) {
                const content = budgetExceededMessage(language);
                setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content, status: 'error' } : m));
                return null;
            }

            try {
                return await aiProvider.chat(aiMessages, (chunk) => {
                    if (!chunk.isComplete && chunk.text) {
                        fullText += chunk.text;
                        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: fullText } : m));
                    }
                });
            } catch (error: unknown) {
                if (!(error instanceof AssistantRateLimitError)) throw error;
                if (signal.aborted) return null;

                const delay = assistantRetryDelaySeconds(error.retryAfter);
                if (allowRetry && !fullText && delay <= MAX_ASSISTANT_RETRY_DELAY_SECONDS) {
                    const content = assistantRateLimitMessage(language === 'vi', 'waiting', delay);
                    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content } : m));
                    if (await waitForAssistantRetry(delay, signal)) return sendToProvider(false);
                    return null;
                }

                const notice = assistantRateLimitMessage(
                    language === 'vi', fullText ? 'interrupted' : 'limited', error.retryAfter ? delay : undefined,
                );
                const content = fullText ? `${fullText}

${notice}` : notice;
                setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content, status: 'error' } : m));
                return null;
            }
        }

        const response = await sendToProvider(true);
        if (!response || signal.aborted) return;

        const detectedPhase = detectPhase(response.text || fullText);
        const phaseLabel = detectedPhase || 'Processing';

        const effectiveMode = currentModeRef.current;
        const qualityScore = shouldRequireAcceptance(effectiveMode)
            ? calculateQualityScore(response.text || fullText, effectiveMode)
            : undefined;

        const factual = calculateFactualScore(response.text || fullText, userContent);
        let preUatStatus: 'PASS' | 'FAIL' | undefined;
        let preUatScore: number | undefined;
        if (shouldRequireAcceptance(effectiveMode) && qualityScore) {
            const complianceScore = detectedPhase
                ? calculatePhaseCompliance(detectedPhase as CVFPhase, autoCheckItems(detectedPhase as CVFPhase, response.text || fullText)).score
                : qualityScore.compliance;
            preUatScore = Math.round((qualityScore.overall + complianceScore + factual.score) / 3);
            preUatStatus = preUatScore >= 70 && factual.score >= 50 ? 'PASS' : 'FAIL';
        }

        const acceptanceStatus: AcceptanceStatus | undefined = shouldRequireAcceptance(effectiveMode)
            ? 'pending'
            : undefined;

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
                            phase: phaseLabel,
                            qualityScore,
                            acceptanceStatus,
                            preUatStatus,
                            preUatScore,
                            factualScore: factual.score,
                            factualRisk: factual.risk,
                        }
                    }
                    : m
            )
        );

        const inputTokens = response.usage?.promptTokens ?? aiMessages.reduce((sum, m) => sum + Math.ceil(m.content.length / 4), 0);
        const outputTokens = response.usage?.completionTokens ?? Math.ceil((response.text || fullText).length / 4);
        trackUsage(provider as ProviderKey, model, inputTokens, outputTokens);

        if (effectiveMode === 'full' && detectedPhase) {
            setPhaseGate({
                show: true,
                phase: detectedPhase,
                response: response.text || fullText,
            });
        }

        if (preUatStatus === 'FAIL') {
            logPreUatFailure({
                phase: detectedPhase,
                factualScore: factual.score,
                preUatScore,
            });
            const warnMessage: ChatMessage = {
                id: `msg_${Date.now() + 2}`,
                role: 'system',
                content: language === 'vi'
                    ? '⚠️ Kiểm tra tự động phát hiện điểm cần sửa. Hãy yêu cầu chỉnh sửa trước khi chấp nhận câu trả lời.'
                    : '⚠️ The automatic check found issues. Ask for a revision before accepting the reply.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, warnMessage]);
        }

        // Governance post-processing check
        if (govState.toolkitEnabled) {
            const govCheck = checkResponseGovernance(response.text || fullText, userContent, language);
            if (govCheck.violations.length > 0 || govCheck.suggestions.length > 0) {
                const parts: string[] = [
                    ...govCheck.violations.map(v => v.message),
                    ...govCheck.suggestions,
                ];
                const govMessage: ChatMessage = {
                    id: `msg_${Date.now() + 4}`,
                    role: 'system',
                    content: parts.join('\n\n'),
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, govMessage]);
            }
        }
    }, [messages, language, detectPhase, trackUsage, checkBudget, usesPersonalKey, verifySession]);

    const handleSendMessage = useCallback(async (messageContent?: string) => {
        const content = messageContent || input.trim();
        if (!content || isLoading) return;

        if (hasPhysicalSafetyConcern(normalizeRequestText(content))) {
            const now = Date.now();
            setMessages(prev => [...prev, {
                id: `msg_${now}`,
                role: 'user',
                content,
                timestamp: new Date(now),
                status: 'complete',
            }, {
                id: `msg_${now + 1}`,
                role: 'assistant',
                content: PHYSICAL_SAFETY_GUIDANCE[language],
                timestamp: new Date(now),
                status: 'complete',
            }]);
            setInput('');
            return;
        }

        let provider = modelSelection?.provider ?? settings.preferences.defaultProvider;
        let apiKey = modelSelection
            ? selectedModelKey
            : canUseConfiguredKeys !== false ? settings.providers[provider]?.apiKey : undefined;

        if (!modelSelection && !apiKey && canUseConfiguredKeys !== false) {
            try {
                const freshSettings = JSON.parse(localStorage.getItem('cvf_settings') || '{}');
                provider = freshSettings.preferences?.defaultProvider || GOVERNED_ROUTE_DEFAULT_PROVIDER;
                apiKey = freshSettings.providers?.[provider]?.apiKey;
            } catch {
                apiKey = '';
            }
        }

        const selectedModel = modelSelection?.model ?? (settings.providers[provider]?.selectedModel || GOVERNED_ROUTE_DEFAULT_MODEL);

        const providerChanged = historyProvider !== undefined && historyProvider !== provider;
        const demoWithoutKey = process.env.NEXT_PUBLIC_CVF_MOCK_AI === '1' && canUseConfiguredKeys !== false;
        if ((!apiKey && !demoWithoutKey) || provider === 'alibaba' || providerChanged) {
            let contentForUser = labels.noApiKey;
            if (modelSelection) {
                contentForUser = language === 'vi' ? 'Hãy nhập khóa API cho nhà cung cấp của model đã chọn.' : 'Enter an API key for the selected model’s provider.';
            } else if (canUseConfiguredKeys === false) {
                contentForUser = language === 'vi' ? 'Hãy chọn model rồi nhập khóa API của bạn.' : 'Choose a model, then enter your API key.';
            }
            if (provider === 'alibaba') {
                contentForUser = language === 'vi' ? 'Hãy dùng Qwen từ Trang chủ để kiểm tra hạn mức miễn phí.' : 'Use Qwen from Home to enforce the free quota.';
            }
            if (providerChanged) {
                contentForUser = language === 'vi' ? 'Hãy mở chat mới để đổi nhà cung cấp.' : 'Start a new chat to change provider.';
            }
            const errorMsg: ChatMessage = {
                id: `msg_${Date.now()}`,
                role: 'system',
                content: `⚠️ ${contentForUser}`,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMsg]);
            if (modelSelection) setInput(content);
            return;
        }

        let finalContent = content;
        if (attachedFile) {
            finalContent = `${content}

---

📎 **File: ${attachedFile.name}**

\`\`\`
${attachedFile.content}
\`\`\``;
        }

        const userMessage: ChatMessage = {
            id: `msg_${Date.now()}`,
            role: 'user',
            content: finalContent,
            timestamp: new Date(),
            status: 'complete',
        };

        setMessages(prev => [...prev, userMessage]);

        const govState = governanceStateRef.current;
        const budgetStatus = checkBudget();
        const enforcement = evaluateEnforcement({
            mode: currentModeRef.current,
            content: finalContent,
            budgetOk: budgetStatus.ok,
            cvfPhase: govState.phase,
            cvfRiskLevel: govState.riskLevel,
            requiresSkillPreflight: Boolean(govState.toolkitEnabled && govState.phase === 'BUILD'),
        });
        logEnforcementDecision({
            source: 'agent_chat',
            mode: currentModeRef.current,
            enforcement,
            context: {
                hasFile: Boolean(attachedFile),
                provider,
            },
        });

        if (enforcement.status === 'BLOCK') {
            if (!budgetStatus.ok) {
                const budgetMessage: ChatMessage = {
                    id: `msg_${Date.now() + 1}`,
                    role: 'system',
                    content: budgetExceededMessage(language),
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, budgetMessage]);
            } else if (enforcement.riskGate?.status === 'BLOCK') {
                const blockMessage: ChatMessage = {
                    id: `msg_${Date.now() + 1}`,
                    role: 'system',
                    content: language === 'vi'
                        ? `⛔ Yêu cầu bị chặn do rủi ro ${enforcement.riskGate.riskLevel}. Hãy dùng chế độ Có quy tắc hoặc Quy trình đầy đủ, hoặc giảm rủi ro.`
                        : `⛔ Request blocked due to risk ${enforcement.riskGate.riskLevel}. Use the work rules or full workflow mode, or reduce the risk.`,
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, blockMessage]);
            } else if (enforcement.skillPreflight?.required && !enforcement.skillPreflight.declared) {
                const blockMessage: ChatMessage = {
                    id: `msg_${Date.now() + 1}`,
                    role: 'system',
                    content: language === 'vi'
                        ? '⛔ Thiếu Skill Preflight declaration cho Build/Execute. Hãy khai báo SKILL_PREFLIGHT_RECORD trước khi tiếp tục.'
                        : '⛔ Missing Skill Preflight declaration for Build/Execute. Declare SKILL_PREFLIGHT_RECORD before continuing.',
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, blockMessage]);
            } else {
                const blockMessage: ChatMessage = {
                    id: `msg_${Date.now() + 1}`,
                    role: 'system',
                    content: language === 'vi'
                        ? '⛔ Spec chưa đạt yêu cầu tối thiểu. Vui lòng bổ sung thông tin còn thiếu.'
                        : '⛔ Spec is incomplete. Please provide missing information before continuing.',
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, blockMessage]);
            }
            setInput('');
            setAttachedFile(null);
            return;
        }

        if (enforcement.status === 'CLARIFY') {
            const clarifyMessage: ChatMessage = {
                id: `msg_${Date.now() + 1}`,
                role: 'system',
                content: language === 'vi'
                    ? '❓ Spec còn thiếu thông tin quan trọng. Vui lòng làm rõ trước khi tiếp tục.'
                    : '❓ Spec is missing key details. Please clarify before continuing.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, clarifyMessage]);
            setInput('');
            setAttachedFile(null);
            return;
        }

        if (enforcement.status === 'NEEDS_APPROVAL' && enforcement.riskGate) {
            const prompt = language === 'vi'
                ? `Rủi ro ${enforcement.riskGate.riskLevel} yêu cầu xác nhận của con người trước khi chạy. Bạn có muốn tiếp tục?`
                : `Risk ${enforcement.riskGate.riskLevel} requires human approval before execution. Continue?`;
            const approved = typeof window === 'undefined' ? true : window.confirm(prompt);
            if (!approved) {
                const approvalMessage: ChatMessage = {
                    id: `msg_${Date.now() + 2}`,
                    role: 'system',
                    content: language === 'vi'
                        ? `⏸️ Đã dừng. Chưa có xác nhận cho rủi ro ${enforcement.riskGate.riskLevel}.`
                        : `⏸️ Execution halted. No approval for risk ${enforcement.riskGate.riskLevel}.`,
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, approvalMessage]);
                setInput('');
                setAttachedFile(null);
                return;
            }
        }

        setInput('');
        setAttachedFile(null);
        setIsLoading(true);

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
            await callRealAI(assistantId, content, provider as AIProvider, apiKey ?? '', selectedModel);
        } catch {
            setMessages(prev => prev.map(m =>
                m.id === assistantId
                    ? { ...m, content: `❌ ${labels.connectionError}`, status: 'error' }
                    : m
            ));
        } finally {
            setIsLoading(false);
            setIsStreaming(false);
        }
    }, [attachedFile, callRealAI, canUseConfiguredKeys, checkBudget, historyProvider, input, isLoading, labels, language, modelSelection, selectedModelKey, settings]);

    useEffect(() => {
        if (initialPrompt && handledPromptRef.current !== initialPrompt) {
            const timer = setTimeout(() => {
                handledPromptRef.current = initialPrompt;

                const detectedMode = detectSpecMode(initialPrompt);
                currentModeRef.current = detectedMode;
                setCurrentMode(detectedMode);

                const modeInfo = language === 'vi'
                    ? MODE_CONFIG[detectedMode].label
                    : MODE_CONFIG[detectedMode].labelEn;

                const systemMessage: ChatMessage = {
                    id: `msg_${Date.now()}`,
                    role: 'system',
                    content: language === 'vi'
                        ? `Chế độ trò chuyện: ${modeInfo}`
                        : `Chat mode: ${modeInfo}`,
                    timestamp: new Date(),
                };
                setMessages((prev) => [...prev, systemMessage]);

                void handleSendMessage(initialPrompt);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [initialPrompt, language, handleSendMessage]);

    const handleComplete = useCallback(() => {
        onComplete?.(messages);
        onClose?.();
    }, [messages, onComplete, onClose]);

    const handleAccept = useCallback((messageId: string) => {
        setMessages(prev =>
            prev.map(m =>
                m.id === messageId
                    ? { ...m, metadata: { ...m.metadata, acceptanceStatus: 'accepted' as AcceptanceStatus } }
                    : m
            )
        );

        const phase = resolvePhaseForMessage(messageId);
        addDecisionEntry(phase ? createDecisionLogEntry(phase, 'checklist_updated', 'Accepted response') : null);
    }, [addDecisionEntry, resolvePhaseForMessage]);

    const handleReject = useCallback((messageId: string) => {
        setMessages(prev =>
            prev.map(m =>
                m.id === messageId
                    ? { ...m, metadata: { ...m.metadata, acceptanceStatus: 'rejected' as AcceptanceStatus } }
                    : m
            )
        );

        const phase = resolvePhaseForMessage(messageId);
        addDecisionEntry(phase ? createDecisionLogEntry(phase, 'checklist_updated', 'Rejected response') : null);
    }, [addDecisionEntry, resolvePhaseForMessage]);

    const handleRetry = useCallback((messageId: string) => {
        setMessages(prev =>
            prev.map(m =>
                m.id === messageId
                    ? { ...m, metadata: { ...m.metadata, acceptanceStatus: 'retry' as AcceptanceStatus } }
                    : m
            )
        );

        const phase = resolvePhaseForMessage(messageId);
        addDecisionEntry(phase ? createDecisionLogEntry(phase, 'retry_requested', 'Retry requested') : null);

        const lastUserMessage = messages.filter(m => m.role === 'user').pop();
        if (lastUserMessage) {
            setTimeout(() => {
                handleSendMessage(`${lastUserMessage.content}\n\n${labels.retryMessage}`);
            }, 100);
        }
    }, [addDecisionEntry, handleSendMessage, labels.retryMessage, messages, resolvePhaseForMessage]);

    const handleFileSelected = useCallback((file: File) => {
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (!ALLOWED_FILE_TYPES.includes(ext)) {
            alert(language === 'vi'
                ? `Chỉ hỗ trợ các định dạng: ${ALLOWED_FILE_TYPES.join(', ')}`
                : `Only these formats are supported: ${ALLOWED_FILE_TYPES.join(', ')}`
            );
            return;
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
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
    }, [language]);

    const handlePhaseGateApprove = useCallback(() => {
        setPhaseGate({ show: false, phase: null, response: '' });

        if (phaseGate.phase) {
            addDecisionEntry(createDecisionLogEntry(phaseGate.phase, 'gate_approved', 'Phase approved'));
        }

        const approvalMessage: ChatMessage = {
            id: `msg_${Date.now()}`,
            role: 'system',
            content: `✅ Phase ${phaseGate.phase} approved. AI may proceed to next phase.`,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, approvalMessage]);
    }, [addDecisionEntry, phaseGate.phase]);

    const handlePhaseGateReject = useCallback(() => {
        setPhaseGate({ show: false, phase: null, response: '' });

        if (phaseGate.phase) {
            addDecisionEntry(createDecisionLogEntry(phaseGate.phase, 'gate_rejected', 'Phase rejected'));
        }

        const revisionMessage = `[Revision Request] Phase ${phaseGate.phase} needs revision. Please address the checklist requirements.`;
        handleSendMessage(revisionMessage);
    }, [addDecisionEntry, handleSendMessage, phaseGate.phase]);

    const handlePhaseGateClose = useCallback(() => {
        setPhaseGate({ show: false, phase: null, response: '' });
    }, []);

    const clearDecisionLog = useCallback(() => {
        setDecisionLog([]);
    }, []);

    return {
        messages,
        input,
        setInput,
        isLoading,
        isStreaming,
        attachedFile,
        currentMode,
        phaseGate,
        decisionLog,
        governanceState,
        setGovernanceState,
        handleSendMessage,
        handleAccept,
        handleReject,
        handleRetry,
        handleFileSelected,
        handleRemoveAttachment: () => setAttachedFile(null),
        handlePhaseGateApprove,
        handlePhaseGateReject,
        handlePhaseGateClose,
        handleComplete,
        clearDecisionLog,
    };
}
