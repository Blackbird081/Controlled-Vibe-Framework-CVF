// Text Encoding Exception: localized Vietnamese user-facing copy follows this file's existing convention.

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import KnowledgeIntakePage from './page';

vi.mock('@/components', () => ({
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
        setLanguage: vi.fn(),
    }),
}));

describe('KnowledgeIntakePage', () => {
    beforeEach(() => {
        mockLang = 'vi';
    });

    it('renders KnowledgeJourneyNav at step 2', () => {
        render(<KnowledgeIntakePage />);
        expect(screen.getByTestId('knowledge-journey-nav').textContent).toBe('Step 2');
    });

    it('renders Vietnamese content correctly', () => {
        render(<KnowledgeIntakePage />);
        expect(screen.getByText('Thu thập')).toBeTruthy();
        expect(screen.getByText('Đưa kiến thức mới vào hệ thống')).toBeTruthy();
        expect(screen.getByText('Xem trước gói rà soát')).toBeTruthy();
        expect(screen.queryByText('Preview packet review')).toBeNull();
    });

    it('renders English content correctly', () => {
        mockLang = 'en';
        render(<KnowledgeIntakePage />);
        expect(screen.getByText('Knowledge Intake')).toBeTruthy();
        expect(screen.getByText('Bring new knowledge into CVF without hiding the trail')).toBeTruthy();
    });
});
