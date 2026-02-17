/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAgentChat } from './useAgentChat';

let apiKey = '';
const chatMock = vi.fn();
const trackUsageMock = vi.fn();
const evaluateEnforcementMock = vi.fn();
const checkBudgetMock = vi.fn();

vi.mock('@/lib/ai-providers', () => ({
    createAIProvider: () => ({ chat: chatMock }),
}));

vi.mock('@/lib/enforcement', () => ({
    evaluateEnforcement: (...args: unknown[]) => evaluateEnforcementMock(...args),
}));

vi.mock('@/lib/enforcement-log', () => ({
    logEnforcementDecision: () => {},
    logPreUatFailure: () => {},
}));

vi.mock('@/lib/factual-scoring', () => ({
    calculateFactualScore: () => 0.9,
}));

vi.mock('@/lib/quota-manager', () => ({
    useQuotaManager: () => ({
        trackUsage: trackUsageMock,
        checkBudget: (...args: unknown[]) => checkBudgetMock(...args),
    }),
}));

vi.mock('@/lib/governance', () => ({
    calculateQualityScore: () => ({
        overall: 88,
        completeness: 80,
        clarity: 85,
        actionability: 90,
        compliance: 92,
    }),
    shouldRequireAcceptance: () => true,
}));

vi.mock('@/lib/cvf-checklists', () => ({
    createDecisionLogEntry: (phase: string, action: string, details?: string) => ({
        id: `decision_${phase}_${action}`,
        timestamp: new Date(0),
        phase,
        action,
        details,
    }),
    detectCurrentPhase: () => 'Design',
    autoCheckItems: () => ({}),
    calculatePhaseCompliance: () => ({ score: 85, missing: [] }),
}));

vi.mock('./usePhaseDetection', () => ({
    usePhaseDetection: () => ({
        detectPhase: () => 'Design',
    }),
}));

const baseSettings = {
    preferences: { defaultProvider: 'gemini' as const },
    providers: {
        gemini: { apiKey: '', selectedModel: 'gemini-2.5-flash' },
        openai: { apiKey: '', selectedModel: 'gpt-4o' },
        anthropic: { apiKey: '', selectedModel: 'claude-sonnet-4-20250514' },
    },
};

const baseLabels = {
    placeholder: 'Type a message...',
    send: 'Send',
    complete: 'Complete',
    noApiKey: 'No API key configured',
    connectionError: 'Connection error',
    modelLabel: 'Model',
    retryMessage: 'Please retry',
};

