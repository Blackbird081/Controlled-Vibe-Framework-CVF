import { act, fireEvent, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AgentChatWithHistory } from './AgentChatWithHistory';
import type { ChatMessage } from '@/lib/agent-chat';

const { dispatch, mounted } = vi.hoisted(() => ({ dispatch: vi.fn(), mounted: vi.fn() }));
vi.mock('./Settings', () => ({ useSettings: () => ({ settings: { preferences: { defaultProvider: 'alibaba' } } }) }));
vi.mock('./AgentChat', () => ({
    AgentChat: ({ initialPrompt, onMessagesChange }: { initialPrompt?: string; onMessagesChange: (messages: ChatMessage[]) => void }) => {
        useEffect(() => { mounted(); }, []);
        useEffect(() => {
            if (initialPrompt) {
                dispatch(initialPrompt);
                onMessagesChange([{ id: 'fixture', role: 'user', content: initialPrompt, timestamp: new Date() }]);
            }
        }, [initialPrompt, onMessagesChange]);
        return <div>Chat fixture</div>;
    },
}));
vi.mock('@/lib/chat-history', async importOriginal => ({
    ...await importOriginal<typeof import('@/lib/chat-history')>(),
    ChatHistorySidebar: ({ onNewChat, onSelectSession }: {
        onNewChat: () => void;
        onSelectSession: (session: { id: string }) => void;
    }) => <>
        <button onClick={onNewChat}>New fixture chat</button>
        <button onClick={() => onSelectSession({ id: 'existing' })}>Select fixture history</button>
        <button onClick={() => {
            const history = JSON.parse(localStorage.getItem('cvf_chat_history')!);
            const intake = history.sessions.find((s: { messages: ChatMessage[] }) => s.messages.some(m => m.content === 'Synthetic INTAKE'));
            onSelectSession(intake);
        }}>Return to fixture intake</button>
    </>,
}));

describe('initial intake prompt ownership', () => {
    beforeEach(() => { localStorage.clear(); dispatch.mockClear(); mounted.mockClear(); });
    afterEach(() => localStorage.clear());

    it('creates one history session and mounts only its ready chat for a new prompt', async () => {
        await act(async () => { render(<AgentChatWithHistory initialPrompt="Synthetic INTAKE" />); });
        expect(dispatch).toHaveBeenCalledTimes(1);
        expect(mounted).toHaveBeenCalledTimes(1);
        const history = JSON.parse(localStorage.getItem('cvf_chat_history')!);
        expect(history.sessions).toHaveLength(1);
        expect(history.activeSessionId).toBe(history.sessions[0].id);
    });

    it('does not replay the incoming prompt when opening another chat or historical session', async () => {
        const when = new Date().toISOString();
        localStorage.setItem('cvf_chat_history', JSON.stringify({ sessions: [{
            id: 'existing', title: 'Existing', messages: [], createdAt: when, updatedAt: when, provider: 'alibaba',
        }], activeSessionId: 'existing' }));
        await act(async () => { render(<AgentChatWithHistory initialPrompt="Synthetic INTAKE" />); });
        expect(dispatch).toHaveBeenCalledTimes(1);
        fireEvent.click(screen.getByText('New fixture chat'));
        fireEvent.click(screen.getByText('Select fixture history'));
        fireEvent.click(screen.getByText('Return to fixture intake'));
        expect(dispatch).toHaveBeenCalledTimes(1);
    });
});
