/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAgentChat } from './useAgentChat';
import { createAIProvider } from '@/lib/ai-providers';

let apiKey = '';
const chatMock = vi.fn();
const trackUsageMock = vi.fn();

vi.mock('@/lib/ai-providers', () => ({
    createAIProvider: () => ({ chat: chatMock }),
}));

vi.mock('@/lib/quota-manager', () => ({
    useQuotaManager: () => ({ trackUsage: trackUsageMock }),
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
});
