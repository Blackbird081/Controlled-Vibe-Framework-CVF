/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAgentChat } from './hooks/useAgentChat';

const chatMock = vi.fn();

vi.mock('@/lib/ai-providers', () => ({
    createAIProvider: () => ({ chat: chatMock }),
}));

const baseSettings = {
    preferences: { defaultProvider: 'gemini' as const },
    providers: {
        gemini: { apiKey: 'test-key', selectedModel: 'gemini-2.5-flash' },
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

describe('quota enforcement integration', () => {
    beforeEach(() => {
        chatMock.mockReset();
        localStorage.clear();

        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem('cvf_quota_settings', JSON.stringify({
            enabled: true,
            dailyBudget: 0.001,
            monthlyBudget: 0.001,
            fallbackEnabled: true,
            fallbackOrder: ['gemini', 'openai', 'anthropic'],
            maxTokensPerRequest: 0,
        }));
        localStorage.setItem('cvf_quota_usage', JSON.stringify([
            {
                id: 'usage_1',
                date: today,
                timestamp: Date.now(),
                provider: 'gemini',
                model: 'gemini-2.5-flash',
                inputTokens: 1_000_000,
                outputTokens: 1_000_000,
                cost: 5,
            },
        ]));
    });

    it('blocks chat when budget exceeded', async () => {
        const { result } = renderHook(() => useAgentChat({
            language: 'en',
            settings: baseSettings,
            labels: baseLabels,
        }));

        act(() => {
            result.current.setInput('Hello');
        });

        await act(async () => {
            await result.current.handleSendMessage();
        });

        expect(chatMock).not.toHaveBeenCalled();
        expect(result.current.messages.length).toBe(2);
        expect(result.current.messages[1].content).toContain('Budget exceeded');
    });
});
