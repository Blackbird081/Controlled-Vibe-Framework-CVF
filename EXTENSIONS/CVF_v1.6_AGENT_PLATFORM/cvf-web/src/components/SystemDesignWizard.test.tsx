/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SystemDesignWizard } from './SystemDesignWizard';

vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language: 'vi', t: (key: string) => key }),
}));

describe('SystemDesignWizard', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('enables next button when requirement fields are completed', () => {
        render(<SystemDesignWizard onBack={vi.fn()} />);

        const nextButton = screen.getByText('Tiếp tục →') as HTMLButtonElement;
        expect(nextButton.disabled).toBe(true);

        fireEvent.change(
            screen.getByPlaceholderText(/URL Shortener Service/i),
            { target: { value: 'URL Shortener Service' } }
        );
        fireEvent.change(
            screen.getByPlaceholderText(/Build a scalable URL shortening service/i),
            { target: { value: 'Design a scalable URL shortener like bit.ly' } }
        );
        fireEvent.change(
            screen.getByPlaceholderText(/Shorten URL/i),
            { target: { value: 'Shorten URL\nRedirect\nAnalytics' } }
        );
        fireEvent.change(
            screen.getByPlaceholderText(/99.99% availability/i),
            { target: { value: '99.99% availability\n<100ms latency\n100M DAU' } }
        );

        expect(nextButton.disabled).toBe(false);
    });
});
