/**
 * @vitest-environment jsdom
 */
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
            status: 'complete',
            metadata: {
                phase: 'Design',
                qualityScore: 88,
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
            status: 'complete',
            metadata: {
                acceptanceStatus: 'accepted',
            },
        };

        render(<AgentChatMessageBubble message={message} language="vi" />);
        expect(screen.getByText(/Đã chấp nhận/i)).toBeTruthy();
    });

    it('copies code block content', () => {
        const message: ChatMessage = {
            id: 'a-3',
            role: 'assistant',
            content: '```ts\nconsole.log(\"hi\");\n```',
            status: 'complete',
        };

        render(<AgentChatMessageBubble message={message} language="en" />);
        const copyButton = screen.getByTitle('Copy code');
        fireEvent.click(copyButton);
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
});
