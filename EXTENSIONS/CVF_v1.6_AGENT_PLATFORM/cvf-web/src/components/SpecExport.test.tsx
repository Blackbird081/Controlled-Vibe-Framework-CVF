/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SpecExport, generateCompleteSpec, generateSpec } from './SpecExport';
import type { Template } from '@/types';
import { logEnforcementDecision } from '@/lib/enforcement-log';
import { evaluateEnforcement } from '@/lib/enforcement';

// Mocks
vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language: 'en', t: (key: string) => key }),
}));

vi.mock('./UserContext', () => ({
    useUserContext: () => ({ getContextPrompt: () => '' }),
}));

vi.mock('./Settings', () => ({
    useSettings: () => ({
        settings: {
            preferences: {
                defaultExportMode: 'governance',
                defaultLanguage: 'vi',
            },
        },
        isLoaded: true,
    }),
}));

vi.mock('./WorkflowVisualizer', () => ({
    WorkflowVisualizer: ({ mode }: { mode: string }) => <div data-testid="workflow-viz">{mode}</div>,
}));

vi.mock('@/lib/spec-gate', () => ({
    evaluateSpecGate: vi.fn(() => ({
        status: 'PASS',
        missing: [],
        providedCount: 3,
        requiredCount: 3,
    })),
}));

vi.mock('@/lib/enforcement', () => ({
    evaluateEnforcement: vi.fn(() => ({
        status: 'ALLOW',
        specGate: { status: 'PASS', missing: [], providedCount: 3, requiredCount: 3 },
        reasons: [],
        governanceStateSnapshot: {},
        source: 'client',
    })),
}));

vi.mock('@/lib/enforcement-log', () => ({
    logEnforcementDecision: vi.fn(),
}));

vi.mock('@/lib/governance-context', () => ({
    autoDetectGovernance: vi.fn(() => ({
        phase: 'INTAKE',
        role: 'ANALYST',
        riskLevel: 'R1',
        confidence: 'medium',
        reason: 'Auto-detected',
    })),
    buildGovernanceSpecBlock: vi.fn(() => '[GOVERNANCE BLOCK]'),
    isRiskAllowed: vi.fn(() => true),
}));

const mockTemplate: Template = {
    id: 'test-template',
    name: 'Test Template',
    icon: '📄',
    description: 'A test template for unit testing',
    category: 'business',
    intentPattern: 'Create a test',
    outputExpected: ['section1', 'section2'],
    fields: [
        { id: 'goal', type: 'text', label: 'Goal', required: true, placeholder: 'Enter goal' },
        { id: 'scope', type: 'textarea', label: 'Scope', required: true, placeholder: 'Enter scope' },
        { id: 'optional_field', type: 'text', label: 'Optional', required: false, placeholder: 'Optional' },
    ],
};

const mockValues: Record<string, string> = {
    goal: 'Build an MVP',
    scope: 'Web application with auth',
    optional_field: 'Extra info',
};

const webHandoffTemplate: Template = {
    ...mockTemplate,
    id: 'web_build_handoff',
    name: 'Bàn giao Web cho Agent',
    category: 'product',
};

const appBuilderCompleteTemplate: Template = {
    ...mockTemplate,
    id: 'app_builder_complete',
    icon: '📦',
    name: '📦 Tạo Ứng dụng Hoàn chỉnh',
    description: 'Biến brief sản phẩm đầy đủ thành packet build-ready để non-coder vẫn mô tả rõ mục tiêu.',
    category: 'development',
    fields: [
        { id: 'appName', type: 'text', label: '1. Tên app / sản phẩm', required: true },
        { id: 'appType', type: 'select', label: '2. Đây là loại sản phẩm gì?', required: true },
        { id: 'problem', type: 'textarea', label: '3. Nó giải quyết vấn đề gì?', required: true },
        { id: 'targetUsers', type: 'text', label: '4. Ai sẽ dùng sản phẩm này?', required: true },
        { id: 'coreFeatures', type: 'textarea', label: '5. Những việc quan trọng nhất app phải làm được', required: true },
        { id: 'successCriteria', type: 'textarea', label: '6. Khi nào bạn xem đây là phiên bản đạt yêu cầu?', required: true },
        { id: 'platforms', type: 'text', label: '8. App cần chạy ở đâu?', required: true },
    ],
    intentPattern: `INTENT:
Tôi muốn tạo một app brief đầy đủ nhưng vẫn theo chuẩn non-coder.

APP / PRODUCT NAME: [appName]
PROBLEM TO SOLVE:
[problem]`,
    outputExpected: ['Product Brief', 'Core Workflows'],
    outputTemplate: '# Complete App Brief: [appName]',
};

const appBuilderValues: Record<string, string> = {
    appName: 'App tài chính cá nhân',
    appType: 'Web App',
    problem: 'Quản lý tài chính cá nhân, dòng tiền ra vào hàng ngày',
    targetUsers: 'Team 3-5 người',
    coreFeatures: 'Quản lý thu chi',
    successCriteria: 'Người dùng tạo task trong 1 phút',
    platforms: 'Windows',
};

