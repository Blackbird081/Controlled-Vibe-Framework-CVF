// Text Encoding Exception: localized Vietnamese user-facing copy follows this file's existing convention.

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KnowledgeJourneyNav } from './KnowledgeJourneyNav';

// Mock useLanguage
let mockLang = 'vi';
vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({
        language: mockLang,
        setLanguage: vi.fn(),
    }),
}));

describe('KnowledgeJourneyNav', () => {
    beforeEach(() => {
        mockLang = 'vi';
    });

    it('renders all 5 steps in Vietnamese', () => {
        render(<KnowledgeJourneyNav currentStep={1} />);
        expect(screen.getByText('1. Tìm hiểu')).toBeTruthy();
        expect(screen.getByText('2. Thu thập')).toBeTruthy();
        expect(screen.getByText('3. Kiểm duyệt')).toBeTruthy();
        expect(screen.getByText('4. Đóng gói')).toBeTruthy();
        expect(screen.getByText('5. Bàn giao')).toBeTruthy();
    });

    it('renders all 5 steps in English', () => {
        mockLang = 'en';
        render(<KnowledgeJourneyNav currentStep={1} />);
        expect(screen.getByText('1. Learn')).toBeTruthy();
        expect(screen.getByText('2. Intake')).toBeTruthy();
        expect(screen.getByText('3. Govern')).toBeTruthy();
        expect(screen.getByText('4. Export')).toBeTruthy();
        expect(screen.getByText('5. Handoff')).toBeTruthy();
    });

    it('highlights the current step with aria-current="step"', () => {
        render(<KnowledgeJourneyNav currentStep={3} />);
        const currentLink = screen.getByRole('link', { name: /Kiểm duyệt/i });
        expect(currentLink.getAttribute('aria-current')).toBe('step');

        const nonCurrentLink = screen.getByRole('link', { name: /Thu thập/i });
        expect(nonCurrentLink.hasAttribute('aria-current')).toBe(false);
    });
});
