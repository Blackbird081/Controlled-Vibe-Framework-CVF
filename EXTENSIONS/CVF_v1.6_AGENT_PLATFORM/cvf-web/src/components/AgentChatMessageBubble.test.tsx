/**
 * @vitest-environment jsdom
 */
// Text Encoding Exception: tests verify the Vietnamese disclosure label.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentChatMessageBubble } from './AgentChatMessageBubble';
import type { ChatMessage } from '@/lib/agent-chat';

describe('AgentChatMessageBubble', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders system message', () => {
        const message: ChatMessage = {
            id: 'sys-1',
            role: 'system',
            content: 'System message',
            timestamp: new Date('2026-01-01T00:00:00Z'),
            status: 'complete',
        };

        render(<AgentChatMessageBubble message={message} />);
        expect(screen.getByText('System message')).toBeTruthy();
    });

    it('renders assistant metadata and actions', () => {
        const onAccept = vi.fn();
        const onReject = vi.fn();
        const onRetry = vi.fn();
        const message: ChatMessage = {
            id: 'a-1',
            role: 'assistant',
            content: 'PHASE B: Design\n\n```ts\nconsole.log(\"ok\");\n```',
            timestamp: new Date('2026-01-01T00:00:00Z'),
            status: 'complete',
            metadata: {
                phase: 'DESIGN',
                qualityScore: {
                    overall: 88,
                    completeness: 84,
                    clarity: 86,
                    actionability: 90,
                    compliance: 92,
                },
                acceptanceStatus: 'pending',
                model: 'gpt-4o',
                tokens: 2000,
            },
        };

        render(
            <AgentChatMessageBubble
                message={message}
                onAccept={onAccept}
                onReject={onReject}
                onRetry={onRetry}
                language="vi"
                pricing={{ 'gpt-4o': { input: 1, output: 3 } }}
            />
        );

        expect(screen.getByText(/Tuân thủ/i)).toBeTruthy();
        expect(screen.getByText(/0\.0048/)).toBeTruthy();

        fireEvent.click(screen.getByText('Chấp nhận'));
        fireEvent.click(screen.getByText('Thử lại'));
        fireEvent.click(screen.getByText('Từ chối'));

        expect(onAccept).toHaveBeenCalledWith('a-1');
        expect(onRetry).toHaveBeenCalledWith('a-1');
        expect(onReject).toHaveBeenCalledWith('a-1');
    });

    it('shows accepted status badge', () => {
        const message: ChatMessage = {
            id: 'a-2',
            role: 'assistant',
            content: 'Done',
            timestamp: new Date('2026-01-01T00:00:00Z'),
            status: 'complete',
            metadata: {
                acceptanceStatus: 'accepted',
            },
        };

        render(<AgentChatMessageBubble message={message} language="vi" />);
        expect(screen.getByText(/Đã chấp nhận/i)).toBeTruthy();
    });

    it.each([['vi', 'Chi tiết kỹ thuật'], ['en', 'Technical details']] as const)(
        'puts the phase, factual score and model code behind a closed disclosure in %s',
        (language, label) => {
            const message: ChatMessage = {
                id: 'technical-details', role: 'assistant', status: 'complete', timestamp: new Date(0),
                content: 'The reply is still visible.',
                metadata: { phase: 'Processing', factualScore: 32, factualRisk: 'high', model: 'gpt-4o-mini' },
            };
            render(<AgentChatMessageBubble message={message} language={language} />);

            expect(screen.getByText(message.content).closest('details')).toBeNull();
            const phase = screen.getByText('Processing');
            const score = screen.getByText('Factual: 32% (high)');
            const model = screen.getByText(/gpt-4o-mini/);
            const details = phase.closest('details');
            expect(details?.open).toBe(false);
            expect(score.closest('details')).toBe(details);
            expect(model.closest('details')).toBe(details);

            fireEvent.click(screen.getByText(label));
            expect(details?.open).toBe(true);
        },
    );

    it('copies code block content', () => {
        const message: ChatMessage = {
            id: 'a-3',
            role: 'assistant',
            content: '```ts\nconsole.log(\"hi\");\n```',
            timestamp: new Date('2026-01-01T00:00:00Z'),
            status: 'complete',
        };

        render(<AgentChatMessageBubble message={message} language="en" />);
        const copyButton = screen.getByTitle('Copy code');
        fireEvent.click(copyButton);
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });

    it('renders inline code and link markdown', () => {
        const message: ChatMessage = {
            id: 'a-4',
            role: 'assistant',
            content: 'Use `useState` hook. See [React docs](https://react.dev).',
            timestamp: new Date('2026-01-01T00:00:00Z'),
            status: 'complete',
        };

        render(<AgentChatMessageBubble message={message} language="en" />);
        // Inline code should be rendered with <code> styling
        const inlineCode = screen.getByText('useState');
        expect(inlineCode.tagName).toBe('CODE');
        // Link should be rendered with target="_blank"
        const link = screen.getByText('React docs');
        expect(link.getAttribute('target')).toBe('_blank');
        expect(link.getAttribute('href')).toBe('https://react.dev');
    });
});
