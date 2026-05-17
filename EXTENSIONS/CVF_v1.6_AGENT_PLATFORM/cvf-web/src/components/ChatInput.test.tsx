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

    it('disables attach button and textarea when isLoading is true', () => {
        render(
            <ChatInput
                input="test"
                onInputChange={vi.fn()}
                onSend={vi.fn()}
                isLoading={true}
                attachedFile={null}
                onRemoveAttachment={vi.fn()}
                onFileSelected={vi.fn()}
                language="vi"
                placeholder="Nhập tin nhắn..."
                sendLabel="Gửi"
            />
        );

        const attachBtn = screen.getByTitle('Đính kèm file');
        expect(attachBtn.hasAttribute('disabled')).toBe(true);
        const textarea = screen.getByLabelText('Nhập tin nhắn');
        expect(textarea.hasAttribute('disabled')).toBe(true);
    });

    it('renders English labels when language is en', () => {
        render(
            <ChatInput
                input=""
                onInputChange={vi.fn()}
                onSend={vi.fn()}
                isLoading={false}
                attachedFile={null}
                onRemoveAttachment={vi.fn()}
                onFileSelected={vi.fn()}
                language="en"
                placeholder="Type a message..."
                sendLabel="Send"
            />
        );

        expect(screen.getByLabelText('Message input')).toBeTruthy();
        expect(screen.getByLabelText('Attach file')).toBeTruthy();
        expect(screen.getByTitle('Attach file')).toBeTruthy();
    });

    it('shows custom placeholder when attachedFile is present (en)', () => {
        render(
            <ChatInput
                input=""
                onInputChange={vi.fn()}
                onSend={vi.fn()}
                isLoading={false}
                attachedFile={{ name: 'readme.md', content: '# Hello' }}
                onRemoveAttachment={vi.fn()}
                onFileSelected={vi.fn()}
                language="en"
                placeholder="Type a message..."
                sendLabel="Send"
            />
        );

        const textarea = screen.getByLabelText('Message input');
        expect((textarea as HTMLTextAreaElement).placeholder).toContain('Type about readme.md');
    });

    it('shows custom placeholder when attachedFile is present (vi)', () => {
        render(
            <ChatInput
                input=""
                onInputChange={vi.fn()}
                onSend={vi.fn()}
                isLoading={false}
                attachedFile={{ name: 'data.json', content: '{}' }}
                onRemoveAttachment={vi.fn()}
                onFileSelected={vi.fn()}
                language="vi"
                placeholder="Nhập tin nhắn..."
                sendLabel="Gửi"
            />
        );

        const textarea = screen.getByLabelText('Nhập tin nhắn');
        expect((textarea as HTMLTextAreaElement).placeholder).toContain('Nhập tin nhắn về data.json');
    });

    it('enables send when input has content', () => {
        render(
            <ChatInput
                input="some text"
                onInputChange={vi.fn()}
                onSend={vi.fn()}
                isLoading={false}
                attachedFile={null}
                onRemoveAttachment={vi.fn()}
                onFileSelected={vi.fn()}
                language="en"
                placeholder="Type a message..."
                sendLabel="Send"
            />
        );

        const sendButton = screen.getByRole('button', { name: /Send/i });
        expect(sendButton.hasAttribute('disabled')).toBe(false);
    });

    it('enables send when only attachedFile is present (no text)', () => {
        render(
            <ChatInput
                input=""
                onInputChange={vi.fn()}
                onSend={vi.fn()}
                isLoading={false}
                attachedFile={{ name: 'file.txt', content: 'data' }}
                onRemoveAttachment={vi.fn()}
                onFileSelected={vi.fn()}
                language="en"
                placeholder="Type a message..."
                sendLabel="Send"
            />
        );

        const sendButton = screen.getByRole('button', { name: /Send/i });
        expect(sendButton.hasAttribute('disabled')).toBe(false);
    });

    it('calls onInputChange when textarea value changes', () => {
        const onInputChange = vi.fn();
        render(
            <ChatInput
                input=""
                onInputChange={onInputChange}
                onSend={vi.fn()}
                isLoading={false}
                attachedFile={null}
                onRemoveAttachment={vi.fn()}
                onFileSelected={vi.fn()}
                language="en"
                placeholder="Type a message..."
                sendLabel="Send"
            />
        );

        const textarea = screen.getByLabelText('Message input');
        fireEvent.change(textarea, { target: { value: 'hello world' } });
        expect(onInputChange).toHaveBeenCalledWith('hello world');
    });

    it('ignores file input when no file is selected', () => {
        const onFileSelected = vi.fn();
        render(
            <ChatInput
                input=""
                onInputChange={vi.fn()}
                onSend={vi.fn()}
                isLoading={false}
                attachedFile={null}
                onRemoveAttachment={vi.fn()}
                onFileSelected={onFileSelected}
                language="en"
                placeholder="Type a message..."
                sendLabel="Send"
            />
        );

        const fileInput = screen.getByLabelText('Attach file') as HTMLInputElement;
        fireEvent.change(fileInput, { target: { files: [] } });
        expect(onFileSelected).not.toHaveBeenCalled();
    });

    it('shows Remove file title in English', () => {
        render(
            <ChatInput
                input=""
                onInputChange={vi.fn()}
                onSend={vi.fn()}
                isLoading={false}
                attachedFile={{ name: 'doc.txt', content: 'text' }}
                onRemoveAttachment={vi.fn()}
                onFileSelected={vi.fn()}
                language="en"
                placeholder="Type a message..."
                sendLabel="Send"
            />
        );

        expect(screen.getByTitle('Remove file')).toBeTruthy();
    });
});
