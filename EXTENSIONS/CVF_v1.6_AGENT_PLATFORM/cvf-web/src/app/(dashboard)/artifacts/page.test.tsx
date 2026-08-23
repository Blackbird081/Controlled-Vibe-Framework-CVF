// Text Encoding Exception: localized Vietnamese user-facing copy follows this file's existing convention.

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ArtifactsPage from './page';

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

vi.mock('@/components/ArtifactExportPanel', () => {
    return {
        default: function MockArtifactExportPanel() {
            return <div data-testid="artifact-export-panel" />;
        }
    };
});

let mockLang = 'vi';
vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({
        language: mockLang,
        setLanguage: vi.fn(),
    }),
}));

describe('ArtifactsPage', () => {
    beforeEach(() => {
        mockLang = 'vi';
    });

    it('renders KnowledgeJourneyNav at step 4', () => {
        render(<ArtifactsPage />);
        expect(screen.getByTestId('knowledge-journey-nav').textContent).toBe('Step 4');
    });

    it('renders Vietnamese content correctly', () => {
        render(<ArtifactsPage />);
        expect(screen.getByText('Đóng gói')).toBeTruthy();
        expect(screen.getByText('Biến phần đã duyệt thành gói HTML để rà soát')).toBeTruthy();
    });

    it('renders English content correctly', () => {
        mockLang = 'en';
        render(<ArtifactsPage />);
        expect(screen.getByText('Review Packet Export')).toBeTruthy();
        expect(screen.getByText('Turn approved work into an HTML review packet')).toBeTruthy();
    });
});