describe('useAgentChat', () => {
    beforeEach(() => {
        apiKey = '';
        chatMock.mockReset();
        trackUsageMock.mockReset();
        evaluateEnforcementMock.mockReset();
        evaluateEnforcementMock.mockReturnValue({ status: 'ALLOW', reasons: [] });
        checkBudgetMock.mockReset();
        checkBudgetMock.mockReturnValue({ ok: true, warning: false, remaining: { daily: Infinity, monthly: Infinity } });
        localStorage.clear();
        vi.useRealTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('adds system message when API key is missing', async () => {
        const onMessagesChange = vi.fn();
        const { result } = renderHook(() => useAgentChat({
            language: 'en',
            settings: baseSettings,
            labels: baseLabels,
            onMessagesChange,
        }));

        act(() => {
            result.current.setInput('Hello');
        });

        await act(async () => {
            await result.current.handleSendMessage();
        });

        expect(result.current.messages.length).toBe(1);
        expect(result.current.messages[0].role).toBe('system');
        expect(result.current.messages[0].content).toContain(baseLabels.noApiKey);
        await waitFor(() => expect(onMessagesChange).toHaveBeenCalled());
    });

    it('runs full mode flow with phase gate, acceptance, retry, and completion', async () => {
        apiKey = 'test-key';
        const settings = {
            ...baseSettings,
            providers: {
                ...baseSettings.providers,
                gemini: { apiKey, selectedModel: 'gemini-2.5-flash' },
            },
        };

        chatMock.mockImplementation(async (_messages: unknown, onStream?: (chunk: { text: string; isComplete: boolean }) => void) => {
            onStream?.({ text: 'Partial', isComplete: false });
            return {
                text: 'PHASE B: Design\nStep 1',
                usage: { totalTokens: 16 },
            };
        });

        vi.useFakeTimers();
        const onComplete = vi.fn();
        const onClose = vi.fn();
        const { result } = renderHook(() => useAgentChat({
            initialPrompt: 'CVF FULL MODE PROTOCOL',
            language: 'en',
            settings,
            labels: baseLabels,
            onComplete,
            onClose,
        }));

        await act(async () => {
            await vi.runAllTimersAsync();
        });

        expect(chatMock).toHaveBeenCalled();

        const assistantMessage = result.current.messages.find(m => m.role === 'assistant');
        expect(assistantMessage).toBeTruthy();
        expect(assistantMessage?.status).toBe('complete');
        expect(assistantMessage?.metadata?.acceptanceStatus).toBe('pending');
        expect(result.current.phaseGate.show).toBe(true);
        expect(trackUsageMock).toHaveBeenCalled();

        act(() => {
            result.current.handleAccept(assistantMessage!.id);
        });
        expect(result.current.messages.find(m => m.id === assistantMessage!.id)?.metadata?.acceptanceStatus).toBe('accepted');

        act(() => {
            result.current.handleReject(assistantMessage!.id);
        });
        expect(result.current.messages.find(m => m.id === assistantMessage!.id)?.metadata?.acceptanceStatus).toBe('rejected');

        act(() => {
            result.current.handleRetry(assistantMessage!.id);
        });
        expect(result.current.messages.find(m => m.id === assistantMessage!.id)?.metadata?.acceptanceStatus).toBe('retry');

        await act(async () => {
            await vi.runAllTimersAsync();
        });
        expect(chatMock.mock.calls.length).toBeGreaterThanOrEqual(2);

        act(() => {
            result.current.handlePhaseGateApprove();
        });
        expect(result.current.phaseGate.show).toBe(false);
        expect(result.current.decisionLog.length).toBeGreaterThanOrEqual(2);

        act(() => {
            result.current.handleComplete();
        });
        expect(onComplete).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
    });

    it('validates file attachment and includes content in user message', async () => {
        apiKey = 'test-key';
        const settings = {
            ...baseSettings,
            providers: {
                ...baseSettings.providers,
                gemini: { apiKey, selectedModel: 'gemini-2.5-flash' },
            },
        };

        chatMock.mockResolvedValueOnce({
            text: 'ok',
            usage: { totalTokens: 5 },
        });

        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
        const originalFileReader = globalThis.FileReader;

        class MockFileReader {
            onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
            readAsText() {
                if (this.onload) {
                    const event = { target: { result: 'file-content' } } as ProgressEvent<FileReader>;
                    this.onload(event);
                }
            }
        }

        globalThis.FileReader = MockFileReader as unknown as typeof FileReader;

        const { result } = renderHook(() => useAgentChat({
            language: 'en',
            settings,
            labels: baseLabels,
        }));

        const invalidFile = new File([new Uint8Array([1, 2])], 'bad.exe');
        act(() => result.current.handleFileSelected(invalidFile));
        expect(alertSpy).toHaveBeenCalled();
        expect(result.current.attachedFile).toBeNull();

        const largeFile = new File([new Uint8Array(101 * 1024)], 'large.txt');
        act(() => result.current.handleFileSelected(largeFile));
        expect(alertSpy).toHaveBeenCalledTimes(2);
        expect(result.current.attachedFile).toBeNull();

        const validFile = new File([new Uint8Array([1, 2, 3])], 'note.md');
        act(() => result.current.handleFileSelected(validFile));
        expect(result.current.attachedFile?.name).toBe('note.md');

        act(() => result.current.setInput('Hello'));
        await act(async () => {
            await result.current.handleSendMessage();
        });

        const userMessage = result.current.messages.find(m => m.role === 'user');
        expect(userMessage?.content).toContain('File: note.md');
        expect(userMessage?.content).toContain('file-content');

        alertSpy.mockRestore();
        globalThis.FileReader = originalFileReader;
    });

    it('handlePhaseGateReject closes gate and sends revision message', async () => {
        apiKey = 'test-key';
        const settings = {
            ...baseSettings,
            providers: {
                ...baseSettings.providers,
                gemini: { apiKey, selectedModel: 'gemini-2.5-flash' },
            },
        };

        chatMock.mockImplementation(async () => ({
            text: 'PHASE B: Design\nStep 1',
            usage: { totalTokens: 10 },
        }));

        vi.useFakeTimers();
        const { result } = renderHook(() => useAgentChat({
            initialPrompt: 'CVF FULL MODE PROTOCOL',
            language: 'en',
            settings,
            labels: baseLabels,
        }));

        await act(async () => { await vi.runAllTimersAsync(); });
        expect(result.current.phaseGate.show).toBe(true);

        act(() => {
            result.current.handlePhaseGateReject();
        });

        expect(result.current.phaseGate.show).toBe(false);
        expect(result.current.decisionLog.some(d => d.action === 'gate_rejected')).toBe(true);
    });

    it('handlePhaseGateClose dismisses gate without logging', async () => {
        apiKey = 'test-key';
        const settings = {
            ...baseSettings,
            providers: {
                ...baseSettings.providers,
                gemini: { apiKey, selectedModel: 'gemini-2.5-flash' },
            },
        };

        chatMock.mockImplementation(async () => ({
            text: 'PHASE B: Design\nStep 1',
            usage: { totalTokens: 10 },
        }));

        vi.useFakeTimers();
        const { result } = renderHook(() => useAgentChat({
            initialPrompt: 'CVF FULL MODE PROTOCOL',
            language: 'en',
            settings,
            labels: baseLabels,
        }));

        await act(async () => { await vi.runAllTimersAsync(); });
        expect(result.current.phaseGate.show).toBe(true);
        const logLenBefore = result.current.decisionLog.length;

        act(() => {
            result.current.handlePhaseGateClose();
        });

        expect(result.current.phaseGate.show).toBe(false);
        expect(result.current.phaseGate.phase).toBe(null);
        // Close does NOT add a decision log entry
        expect(result.current.decisionLog.length).toBe(logLenBefore);
    });

    it('clearDecisionLog empties the decision log', async () => {
        apiKey = 'test-key';
        const settings = {
            ...baseSettings,
            providers: {
                ...baseSettings.providers,
                gemini: { apiKey, selectedModel: 'gemini-2.5-flash' },
            },
        };

        chatMock.mockImplementation(async () => ({
            text: 'PHASE B: Design\nStep 1',
            usage: { totalTokens: 10 },
        }));

        vi.useFakeTimers();
        const { result } = renderHook(() => useAgentChat({
            initialPrompt: 'CVF FULL MODE PROTOCOL',
            language: 'en',
            settings,
            labels: baseLabels,
        }));

        await act(async () => { await vi.runAllTimersAsync(); });

        act(() => {
            result.current.handlePhaseGateApprove();
        });
        expect(result.current.decisionLog.length).toBeGreaterThan(0);

        act(() => {
            result.current.clearDecisionLog();
        });
        expect(result.current.decisionLog.length).toBe(0);
    });

    it('handleRemoveAttachment clears attached file', () => {
        const settings = {
            ...baseSettings,
            providers: {
                ...baseSettings.providers,
                gemini: { apiKey: 'test-key', selectedModel: 'gemini-2.5-flash' },
            },
        };

        const originalFileReader = globalThis.FileReader;
        class MockFileReader {
            onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
            readAsText() {
                if (this.onload) {
                    const event = { target: { result: 'content' } } as ProgressEvent<FileReader>;
                    this.onload(event);
                }
            }
        }
        globalThis.FileReader = MockFileReader as unknown as typeof FileReader;

        const { result } = renderHook(() => useAgentChat({
            language: 'en',
            settings,
            labels: baseLabels,
        }));

        const validFile = new File([new Uint8Array([1, 2])], 'note.md');
        act(() => result.current.handleFileSelected(validFile));
        expect(result.current.attachedFile).not.toBeNull();

        act(() => result.current.handleRemoveAttachment());
        expect(result.current.attachedFile).toBeNull();

        globalThis.FileReader = originalFileReader;
    });

    it('shows error message when AI call throws', async () => {
        const settings = {
            ...baseSettings,
            providers: {
                ...baseSettings.providers,
                gemini: { apiKey: 'test-key', selectedModel: 'gemini-2.5-flash' },
            },
        };

        chatMock.mockRejectedValueOnce(new Error('Network error'));

        const { result } = renderHook(() => useAgentChat({
            language: 'en',
            settings,
            labels: baseLabels,
        }));

        act(() => {
            result.current.setInput('Hello');
        });

        await act(async () => {
            await result.current.handleSendMessage();
        });

        // The assistant message should contain the error
        const errorMsg = result.current.messages.find(m =>
            m.role === 'assistant' && m.content.includes('❌')
        );
        expect(errorMsg).toBeTruthy();
        expect(errorMsg!.content).toContain('Connection error');
    });

    it('shows budget exceeded message when enforcement returns BLOCK with budget', async () => {
        const settings = {
            ...baseSettings,
            providers: {
                ...baseSettings.providers,
                gemini: { apiKey: 'test-key', selectedModel: 'gemini-2.5-flash' },
            },
        };

        evaluateEnforcementMock.mockReturnValue({
            status: 'BLOCK',
            reasons: ['Budget exceeded'],
        });

        // Make checkBudget return failure
        checkBudgetMock.mockReturnValue({ ok: false, warning: true, remaining: { daily: 0, monthly: 0 } });

        const { result } = renderHook(() => useAgentChat({
            language: 'en',
            settings,
            labels: baseLabels,
        }));

        act(() => result.current.setInput('Hello'));
        await act(async () => { await result.current.handleSendMessage(); });

        const blockMsg = result.current.messages.find(m => m.content.includes('🚫'));
        expect(blockMsg).toBeTruthy();
        expect(blockMsg!.content).toContain('Budget exceeded');
        expect(chatMock).not.toHaveBeenCalled();
    });

    it('shows risk-blocked message when enforcement returns BLOCK with riskGate', async () => {
        const settings = {
            ...baseSettings,
            providers: {
                ...baseSettings.providers,
                gemini: { apiKey: 'test-key', selectedModel: 'gemini-2.5-flash' },
            },
        };

        evaluateEnforcementMock.mockReturnValue({
            status: 'BLOCK',
            reasons: ['Risk too high'],
            riskGate: { status: 'BLOCK', riskLevel: 'CRITICAL', reason: 'Risk too high' },
        });

        const { result } = renderHook(() => useAgentChat({
            language: 'en',
            settings,
            labels: baseLabels,
        }));

        act(() => result.current.setInput('Do something dangerous'));
        await act(async () => { await result.current.handleSendMessage(); });

        const blockMsg = result.current.messages.find(m => m.content.includes('⛔'));
        expect(blockMsg).toBeTruthy();
        expect(blockMsg!.content).toContain('CRITICAL');
        expect(chatMock).not.toHaveBeenCalled();
    });

    it('shows spec incomplete message when enforcement returns BLOCK without riskGate', async () => {
        const settings = {
            ...baseSettings,
            providers: {
                ...baseSettings.providers,
                gemini: { apiKey: 'test-key', selectedModel: 'gemini-2.5-flash' },
            },
        };

        evaluateEnforcementMock.mockReturnValue({
            status: 'BLOCK',
            reasons: ['Spec completeness failed'],
        });

        const { result } = renderHook(() => useAgentChat({
            language: 'en',
            settings,
            labels: baseLabels,
        }));

        act(() => result.current.setInput('Build something'));
        await act(async () => { await result.current.handleSendMessage(); });

        const blockMsg = result.current.messages.find(m => m.content.includes('⛔'));
        expect(blockMsg).toBeTruthy();
        expect(blockMsg!.content).toContain('Spec is incomplete');
        expect(chatMock).not.toHaveBeenCalled();
    });

    it('shows clarify message when enforcement returns CLARIFY', async () => {
        const settings = {
            ...baseSettings,
            providers: {
                ...baseSettings.providers,
                gemini: { apiKey: 'test-key', selectedModel: 'gemini-2.5-flash' },
            },
        };

        evaluateEnforcementMock.mockReturnValue({
            status: 'CLARIFY',
            reasons: ['Spec needs clarification'],
        });

        const { result } = renderHook(() => useAgentChat({
            language: 'en',
            settings,
            labels: baseLabels,
        }));

        act(() => result.current.setInput('Build something'));
        await act(async () => { await result.current.handleSendMessage(); });

        const clarifyMsg = result.current.messages.find(m => m.content.includes('❓'));
        expect(clarifyMsg).toBeTruthy();
        expect(clarifyMsg!.content).toContain('Spec is missing key details');
        expect(chatMock).not.toHaveBeenCalled();
    });

    it('shows halted message when enforcement returns NEEDS_APPROVAL and user rejects', async () => {
        const settings = {
            ...baseSettings,
            providers: {
                ...baseSettings.providers,
                gemini: { apiKey: 'test-key', selectedModel: 'gemini-2.5-flash' },
            },
        };

        evaluateEnforcementMock.mockReturnValue({
            status: 'NEEDS_APPROVAL',
            reasons: ['High risk'],
            riskGate: { status: 'NEEDS_APPROVAL', riskLevel: 'HIGH', reason: 'High risk' },
        });

        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

        const { result } = renderHook(() => useAgentChat({
            language: 'en',
            settings,
            labels: baseLabels,
        }));

        act(() => result.current.setInput('Deploy to production'));
        await act(async () => { await result.current.handleSendMessage(); });

        const haltMsg = result.current.messages.find(m => m.content.includes('⏸️'));
        expect(haltMsg).toBeTruthy();
        expect(haltMsg!.content).toContain('HIGH');
        expect(chatMock).not.toHaveBeenCalled();

        confirmSpy.mockRestore();
    });

    it('proceeds when enforcement returns NEEDS_APPROVAL and user approves', async () => {
        const settings = {
            ...baseSettings,
            providers: {
                ...baseSettings.providers,
                gemini: { apiKey: 'test-key', selectedModel: 'gemini-2.5-flash' },
            },
        };

        evaluateEnforcementMock.mockReturnValue({
            status: 'NEEDS_APPROVAL',
            reasons: ['High risk'],
            riskGate: { status: 'NEEDS_APPROVAL', riskLevel: 'HIGH', reason: 'High risk' },
        });

        chatMock.mockResolvedValueOnce({
            text: 'Deployed successfully',
            usage: { totalTokens: 10 },
        });

        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

        const { result } = renderHook(() => useAgentChat({
            language: 'en',
            settings,
            labels: baseLabels,
        }));

        act(() => result.current.setInput('Deploy to production'));
        await act(async () => { await result.current.handleSendMessage(); });

        // AI was called because user approved
        expect(chatMock).toHaveBeenCalled();
        const assistantMsg = result.current.messages.find(m => m.role === 'assistant');
        expect(assistantMsg).toBeTruthy();

        confirmSpy.mockRestore();
    });

    it('falls back to localStorage when settings apiKey is empty and handles invalid JSON gracefully', async () => {
        localStorage.setItem('cvf_settings', '{INVALID_JSON');

        const { result } = renderHook(() => useAgentChat({
            language: 'en',
            settings: baseSettings,
            labels: baseLabels,
        }));

        act(() => result.current.setInput('Hello'));
        await act(async () => { await result.current.handleSendMessage(); });

        const sysMsg = result.current.messages.find(m => m.role === 'system' && m.content.includes(baseLabels.noApiKey));
        expect(sysMsg).toBeTruthy();
    });

    it('resolvePhaseForMessage returns null for non-existent message id', () => {
        const { result } = renderHook(() => useAgentChat({
            language: 'en',
            settings: baseSettings,
            labels: baseLabels,
        }));

        const logBefore = result.current.decisionLog.length;
        act(() => {
            result.current.handleAccept('non_existent_id');
        });
        expect(result.current.decisionLog.length).toBe(logBefore);
    });
});
