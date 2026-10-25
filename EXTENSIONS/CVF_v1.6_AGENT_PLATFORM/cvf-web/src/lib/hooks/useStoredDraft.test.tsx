// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { useStoredDraft } from './useStoredDraft';

const key = 'stored-draft-contract';
afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); });

describe('stored draft mount prompt', () => {
    it('hydrates a saved draft without mismatching the server or loading its data', async () => {
        localStorage.setItem(key, JSON.stringify({ data: { goal: 'Existing draft' }, step: 4 }));
        function Prompt() { const [hasDraft] = useStoredDraft(key); return <span>{String(hasDraft)}</span>; }
        const container = document.createElement('div');
        container.innerHTML = renderToString(<Prompt />);
        expect(container.textContent).toBe('false');
        const onRecoverableError = vi.fn();
        let root!: ReturnType<typeof hydrateRoot>;
        await act(async () => { root = hydrateRoot(container, <Prompt />, { onRecoverableError }); });
        expect(container.textContent).toBe('true');
        expect(onRecoverableError).not.toHaveBeenCalled();
        expect(JSON.parse(localStorage.getItem(key)!).step).toBe(4);
        await act(async () => root.unmount());
    });

    it('keeps a dismissed mount prompt closed while the current draft changes', () => {
        localStorage.setItem(key, JSON.stringify({ data: { goal: 'Old' } }));
        const hook = renderHook(() => useStoredDraft(key));
        expect(hook.result.current[0]).toBe(true);
        act(() => hook.result.current[1](false));
        localStorage.setItem(key, JSON.stringify({ data: { goal: 'New' } }));
        hook.rerender();
        expect(hook.result.current[0]).toBe(false);
    });

    it('does not advertise newly saved edits as a pre-existing draft', () => {
        const hook = renderHook(() => useStoredDraft(key));
        localStorage.setItem(key, JSON.stringify({ data: { goal: 'New' } }));
        hook.rerender();
        expect(hook.result.current[0]).toBe(false);
    });

    it('has no draft prompt for corrupt or inaccessible storage', () => {
        localStorage.setItem(key, '{');
        expect(renderHook(() => useStoredDraft(key)).result.current[0]).toBe(false);
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('DENIED'); });
        expect(renderHook(() => useStoredDraft(key)).result.current[0]).toBe(false);
    });
});
