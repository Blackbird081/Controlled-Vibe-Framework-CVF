/**
 * @vitest-environment jsdom
 * Test: ResultViewer export content - a whole-output ```markdown fence is unwrapped in the
 * exported Markdown, while other fenced languages are exported unchanged.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { ResultViewer } from './ResultViewer';

vi.mock('@/lib/analytics', () => ({
    trackEvent: vi.fn(),
}));

vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({
        language: 'en',
        t: (key: string) => key,
    }),
}));

const FENCED_OUTPUT = '```markdown\n## Section Title\n\nA formatted **paragraph** of text.\n\n- Item A\n- Item B\n```';
const TS_OUTPUT = '```ts\nconst a = 1;\n```';

const execution = {
    id: 'exec-export-fence-1',
    templateId: 'business_plan',
    templateName: 'Business Plan',
    intent: 'Create a business plan',
    status: 'completed' as const,
    createdAt: new Date('2026-02-15T10:00:00Z'),
    qualityScore: 85,
    input: { prompt: 'Test' },
};

const baseProps = {
    onAccept: vi.fn(),
    onReject: vi.fn(),
    onRetry: vi.fn(),
    onBack: vi.fn(),
};

function readBlob(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ''));
        reader.onerror = () => reject(reader.error);
        reader.readAsText(blob);
    });
}

describe('ResultViewer export content with whole-output markdown fence', () => {
    let writeText: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText },
            configurable: true,
        });
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    async function copyExportedText(output: string): Promise<string> {
        const { unmount } = render(
            <ResultViewer {...baseProps} execution={{ ...execution, output }} output={output} />
        );
        const exportButton = Array.from(document.querySelectorAll('button')).find((b) => /Export/i.test(b.textContent ?? ''));
        fireEvent.click(exportButton as HTMLButtonElement);
        fireEvent.click(Array.from(document.querySelectorAll('button')).find((b) => /Copy to Clipboard/i.test(b.textContent ?? '')) as HTMLButtonElement);
        await waitFor(() => expect(writeText).toHaveBeenCalled());
        const copied = String(writeText.mock.calls.at(-1)?.[0] ?? '');
        unmount();
        return copied;
    }

    it('exports a fenced-markdown output with its heading and without a leading ```markdown line', async () => {
        const copied = await copyExportedText(FENCED_OUTPUT);
        expect(copied).toContain('## Section Title');
        expect(copied).toContain('A formatted **paragraph** of text.');
        expect(copied).not.toMatch(/```markdown/);
        expect(copied).not.toMatch(/^```/m);
    });

    it('downloads the Markdown file with the unwrapped body', async () => {
        const { unmount } = render(
            <ResultViewer {...baseProps} execution={{ ...execution, output: FENCED_OUTPUT }} output={FENCED_OUTPUT} />
        );
        const createObjectURLMock = vi.fn<(obj: Blob) => string>(() => 'blob:mock');
        (URL as unknown as Record<string, unknown>).createObjectURL = createObjectURLMock;
        (URL as unknown as Record<string, unknown>).revokeObjectURL = vi.fn();
        const originalCreate = document.createElement.bind(document);
        vi.spyOn(document, 'createElement').mockImplementation((tag: string) => (
            tag === 'a' ? ({ click: vi.fn(), href: '', download: '' } as unknown as HTMLAnchorElement) : originalCreate(tag)
        ));
        vi.spyOn(document.body, 'appendChild').mockImplementation((n) => n as Node);
        vi.spyOn(document.body, 'removeChild').mockImplementation((n) => n as Node);

        fireEvent.click(Array.from(document.querySelectorAll('button')).find((b) => /Export/i.test(b.textContent ?? '')) as HTMLButtonElement);
        fireEvent.click(Array.from(document.querySelectorAll('button')).find((b) => /Download .md/i.test(b.textContent ?? '')) as HTMLButtonElement);

        expect(createObjectURLMock).toHaveBeenCalled();
        const text = await readBlob(createObjectURLMock.mock.calls[0][0]);
        expect(text).toContain('## Section Title');
        expect(text).not.toMatch(/```markdown/);
        unmount();
    });

    it('exports a ts fence unchanged', async () => {
        const copied = await copyExportedText(TS_OUTPUT);
        expect(copied).toContain(TS_OUTPUT);
    });
});
