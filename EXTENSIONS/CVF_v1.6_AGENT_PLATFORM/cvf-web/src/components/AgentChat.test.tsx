/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AgentChat } from './AgentChat';

let apiKey = '';
const chatMock = vi.fn();
const discoveryResponse = [
    'PHASE A - Discovery',
    'My Understanding: Confirm the goal.',
    'Assumption: Requirements are clear.',
    'IN SCOPE: Governance checks.',
].join('\n');

vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language: 'en', t: (key: string) => key }),
}));

vi.mock('./Settings', () => ({
    useSettings: () => ({
        settings: {
            preferences: { defaultProvider: 'gemini' },
            providers: {
                gemini: { apiKey, selectedModel: 'gemini-2.5-flash' },
                openai: { apiKey: '', selectedModel: 'gpt-4o' },
                anthropic: { apiKey: '', selectedModel: 'claude-sonnet-4-20250514' },
            },
        },
    }),
}));

vi.mock('@/lib/quota-manager', async () => {
    const actual = await vi.importActual<typeof import('@/lib/quota-manager')>('@/lib/quota-manager');
    return {
        ...actual,
        useQuotaManager: () => ({
            trackUsage: vi.fn(),
            checkBudget: () => ({ ok: true, warning: false, remaining: { daily: Infinity, monthly: Infinity } }),
        }),
    };
});

vi.mock('@/lib/ai-providers', () => ({
    createAIProvider: () => ({ chat: chatMock }),
}));

vi.mock('@/lib/hooks/useModelPricing', () => ({
    useModelPricing: () => ({
        pricing: { 'gemini-2.5-flash': { input: 0.1, output: 0.2 } },
        status: 'ready',
        updatedAt: null,
    }),
}));

describe('AgentChat', () => {
    beforeEach(() => {
        apiKey = '';
        chatMock.mockReset();
        vi.useRealTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('shows warning when API key is missing', async () => {
        render(<AgentChat />);

        const input = screen.getByPlaceholderText('Type a message...');
        fireEvent.change(input, { target: { value: 'Hello' } });
        fireEvent.click(screen.getByRole('button', { name: 'Send' }));

        expect(await screen.findByText(/No API key configured/i)).toBeTruthy();
    });

    it('sends message and renders assistant response', async () => {
        apiKey = 'test-key';
        chatMock.mockImplementationOnce(async (_messages: unknown, onStream?: (chunk: { text: string; isComplete: boolean }) => void) => {
            onStream?.({ text: 'Hello', isComplete: false });
            onStream?.({ text: '', isComplete: true });
            return {
                text: 'Hello',
                model: 'gemini-2.5-flash',
                usage: { totalTokens: 12 },
            };
        });

        render(<AgentChat />);

        const input = screen.getByPlaceholderText('Type a message...');
        fireEvent.change(input, { target: { value: 'Hi there' } });
        fireEvent.click(screen.getByRole('button', { name: 'Send' }));

        await waitFor(() => expect(chatMock).toHaveBeenCalled());
        expect(await screen.findByText('Hello')).toBeTruthy();
    });

    it('shows accept/reject buttons in governance mode', async () => {
        apiKey = 'test-key';
        chatMock.mockResolvedValueOnce({
            text: 'Governance response',
            model: 'gemini-2.5-flash',
            usage: { totalTokens: 12 },
        });

        render(<AgentChat initialPrompt="CVF GOVERNANCE RULES" />);

        await waitFor(() => expect(chatMock).toHaveBeenCalled());
        expect(await screen.findByText('Accept')).toBeTruthy();
        expect(await screen.findByText('Reject')).toBeTruthy();
    });

    it('shows phase gate modal in full mode', async () => {
        apiKey = 'test-key';
        chatMock.mockResolvedValueOnce({
            text: 'PHASE A - Discovery content',
            model: 'gemini-2.5-flash',
            usage: { totalTokens: 12 },
        });

        render(<AgentChat initialPrompt="CVF FULL MODE PROTOCOL" />);

        await waitFor(() => expect(chatMock).toHaveBeenCalled());
        expect(await screen.findByText(/Phase A: Discovery/i)).toBeTruthy();
    });

    it('adds decision log entry when governance response is accepted', async () => {
        apiKey = 'test-key';
        chatMock.mockResolvedValueOnce({
            text: discoveryResponse,
            model: 'gemini-2.5-flash',
            usage: { totalTokens: 12 },
        });

        render(<AgentChat initialPrompt="CVF GOVERNANCE RULES" />);

        expect(await screen.findByText('Accept')).toBeTruthy();
        fireEvent.click(screen.getByText('Accept'));

        expect(await screen.findByText(/Accepted/i)).toBeTruthy();

        fireEvent.click(screen.getByTitle('Decision log'));
        expect(await screen.findByText('Decision updated')).toBeTruthy();
        expect(screen.getByText('Accepted response')).toBeTruthy();
    });

    it('approves phase gate and records decision log in full mode', async () => {
        apiKey = 'test-key';
        chatMock.mockResolvedValueOnce({
            text: discoveryResponse,
            model: 'gemini-2.5-flash',
            usage: { totalTokens: 12 },
        });

        render(<AgentChat initialPrompt="CVF FULL MODE PROTOCOL" />);

        expect(await screen.findByText(/Phase A: Discovery/i)).toBeTruthy();
        const approveButton = screen.getByRole('button', { name: /Approve/i });
        await waitFor(() => expect(approveButton.hasAttribute('disabled')).toBe(false));
        fireEvent.click(approveButton);

        await waitFor(() => expect(screen.queryByText(/Phase A: Discovery/i)).toBeNull());
        expect(await screen.findByText(/Phase Discovery approved/i)).toBeTruthy();

        fireEvent.click(screen.getByTitle('Decision log'));
        expect(await screen.findByText('Gate approved')).toBeTruthy();
    });
});
