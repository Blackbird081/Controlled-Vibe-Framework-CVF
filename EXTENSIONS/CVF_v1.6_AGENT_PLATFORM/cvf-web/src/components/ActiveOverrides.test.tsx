/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ActiveOverrides, type ActiveOverride } from './ActiveOverrides';

let language: 'vi' | 'en' = 'vi';

vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language }),
}));

function makeOverride(partial: Partial<ActiveOverride> = {}): ActiveOverride {
    return {
        id: partial.id || 'ovr-1',
        requestId: partial.requestId || 'request-1234567890',
        scope: partial.scope || 'request',
        approvedBy: partial.approvedBy || 'qa-user',
        expiresAt: partial.expiresAt || new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        createdAt: partial.createdAt || new Date().toISOString(),
        justification: partial.justification || 'approved for test',
    };
}

describe('ActiveOverrides', () => {
    beforeEach(() => {
        vi.unstubAllGlobals();
        language = 'vi';
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('renders active overrides, filters expired entries, and highlights urgent ones', () => {
        const items: ActiveOverride[] = [
            makeOverride({
                id: 'urgent',
                requestId: 'urgent-request-1234',
                expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            }),
            makeOverride({
                id: 'normal',
                requestId: 'normal-request-1234',
                expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
            }),
            makeOverride({
                id: 'expired',
                requestId: 'expired-request-1234',
                expiresAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            }),
        ];

        render(<ActiveOverrides overrides={items} />);

        expect(screen.getByText(/Ghi đè đang hoạt động \(2\)/i)).toBeTruthy();
        expect(screen.getByText(/Sắp hết hạn!/i)).toBeTruthy();
        expect(screen.queryByText(/expired-request/i)).toBeNull();
    });

    it('renders compact badge with active count', () => {
        const items: ActiveOverride[] = [
            makeOverride({ id: 'a1' }),
            makeOverride({ id: 'a2', expiresAt: new Date(Date.now() - 60 * 60 * 1000).toISOString() }),
        ];

        render(<ActiveOverrides overrides={items} compact />);

        expect(screen.getByText(/⏳\s*1/i)).toBeTruthy();
        expect(screen.queryByText(/Ghi đè đang hoạt động/i)).toBeNull();
    });

    it('fetches overrides when prop is missing and renders english labels', async () => {
        language = 'en';
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                data: {
                    overrides: [makeOverride({ id: 'fetched' })],
                },
            }),
        });
        vi.stubGlobal('fetch', fetchMock);

        render(<ActiveOverrides />);

        expect(screen.getByText(/Loading.../i)).toBeTruthy();
        await waitFor(() => expect(screen.getByText(/Active Overrides \(1\)/i)).toBeTruthy());
        expect(fetchMock).toHaveBeenCalled();
    });

    it('handles fetch failure and shows empty state', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({}),
        });
        vi.stubGlobal('fetch', fetchMock);

        render(<ActiveOverrides />);

        await waitFor(() => {
            expect(screen.getByText(/Không có ghi đè nào/i)).toBeTruthy();
        });
    });
});
