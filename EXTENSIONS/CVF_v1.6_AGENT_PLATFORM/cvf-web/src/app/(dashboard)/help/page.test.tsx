// Text Encoding Exception: localized Vietnamese user-facing copy follows this file's existing convention.

import viCopy from '@/lib/i18n/vi.json';
import enCopy from '@/lib/i18n/en.json';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HelpPage from './page';

// Mock SurfaceTopBar and KnowledgeJourneyNav
vi.mock('@/components', () => ({
    SurfaceTopBar: ({ title, subtitle }: { title: string; subtitle: string }) => (
        <div data-testid="surface-top-bar">
            <h1>{title}</h1>
            <p>{subtitle}</p>
        </div>
    ),
    KnowledgeJourneyNav: ({ currentStep }: { currentStep: number }) => (
        <div data-testid="knowledge-journey-nav">Step {currentStep}</div>
    ),
}));

vi.mock('@/components/KnowledgeJourneyNav', () => ({
    KnowledgeJourneyNav: ({ currentStep }: { currentStep: number }) => (
        <div data-testid="knowledge-journey-nav">Step {currentStep}</div>
    ),
}));

let mockLang = 'vi';
vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({
        language: mockLang,
        t: (key: string) => ((mockLang === 'vi' ? viCopy : enCopy) as Record<string, string>)[key] ?? key,
        setLanguage: vi.fn(),
    }),
}));

describe('HelpPage', () => {
    beforeEach(() => {
        mockLang = 'vi';
    });

    it('renders KnowledgeJourneyNav at step 1', () => {
        render(<HelpPage />);
        expect(screen.getByTestId('knowledge-journey-nav').textContent).toBe('Step 1');
    });

    it('renders Vietnamese content correctly', () => {
        render(<HelpPage />);
        expect(screen.getByText(viCopy['nav.help'])).toBeTruthy();
        expect(screen.getByText('Những câu hỏi quan trọng nhất')).toBeTruthy();
        expect(screen.getByText('Trò chuyện với AI')).toBeTruthy();
        expect(screen.getByText('Tự kiểm tra an toàn')).toBeTruthy();
        expect(screen.queryByText('Agent Chat')).toBeNull();
    });

    it('renders English content correctly', () => {
        mockLang = 'en';
        render(<HelpPage />);
        expect(screen.getByText(enCopy['nav.help'])).toBeTruthy();
        expect(screen.getByText('The most important questions')).toBeTruthy();
    });
});
