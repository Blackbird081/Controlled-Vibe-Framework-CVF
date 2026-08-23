// Text Encoding Exception: localized Vietnamese user-facing copy follows this file's existing convention.

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import KnowledgeGovernancePage from './page';

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

describe('KnowledgeGovernancePage', () => {
    beforeEach(() => {
        mockLang = 'vi';
    });

    it('renders KnowledgeJourneyNav at step 3', () => {
        render(<KnowledgeGovernancePage />);
        expect(screen.getByTestId('knowledge-journey-nav').textContent).toBe('Step 3');
    });

    it('renders Vietnamese content correctly', () => {
        render(<KnowledgeGovernancePage />);
        expect(screen.getByText('🛡️ Kiểm duyệt')).toBeTruthy();
        expect(screen.getByText('Đánh giá và phê duyệt dữ liệu (Governance)')).toBeTruthy();
        expect(screen.getAllByText('1. Biên soạn và duyệt').length).toBeGreaterThan(0);
        expect(screen.getByText('Mã ngữ cảnh')).toBeTruthy();
        expect(screen.getByText('Quyết định kiểm duyệt')).toBeTruthy();
        expect(screen.queryByText('1. Compile & Govern')).toBeNull();
    });

    it('renders English content correctly', () => {
        mockLang = 'en';
        render(<KnowledgeGovernancePage />);
        expect(screen.getByText('📚 Knowledge Governance')).toBeTruthy();
        expect(screen.getByText('Lifecycle: Compile → Govern → Maintain → Refactor → Load Project Knowledge')).toBeTruthy();
    });
});
