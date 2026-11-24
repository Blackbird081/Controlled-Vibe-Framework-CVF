/**
 * @vitest-environment jsdom
 */
import enLabels from '@/lib/i18n/en.json';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrandDriftIndicator } from './BrandDriftIndicator';

vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language: 'en', t: (key: string) => (enLabels as Record<string, string>)[key] ?? key }),
}));

describe('BrandDriftIndicator fetch behavior', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    it('shows loading then renders fetched drift data', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({
                data: {
                    drift_score: 45,
                    status: 'DRIFTING',
                    changed_fields: ['tone', 'persona'],
                    last_checked: '2026-02-22T12:00:00.000Z',
                },
            }),
        }));

        render(<BrandDriftIndicator />);
        expect(screen.getByText('Checking...')).toBeTruthy();

        await waitFor(() => {
            expect(screen.getByText('45%')).toBeTruthy();
        });
        expect(screen.getByText('tone')).toBeTruthy();
        expect(screen.getByText('persona')).toBeTruthy();
        expect(screen.getByText(/Drifting/)).toBeTruthy();
    });

    it('keeps an unavailable fetch neutral', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

        render(<BrandDriftIndicator />);
        expect(await screen.findAllByText('No data yet')).toHaveLength(2);
        expect(screen.queryByText(/Compliant/)).toBeNull();
        expect(screen.queryByText('0%')).toBeNull();
        expect(screen.queryByText('No changes detected')).toBeNull();
    });

    it.each([true, false])('distinguishes synthetic vs measured zero (fallback=%s)', async fallback => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                status: 'ok',
                fallback,
                data: { drift_score: 0, status: 'COMPLIANT', changed_fields: [], last_checked: '2026-02-22T12:00:00.000Z' },
            }),
        }));

        render(<BrandDriftIndicator />);
        if (fallback) {
            expect(await screen.findAllByText('No data yet')).toHaveLength(2);
            expect(screen.queryByText(/Compliant/)).toBeNull();
        } else {
            expect(await screen.findByText('0%')).toBeTruthy();
            expect(screen.getByText(/Compliant/)).toBeTruthy();
        }
    });

    it('compact mode shows a measured zero with its status', () => {
        const { container } = render(
            <BrandDriftIndicator
                compact
                data={{
                    driftScore: 0,
                    status: 'FROZEN',
                    changedFields: [],
                    lastChecked: '2026-02-22T12:00:00.000Z',
                }}
            />
        );

        expect(container.textContent).toContain('Frozen');
        expect(container.textContent).toContain('0%');
        expect(container.firstElementChild?.classList.contains('text-blue-700')).toBe(true);
    });
});
