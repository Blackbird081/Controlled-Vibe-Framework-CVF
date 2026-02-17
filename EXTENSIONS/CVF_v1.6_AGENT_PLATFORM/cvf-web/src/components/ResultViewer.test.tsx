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

// Mock jsPDF dynamic import
const mockJsPDFInstance = {
    internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    setDrawColor: vi.fn(),
    splitTextToSize: vi.fn((text: string) => [text]),
    text: vi.fn(),
    line: vi.fn(),
    addPage: vi.fn(),
    save: vi.fn(),
};
vi.mock('jspdf', () => {
    function JsPDFCtor() { return mockJsPDFInstance; }
    return { jsPDF: JsPDFCtor };
});

// Mock docx dynamic import
const mockPackerToBlob = vi.fn().mockResolvedValue(new Blob(['test']));
vi.mock('docx', () => {
    function DocCtor(opts: Record<string, unknown>) { Object.assign(this, opts); }
    function ParaCtor(opts: Record<string, unknown>) { Object.assign(this, opts); }
    function TRCtor(opts: Record<string, unknown>) { Object.assign(this, opts); }
    return {
        Document: DocCtor,
        Packer: { toBlob: mockPackerToBlob },
        Paragraph: ParaCtor,
        TextRun: TRCtor,
        HeadingLevel: { TITLE: 'TITLE', HEADING_1: 'H1', HEADING_2: 'H2', HEADING_3: 'H3' },
        AlignmentType: { CENTER: 'CENTER' },
        BorderStyle: { SINGLE: 'SINGLE' },
    };
});

