import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useAuth, verifyAgentChatAccount } from './useAuth';

vi.mock('next-auth/react', () => ({ signOut: vi.fn() }));

const noPermissions = {
    canUseAgent: false, canUseMultiAgent: false, canUseTools: false,
    canUseSettings: false, canUseAIUsage: false, canUseContext: false,
};

afterEach(() => {
    vi.unstubAllGlobals();
    document.cookie = 'cvf_role=; Path=/; Max-Age=0';
});

describe('useAuth session role', () => {
    it('starts without a role or permissions while the request is pending', () => {
        vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
        const { result } = renderHook(() => useAuth());
        expect(result.current.userRole).toBeNull();
        expect(result.current.permissions).toEqual(noPermissions);
    });

    it.each(['401', 'network error', 'invalid role'])('does not trust a forged role cookie on %s', async (scenario) => {
        document.cookie = 'cvf_role=admin; Path=/';
        const fetchMock = scenario === 'network error'
            ? vi.fn().mockRejectedValue(new Error('offline'))
            : vi.fn().mockResolvedValue(scenario === '401'
                ? { ok: false, status: 401 }
                : { ok: true, json: async () => ({ authenticated: true, role: 'constructor' }) });
        vi.stubGlobal('fetch', fetchMock);
        const { result } = renderHook(() => useAuth());
        await act(async () => { await fetchMock.mock.results[0].value.catch(() => undefined); });
        expect(fetchMock).toHaveBeenCalledWith('/api/auth/me', { cache: 'no-store' });
        expect(result.current.userRole).toBeNull();
        expect(result.current.permissions).toEqual(noPermissions);
        expect(result.current.userName).toBeUndefined();
    });

    it('uses the role and name returned by the verified session', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true, json: async () => ({ authenticated: true, role: 'reviewer', user: 'Ada' }),
        }));
        const { result } = renderHook(() => useAuth());
        await waitFor(() => expect(result.current.userRole).toBe('reviewer'));
        expect(result.current.userName).toBe('Ada');
        expect(result.current.permissions.canUseAgent).toBe(true);
        expect(result.current.permissions.canUseTools).toBe(false);
    });

    it('rejects the shared legacy account placeholder for model requests', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true, json: async () => ({ authenticated: true, role: 'admin', orgId: 'org_cvf', userId: 'unknown-user' }),
        }));
        const { result } = renderHook(() => useAuth());
        await waitFor(() => expect(result.current.userRole).toBe('admin'));
        expect(result.current.accountScope).toBeUndefined();
        await act(async () => {
            expect(await verifyAgentChatAccount('["org_cvf","unknown-user"]', false)).toBe(false);
        });
    });
});
