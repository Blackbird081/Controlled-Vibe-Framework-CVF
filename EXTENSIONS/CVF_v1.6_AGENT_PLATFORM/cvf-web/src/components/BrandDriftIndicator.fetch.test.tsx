/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrandDriftIndicator } from './BrandDriftIndicator';

vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language: 'en' }),
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

    it('falls back to compliant state when API fails', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

        render(<BrandDriftIndicator />);
        await waitFor(() => {
            expect(screen.getByText(/Compliant/)).toBeTruthy();
        });
        expect(screen.getByText('0%')).toBeTruthy();
        expect(screen.getByText('No changes detected')).toBeTruthy();
    });

    it('compact mode hides percent text when drift score is zero', () => {
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
        expect(container.textContent).not.toContain('0%');
    });
});
