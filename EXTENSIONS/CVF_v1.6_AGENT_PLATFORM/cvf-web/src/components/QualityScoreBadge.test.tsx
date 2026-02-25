/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QualityScoreBadge } from './QualityScoreBadge';
import type { CVFQualityResult } from '@/types/governance-engine';

vi.mock('./QualityRadar', () => ({
    QualityRadar: () => <div>QualityRadarMock</div>,
}));

const baseServerQuality: CVFQualityResult = {
    correctness: 0.8,
    safety: 0.9,
    alignment: 0.85,
    quality: 0.82,
    overall: 0.87,
    grade: 'A',
};

describe('QualityScoreBadge', () => {
    it('renders fallback badge without server quality', () => {
        render(
            <QualityScoreBadge
                score={{
                    overall: 85,
                    completeness: 80,
                    clarity: 82,
                    actionability: 86,
                    compliance: 88,
                }}
                language="vi"
            />
        );

        expect(screen.getByText(/85% Xuất sắc/i)).toBeTruthy();
        expect(screen.queryByText('QualityRadarMock')).toBeNull();
    });

    it('renders server quality badge and toggles radar panel', () => {
        render(
            <QualityScoreBadge
                score={{
                    overall: 50,
                    completeness: 50,
                    clarity: 50,
                    actionability: 50,
                    compliance: 50,
                }}
                language="en"
                serverQuality={baseServerQuality}
            />
        );

        expect(screen.getByText('87%')).toBeTruthy();
        expect(screen.getByText('A')).toBeTruthy();
        expect(screen.queryByText('QualityRadarMock')).toBeNull();

        fireEvent.click(screen.getByRole('button'));
        expect(screen.getByText('QualityRadarMock')).toBeTruthy();
        expect(screen.getByText('Close')).toBeTruthy();

        fireEvent.click(screen.getByText('Close'));
        expect(screen.queryByText('QualityRadarMock')).toBeNull();
    });

    it('falls back to F color class for unknown server grade', () => {
        render(
            <QualityScoreBadge
                score={{
                    overall: 30,
                    completeness: 30,
                    clarity: 30,
                    actionability: 30,
                    compliance: 30,
                }}
                serverQuality={{ ...baseServerQuality, grade: 'Z' as 'A' }}
            />
        );

        const button = screen.getByRole('button');
        expect(button.className).toContain('bg-red-100');
    });
});