const defaultProps = {
    template: mockTemplate,
    values: mockValues,
    onClose: vi.fn(),
    onSendToAgent: vi.fn(),
};

describe('SpecExport', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders the export title', () => {
        render(<SpecExport {...defaultProps} />);
        // Should render the help title from labels
        const heading = document.querySelector('h3');
        expect(heading).toBeTruthy();
    });

    it('renders close button when onClose is provided', () => {
        render(<SpecExport {...defaultProps} />);
        const closeBtn = screen.getByText('✕');
        fireEvent.click(closeBtn);
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('renders three export mode buttons', () => {
        render(<SpecExport {...defaultProps} />);
        // Labels could be Vietnamese or English depending on default language setting
        const buttons = document.querySelectorAll('button');
        // At least 3 mode buttons exist among all buttons
        expect(buttons.length).toBeGreaterThanOrEqual(3);
    });

    it('switches export mode when clicking mode buttons', () => {
        render(<SpecExport {...defaultProps} />);
        // Click simple mode
        const buttons = screen.getAllByRole('button');
        const simpleBtn = buttons.find(b => b.textContent?.includes('Simple') || b.textContent?.includes('Đơn giản'));
        if (simpleBtn) {
            fireEvent.click(simpleBtn);
        }
        // No error = mode switched successfully
    });

    it('renders WorkflowVisualizer', () => {
        render(<SpecExport {...defaultProps} />);
        expect(screen.getByTestId('workflow-viz')).toBeTruthy();
    });

    it('renders language selector with vi and en options', () => {
        render(<SpecExport {...defaultProps} />);
        expect(screen.getByText(/Tiếng Việt/)).toBeTruthy();
        expect(screen.getByText(/English/)).toBeTruthy();
    });

    it('switches export language', () => {
        render(<SpecExport {...defaultProps} />);
        const enBtn = screen.getByText(/English/);
        fireEvent.click(enBtn);
        // No error = language switched
    });

    it('renders copy, export, preview buttons', () => {
        render(<SpecExport {...defaultProps} />);
        const allText = document.body.textContent || '';
        // The copy button text depends on language (Sao chép or Copy)
        expect(allText).toMatch(/Sao chép|Copy/);
        // Export/download button
        expect(allText).toMatch(/Tải|Export|💾/);
    });

    it('copies spec to clipboard', async () => {
        render(<SpecExport {...defaultProps} />);
        // Find copy button
        const copyBtn = Array.from(document.querySelectorAll('button')).find(
            b => b.textContent?.includes('Sao chép') || b.textContent?.includes('Copy')
        );
        expect(copyBtn).toBeTruthy();
        fireEvent.click(copyBtn!);

        await waitFor(() => {
            expect(navigator.clipboard.writeText).toHaveBeenCalled();
        });
    });

    it('shows copied feedback after copy', async () => {
        render(<SpecExport {...defaultProps} />);
        const copyBtn = Array.from(document.querySelectorAll('button')).find(
            b => b.textContent?.includes('Sao chép') || b.textContent?.includes('Copy')
        );
        fireEvent.click(copyBtn!);

        await waitFor(() => {
            const allText = document.body.textContent || '';
            expect(allText).toMatch(/✓|Copied|Đã sao chép/);
        });
    });

    it('exports spec to markdown file', () => {
        render(<SpecExport {...defaultProps} />);

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

        // Find export/download button
        const exportBtn = Array.from(document.querySelectorAll('button')).find(
            b => b.textContent?.includes('💾')
        );
        expect(exportBtn).toBeTruthy();
        fireEvent.click(exportBtn!);
        expect(createObjectURLMock).toHaveBeenCalled();
        expect(clickMock).toHaveBeenCalled();
    });

    it('toggles preview visibility', () => {
        render(<SpecExport {...defaultProps} />);
        const previewBtn = Array.from(document.querySelectorAll('button')).find(
            b => b.textContent?.includes('👁️') || b.textContent?.includes('Xem') || b.textContent?.includes('Preview')
        );
        expect(previewBtn).toBeTruthy();
        fireEvent.click(previewBtn!);

        // Preview should now be visible (a <pre> tag)
        const pre = document.querySelector('pre');
        expect(pre).toBeTruthy();

        // Click again to hide
        const hideBtn = Array.from(document.querySelectorAll('button')).find(
            b => b.textContent?.includes('🙈') || b.textContent?.includes('Ẩn') || b.textContent?.includes('Hide')
        );
        if (hideBtn) {
            fireEvent.click(hideBtn);
            expect(document.querySelector('pre')).toBeNull();
        }
    });

    it('renders Send to Agent button when onSendToAgent is provided', () => {
        render(<SpecExport {...defaultProps} />);
        const allText = document.body.textContent || '';
        expect(allText).toMatch(/Send.*Agent|Gửi.*Agent/);
    });

    it('calls onSendToAgent with spec content when agent button clicked', () => {
        render(<SpecExport {...defaultProps} />);
        const agentBtn = Array.from(document.querySelectorAll('button')).find(
            b => b.textContent?.includes('Send Packet to Agent') || b.textContent?.includes('Gửi Packet cho Agent')
        );
        expect(agentBtn).toBeTruthy();
        fireEvent.click(agentBtn!);

        expect(logEnforcementDecision).toHaveBeenCalled();
        expect(defaultProps.onSendToAgent).toHaveBeenCalledTimes(1);
        expect(typeof defaultProps.onSendToAgent.mock.calls[0][0]).toBe('string');
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('does not render Send to Agent when prop is absent', () => {
        const propsWithout = { ...defaultProps, onSendToAgent: undefined };
        render(<SpecExport {...propsWithout} onClose={vi.fn()} />);
        const allText = document.body.textContent || '';
        expect(allText).not.toMatch(/Send.*Agent|Gửi.*Agent/);
    });

    it('shows Spec Gate PASS status', () => {
        render(<SpecExport {...defaultProps} />);
        const allText = document.body.textContent || '';
        expect(allText).toMatch(/Spec Gate.*PASS/);
    });

    it('shows Spec Gate FAIL when required fields are missing', async () => {
        vi.mocked(evaluateEnforcement).mockReturnValue({
            status: 'ALLOW',
            specGate: {
                status: 'FAIL',
                missing: [{ id: 'goal', label: 'Goal', required: true }],
                providedCount: 1,
                requiredCount: 2,
            },
            reasons: [],
            governanceStateSnapshot: {} as unknown as ReturnType<typeof evaluateEnforcement>['governanceStateSnapshot'],
            source: 'client',
        } as ReturnType<typeof evaluateEnforcement>);

        render(<SpecExport {...defaultProps} values={{}} />);
        const allText = document.body.textContent || '';
        expect(allText).toMatch(/FAIL|Goal/);
    });

    it('shows quick paste links for ChatGPT, Claude, Gemini', () => {
        render(<SpecExport {...defaultProps} />);
        expect(screen.getByText('ChatGPT ↗')).toBeTruthy();
        expect(screen.getByText('Claude ↗')).toBeTruthy();
        expect(screen.getByText('Gemini ↗')).toBeTruthy();
    });

    it('quick paste links have proper external attributes', () => {
        render(<SpecExport {...defaultProps} />);
        const chatGPTLink = screen.getByText('ChatGPT ↗').closest('a')!;
        expect(chatGPTLink.getAttribute('target')).toBe('_blank');
        expect(chatGPTLink.getAttribute('rel')).toContain('noopener');
    });

    it('shows governance auto-detect info in governance mode', () => {
        render(<SpecExport {...defaultProps} />);
        const allText = document.body.textContent || '';
        expect(allText).toContain('Auto-Detect');
    });

    it('renders instructions section', () => {
        render(<SpecExport {...defaultProps} />);
        const allText = document.body.textContent || '';
        expect(allText).toMatch(/Hướng dẫn|Instructions/);
    });
});

describe('generateCompleteSpec', () => {
    it('generates a spec string from template and values', () => {
        const spec = generateCompleteSpec(mockTemplate, mockValues);
        expect(typeof spec).toBe('string');
        expect(spec.length).toBeGreaterThan(0);
        expect(spec).toContain('Build an MVP');
        expect(spec).toContain('Web application with auth');
        expect(spec).toContain('Chuẩn Thành Công Cho Non-Coder');
        expect(spec).toContain('Quy tắc Phản hồi Governed');
        expect(spec).toContain('Ưu tiên Knowledge Context');
    });

    it('generates spec without user intent', () => {
        const spec = generateCompleteSpec(mockTemplate, mockValues);
        expect(spec).toBeTruthy();
    });

    it('generates spec with empty values', () => {
        const spec = generateCompleteSpec(mockTemplate, {});
        expect(typeof spec).toBe('string');
        // Should still produce a spec, just without filled values
    });

    it('adds CVF Web Redesign DNA to exported web handoff packets', () => {
        const spec = generateCompleteSpec(webHandoffTemplate, mockValues);

        expect(spec).toContain('CVF Web Redesign DNA');
        expect(spec).toContain('professional command workspace');
    });
});

describe('generateSpec Surface 1 English export i18n', () => {
    it('localizes app_builder_complete chrome while preserving Vietnamese source values', () => {
        const spec = generateSpec(appBuilderCompleteTemplate, appBuilderValues, 'en', 'full');

        expect(spec).toContain('**Template:** 📦 App Builder Complete');
        expect(spec).toContain('Create a full product brief and builder-ready handoff');
        expect(spec).toContain('**1. App / product name:** App tài chính cá nhân');
        expect(spec).toContain('| 3. What problem does it solve? | ✅ |');
        expect(spec).toContain('I want to create a complete app brief that remains non-coder friendly.');

        expect(spec).toContain('App tài chính cá nhân');
        expect(spec).toContain('Quản lý tài chính cá nhân');

        expect(spec).not.toContain('Tạo Ứng dụng Hoàn chỉnh');
        expect(spec).not.toContain('Biến brief sản phẩm');
        expect(spec).not.toContain('1. Tên app / sản phẩm');
        expect(spec).not.toContain('Nó giải quyết vấn đề gì');
        expect(spec).not.toContain('Tôi muốn tạo một app brief');
        expect(spec).not.toContain('đúng');
    });
});
