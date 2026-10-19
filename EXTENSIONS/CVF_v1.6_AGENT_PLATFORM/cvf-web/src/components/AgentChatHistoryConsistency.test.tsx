/**
 * @vitest-environment jsdom
 */
// Worker-authored regression for NCR chat history consistency (synthetic localStorage only).
// Composed from the REAL AgentChatWithHistory, ChatHistorySidebar and useChatHistory. Two
// disclosed Chat leaf modes:
//  - recorder: transparent AgentChat stand-in that mirrors the hook's once-per-prompt guard and
//    message callback, and can replay a delayed callback captured at mount (stale continuation);
//  - real: the actual AgentChat/useAgentChat with an in-process provider-adapter stub
//    (createAIProvider mocked; the shared provider fetch denial from test/setup stays installed).
// Fixture transport proves client wiring only: no AI governance, full-mode, browser, backend
// abort or provider behaviour is claimed. Each `snap()` prints one JSON line the evidence file reuses.
import { StrictMode, useEffect, useRef, useState } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AgentChatWithHistory } from './AgentChatWithHistory';
import type { ChatMessage } from '@/lib/agent-chat';
import type { AgentChatProps } from '@/components/AgentChat';

const { probe, chatMode, providerChat, SETTINGS } = vi.hoisted(() => ({
    probe: {
        chats: [] as Array<{ prompt?: string; existing: string[]; emit: (t: string) => void; emitLate: (t: string) => void }>,
        delivered: [] as string[],
        seq: 0,
    },
    chatMode: { real: false },
    providerChat: vi.fn(),
    SETTINGS: {
        preferences: { defaultProvider: 'alibaba' },
        providers: { alibaba: { apiKey: 'synthetic-key', selectedModel: 'qwen-plus' } },
    },
}));