// Mock file-saver
const mockSaveAs = vi.fn();
vi.mock('file-saver', () => ({
    saveAs: mockSaveAs,
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

    it('calls onSendToAgent with exported content when Send to Agent is clicked', () => {
        const onSendToAgent = vi.fn();
        render(<ResultViewer {...defaultProps} onSendToAgent={onSendToAgent} />);
        const sendBtn = screen.getByText(/Send to Agent/i);
        fireEvent.click(sendBtn);
        expect(onSendToAgent).toHaveBeenCalledTimes(1);
        // Should be called with a string containing the output content
        expect(typeof onSendToAgent.mock.calls[0][0]).toBe('string');
        expect(onSendToAgent.mock.calls[0][0]).toContain('Business Plan');
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

    describe('Send to Agent', () => {
        it('calls onSendToAgent with generated content when clicked', () => {
            const onSendToAgent = vi.fn();
            render(<ResultViewer {...defaultProps} onSendToAgent={onSendToAgent} />);
            const sendBtn = screen.getByText(/Send to Agent/i);
            fireEvent.click(sendBtn);
            expect(onSendToAgent).toHaveBeenCalledTimes(1);
            // Should receive a string containing the output content
            expect(typeof onSendToAgent.mock.calls[0][0]).toBe('string');
            expect(onSendToAgent.mock.calls[0][0]).toContain('Test Output');
        });
    });

    describe('copy feedback', () => {
        it('shows Copied feedback after clipboard copy', async () => {
            render(<ResultViewer {...defaultProps} />);
            fireEvent.click(screen.getByText(/Export/i));
            fireEvent.click(screen.getByText(/Copy/i));

            await waitFor(() => {
                // Check for copied feedback text  
                const allText = document.body.textContent || '';
                expect(allText).toMatch(/Copied|Đã sao chép/);
            });
        });
    });

    describe('metadata', () => {
        it('renders timestamp section', () => {
            render(<ResultViewer {...defaultProps} />);
            // Check for generated date or duration in footer
            const allText = document.body.textContent || '';
            expect(allText).toContain('Duration');
        });
    });

    describe('export menu closes on action', () => {
        it('closes export menu after markdown download', () => {
            render(<ResultViewer {...defaultProps} />);
            fireEvent.click(screen.getByText(/Export/i));
            expect(screen.getByText(/Download .md/i)).toBeTruthy();

            // Mock download helpers
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

            fireEvent.click(screen.getByText(/Download .md/i));

            // Export menu should close (Download .md button no longer visible)
            expect(screen.queryByText(/Download .md/i)).toBeNull();
        });
    });

    describe('PDF export', () => {
        it('exports to PDF successfully', async () => {
            render(<ResultViewer {...defaultProps} />);
            fireEvent.click(screen.getByText(/Export/i));
            fireEvent.click(screen.getByText(/Download PDF/i));

            await waitFor(() => {
                expect(mockJsPDFInstance.save).toHaveBeenCalled();
                const filename = mockJsPDFInstance.save.mock.calls[0][0] as string;
                expect(filename).toMatch(/^cvf-result-business_plan-\d+\.pdf$/);
            });
        });

        it('renders all markdown element types in PDF', async () => {
            const richOutput = `# Heading 1
## Heading 2
### Heading 3

- Bullet item
* Star item
1. Numbered item

| Col1 | Col2 |
| --- | --- |
| Data1 | Data2 |

- [x] Checked item
- [X] Capital checked
- [ ] Unchecked item

Regular **bold** text`;
            render(<ResultViewer {...defaultProps} output={richOutput} />);
            fireEvent.click(screen.getByText(/Export/i));
            fireEvent.click(screen.getByText(/Download PDF/i));

            await waitFor(() => {
                expect(mockJsPDFInstance.save).toHaveBeenCalled();
                // All markdown types should trigger text calls
                expect(mockJsPDFInstance.text).toHaveBeenCalled();
                // Separator lines should be drawn
                expect(mockJsPDFInstance.line).toHaveBeenCalled();
            });
        });

        it('handles PDF page overflow by adding pages', async () => {
            // Make page height very small so addPage is triggered
            mockJsPDFInstance.internal.pageSize.getHeight = () => 30;
            const longOutput = Array(50).fill('Line of text content').join('\n');
            render(<ResultViewer {...defaultProps} output={longOutput} />);
            fireEvent.click(screen.getByText(/Export/i));
            fireEvent.click(screen.getByText(/Download PDF/i));

            await waitFor(() => {
                expect(mockJsPDFInstance.addPage).toHaveBeenCalled();
            });
            // Restore
            mockJsPDFInstance.internal.pageSize.getHeight = () => 297;
        });

        it('handles PDF export error gracefully', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            mockJsPDFInstance.save.mockImplementationOnce(() => { throw new Error('Save failed'); });
            render(<ResultViewer {...defaultProps} />);
            fireEvent.click(screen.getByText(/Export/i));
            fireEvent.click(screen.getByText(/Download PDF/i));

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith('PDF export failed:', expect.any(Error));
            });
            consoleSpy.mockRestore();
        });

        it('closes export menu after PDF export', async () => {
            render(<ResultViewer {...defaultProps} />);
            fireEvent.click(screen.getByText(/Export/i));
            fireEvent.click(screen.getByText(/Download PDF/i));

            await waitFor(() => {
                expect(screen.queryByText(/Download PDF/i)).toBeNull();
            });
        });
    });

    describe('Word export', () => {
        it('exports to DOCX successfully', async () => {
            render(<ResultViewer {...defaultProps} />);
            fireEvent.click(screen.getByText(/Export/i));
            fireEvent.click(screen.getByText(/Download Word/i));

            await waitFor(() => {
                expect(mockSaveAs).toHaveBeenCalled();
                const filename = mockSaveAs.mock.calls[0][1] as string;
                expect(filename).toMatch(/^cvf-result-business_plan-\d+\.docx$/);
            });
        });

        it('renders all markdown element types in DOCX', async () => {
            const richOutput = `# Heading 1
## Heading 2
### Heading 3

- Bullet item
* Star item
1. Numbered item

| Col1 | Col2 |
| --- | --- |
| Data1 | Data2 |

- [x] Checked item
- [X] Capital checked
- [ ] Unchecked item

Regular **bold** text`;
            render(<ResultViewer {...defaultProps} output={richOutput} />);
            fireEvent.click(screen.getByText(/Export/i));
            fireEvent.click(screen.getByText(/Download Word/i));

            await waitFor(() => {
                expect(mockSaveAs).toHaveBeenCalled();
            });
        });

        it('handles DOCX export error gracefully', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            mockPackerToBlob.mockRejectedValueOnce(new Error('Blob failed'));
            render(<ResultViewer {...defaultProps} />);
            fireEvent.click(screen.getByText(/Export/i));
            fireEvent.click(screen.getByText(/Download Word/i));

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith('Word export failed:', expect.any(Error));
            });
            consoleSpy.mockRestore();
        });

        it('closes export menu after DOCX export', async () => {
            render(<ResultViewer {...defaultProps} />);
            fireEvent.click(screen.getByText(/Export/i));
            fireEvent.click(screen.getByText(/Download Word/i));

            await waitFor(() => {
                expect(screen.queryByText(/Download Word/i)).toBeNull();
            });
        });

        it('uses Vietnamese labels when export language is vi', async () => {
            render(<ResultViewer {...defaultProps} />);
            fireEvent.click(screen.getByText(/Export/i));
            fireEvent.click(screen.getByText(/Tiếng Việt/i));
            fireEvent.click(screen.getByText(/Tải Word/i));

            await waitFor(() => {
                expect(mockSaveAs).toHaveBeenCalled();
            });
        });

        it('toggles export language back to English after switching to Vietnamese', async () => {
            render(<ResultViewer {...defaultProps} />);
            fireEvent.click(screen.getByText(/Export/i));

            // Switch to Vietnamese
            fireEvent.click(screen.getByText(/Tiếng Việt/i));
            // Verify Vietnamese labels visible
            expect(screen.getByText(/Tải Word/i)).toBeTruthy();

            // Switch back to English
            fireEvent.click(screen.getByText(/English/i));
            // Verify English labels visible
            expect(screen.getByText(/Download Word/i)).toBeTruthy();
        });
    });

    describe('handleExportToFile (markdown download)', () => {
        it('triggers file download with correct blob and cleans up', () => {
            render(<ResultViewer {...defaultProps} />);
            fireEvent.click(screen.getByText(/Export/i));

            const createObjectURLMock = vi.fn(() => 'blob:mock');
            const revokeObjectURLMock = vi.fn();
            (URL as unknown as Record<string, unknown>).createObjectURL = createObjectURLMock;
            (URL as unknown as Record<string, unknown>).revokeObjectURL = revokeObjectURLMock;

            const clickMock = vi.fn();
            let capturedHref = '';
            let capturedDownload = '';
            const originalCreate = document.createElement.bind(document);
            vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
                if (tag === 'a') {
                    const el = { click: clickMock, href: '', download: '' };
                    Object.defineProperty(el, 'href', {
                        set(v) { capturedHref = v; },
                        get() { return capturedHref; },
                    });
                    Object.defineProperty(el, 'download', {
                        set(v) { capturedDownload = v; },
                        get() { return capturedDownload; },
                    });
                    return el as unknown as HTMLAnchorElement;
                }
                return originalCreate(tag);
            });
            vi.spyOn(document.body, 'appendChild').mockImplementation((n) => n as Node);
            vi.spyOn(document.body, 'removeChild').mockImplementation((n) => n as Node);

            fireEvent.click(screen.getByText(/Download .md/i));

            expect(createObjectURLMock).toHaveBeenCalled();
            expect(clickMock).toHaveBeenCalled();
            expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock');
            expect(capturedDownload).toMatch(/^cvf-result-business_plan-\d+\.md$/);
        });
    });
});
