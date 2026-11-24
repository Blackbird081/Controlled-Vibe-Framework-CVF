/**
 * @vitest-environment jsdom
 */
// Text Encoding Exception: Vietnamese assistant rate-limit fixtures use UTF-8.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { StrictMode, createElement } from 'react';
import { useAgentChat } from './useAgentChat';
import { AssistantRateLimitError } from '@/lib/assistant-rate-limit';

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
        alibaba: { apiKey: '', selectedModel: 'qwen-plus' },
        openrouter: { apiKey: '', selectedModel: 'openai/gpt-4o-mini' },
        deepseek: { apiKey: '', selectedModel: 'deepseek-chat' },
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
    it('cancels an initial send when the chat unmounts before its timer fires', async () => {
        vi.useFakeTimers();
        const settings = { ...baseSettings, providers: { ...baseSettings.providers,
            gemini: { apiKey: 'fixture-key', selectedModel: 'gemini-2.5-flash' } } };
        const hook = renderHook(() => useAgentChat({ initialPrompt: 'Synthetic intake',
            language: 'en', settings, labels: baseLabels }));
        hook.unmount();
        await act(async () => { await vi.runAllTimersAsync(); });
        expect(chatMock).not.toHaveBeenCalled();
    });

    it('dispatches exactly once under StrictMode and rerenders', async () => {
        vi.useFakeTimers();
        chatMock.mockResolvedValue({ text: 'INTAKE fixture result', usage: { totalTokens: 10 } });
        const settings = { ...baseSettings, providers: { ...baseSettings.providers,
            gemini: { apiKey: 'fixture-key', selectedModel: 'gemini-2.5-flash' } } };
        const hook = renderHook(() => useAgentChat({ initialPrompt: 'Synthetic intake',
            language: 'en', settings, labels: baseLabels }), {
            wrapper: ({ children }) => createElement(StrictMode, null, children),
        });
        hook.rerender();
        await act(async () => { await vi.runAllTimersAsync(); });
        hook.rerender();
        await act(async () => { await vi.runAllTimersAsync(); });
        expect(chatMock).toHaveBeenCalledTimes(1);
        expect(hook.result.current.messages.filter(m => m.role === 'user')).toHaveLength(1);
    });

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

    describe('assistant rate limits', () => {
        const settings = { ...baseSettings, providers: { ...baseSettings.providers,
            gemini: { apiKey: 'fixture-key', selectedModel: 'gemini-2.5-flash' } } };

        function rateLimit(retryAfter: string | null) {
            return new AssistantRateLimitError(retryAfter);
        }

        it.each([
            ['en', 'Too many requests.', 'Please wait a moment and try again.'],
            ['vi', 'Có quá nhiều yêu cầu.', 'Vui lòng chờ một lát rồi thử lại.'],
        ] as const)('retries once after the provider wait and reports the outcome in %s', async (language, busy, later) => {
            vi.useFakeTimers();
            chatMock.mockRejectedValueOnce(rateLimit('3')).mockRejectedValueOnce(rateLimit(null));
            const { result } = renderHook(() => useAgentChat({ language, settings, labels: baseLabels }));

            let send!: Promise<void>;
            await act(async () => { send = result.current.handleSendMessage('fixture request'); });
            const reply = () => result.current.messages.find(m => m.role === 'assistant');
            expect(reply()?.content).toContain(busy);
            expect(result.current.isLoading).toBe(true);
            expect(chatMock).toHaveBeenCalledTimes(1);
            await act(async () => { await vi.advanceTimersByTimeAsync(2999); });
            expect(chatMock).toHaveBeenCalledTimes(1);
            await act(async () => { await vi.advanceTimersByTimeAsync(1); await send; });
            expect(chatMock).toHaveBeenCalledTimes(2);
            expect(chatMock.mock.calls[0][0]).toEqual(chatMock.mock.calls[1][0]);
            expect(result.current.messages.filter(m => m.role === 'user')).toHaveLength(1);
            expect(reply()).toMatchObject({ status: 'error' });
            expect(reply()?.content).toContain(later);
            expect(reply()?.content).not.toContain('hidden provider text');
        });

        it('retries a 429 with no wait time after two seconds and accepts the reply', async () => {
            vi.useFakeTimers();
            chatMock.mockRejectedValueOnce(rateLimit(null)).mockResolvedValueOnce({ text: 'fixture reply' });
            const { result } = renderHook(() => useAgentChat({ language: 'en', settings, labels: baseLabels }));

            let send!: Promise<void>;
            await act(async () => { send = result.current.handleSendMessage('fixture request'); });
            await act(async () => { await vi.advanceTimersByTimeAsync(1999); });
            expect(chatMock).toHaveBeenCalledTimes(1);
            await act(async () => { await vi.advanceTimersByTimeAsync(1); await send; });
            expect(chatMock).toHaveBeenCalledTimes(2);
            expect(result.current.messages.find(m => m.role === 'assistant'))
                .toMatchObject({ status: 'complete', content: 'fixture reply' });
        });

        it('checks the current budget after re-verifying the session and before retrying', async () => {
            vi.useFakeTimers();
            chatMock.mockRejectedValueOnce(rateLimit('2')).mockResolvedValueOnce({ text: 'should not be sent' });
            const verifySession = vi.fn().mockResolvedValueOnce(true).mockImplementationOnce(async () => {
                checkBudgetMock.mockReturnValue({ ok: false, warning: true, remaining: { daily: 0, monthly: 1 } });
                return true;
            });
            const { result } = renderHook(() => useAgentChat({ language: 'en', settings, labels: baseLabels, verifySession }));

            let send!: Promise<void>;
            await act(async () => { send = result.current.handleSendMessage('fixture request'); });
            expect(chatMock).toHaveBeenCalledTimes(1);
            await act(async () => { await vi.advanceTimersByTimeAsync(2000); await send; });

            expect(verifySession).toHaveBeenCalledTimes(2);
            expect(checkBudgetMock).toHaveBeenCalledTimes(2);
            expect(chatMock).toHaveBeenCalledTimes(1);
            expect(result.current.messages.find(m => m.role === 'assistant'))
                .toMatchObject({ status: 'error', content: expect.stringContaining('Budget exceeded.') });
            expect(result.current.isLoading).toBe(false);
        });

        it('keeps a provider-requested longer wait for a manual retry', async () => {
            chatMock.mockRejectedValueOnce(rateLimit('120'));
            const { result } = renderHook(() => useAgentChat({ language: 'en', settings, labels: baseLabels }));
            await act(async () => { await result.current.handleSendMessage('fixture request'); });
            expect(chatMock).toHaveBeenCalledTimes(1);
            expect(result.current.messages.find(m => m.role === 'assistant')?.content)
                .toContain('Please wait at least 120 seconds and try again.');
        });

        it('does not retry once a reply has started', async () => {
            vi.useFakeTimers();
            chatMock.mockImplementation(async (_messages, onStream) => {
                onStream({ text: 'partial reply', isComplete: false });
                throw rateLimit('1');
            });
            const { result } = renderHook(() => useAgentChat({ language: 'en', settings, labels: baseLabels }));
            await act(async () => { await result.current.handleSendMessage('fixture request'); });
            expect(chatMock).toHaveBeenCalledTimes(1);
            expect(result.current.messages.find(m => m.role === 'assistant')?.content)
                .toContain('The reply was interrupted.');
        });

        it('cancels a pending retry when the chat closes', async () => {
            vi.useFakeTimers();
            chatMock.mockRejectedValueOnce(rateLimit(null));
            const hook = renderHook(() => useAgentChat({ language: 'en', settings, labels: baseLabels }));
            let send!: Promise<void>;
            await act(async () => { send = hook.result.current.handleSendMessage('fixture request'); });
            expect(hook.result.current.isLoading).toBe(true);
            hook.unmount();
            await act(async () => { await vi.runAllTimersAsync(); await send; });
            expect(chatMock).toHaveBeenCalledTimes(1);
        });
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

    it('does not fall back to the configured OpenAI key for a personal model', async () => {
        const settings = {
            ...baseSettings,
            providers: { ...baseSettings.providers, openai: { apiKey: 'fixture-old', selectedModel: 'gpt-4o-mini' } },
        };
        const { result } = renderHook(() => useAgentChat({
            language: 'en',
            settings,
            labels: baseLabels,
            modelSelection: { provider: 'deepseek', model: 'deepseek-flash' },
        }));
        await act(async () => { await result.current.handleSendMessage('Example question'); });
        expect(chatMock).not.toHaveBeenCalled();
        expect(result.current.messages.some(message => message.content.includes('selected model'))).toBe(true);
    });

    it('makes no provider request when the authenticated account changed', async () => {
        const verifySession = vi.fn(async () => false);
        const { result } = renderHook(() => useAgentChat({
            language: 'en',
            settings: baseSettings,
            labels: baseLabels,
            modelSelection: { provider: 'openai', model: 'gpt-6-luna' },
            selectedModelKey: 'fixture-personal',
            usesPersonalKey: true,
            verifySession,
        }));
        await act(async () => { await result.current.handleSendMessage('Example question'); });
        expect(verifySession).toHaveBeenCalledWith(false);
        expect(chatMock).not.toHaveBeenCalled();
    });

    it('does not use a saved browser key when the logged-in viewer picks current settings', async () => {
        const settings = {
            ...baseSettings,
            providers: { ...baseSettings.providers, gemini: { apiKey: 'fixture-configured', selectedModel: 'gemini-4-hydrogen' } },
        };
        localStorage.setItem('cvf_settings', JSON.stringify(settings));
        const { result } = renderHook(() => useAgentChat({
            language: 'en', settings, labels: baseLabels, canUseConfiguredKeys: false,
        }));
        await act(async () => { await result.current.handleSendMessage('Example question'); });
        expect(chatMock).not.toHaveBeenCalled();
        expect(result.current.messages.some(message => message.content.includes('enter your API key'))).toBe(true);
    });

    it('excludes chat from the previous provider when sending a request to a new provider', async () => {
        const { result } = renderHook(() => useAgentChat({
            language: 'en',
            settings: baseSettings,
            labels: baseLabels,
            historyProvider: 'openai',
            modelSelection: { provider: 'deepseek', model: 'deepseek-flash' },
            selectedModelKey: 'fixture-personal',
        }));
        await act(async () => { await result.current.handleSendMessage('Example question'); });
        expect(chatMock).not.toHaveBeenCalled();
        expect(result.current.messages.some(message => message.content.includes('Start a new chat'))).toBe(true);
    });

    it('uses the provider, model and key chosen for the signed-in user', async () => {
        chatMock.mockResolvedValueOnce({ text: 'Example answer' });
        const { result } = renderHook(() => useAgentChat({
            language: 'en',
            settings: baseSettings,
            labels: baseLabels,
            modelSelection: { provider: 'openai', model: 'gpt-6-luna' },
            selectedModelKey: 'fixture-personal',
        }));
        await act(async () => { await result.current.handleSendMessage('Example question'); });
        expect(chatMock).toHaveBeenCalledTimes(1);
        expect(result.current.messages.find(message => message.role === 'assistant')?.metadata?.model).toBe('gpt-6-luna');
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
it('keeps an incoming quick-work draft unsent until the user sends it', async () => {
 vi.useFakeTimers(); chatMock.mockClear();
 const settings = { ...baseSettings, providers: { ...baseSettings.providers, gemini: { apiKey:'fixture-key', selectedModel:'gemini-2.5-flash' } } };
 const hook = renderHook(() => useAgentChat({ initialDraft:'Draft for review', language:'en', settings, labels:baseLabels }));
 await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
 expect(hook.result.current.input).toBe('Draft for review');
 expect(chatMock).not.toHaveBeenCalled();
 vi.useRealTimers();
});
