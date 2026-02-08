'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createAIProvider, AIMessage } from '@/lib/ai-providers';
import { useQuotaManager, ProviderKey } from '@/lib/quota-manager';
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
    existingMessages?: ChatMessage[];
    language: 'vi' | 'en';
    settings: AgentChatSettings;
    labels: AgentChatLabels;
    onComplete?: (messages: ChatMessage[]) => void;
    onClose?: () => void;
    onMessagesChange?: (messages: ChatMessage[]) => void;
}

const ALLOWED_FILE_TYPES = ['.txt', '.md', '.json', '.js', '.ts', '.tsx', '.css', '.html', '.py', '.yaml', '.yml'];
const MAX_FILE_SIZE_BYTES = 100 * 1024;

export function useAgentChat({
    initialPrompt,
    existingMessages,
    language,
    settings,
    labels,
    onComplete,
    onClose,
    onMessagesChange,
}: UseAgentChatOptions) {
    const { trackUsage, checkBudget } = useQuotaManager();
    const { detectPhase } = usePhaseDetection();

    const [messages, setMessages] = useState<ChatMessage[]>(existingMessages || []);
    const [input, setInput] = useState('');
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
        if (metaPhase && ['Discovery', 'Design', 'Build', 'Review'].includes(metaPhase)) {
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
        provider: 'gemini' | 'openai' | 'anthropic',
        apiKey: string,
        model: string
    ) => {
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

        const inputTokens = aiMessages.reduce((sum, m) => sum + Math.ceil(m.content.length / 4), 0);
        const outputTokens = response.usage?.totalTokens || Math.ceil(fullText.length / 4);
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
                    ? '⚠️ Pre-UAT (Agent self-check) chưa đạt. Nên yêu cầu chỉnh sửa trước khi user đánh giá.'
                    : '⚠️ Pre-UAT (Agent self-check) failed. Request revisions before user evaluation.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, warnMessage]);
        }
    }, [messages, language, currentMode, detectPhase, trackUsage]);

    const handleSendMessage = useCallback(async (messageContent?: string) => {
        const content = messageContent || input.trim();
        if (!content || isLoading) return;

        let provider = settings.preferences.defaultProvider;
        let apiKey = settings.providers[provider]?.apiKey;

        if (!apiKey) {
            try {
                const freshSettings = JSON.parse(localStorage.getItem('cvf_settings') || '{}');
                provider = freshSettings.preferences?.defaultProvider || 'gemini';
                apiKey = freshSettings.providers?.[provider]?.apiKey;
            } catch {
                apiKey = '';
            }
        }

        const selectedModel = settings.providers[provider]?.selectedModel || 'gemini-2.5-flash';

        if (!apiKey) {
            const errorMsg: ChatMessage = {
                id: `msg_${Date.now()}`,
                role: 'system',
                content: `⚠️ ${labels.noApiKey}`,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMsg]);
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

        const budgetStatus = checkBudget();
        const enforcement = evaluateEnforcement({
            mode: currentModeRef.current,
            content: finalContent,
            budgetOk: budgetStatus.ok,
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
                    content: language === 'vi'
                        ? '🚫 Đã vượt budget. Vui lòng tăng budget hoặc chờ reset trước khi tiếp tục.'
                        : '🚫 Budget exceeded. Please increase budget or wait for reset before continuing.',
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, budgetMessage]);
            } else if (enforcement.riskGate?.status === 'BLOCK') {
                const blockMessage: ChatMessage = {
                    id: `msg_${Date.now() + 1}`,
                    role: 'system',
                    content: language === 'vi'
                        ? `⛔ Yêu cầu bị chặn do rủi ro ${enforcement.riskGate.riskLevel}. Vui lòng chuyển sang Governance/Full mode hoặc giảm rủi ro.`
                        : `⛔ Request blocked due to risk ${enforcement.riskGate.riskLevel}. Switch to Governance/Full mode or reduce risk.`,
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
            await callRealAI(assistantId, content, provider as 'gemini' | 'openai' | 'anthropic', apiKey, selectedModel);
        } catch (error) {
            setMessages(prev => prev.map(m =>
                m.id === assistantId
                    ? { ...m, content: `❌ ${labels.connectionError}`, status: 'error' }
                    : m
            ));
        } finally {
            setIsLoading(false);
            setIsStreaming(false);
        }
    }, [attachedFile, callRealAI, input, isLoading, labels, settings]);

    useEffect(() => {
        if (initialPrompt && handledPromptRef.current !== initialPrompt) {
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
                    ? `🚀 CVF Agent Mode bắt đầu | ${MODE_CONFIG[detectedMode].icon} ${modeInfo}`
                    : `🚀 CVF Agent Mode started | ${MODE_CONFIG[detectedMode].icon} ${modeInfo}`,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, systemMessage]);

            setTimeout(() => {
                handleSendMessage(initialPrompt);
            }, 500);
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
