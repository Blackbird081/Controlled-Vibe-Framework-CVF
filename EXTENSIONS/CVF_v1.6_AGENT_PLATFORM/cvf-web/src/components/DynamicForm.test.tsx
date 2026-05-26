/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DynamicForm } from './DynamicForm';
import type { Template } from '@/types';

let currentLanguage: 'en' | 'vi' = 'en';

vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({
        language: currentLanguage,
        t: (key: string) => key,
    }),
}));

vi.mock('./SpecExport', () => ({
    SpecExport: ({ template }: { template: Template }) => (
        <div data-testid="spec-export">{template.id}</div>
    ),
}));

vi.mock('@/lib/skill-template-map', () => ({
    getSkillForTemplate: () => null,
}));

const appBuilderCompleteTemplate: Template = {
    id: 'app_builder_complete',
    name: '📦 Tạo Ứng dụng Hoàn chỉnh',
    icon: '📦',
    description: 'Biến brief sản phẩm đầy đủ thành packet build-ready để non-coder vẫn mô tả rõ mục tiêu.',
    category: 'development',
    difficulty: 'advanced',
    fields: [
        { id: 'appName', type: 'text', label: '1. Tên app / sản phẩm', placeholder: 'VD: TaskFlow', required: true, section: 'required', hint: 'Tên gọi dễ nhớ để packet và handoff bám đúng sản phẩm.', example: 'TaskFlow' },
        { id: 'appType', type: 'select', label: '2. Đây là loại sản phẩm gì?', options: ['Desktop App', 'Web App'], required: true, section: 'required', hint: 'Chỉ cần chọn loại bề mặt chính, không cần nói framework.' },
        { id: 'problem', type: 'textarea', label: '3. Nó giải quyết vấn đề gì?', placeholder: 'Mô tả pain point hoặc công việc đang bị chậm, rối, tốn công...', required: true, rows: 3, section: 'required', hint: 'Tập trung vào vấn đề thật ngoài đời thay vì giải pháp kỹ thuật.', example: 'Team nhỏ cần theo dõi công việc hằng ngày nhưng Jira quá nặng.' },
        { id: 'mustPreserve', type: 'textarea', label: '7. Những gì phải giữ nguyên', placeholder: 'Logic, dữ liệu, route...', required: false, rows: 3, section: 'advanced', hint: 'Giúp builder biết ranh giới không được phá khi thực hiện.', example: 'Giữ nguyên webhook.' },
    ],
    intentPattern: `INTENT:
Tôi muốn tạo một app brief đầy đủ nhưng vẫn theo chuẩn non-coder.

APP / PRODUCT NAME: [appName]
PROBLEM TO SOLVE:
[problem]`,
    outputExpected: ['Product Brief'],
};

const defaultProps = {
    template: appBuilderCompleteTemplate,
    onSubmit: vi.fn(),
    onBack: vi.fn(),
};

describe('DynamicForm Surface 1 template i18n', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        currentLanguage = 'en';
    });

    it('renders app_builder_complete form chrome in English mode', () => {
        render(<DynamicForm {...defaultProps} />);

        expect(screen.getByText(/App Builder Complete/)).toBeTruthy();
        expect(screen.getByText(/Create a full product brief/)).toBeTruthy();
        expect(screen.getByText('1. App / product name')).toBeTruthy();
        expect(screen.getByText('3. What problem does it solve?')).toBeTruthy();
        expect(screen.getByText(/Focus on the real-world problem/)).toBeTruthy();
        expect(screen.getByText(/Example: A small team needs to track daily work/)).toBeTruthy();

        const allText = document.body.textContent || '';
        expect(allText).not.toContain('1. Tên app / sản phẩm');
        expect(allText).not.toContain('Nó giải quyết vấn đề gì');
        expect(allText).not.toContain('Tập trung vào vấn đề thật ngoài đời');
    });

    it('keeps app_builder_complete form chrome in Vietnamese mode', () => {
        currentLanguage = 'vi';
        render(<DynamicForm {...defaultProps} />);

        expect(screen.getByText('1. Tên app / sản phẩm')).toBeTruthy();
        expect(screen.getByText('3. Nó giải quyết vấn đề gì?')).toBeTruthy();
        expect(screen.getByText(/Tập trung vào vấn đề thật ngoài đời/)).toBeTruthy();
        expect(screen.getByText(/VD: Team nhỏ cần theo dõi công việc/)).toBeTruthy();
    });

    it('uses English preview intent in English mode without changing source values', () => {
        render(<DynamicForm {...defaultProps} />);

        fireEvent.change(screen.getByPlaceholderText('Example: TaskFlow'), {
            target: { value: 'App tài chính cá nhân' },
        });
        fireEvent.change(screen.getByPlaceholderText(/Describe the pain point/), {
            target: { value: 'Quản lý dòng tiền hàng ngày' },
        });
        fireEvent.click(screen.getByText('Preview agent instructions'));

        const preview = document.querySelector('pre')?.textContent || '';
        expect(preview).toContain('I want to create a complete app brief');
        expect(preview).toContain('App tài chính cá nhân');
        expect(preview).toContain('Quản lý dòng tiền hàng ngày');
        expect(preview).not.toContain('Tôi muốn tạo một app brief');
    });
});
