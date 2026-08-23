// Text Encoding Exception: localized Vietnamese user-facing copy follows this file's existing convention.

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import WorkTransferPage from './page';

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

vi.mock('@/components/ArtifactExportPanel', () => ({
    ArtifactExportPanel: () => <div data-testid="artifact-export-panel" />,
}));

let mockLang = 'vi';
vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({
        language: mockLang,
        setLanguage: vi.fn(),
    }),
}));

global.fetch = vi.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve({ success: true, data: [] }),
    })
) as Mock;

describe('WorkTransferPage', () => {
    beforeEach(() => {
        mockLang = 'vi';
    });

    it('renders KnowledgeJourneyNav at step 5', async () => {
        render(<WorkTransferPage />);
        expect(screen.getByTestId('knowledge-journey-nav').textContent).toBe('Step 5');
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    });

    it('renders Vietnamese content correctly', async () => {
        render(<WorkTransferPage />);
        expect(screen.getByText('Bàn giao')).toBeTruthy();
        expect(screen.getByText('Bàn giao công việc cho bước tiếp theo')).toBeTruthy();
        expect(screen.getByDisplayValue('Kiến thức mới đã sẵn sàng để rà soát. Hãy giữ ghi chú nguồn, biên nhận và ranh giới khẳng định cùng nhau.')).toBeTruthy();
        expect(screen.getByText('Đã hoàn tất')).toBeTruthy();
        expect(screen.queryByText('Decision: ALLOW')).toBeNull();
        expect(screen.getByText('Quyết định: ALLOW')).toBeTruthy();
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    });

    it('renders English content correctly', async () => {
        mockLang = 'en';
        render(<WorkTransferPage />);
        expect(screen.getByText('Work Transfer')).toBeTruthy();
        expect(screen.getByText('Pass reviewed work forward with less guesswork')).toBeTruthy();
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    });
});
