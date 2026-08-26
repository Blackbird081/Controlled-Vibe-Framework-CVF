/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CompactHeader from './CompactHeader';

vi.mock('@/lib/i18n', () => ({
    LanguageToggle: () => <button data-testid="language-toggle">EN</button>,
    useLanguage: () => ({
        language: 'en',
        setLanguage: vi.fn(),
        t: (k: string) => k
    }),
}));

vi.mock('@/lib/theme', () => ({
    useTheme: () => ({
        isDarkMode: false,
        toggle: vi.fn(),
    }),
}));

describe('CompactHeader', () => {
    const mockProps = {
        onSidebarOpen: vi.fn(),
        onLogoClick: vi.fn(),
        mockAiEnabled: false,
    };

    it('renders logo and preferences button', () => {
        const { container } = render(<CompactHeader {...mockProps} />);
        expect(screen.getByText('CVF')).toBeTruthy();
        expect(screen.getAllByLabelText('Preferences')[0]).toBeTruthy();
        expect(container.firstElementChild?.className).not.toContain('overflow-hidden');
    });

    it('reveals secondary preferences without clipping the disclosure', () => {
        render(<CompactHeader {...mockProps} />);
        fireEvent.click(screen.getAllByLabelText('Preferences')[0]);
        expect(screen.getByText('Accent color')).toBeTruthy();
        expect(screen.getByText('version 1.6')).toBeTruthy();
    });

    it('toggles language', () => {
        render(<CompactHeader {...mockProps} />);
        fireEvent.click(screen.getAllByText('EN')[0]);
    });
});
