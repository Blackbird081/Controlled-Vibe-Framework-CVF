/**
 * @vitest-environment jsdom
 * Focused offline coverage for visible PDF/Word export failure recovery.
 * Text Encoding Exception: localized Vietnamese labels in fixtures/assertions mirror the required user-facing copy.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ResultViewer } from './ResultViewer';

const mocks = vi.hoisted(() => {
    const pdf = {
        internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
        setFontSize: vi.fn(), setFont: vi.fn(), setDrawColor: vi.fn(),
        splitTextToSize: vi.fn((text: string) => [text]), text: vi.fn(), line: vi.fn(), addPage: vi.fn(),
        save: vi.fn(),
    };
    return {
        language: { value: 'en' },
        track: vi.fn(),
        pdf,
        packerToBlob: vi.fn(),
        saveAs: vi.fn(),
    };
});

vi.mock('@/lib/i18n', () => ({ useLanguage: () => ({ language: mocks.language.value, t: (key: string) => key }) }));
vi.mock('@/lib/analytics', () => ({ trackEvent: (...args: unknown[]) => mocks.track(...args) }));
vi.mock('jspdf', () => ({ jsPDF: function JsPDF() { return mocks.pdf; } }));
vi.mock('docx', () => {
    function Ctor(this: Record<string, unknown>, opts: Record<string, unknown>) { Object.assign(this, opts); }
    return {
        Document: Ctor, Paragraph: Ctor, TextRun: Ctor,
        Packer: { toBlob: (...args: unknown[]) => mocks.packerToBlob(...args) },
        HeadingLevel: { TITLE: 'TITLE', HEADING_1: 'H1', HEADING_2: 'H2', HEADING_3: 'H3' },
        AlignmentType: { CENTER: 'CENTER' }, BorderStyle: { SINGLE: 'SINGLE' },
    };
});
vi.mock('file-saver', () => ({ saveAs: (...args: unknown[]) => mocks.saveAs(...args) }));

const props = {
    execution: {
        id: 'export-feedback-run', templateId: 'business_plan', templateName: 'Business Plan',
        intent: 'Create a business plan', status: 'completed' as const,
        createdAt: new Date('2026-10-12T00:00:00.000Z'), input: { prompt: 'fixture' },
    },
    output: '# Preserved result\n\nThe current output remains visible.',
    evidenceReceipt: {
        receiptId: 'receipt-export-feedback', evidenceMode: 'static' as const,
        routeId: '/fixture', decision: 'ALLOW', riskLevel: 'R1', generatedAt: '2026-10-12T00:00:00.000Z',
    },
    onAccept: vi.fn(), onReject: vi.fn(), onRetry: vi.fn(), onBack: vi.fn(),
};

function openExportMenu() {
    fireEvent.click(screen.getByRole('button', { name: /^📄 Export$/ }));
}

function selectLanguage(language: 'en' | 'vi') {
    if (language === 'vi') fireEvent.click(screen.getByRole('button', { name: /Tiếng Việt/ }));
}

beforeEach(() => {
    mocks.language.value = 'en';
    vi.clearAllMocks();
    mocks.pdf.save.mockReset();
    mocks.packerToBlob.mockReset().mockResolvedValue(new Blob(['fixture-docx']));
});

describe('ResultViewer visible export failure recovery', () => {
    it.each([
        { format: 'pdf', language: 'en', menuLabel: /Download PDF/, message: /PDF export failed\. Try again\./, retry: /Retry PDF export/ },
        { format: 'pdf', language: 'vi', menuLabel: /Tải PDF/, message: /Xuất PDF thất bại\. Hãy thử lại\./, retry: /Thử lại xuất PDF/ },
        { format: 'docx', language: 'en', menuLabel: /Download Word/, message: /Word export failed\. Try again\./, retry: /Retry Word export/ },
        { format: 'docx', language: 'vi', menuLabel: /Tải Word/, message: /Xuất Word thất bại\. Hãy thử lại\./, retry: /Thử lại xuất Word/ },
    ] as const)('shows a safe accessible $format failure in $language and preserves the run', async ({ format, language, menuLabel, message, retry }) => {
        if (format === 'pdf') mocks.pdf.save.mockImplementationOnce(() => { throw new Error('sensitive fixture detail'); });
        else mocks.packerToBlob.mockRejectedValueOnce(new Error('sensitive fixture detail'));

        render(<ResultViewer {...props} />);
        openExportMenu();
        selectLanguage(language);
        fireEvent.click(screen.getByRole('button', { name: menuLabel }));

        const alert = await screen.findByRole('alert');
        expect(alert.textContent).toMatch(message);
        expect(alert.textContent).not.toContain('sensitive fixture detail');
        expect(screen.getByText('The current output remains visible.')).toBeTruthy();
        expect(screen.getByTestId('w119-evidence-receipt').textContent).toContain('receipt-export-feedback');
        expect(screen.getByRole('button', { name: retry })).toBeTruthy();
        expect(screen.queryByRole('button', { name: menuLabel })).toBeNull();
        expect(mocks.track).not.toHaveBeenCalledWith('evidence_exported', expect.objectContaining({ format }));
    });

    it('clears only the retried format failure and succeeds through the existing PDF download path', async () => {
        mocks.pdf.save
            .mockImplementationOnce(() => { throw new Error('first PDF failure'); })
            .mockImplementationOnce(() => undefined);
        mocks.packerToBlob.mockRejectedValueOnce(new Error('Word failure'));

        render(<ResultViewer {...props} />);
        openExportMenu();
        fireEvent.click(screen.getByRole('button', { name: /Download PDF/ }));
        await screen.findByRole('alert');

        openExportMenu();
        fireEvent.click(screen.getByRole('button', { name: /Download Word/ }));
        await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(2));

        fireEvent.click(screen.getByRole('button', { name: /Retry PDF export/ }));
        expect(screen.getByTestId('export-error-docx').textContent).toMatch(/Word export failed/);
        await waitFor(() => expect(mocks.pdf.save).toHaveBeenCalledTimes(2));
        await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(1));
        expect(screen.getByTestId('export-error-docx').textContent).toMatch(/Word export failed/);
        expect(mocks.track).toHaveBeenCalledWith('evidence_exported', expect.objectContaining({ executionId: props.execution.id, format: 'pdf' }));
    });
});
