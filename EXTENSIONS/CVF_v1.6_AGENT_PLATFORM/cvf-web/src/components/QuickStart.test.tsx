/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import QuickStart from './QuickStart';

describe('QuickStart', () => {
    it('routes a non-coder request into a governed starter recommendation', () => {
        const onComplete = vi.fn();

        render(<QuickStart onComplete={onComplete} language="vi" />);

        fireEvent.change(screen.getByPlaceholderText('Paste API key tại đây...'), {
            target: { value: 'test-api-key' },
        });
        fireEvent.click(screen.getByText('Tiếp tục →'));

        fireEvent.change(
            screen.getByPlaceholderText(/Mô tả yêu cầu của bạn bằng ngôn ngữ tự nhiên/i),
            { target: { value: 'Tôi muốn tạo app quản lý công việc cho nhóm' } }
        );
        fireEvent.click(screen.getByText('Tiếp tục →'));

        expect(screen.getByText('Starter path')).toBeTruthy();
        expect(screen.getByText('🧙 App Builder Wizard')).toBeTruthy();

        fireEvent.click(screen.getByText('Mở governed path! 🚀'));

        expect(onComplete).toHaveBeenCalledWith(
            expect.objectContaining({
                provider: 'gemini',
                userInput: 'Tôi muốn tạo app quản lý công việc cho nhóm',
                detectedIntent: expect.objectContaining({
                    phase: 'BUILD',
                    suggestedTemplates: expect.arrayContaining(['app-builder']),
                }),
            })
        );
    });
});
