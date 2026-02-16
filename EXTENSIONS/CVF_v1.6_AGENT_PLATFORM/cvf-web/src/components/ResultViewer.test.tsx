/**
 * @vitest-environment jsdom
 * Test: ResultViewer — export (PDF, Word, Markdown), copy, and action buttons
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResultViewer } from './ResultViewer';

let mockLanguage = 'en';
vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({
        language: mockLanguage,
        t: (key: string) => key,
    }),
}));

const mockExecution = {
    id: 'exec-test-1',
    templateId: 'business_plan',
    templateName: 'Business Plan',
    status: 'completed' as const,
    createdAt: new Date('2026-02-15T10:00:00Z'),
    qualityScore: {
        overall: 8.5,
        structure: 9.0,
        completeness: 8.0,
        clarity: 8.5,
        actionability: 8.5,
    },
    input: { prompt: 'Test' },
};

const mockOutput = '# Test Output\n\nThis is a test output.\n\n## Section 1\n\n- Item A\n- Item B';

const defaultProps = {
    execution: mockExecution,
    output: mockOutput,
    onAccept: vi.fn(),
    onReject: vi.fn(),
    onRetry: vi.fn(),
    onBack: vi.fn(),
};

describe('ResultViewer', () => {
    beforeEach(() => {
        mockLanguage = 'en';
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders the template name with Complete status', () => {
        render(<ResultViewer {...defaultProps} />);
        // Template name appears in heading: "{name} Complete"
        expect(screen.getByText(/Business Plan Complete/)).toBeTruthy();
    });

    it('renders markdown output', () => {
        render(<ResultViewer {...defaultProps} />);
        expect(screen.getByText('This is a test output.')).toBeTruthy();
    });

    it('calls onBack when back button is clicked', () => {
        render(<ResultViewer {...defaultProps} />);
        const backBtn = screen.getByLabelText(/back|Quay lại/i);
        fireEvent.click(backBtn);
        expect(defaultProps.onBack).toHaveBeenCalled();
    });

    it('calls onAccept when accept button is clicked', () => {
        render(<ResultViewer {...defaultProps} />);
        const acceptBtn = screen.getByText(/Accept/i);
        fireEvent.click(acceptBtn);
        expect(defaultProps.onAccept).toHaveBeenCalled();
    });

    it('calls onReject when reject button is clicked', () => {
        render(<ResultViewer {...defaultProps} />);
        const rejectBtn = screen.getByText(/Reject/i);
        fireEvent.click(rejectBtn);
        expect(defaultProps.onReject).toHaveBeenCalled();
    });

    it('calls onRetry when retry button is clicked', () => {
        render(<ResultViewer {...defaultProps} />);
        const retryBtn = screen.getByText(/Retry/i);
        fireEvent.click(retryBtn);
        expect(defaultProps.onRetry).toHaveBeenCalled();
    });

    it('renders Send to Agent button when onSendToAgent is provided', () => {
        const onSendToAgent = vi.fn();
        render(<ResultViewer {...defaultProps} onSendToAgent={onSendToAgent} />);
        const sendBtn = screen.getByText(/Send to Agent/i);
        expect(sendBtn).toBeTruthy();
    });

    it('does not render Send to Agent button when prop is absent', () => {
        render(<ResultViewer {...defaultProps} />);
        expect(screen.queryByText(/Send to Agent/i)).toBeNull();
    });

    describe('export menu', () => {
        it('toggles export menu visibility', () => {
            render(<ResultViewer {...defaultProps} />);
            const exportBtn = screen.getByText(/Export/i);
            fireEvent.click(exportBtn);
            expect(screen.getByText(/Download .md/i)).toBeTruthy();
        });

        it('shows language selector in export menu', () => {
            render(<ResultViewer {...defaultProps} />);
            fireEvent.click(screen.getByText(/Export/i));
            expect(screen.getByText(/Language/i)).toBeTruthy();
        });

        it('exports to markdown file', () => {
            // Render first, then mock download helpers
            const { container } = render(<ResultViewer {...defaultProps} />);

            // Open export menu
            fireEvent.click(screen.getByText(/Export/i));

            // Now mock download infrastructure
            const createObjectURLMock = vi.fn(() => 'blob:mock');
            const revokeObjectURLMock = vi.fn();
            (URL as unknown as Record<string, unknown>).createObjectURL = createObjectURLMock;
            (URL as unknown as Record<string, unknown>).revokeObjectURL = revokeObjectURLMock;

            const clickMock = vi.fn();
            const originalCreate = document.createElement.bind(document);
            vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
                if (tag === 'a') {
                    return { click: clickMock, href: '', download: '' } as unknown as HTMLAnchorElement;
                }
                return originalCreate(tag);
            });
            vi.spyOn(document.body, 'appendChild').mockImplementation((n) => n as Node);
            vi.spyOn(document.body, 'removeChild').mockImplementation((n) => n as Node);

            // Click download
            fireEvent.click(screen.getByText(/Download .md/i));
            expect(createObjectURLMock).toHaveBeenCalled();
            expect(clickMock).toHaveBeenCalled();
        });

        it('copies to clipboard', async () => {
            render(<ResultViewer {...defaultProps} />);
            fireEvent.click(screen.getByText(/Export/i));
            const copyBtn = screen.getByText(/Copy/i);
            fireEvent.click(copyBtn);

            await waitFor(() => {
                expect(navigator.clipboard.writeText).toHaveBeenCalled();
            });
        });

        it('shows PDF and Word download buttons', () => {
            render(<ResultViewer {...defaultProps} />);
            fireEvent.click(screen.getByText(/Export/i));
            expect(screen.getByText(/Download PDF/i)).toBeTruthy();
            expect(screen.getByText(/Download Word/i)).toBeTruthy();
        });
    });

    describe('bilingual export labels', () => {
        it('shows Vietnamese labels when export language is switched to vi', async () => {
            render(<ResultViewer {...defaultProps} />);
            fireEvent.click(screen.getByText(/Export/i));

            // Switch to Vietnamese
            const viBtn = screen.getByText(/Tiếng Việt/i);
            fireEvent.click(viBtn);

            await waitFor(() => {
                expect(screen.getByText(/Sao chép/)).toBeTruthy();
                expect(screen.getByText(/Tải xuống .md/)).toBeTruthy();
                expect(screen.getByText(/Tải PDF/)).toBeTruthy();
                expect(screen.getByText(/Tải Word/)).toBeTruthy();
            });
        });
    });

});
