/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatInput } from './ChatInput';

describe('ChatInput', () => {
    it('sends on Enter and ignores Shift+Enter', () => {
        const onSend = vi.fn();
        render(
            <ChatInput
                input="hello"
                onInputChange={vi.fn()}
                onSend={onSend}
                isLoading={false}
                attachedFile={null}
                onRemoveAttachment={vi.fn()}
                onFileSelected={vi.fn()}
                language="vi"
                placeholder="Nhập tin nhắn..."
                sendLabel="Gửi"
            />
        );

        const textarea = screen.getByLabelText('Nhập tin nhắn');
        fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });
        fireEvent.keyDown(textarea, { key: 'Enter' });
        expect(onSend).toHaveBeenCalledTimes(1);
    });

    it('handles file selection and removal', () => {
        const onFileSelected = vi.fn();
        const onRemoveAttachment = vi.fn();
        const file = new File(['content'], 'note.txt', { type: 'text/plain' });

        const { rerender } = render(
            <ChatInput
                input=""
                onInputChange={vi.fn()}
                onSend={vi.fn()}
                isLoading={false}
                attachedFile={null}
                onRemoveAttachment={onRemoveAttachment}
                onFileSelected={onFileSelected}
                language="vi"
                placeholder="Nhập tin nhắn..."
                sendLabel="Gửi"
            />
        );

        const fileInput = screen.getByLabelText('Đính kèm file') as HTMLInputElement;
        fireEvent.change(fileInput, { target: { files: [file] } });
        expect(onFileSelected).toHaveBeenCalledWith(file);

        rerender(
            <ChatInput
                input=""
                onInputChange={vi.fn()}
                onSend={vi.fn()}
                isLoading={false}
                attachedFile={{ name: 'note.txt', content: 'content' }}
                onRemoveAttachment={onRemoveAttachment}
                onFileSelected={onFileSelected}
                language="vi"
                placeholder="Nhập tin nhắn..."
                sendLabel="Gửi"
            />
        );

        fireEvent.click(screen.getByTitle('Xóa file'));
        expect(onRemoveAttachment).toHaveBeenCalledTimes(1);
    });

    it('disables send when empty', () => {
        render(
            <ChatInput
                input=""
                onInputChange={vi.fn()}
                onSend={vi.fn()}
                isLoading={false}
                attachedFile={null}
                onRemoveAttachment={vi.fn()}
                onFileSelected={vi.fn()}
                language="vi"
                placeholder="Nhập tin nhắn..."
                sendLabel="Gửi"
            />
        );

        const sendButton = screen.getByRole('button', { name: /Gửi/i });
        expect(sendButton.hasAttribute('disabled')).toBe(true);
    });
});
