/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor, renderHook } from '@testing-library/react';
import { LanguageProvider, LanguageToggle, useLanguage } from './i18n';

describe('i18n', () => {
    it('throws when useLanguage is used outside provider', () => {
        expect(() => renderHook(() => useLanguage())).toThrow('useLanguage must be used within a LanguageProvider');
    });

    it('loads saved language and toggles', async () => {
        localStorage.setItem('cvf_language', 'en');

        render(
            <LanguageProvider>
                <LanguageToggle />
            </LanguageProvider>
        );

        await waitFor(() => expect(screen.getByTitle('English')).toBeTruthy());
        expect(screen.getByText('🌐 VI')).toBeTruthy();

        fireEvent.click(screen.getByRole('button'));
        expect(localStorage.getItem('cvf_language')).toBe('vi');
    }, 10000);

    it('returns key when translation missing', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <LanguageProvider>{children}</LanguageProvider>
        );
        const { result } = renderHook(() => useLanguage(), { wrapper });
        expect(result.current.t('missing.key')).toBe('missing.key');
    });
});
