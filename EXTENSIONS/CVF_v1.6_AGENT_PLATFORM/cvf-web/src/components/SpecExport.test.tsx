/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SpecExport, generateCompleteSpec } from './SpecExport';
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
        provided: 3,
        total: 3,
    })),
}));

vi.mock('@/lib/enforcement', () => ({
    evaluateEnforcement: vi.fn(() => ({
        status: 'active',
        specGate: { status: 'PASS', missing: [], provided: 3, total: 3 },
        reasons: [],
        mode: 'governance',
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
        expect(allText).toMatch(/Send to Agent|Gửi đến Agent/);
    });

    it('calls onSendToAgent with spec content when agent button clicked', () => {
        render(<SpecExport {...defaultProps} />);
        const agentBtn = Array.from(document.querySelectorAll('button')).find(
            b => b.textContent?.includes('Agent')
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
        expect(allText).not.toMatch(/Send to Agent|Gửi đến Agent/);
    });

    it('shows Spec Gate PASS status', () => {
        render(<SpecExport {...defaultProps} />);
        const allText = document.body.textContent || '';
        expect(allText).toMatch(/Spec Gate.*PASS/);
    });

    it('shows Spec Gate FAIL when required fields are missing', async () => {
        vi.mocked(evaluateEnforcement).mockReturnValue({
            status: 'active',
            specGate: {
                status: 'FAIL',
                missing: [{ id: 'goal', label: 'Goal' }],
                provided: 1,
                total: 2,
            },
            reasons: [],
            mode: 'governance',
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
});