vi.mock('@/components/Settings', () => ({
    useSettings: () => ({ settings: SETTINGS, updateProvider: vi.fn(), updatePreferences: vi.fn() }),
}));
vi.mock('@/lib/i18n', () => ({ useLanguage: () => ({ language: 'en', t: (key: string) => key }) }));
vi.mock('@/lib/ai-providers', () => ({ createAIProvider: () => ({ chat: providerChat }) }));
vi.mock('@/lib/hooks/useModelPricing', () => ({ useModelPricing: () => ({ pricing: {}, status: 'ready', updatedAt: null }) }));
vi.mock('@/lib/quota-manager', async () => ({
    ...await vi.importActual<typeof import('@/lib/quota-manager')>('@/lib/quota-manager'),
    useQuotaManager: () => ({
        trackUsage: vi.fn(),
        checkBudget: () => ({ ok: true, warning: false, remaining: { daily: Infinity, monthly: Infinity } }),
    }),
}));
vi.mock('@/components/AgentChat', async importOriginal => {
    const actual = await importOriginal<typeof import('@/components/AgentChat')>();
    const msg = (content: string): ChatMessage => ({ id: `rec-${++probe.seq}`, role: 'user', content, timestamp: new Date() });
    function Recorder({ initialPrompt, existingMessages, onMessagesChange }: AgentChatProps) {
        const [messages, setMessages] = useState<ChatMessage[]>(existingMessages ?? []);
        const handled = useRef<string | null>(null);
        const mountCallback = useRef(onMessagesChange); // closure captured at mount = delayed continuation
        const latest = useRef(messages);
        latest.current = messages;
        useEffect(() => {
            probe.chats.push({
                prompt: initialPrompt,
                existing: (existingMessages ?? []).map(m => m.content),
                emit: text => act(() => setMessages(prev => [...prev, msg(text)])),
                emitLate: text => act(() => mountCallback.current?.([...latest.current, msg(text)])),
            });
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);
        useEffect(() => {
            if (initialPrompt && handled.current !== initialPrompt) {
                handled.current = initialPrompt;
                probe.delivered.push(initialPrompt);
                setMessages(prev => [...prev, msg(initialPrompt)]);
            }
        }, [initialPrompt]);
        useEffect(() => { if (messages.length > 0) onMessagesChange?.(messages); }, [messages, onMessagesChange]);
        return <div data-testid="chat-body">{messages.map(m => m.content).join('|')}</div>;
    }
    return { ...actual, AgentChat: (props: AgentChatProps) => (chatMode.real ? <actual.AgentChat {...props} /> : <Recorder {...props} />) };
});

const KEY = 'cvf_chat_history';
const WHEN = '2026-01-01T00:00:00.000Z';
const SESSIONS: Record<string, object> = {
    A: {
        id: 'saved-A', title: 'Saved A', provider: 'alibaba', createdAt: WHEN, updatedAt: WHEN,
        metadata: { messageCount: 1 },
        messages: [{ id: 'a1', role: 'user', content: 'body-A', timestamp: WHEN }],
    },
    B: {
        id: 'saved-B', title: 'Saved B', provider: 'gemini', createdAt: WHEN, updatedAt: WHEN,
        metadata: { messageCount: 2, totalTokens: 42 },
        messages: [
            { id: 'b1', role: 'user', content: 'body-B', timestamp: WHEN },
            { id: 'b2', role: 'assistant', content: 'answer-B', timestamp: WHEN },
        ],
    },
};
const seed = (ids: string[] = ['A', 'B']) => localStorage.setItem(KEY, JSON.stringify({
    sessions: ids.map(id => SESSIONS[id]), activeSessionId: (SESSIONS[ids[0]] as { id: string }).id,
}));

type Stored = { id: string; title: string; provider: string; metadata?: { messageCount: number; totalTokens?: number }; messages: Array<{ content: string }> };
const stored = () => JSON.parse(localStorage.getItem(KEY)!) as { activeSessionId: string | null; sessions: Stored[] };
const storedIds = () => stored().sessions.map(s => s.id);
const rowEls = () => screen.queryAllByTitle('Delete').map(button => button.closest('.group') as HTMLElement);
const rows = () => rowEls().map(row => ({
    title: row.querySelector('span.font-medium')!.textContent,
    count: Number(/(\d+) msgs/.exec(row.textContent!)![1]),
    active: row.className.includes('border-blue-500'),
}));
const row = (title: string) => rowEls().find(el => el.querySelector('span.font-medium')!.textContent === title)!;
const body = () => screen.getByTestId('chat-body').textContent;
const newChat = () => fireEvent.click(screen.getByRole('button', { name: /New Chat/ }));
const select = (title: string) => fireEvent.click(row(title));
const remove = (title: string) => fireEvent.click(within(row(title)).getByTitle('Delete'));
const clearAll = (choice: 'Confirm' | 'Cancel') => {
    fireEvent.click(screen.getByText(/Clear All History/));
    fireEvent.click(screen.getByText(choice));
};
const live = () => probe.chats[probe.chats.length - 1];
const snap = (label: string) => console.log('SNAP ' + JSON.stringify({
    label,
    sidebar: rows(),
    chat: screen.queryByTestId('chat-body')?.textContent ?? null,
    storage: { active: stored().activeSessionId, sessions: stored().sessions.map(s => ({ id: s.id, title: s.title, count: s.metadata?.messageCount, texts: s.messages.map(m => m.content) })) },
}));

/** One oracle: sidebar rows, persisted sessions, active marker and chat body describe the same state. */
function expectAgreement() {
    const h = stored();
    expect(rows().map(r => [r.title, r.count])).toEqual(h.sessions.map(s => [s.title, s.metadata?.messageCount]));
    expect(h.sessions.every(s => s.metadata?.messageCount === s.messages.length)).toBe(true);
    const active = h.sessions.find(s => s.id === h.activeSessionId)!;
    expect(active).toBeDefined();
    expect(rows().filter(r => r.active).map(r => r.title)).toEqual([active.title]);
    if (!chatMode.real) expect(body()).toBe(active.messages.map(m => m.content).join('|'));
}

beforeEach(() => {
    localStorage.clear();
    probe.chats.length = 0; probe.delivered.length = 0; probe.seq = 0;
    chatMode.real = false;
    providerChat.mockReset();
    providerChat.mockImplementation(async (messages: Array<{ content: string }>) => ({
        text: `STUB_REPLY(${messages[messages.length - 1].content})`, usage: { totalTokens: 3 },
    }));
});
afterEach(() => { vi.useRealTimers(); localStorage.clear(); });

describe('history consistency: real sidebar + hook, recorder Chat leaf', () => {
    it('control: seeded sessions show in the sidebar and the active one fills the chat', () => {
        seed();
        render(<AgentChatWithHistory />);
        expect(rows()).toEqual([{ title: 'Saved A', count: 1, active: true }, { title: 'Saved B', count: 2, active: false }]);
        expect(body()).toBe('body-A');
        expectAgreement();
        snap('control-seeded');
    });

    it('New Chat shows at once, title/count follow real messages, selection restores each own messages', () => {
        seed();
        render(<AgentChatWithHistory />);
        const before = stored();
        newChat();
        expect(rows()).toEqual([
            { title: 'New Chat', count: 0, active: true },
            { title: 'Saved A', count: 1, active: false },
            { title: 'Saved B', count: 2, active: false },
        ]);
        expect(body()).toBe('');
        expect(stored().sessions).toHaveLength(3);
        expect(stored().sessions[0].provider).toBe('alibaba');
        expectAgreement();
        snap('new-chat');

        live().emit('typed-N');
        expect(rows()[0]).toEqual({ title: 'typed-N', count: 1, active: true });
        expectAgreement();
        live().emit('typed-N2');
        expect(rows()[0]).toMatchObject({ title: 'typed-N', count: 2 });
        snap('new-chat-two-messages');

        select('Saved B');
        expect(body()).toBe('body-B|answer-B');
        expect(rows().find(r => r.active)!.title).toBe('Saved B');
        expect(stored().activeSessionId).toBe('saved-B');
        expectAgreement();
        select('Saved A');
        expect(body()).toBe('body-A');
        expectAgreement();
        select('typed-N');
        expect(body()).toBe('typed-N|typed-N2');
        // saved sessions keep every field, including unrelated metadata and timestamps
        expect(stored().sessions.filter(s => s.id.startsWith('saved-'))).toEqual(before.sessions);
        snap('selection-roundtrip');
    });

    it('incoming prompt session shows immediately and is never replayed by New Chat or selection', () => {
        seed();
        render(<AgentChatWithHistory initialPrompt="INCOMING" />);
        expect(probe.delivered).toEqual(['INCOMING']);
        expect(rows()).toEqual([
            { title: 'INCOMING', count: 1, active: true },
            { title: 'Saved A', count: 1, active: false },
            { title: 'Saved B', count: 2, active: false },
        ]);
        expectAgreement();
        snap('incoming-prompt');
        newChat();
        select('Saved B');
        select('Saved A');
        select('INCOMING');
        expect(body()).toBe('INCOMING');
        expect(probe.delivered).toEqual(['INCOMING']);
        expect(probe.chats.slice(1).every(c => c.prompt === undefined)).toBe(true);
        expect(stored().sessions.filter(s => s.messages.some(m => m.content === 'INCOMING'))).toHaveLength(1);
        expectAgreement();
    });

    it('deleting an inactive session leaves the open chat untouched', () => {
        seed();
        render(<AgentChatWithHistory />);
        const mounts = probe.chats.length;
        remove('Saved B');
        expect(rows()).toEqual([{ title: 'Saved A', count: 1, active: true }]);
        expect(body()).toBe('body-A');
        expect(probe.chats).toHaveLength(mounts);
        expect(storedIds()).toEqual(['saved-A']);
        expect(stored().activeSessionId).toBe('saved-A');
        expectAgreement();
        snap('delete-inactive');
    });

    it('deleting the active session selects the first survivor, persists it and cannot resurrect it', () => {
        seed();
        render(<AgentChatWithHistory />);
        remove('Saved A');
        expect(rows()).toEqual([{ title: 'Saved B', count: 2, active: true }]);
        expect(body()).toBe('body-B|answer-B');
        expect(stored().activeSessionId).toBe('saved-B');
        expect(storedIds()).toEqual(['saved-B']);
        expectAgreement();
        snap('delete-active');
        newChat();
        expect(storedIds()).not.toContain('saved-A');
        expect(JSON.stringify(stored())).not.toContain('body-A');
        expect(rows().map(r => r.title)).toEqual(['New Chat', 'Saved B']);
        live().emit('after-delete');
        expect(storedIds()).toHaveLength(2);
        expect(JSON.stringify(stored())).not.toContain('body-A');
        expectAgreement();
        snap('delete-active-then-new-chat');
    });

    it('active delete picks the state-array-first survivor, not the neighbour', () => {
        seed();
        render(<AgentChatWithHistory />);
        newChat();
        live().emit('typed-N');
        select('Saved B');
        remove('Saved B');
        expect(rows()).toEqual([{ title: 'typed-N', count: 1, active: true }, { title: 'Saved A', count: 1, active: false }]);
        expect(body()).toBe('typed-N');
        expect(stored().activeSessionId).toBe(stored().sessions[0].id);
        expectAgreement();
    });

    it('deleting the final session creates exactly one empty replacement (also under StrictMode)', () => {
        for (const strict of [false, true]) {
            localStorage.clear(); probe.chats.length = 0;
            seed(['A']);
            const shell = <AgentChatWithHistory />;
            const view = render(strict ? <StrictMode>{shell}</StrictMode> : shell);
            remove('Saved A');
            expect(rows()).toEqual([{ title: 'New Chat', count: 0, active: true }]);
            expect(body()).toBe('');
            const h = stored();
            expect(h.sessions).toHaveLength(1);
            expect(h.sessions[0]).toMatchObject({ provider: 'alibaba', messages: [] });
            expect(h.activeSessionId).toBe(h.sessions[0].id);
            expect(JSON.stringify(h)).not.toContain('body-A');
            view.rerender(strict ? <StrictMode>{shell}</StrictMode> : shell);
            expect(stored().sessions).toHaveLength(1);
            expect(rows()).toHaveLength(1);
            snap(`delete-final-${strict ? 'strict' : 'plain'}`);
            view.unmount();
        }
    });

    it('Confirm Clear All leaves one empty replacement; Cancel changes nothing', () => {
        seed();
        render(<AgentChatWithHistory />);
        const raw = localStorage.getItem(KEY);
        const mounts = probe.chats.length;
        clearAll('Cancel');
        expect(localStorage.getItem(KEY)).toBe(raw);
        expect(rows()).toHaveLength(2);
        expect(body()).toBe('body-A');
        expect(probe.chats).toHaveLength(mounts);
        expect(screen.queryByText('Confirm')).toBeNull();
        snap('clear-cancel');
        clearAll('Confirm');
        expect(rows()).toEqual([{ title: 'New Chat', count: 0, active: true }]);
        expect(body()).toBe('');
        expect(stored().sessions).toHaveLength(1);
        expect(stored().sessions[0].messages).toEqual([]);
        expect(JSON.stringify(stored())).not.toMatch(/body-A|body-B|answer-B/);
        expectAgreement();
        snap('clear-confirm');
    });

    it('clearing the incoming session cannot replay its prompt into the replacement', () => {
        seed();
        const view = render(<AgentChatWithHistory initialPrompt="INCOMING" />);
        expect(probe.delivered).toEqual(['INCOMING']);
        clearAll('Confirm');
        expect(body()).toBe('');
        view.rerender(<AgentChatWithHistory initialPrompt="INCOMING" />);
        newChat();
        select('New Chat');
        expect(probe.delivered).toEqual(['INCOMING']);
        expect(probe.chats.slice(1).every(c => c.prompt === undefined)).toBe(true);
        expect(JSON.stringify(stored())).not.toContain('INCOMING');
        expect(stored().sessions).toHaveLength(2);
        snap('clear-incoming');
        // close / reopen with no prompt keeps the persisted state
        view.unmount();
        render(<AgentChatWithHistory />);
        expect(stored().sessions).toHaveLength(2);
        expect(JSON.stringify(stored())).not.toContain('INCOMING');
        expectAgreement();
    });

    it('deleting the incoming session before anything else cannot replay it either', () => {
        seed();
        render(<AgentChatWithHistory initialPrompt="INCOMING" />);
        remove('INCOMING');
        expect(rows()[0]).toEqual({ title: 'Saved A', count: 1, active: true });
        expect(body()).toBe('body-A');
        newChat();
        expect(probe.delivered).toEqual(['INCOMING']);
        expect(JSON.stringify(stored())).not.toContain('INCOMING');
        expectAgreement();
    });

    it('a delayed message callback from a deleted or cleared chat restores nothing', () => {
        seed();
        render(<AgentChatWithHistory />);
        const chatA = live();
        remove('Saved A');
        const afterDelete = localStorage.getItem(KEY);
        chatA.emitLate('LATE_A');
        expect(localStorage.getItem(KEY)).toBe(afterDelete);
        expect(storedIds()).toEqual(['saved-B']);
        expect(rows()).toEqual([{ title: 'Saved B', count: 2, active: true }]);
        newChat();
        chatA.emitLate('LATE_A_AGAIN');
        expect(JSON.stringify(stored())).not.toMatch(/LATE_A|saved-A|body-A/);
        expectAgreement();
        snap('late-after-delete');

        const chatB = probe.chats[probe.chats.length - 2] ?? live();
        clearAll('Confirm');
        chatB.emitLate('LATE_B');
        expect(JSON.stringify(stored())).not.toMatch(/LATE_B|saved-B|body-B/);
        expect(stored().sessions).toHaveLength(1);
        expect(stored().sessions[0].id).not.toBe('saved-B');
        expectAgreement();
        snap('late-after-clear');
    });

    it('a delayed callback for a live session lands in that session only, never in the selected one', () => {
        seed();
        render(<AgentChatWithHistory />);
        const chatA = live();
        select('Saved B');
        chatA.emitLate('LATE_FOR_A');
        const h = stored();
        expect(h.sessions.find(s => s.id === 'saved-B')!.messages.map(m => m.content)).toEqual(['body-B', 'answer-B']);
        expect(h.sessions.find(s => s.id === 'saved-A')!.messages.map(m => m.content)).toEqual(['body-A', 'LATE_FOR_A']);
        expect(body()).toBe('body-B|answer-B');
        expect(h.activeSessionId).toBe('saved-B');
        expectAgreement();
    });

    it('ordinary rerenders and StrictMode never add visible or persisted sessions', () => {
        seed();
        const shell = <StrictMode><AgentChatWithHistory /></StrictMode>;
        const view = render(shell);
        view.rerender(shell);
        view.rerender(shell);
        expect(rows()).toHaveLength(2);
        expect(stored().sessions).toHaveLength(2);
        view.unmount();
        localStorage.clear();
        const empty = render(shell);
        empty.rerender(shell);
        expect(rows()).toEqual([{ title: 'New Chat', count: 0, active: true }]);
        expect(stored().sessions).toHaveLength(1);
        expectAgreement();
    });

    it('an orphaned active ID in storage recovers to the first stored session', () => {
        seed();
        localStorage.setItem(KEY, JSON.stringify({ ...stored(), activeSessionId: 'gone' }));
        render(<AgentChatWithHistory />);
        expect(body()).toBe('body-A');
        expect(stored().activeSessionId).toBe('saved-A');
        expectAgreement();
    });
});

describe('history consistency: real AgentChat and useAgentChat seam (in-process provider stub)', () => {
    beforeEach(() => { chatMode.real = true; });
    const send = (text: string) => {
        fireEvent.change(screen.getByLabelText('Message input'), { target: { value: text } });
        fireEvent.click(screen.getByLabelText('Send message'));
    };
    const settle = () => act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
    const texts = (id: string) => stored().sessions.find(s => s.id === id)!.messages.map(m => m.content);

    it('real send updates sidebar title/count; selection shows each own messages; no cross-copy', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch'); // wraps, never replaces, the shared denial guard
        seed();
        render(<AgentChatWithHistory />);
        newChat();
        send('REAL_Q');
        await settle();
        expect(providerChat).toHaveBeenCalledTimes(1);
        const created = stored().sessions[0];
        expect(created.messages.map(m => m.content)).toEqual(expect.arrayContaining(['REAL_Q', 'STUB_REPLY(REAL_Q)']));
        expect(rows()[0]).toEqual({ title: 'REAL_Q', count: created.messages.length, active: true });
        expectAgreement();
        snap('real-send');
        select('Saved B');
        expect(document.body.textContent).toContain('answer-B');
        expect(document.body.textContent).not.toContain('STUB_REPLY(REAL_Q)');
        expect(texts('saved-B')).toEqual(['body-B', 'answer-B']);
        select('REAL_Q');
        expect(document.body.textContent).toContain('STUB_REPLY(REAL_Q)');
        expect(document.body.textContent).not.toContain('answer-B');
        expect(providerChat).toHaveBeenCalledTimes(1);
        expect(fetchSpy).not.toHaveBeenCalled();
        fetchSpy.mockRestore();
    });

    it('a provider result that arrives after the active session was deleted restores nothing', async () => {
        let release!: (value: { text: string; usage: { totalTokens: number } }) => void;
        providerChat.mockImplementation(() => new Promise(resolve => { release = resolve; }));
        seed();
        render(<AgentChatWithHistory />);
        newChat();
        send('SLOW_Q');
        await settle();
        const slowId = stored().sessions[0].id;
        expect(texts(slowId)).toContain('SLOW_Q');
        expect(rows()[0].title).toBe('SLOW_Q');
        remove('SLOW_Q');
        expect(storedIds()).toEqual(['saved-A', 'saved-B']);
        expect(stored().activeSessionId).toBe('saved-A');
        await act(async () => { release({ text: 'STUB_SLOW_REPLY', usage: { totalTokens: 1 } }); });
        await settle();
        newChat();
        await settle();
        expect(JSON.stringify(stored())).not.toMatch(/SLOW_Q|STUB_SLOW_REPLY/);
        expect(storedIds()).not.toContain(slowId);
        expect(stored().sessions).toHaveLength(3);
        expect(texts('saved-A')).toEqual(['body-A']);
        expectAgreement();
        snap('real-late-result-after-delete');
    });
});
