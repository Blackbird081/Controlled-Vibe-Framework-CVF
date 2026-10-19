/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ResultViewer } from './ResultViewer';

const language = vi.hoisted(() => ({ value: 'en' }));
vi.mock('@/lib/i18n', () => ({ useLanguage: () => ({ language: language.value, t: (key: string) => key }) }));
vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));

const props = {
    execution: {
        id: 'saved-one', templateId: 'documentation', templateName: 'Documentation',
        input: { topic: 'fixture' }, intent: 'fixture', status: 'completed' as const,
        createdAt: new Date('2026-10-14T00:00:00Z'),
    },
    output: '# Exact original output\n\nSaved run body.',
    evidenceReceipt: {
        receiptId: 'saved-receipt-one', evidenceMode: 'mock' as const,
        routeId: '/api/execute', generatedAt: '2026-10-14T00:00:00Z',
        provider: 'alibaba', model: 'qwen-flash',
    },
    onAccept: vi.fn(), onReject: vi.fn(), onRetry: vi.fn(), onBack: vi.fn(),
};

function blobText(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsText(blob);
    });
}

afterEach(() => { vi.restoreAllMocks(); language.value = 'en'; });

describe('saved receipt origin', () => {
    it('shows local saved-copy origin and preserves mock mode in downloaded Markdown', async () => {
        language.value = 'en';
        const urls = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fixture');
        vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
        render(<ResultViewer {...props} savedLocalHistory />);
        expect(screen.getByTestId('saved-receipt-origin').textContent).toContain('has not been reverified');
        fireEvent.click(screen.getByText(/Export/i));
        fireEvent.click(screen.getByText(/Download .md/i));
        const markdown = await blobText(urls.mock.calls[0][0] as Blob);
        expect(markdown).toContain('Saved local history receipt');
        expect(markdown).toContain('Original evidence mode: mock');
        expect(markdown).toContain('saved-receipt-one');
        expect(markdown).toContain('# Exact original output');
        expect(markdown).not.toContain('evidence mode: live');
    });

    it('keeps live/current route receipt free of saved-history origin', () => {
        render(<ResultViewer {...props} savedLocalHistory={false} />);
        expect(screen.queryByTestId('saved-receipt-origin')).toBeNull();
    });
});
