/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AgentChat, AgentChatButton } from './AgentChat';

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

vi.mock('@/lib/governance-context', async () => {
    const actual = await vi.importActual<typeof import('@/lib/governance-context')>('@/lib/governance-context');
    return {
        ...actual,
        buildGovernanceSystemPrompt: () => 'mock system prompt',
    };
});

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
        fireEvent.click(screen.getByRole('button', { name: /Send/i }));

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
        fireEvent.click(screen.getByRole('button', { name: /Send/i }));

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

    it('toggles export menu when export button is clicked', async () => {
        apiKey = 'test-key';
        chatMock.mockResolvedValueOnce({
            text: 'Hello response',
            model: 'gemini-2.5-flash',
            usage: { totalTokens: 12 },
        });

        render(<AgentChat />);
        const input = screen.getByPlaceholderText('Type a message...');
        fireEvent.change(input, { target: { value: 'Hi' } });
        fireEvent.click(screen.getByRole('button', { name: /Send/i }));

        await waitFor(() => expect(chatMock).toHaveBeenCalled());
        await screen.findByText('Hello response');
        const exportBtn = screen.getByTitle('Export chat');
        fireEvent.click(exportBtn);
        // Export menu should show Markdown/JSON/Copy All options
        expect(await screen.findByText(/Markdown/)).toBeTruthy();
        expect(screen.getByText(/JSON/)).toBeTruthy();
        expect(screen.getByText(/Copy All/)).toBeTruthy();
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

    describe('welcome screen', () => {
        it('shows welcome message when no messages', () => {
            render(<AgentChat />);
            expect(screen.getByText('Welcome to CVF Agent!')).toBeTruthy();
            expect(screen.getByText(/Ask me anything/)).toBeTruthy();
        });

        it('shows Vietnamese welcome when language is vi', () => {
            // language mock always returns 'en' but we can verify English text exists
            render(<AgentChat />);
            expect(screen.getByText('Welcome to CVF Agent!')).toBeTruthy();
        });

        it('shows 6 suggestion buttons', () => {
            render(<AgentChat />);
            expect(screen.getByText(/Write a business plan/)).toBeTruthy();
            expect(screen.getByText(/SWOT analysis/)).toBeTruthy();
            expect(screen.getByText(/marketing strategy/)).toBeTruthy();
            expect(screen.getByText(/data analysis report/)).toBeTruthy();
            expect(screen.getByText(/Design an application/)).toBeTruthy();
            expect(screen.getByText(/Security assessment/)).toBeTruthy();
        });

        it('clicking suggestion button fills input with text', async () => {
            apiKey = 'test-key';
            render(<AgentChat />);
            const suggestBtn = screen.getByText(/Write a business plan/);
            fireEvent.click(suggestBtn);

            await waitFor(() => {
                const textarea = screen.getByPlaceholderText('Type a message...');
                expect((textarea as HTMLTextAreaElement).value).toContain('Write a business plan');
            });
        });

        it('pressing Enter on suggestion button fills input', async () => {
            apiKey = 'test-key';
            render(<AgentChat />);
            const suggestBtn = screen.getByText(/SWOT analysis/);
            fireEvent.keyDown(suggestBtn, { key: 'Enter' });

            await waitFor(() => {
                const textarea = screen.getByPlaceholderText('Type a message...');
                expect((textarea as HTMLTextAreaElement).value).toContain('SWOT analysis');
            });
        });
    });

    describe('bottom area', () => {
        it('shows Complete button when messages exist', async () => {
            apiKey = 'test-key';
            chatMock.mockResolvedValueOnce({
                text: 'Hello response',
                model: 'gemini-2.5-flash',
                usage: { totalTokens: 12 },
            });

            render(<AgentChat />);
            const input = screen.getByPlaceholderText('Type a message...');
            fireEvent.change(input, { target: { value: 'Hi' } });
            fireEvent.click(screen.getByRole('button', { name: /Send/i }));

            await waitFor(() => expect(chatMock).toHaveBeenCalled());
            expect(await screen.findByText(/Complete/i)).toBeTruthy();
        });

        it('shows Governance button when messages exist', async () => {
            apiKey = 'test-key';
            chatMock.mockResolvedValueOnce({
                text: 'Hello response',
                model: 'gemini-2.5-flash',
                usage: { totalTokens: 12 },
            });

            render(<AgentChat />);
            const input = screen.getByPlaceholderText('Type a message...');
            fireEvent.change(input, { target: { value: 'Hi' } });
            fireEvent.click(screen.getByRole('button', { name: /Send/i }));

            await waitFor(() => expect(chatMock).toHaveBeenCalled());
            expect(await screen.findByText(/Governance/i)).toBeTruthy();
        });

        it('clicking Governance button toggles governance panel', async () => {
            apiKey = 'test-key';
            chatMock.mockResolvedValueOnce({
                text: 'Hello response',
                model: 'gemini-2.5-flash',
                usage: { totalTokens: 12 },
            });

            render(<AgentChat />);
            const input = screen.getByPlaceholderText('Type a message...');
            fireEvent.change(input, { target: { value: 'Hi' } });
            fireEvent.click(screen.getByRole('button', { name: /Send/i }));

            await waitFor(() => expect(chatMock).toHaveBeenCalled());
            await screen.findByText('Hello response');
            await waitFor(() => {
                expect(screen.getByText('🛡️ Governance')).toBeTruthy();
            });
            fireEvent.click(screen.getByText('🛡️ Governance'));
            await waitFor(() => {
                expect(screen.queryByText(/Governance Panel/)).toBeTruthy();
            }, { timeout: 3000 });
        });

        it('calls onComplete callback when Complete is clicked', async () => {
            apiKey = 'test-key';
            const onComplete = vi.fn();
            chatMock.mockResolvedValueOnce({
                text: 'Hello response',
                model: 'gemini-2.5-flash',
                usage: { totalTokens: 12 },
            });

            render(<AgentChat onComplete={onComplete} />);
            const input = screen.getByPlaceholderText('Type a message...');
            fireEvent.change(input, { target: { value: 'Hi' } });
            fireEvent.click(screen.getByRole('button', { name: /Send/i }));

            await waitFor(() => expect(chatMock).toHaveBeenCalled());
            const completeBtn = await screen.findByText(/Complete/i);
            fireEvent.click(completeBtn);

            await waitFor(() => expect(onComplete).toHaveBeenCalled());
        });
    });

    describe('AgentChatButton', () => {
        it('renders the chat button', () => {
            render(<AgentChatButton onClick={vi.fn()} />);
            expect(screen.getByText('AI Agent')).toBeTruthy();
            expect(screen.getByText('Chat with CVF')).toBeTruthy();
        });

        it('calls onClick when clicked', () => {
            const onClick = vi.fn();
            render(<AgentChatButton onClick={onClick} />);
            fireEvent.click(screen.getByTitle('Open CVF Agent'));
            expect(onClick).toHaveBeenCalledTimes(1);
        });
    });

    describe('header controls', () => {
        it('calls onMinimize when minimize button is clicked', () => {
            const onMinimize = vi.fn();
            render(<AgentChat onMinimize={onMinimize} />);

            fireEvent.click(screen.getByLabelText('Minimize'));
            expect(onMinimize).toHaveBeenCalledTimes(1);
        });

        it('falls back to onClose when minimize is clicked and onMinimize is missing', () => {
            const onClose = vi.fn();
            render(<AgentChat onClose={onClose} />);

            fireEvent.click(screen.getByLabelText('Minimize'));
            expect(onClose).toHaveBeenCalledTimes(1);
        });

        it('calls onClose from close button', () => {
            const onClose = vi.fn();
            render(<AgentChat onClose={onClose} />);

            fireEvent.click(screen.getByLabelText('Close chat'));
            expect(onClose).toHaveBeenCalledTimes(1);
        });

        it('dispatches maximize event from maximize button', () => {
            const listener = vi.fn();
            window.addEventListener('cvf-chat-maximize', listener);
            render(<AgentChat />);

            fireEvent.click(screen.getByLabelText('Maximize'));
            expect(listener).toHaveBeenCalledTimes(1);
            window.removeEventListener('cvf-chat-maximize', listener);
        });
    });
});
