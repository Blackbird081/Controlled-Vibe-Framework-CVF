import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { useAgentModelSelection } from './useAgentModelSelection';

beforeEach(() => localStorage.clear());

it('retains the selection for the verified account and hides it on account switch or sign-out', async () => {
    const { result, rerender, unmount } = renderHook(
        ({ account }: { account?: string }) => useAgentModelSelection(account),
        { initialProps: { account: 'org/account-a' as string | undefined } },
    );
    await waitFor(() => expect(result.current.ready).toBe(true));
    act(() => result.current.selectModel('openai:gpt-6-luna'));
    expect(result.current.model).toEqual({ provider: 'openai', model: 'gpt-6-luna' });

    rerender({ account: 'org/account-b' });
    expect(result.current.model).toBeNull();
    await waitFor(() => expect(result.current.ready).toBe(true));
    act(() => result.current.selectModel('gemini:gemini-4-hydrogen'));
    expect(result.current.model?.provider).toBe('gemini');
    rerender({ account: undefined });
    expect(result.current.model).toBeNull();
    unmount();

    const reopened = renderHook(() => useAgentModelSelection('org/account-a'));
    await waitFor(() => expect(reopened.result.current.model?.model).toBe('gpt-6-luna'));
});

it('ignores retired, mismatched and free-quota-only models in personal settings', async () => {
    localStorage.setItem('cvf_agent_model:account', 'openai:gpt-4-turbo');
    const { result } = renderHook(() => useAgentModelSelection('account'));
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.model).toBeNull();
    act(() => result.current.selectModel('openai:deepseek-flash'));
    act(() => result.current.selectModel('alibaba:qwen-plus-character'));
    expect(result.current.model).toBeNull();
});
