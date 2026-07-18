/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LanguageProvider } from '@/lib/i18n';
import GovernancePage from './page';

// Text Encoding Exception: the assertion preserves required Vietnamese user-facing copy.
function renderWithLanguage(lang: 'vi' | 'en') {
    window.localStorage.setItem('cvf_language', lang);
    return render(
        <LanguageProvider>
            <GovernancePage />
        </LanguageProvider>,
    );
}

describe('GovernancePage SOT3 evidence discoverability link', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    afterEach(() => {
        window.localStorage.clear();
    });

    it('renders the English SOT3 Evidence link pointing at /governance/sot3-evidence', async () => {
        renderWithLanguage('en');

        const link = await screen.findByRole('link', { name: 'SOT3 Evidence' });
        expect(link.getAttribute('href')).toBe('/governance/sot3-evidence');
    });

    it('renders the Vietnamese SOT3 Evidence label pointing at /governance/sot3-evidence', async () => {
        renderWithLanguage('vi');

        const link = await screen.findByRole('link', { name: 'Bằng chứng SOT3' });
        expect(link.getAttribute('href')).toBe('/governance/sot3-evidence');
    });

    it('renders the English MAO Durable Runs link pointing at /governance/mao-runs', async () => {
        renderWithLanguage('en');

        const link = await screen.findByRole('link', { name: 'MAO Durable Runs' });
        expect(link.getAttribute('href')).toBe('/governance/mao-runs');
    });

    it('renders the Vietnamese MAO Durable Runs label pointing at /governance/mao-runs', async () => {
        renderWithLanguage('vi');

        const link = await screen.findByRole('link', { name: 'Lượt chạy MAO bền vững' });
        expect(link.getAttribute('href')).toBe('/governance/mao-runs');
    });
});
