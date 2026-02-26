/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DocsPage from './page';
import { DOCS } from '@/data/docs-data';

let mockLanguage: 'vi' | 'en' = 'vi';

vi.mock('next/link', () => ({
    default: ({ href, children, ...props }: any) => (
        <a href={typeof href === 'string' ? href : String(href)} {...props}>
            {children}
        </a>
    ),
}));

vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language: mockLanguage, t: (key: string) => key }),
    LanguageToggle: () => <button type="button">Language</button>,
}));

vi.mock('@/lib/theme', () => ({
    ThemeToggle: () => <button type="button">Theme</button>,
}));

describe('DocsPage external skills section', () => {
    it('renders Vietnamese external skills reference section with all expected links', () => {
        mockLanguage = 'vi';
        render(<DocsPage />);

        expect(screen.getByText('Thư viện Skills Tham khảo')).toBeTruthy();
        expect(
            screen.getByText(/Không tích hợp trực tiếp vào CVF/i)
        ).toBeTruthy();
        expect(screen.getByText('An toàn & Alignment')).toBeTruthy();
        expect(screen.getByText('Đánh giá')).toBeTruthy();

        const repoLink = screen.getByRole('link', {
            name: /Xem toàn bộ 85 skills/i,
        });
        expect(repoLink.getAttribute('href')).toBe(
            'https://github.com/Orchestra-Research/AI-Research-SKILLs'
        );

        const allExternalLinks = document.querySelectorAll(
            'a[href*="AI-Research-SKILLs"]'
        );
        expect(allExternalLinks.length).toBe(6);
    });

    it('renders English external skills labels when language is en', () => {
        mockLanguage = 'en';
        render(<DocsPage />);

        expect(
            screen.getByText('External Skills Reference Library')
        ).toBeTruthy();
        expect(
            screen.getByText(/reference only for patterns & implementation/i)
        ).toBeTruthy();
        expect(
            screen.getByRole('link', { name: /View all 85 skills/i })
        ).toBeTruthy();
    });

    it('filters docs by selected category and toggles back to all', () => {
        mockLanguage = 'en';
        render(<DocsPage />);

        const firstCategory = DOCS[0];
        const secondCategory = DOCS[1];
        const firstItemTitle = firstCategory.items[0].title.en;
        const secondItemTitle = secondCategory.items[0].title.en;

        expect(screen.getByText(firstItemTitle)).toBeTruthy();
        expect(screen.getByText(secondItemTitle)).toBeTruthy();

        const firstCategoryButton = screen.getByRole('button', {
            name: new RegExp(firstCategory.label.en, 'i'),
        });
        fireEvent.click(firstCategoryButton);

        expect(screen.getByText(firstItemTitle)).toBeTruthy();
        expect(screen.queryByText(secondItemTitle)).toBeNull();

        fireEvent.click(firstCategoryButton);
        expect(screen.getByText(secondItemTitle)).toBeTruthy();
    });
});
