/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportMenu } from './ExportMenu';

const messages = [
    {
        id: '1',
        role: 'user' as const,
        content: 'Hello',
        timestamp: new Date('2026-02-07T10:00:00Z'),
    },
    {
        id: '2',
        role: 'assistant' as const,
        content: 'Hi there',
        timestamp: new Date('2026-02-07T10:01:00Z'),
        metadata: { model: 'gpt-4o', tokens: 12 },
    },
];

describe('ExportMenu', () => {
    const clickMock = vi.fn();
    const createObjectURLMock = vi.fn(() => 'blob:mock');
    const revokeObjectURLMock = vi.fn();
    let createElementSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        clickMock.mockClear();
        createObjectURLMock.mockClear();
        revokeObjectURLMock.mockClear();

        (URL as unknown as { createObjectURL: typeof createObjectURLMock }).createObjectURL = createObjectURLMock;
        (URL as unknown as { revokeObjectURL: typeof revokeObjectURLMock }).revokeObjectURL = revokeObjectURLMock;

        const originalCreate = document.createElement.bind(document);
        createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
            if (tagName === 'a') {
                return {
                    click: clickMock,
                    set href(_value: string) { },
                    set download(_value: string) { },
                } as unknown as HTMLAnchorElement;
            }
            return originalCreate(tagName);
        });
    });

    afterEach(() => {
        createElementSpy.mockRestore();
    });

    it('exports to markdown', () => {
        const onClose = vi.fn();
        render(<ExportMenu messages={messages} onClose={onClose} />);

        fireEvent.click(screen.getByText(/Markdown/i));
        expect(createObjectURLMock).toHaveBeenCalled();
        expect(clickMock).toHaveBeenCalled();
        expect(revokeObjectURLMock).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
    });

    it('exports to json', () => {
        const onClose = vi.fn();
        render(<ExportMenu messages={messages} onClose={onClose} />);

        fireEvent.click(screen.getByText(/JSON/i));
        expect(createObjectURLMock).toHaveBeenCalled();
        expect(clickMock).toHaveBeenCalled();
        expect(revokeObjectURLMock).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
    });

    it('copies all to clipboard', async () => {
        const onClose = vi.fn();
        const clipboardSpy = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: clipboardSpy },
            configurable: true,
        });
        render(<ExportMenu messages={messages} onClose={onClose} />);

        fireEvent.click(screen.getByText(/Copy All/i));
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(clipboardSpy).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
    });
});
