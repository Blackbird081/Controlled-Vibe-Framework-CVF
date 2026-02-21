import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QualityRadar } from './QualityRadar';
import type { CVFQualityResult } from '@/types/governance-engine';

const mockQuality: CVFQualityResult = {
    correctness: 0.9,
    safety: 0.85,
    alignment: 0.8,
    quality: 0.88,
    overall: 0.86,
    grade: 'B',
};

describe('QualityRadar', () => {
    it('renders grade badge and overall score', () => {
        render(<QualityRadar quality={mockQuality} language="en" />);
        expect(screen.getByText('B')).toBeTruthy();
        expect(screen.getByText(/86%/)).toBeTruthy();
    });

    it('renders all 4 dimension bars', () => {
        render(<QualityRadar quality={mockQuality} language="en" />);
        expect(screen.getByText('Correctness')).toBeTruthy();
        expect(screen.getByText(/Safety/)).toBeTruthy();
        expect(screen.getByText('Alignment')).toBeTruthy();
        expect(screen.getByText('Quality')).toBeTruthy();
    });

    it('renders in Vietnamese', () => {
        render(<QualityRadar quality={mockQuality} language="vi" />);
        expect(screen.getByText('Chính xác')).toBeTruthy();
        expect(screen.getByText(/An toàn/)).toBeTruthy();
        expect(screen.getByText('Phù hợp')).toBeTruthy();
        expect(screen.getByText('Chất lượng')).toBeTruthy();
    });

    it('renders SVG radar chart', () => {
        const { container } = render(<QualityRadar quality={mockQuality} />);
        const svg = container.querySelector('svg');
        expect(svg).toBeTruthy();
    });

    it('compact mode shows only badge initially', () => {
        render(<QualityRadar quality={mockQuality} compact language="en" />);
        // In compact mode, the badge shows grade and percentage
        expect(screen.getByText('B')).toBeTruthy();
        expect(screen.getByText(/86%/)).toBeTruthy();
    });

    it('handles low scores with grade F', () => {
        const lowQuality: CVFQualityResult = {
            correctness: 0.1,
            safety: 0.05,
            alignment: 0.15,
            quality: 0.1,
            overall: 0.09,
            grade: 'F',
        };
        render(<QualityRadar quality={lowQuality} language="en" />);
        expect(screen.getByText('F')).toBeTruthy();
        expect(screen.getByText(/9%/)).toBeTruthy();
    });

    it('renders dimension percentages', () => {
        render(<QualityRadar quality={mockQuality} language="en" />);
        expect(screen.getByText('90%')).toBeTruthy();  // correctness
        expect(screen.getByText('85%')).toBeTruthy();  // safety
        expect(screen.getByText('80%')).toBeTruthy();  // alignment
        expect(screen.getByText('88%')).toBeTruthy();  // quality
    });
});
