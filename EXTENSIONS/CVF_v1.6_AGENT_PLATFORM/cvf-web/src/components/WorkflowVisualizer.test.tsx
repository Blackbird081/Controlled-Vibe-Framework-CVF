// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkflowVisualizer, WorkflowModeSelector } from './WorkflowVisualizer';

let mockLanguage = 'en';
vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language: mockLanguage, t: (key: string) => key }),
}));

describe('WorkflowVisualizer', () => {
    beforeEach(() => {
        mockLanguage = 'en';
    });

    // ── Simple mode ──
    describe('simple mode', () => {
        it('renders all 3 steps in full layout', () => {
            render(<WorkflowVisualizer mode="simple" />);
            expect(screen.getByText('Fill Form')).toBeTruthy();
            expect(screen.getByText('Export Spec')).toBeTruthy();
            expect(screen.getByText('Paste to AI')).toBeTruthy();
        });

        it('renders mode name and description', () => {
            render(<WorkflowVisualizer mode="simple" />);
            expect(screen.getByText('Simple Mode')).toBeTruthy();
            expect(screen.getByText('Quick prompts, no rules. Best for simple tasks.')).toBeTruthy();
        });

        it('renders badge icon', () => {
            render(<WorkflowVisualizer mode="simple" />);
            expect(screen.getByText('⚡')).toBeTruthy();
        });

        it('renders step descriptions', () => {
            render(<WorkflowVisualizer mode="simple" />);
            expect(screen.getByText('Enter your requirements')).toBeTruthy();
            expect(screen.getByText('Copy prompt to clipboard')).toBeTruthy();
            expect(screen.getByText('Use in ChatGPT, Claude, Gemini')).toBeTruthy();
        });

        it('renders step icons', () => {
            render(<WorkflowVisualizer mode="simple" />);
            expect(screen.getAllByText('📝').length).toBeGreaterThanOrEqual(1);
            expect(screen.getAllByText('📋').length).toBeGreaterThanOrEqual(1);
            expect(screen.getAllByText('🤖').length).toBeGreaterThanOrEqual(1);
        });
    });

    // ── Governance mode ──
    describe('governance mode', () => {
        it('renders all 4 steps', () => {
            render(<WorkflowVisualizer mode="governance" />);
            expect(screen.getByText('Fill Form')).toBeTruthy();
            expect(screen.getByText('Add Rules')).toBeTruthy();
            expect(screen.getByText('Export Spec')).toBeTruthy();
            expect(screen.getByText('Paste to AI')).toBeTruthy();
        });

        it('shows governance mode name and badge', () => {
            render(<WorkflowVisualizer mode="governance" />);
            expect(screen.getByText('Governance Mode')).toBeTruthy();
            expect(screen.getByText('🛡️')).toBeTruthy();
        });

        it('shows governance description', () => {
            render(<WorkflowVisualizer mode="governance" />);
            expect(screen.getByText('Adds stop conditions & guardrails for safer AI execution.')).toBeTruthy();
        });
    });

    // ── Full mode ──
    describe('full mode', () => {
        it('renders all 4 steps', () => {
            render(<WorkflowVisualizer mode="full" />);
            expect(screen.getByText('Discovery')).toBeTruthy();
            expect(screen.getByText('Design')).toBeTruthy();
            expect(screen.getByText('Build')).toBeTruthy();
            expect(screen.getByText('Review')).toBeTruthy();
        });

        it('shows full mode name and badge', () => {
            render(<WorkflowVisualizer mode="full" />);
            expect(screen.getByText('CVF Full Mode')).toBeTruthy();
            expect(screen.getByText('🚀')).toBeTruthy();
        });
    });

    // ── currentStep highlighting ──
    describe('currentStep', () => {
        it('defaults currentStep to -1 (no step highlighted)', () => {
            const { container } = render(<WorkflowVisualizer mode="simple" />);
            // No step should have the active bg class
            const activeCircles = container.querySelectorAll('.bg-blue-500');
            expect(activeCircles.length).toBe(0);
        });

        it('highlights steps up to currentStep=1', () => {
            const { container } = render(<WorkflowVisualizer mode="simple" currentStep={1} />);
            // Steps 0 and 1 circles + connector between 0→1 = 3 elements with bg-blue-500
            const activeElements = container.querySelectorAll('.bg-blue-500');
            expect(activeElements.length).toBe(3);
        });

        it('highlights all steps when currentStep equals last index', () => {
            const { container } = render(<WorkflowVisualizer mode="simple" currentStep={2} />);
            // 3 circles + 2 connectors = 5 elements with bg-blue-500
            const activeElements = container.querySelectorAll('.bg-blue-500');
            expect(activeElements.length).toBe(5);
        });

        it('highlights connector bars for completed steps', () => {
            const { container } = render(<WorkflowVisualizer mode="simple" currentStep={2} />);
            // Connectors between step 0→1 and 1→2 should be highlighted
            const activeConnectors = container.querySelectorAll('.h-1.bg-blue-500');
            expect(activeConnectors.length).toBe(2);
        });

        it('uses amber color for governance mode', () => {
            const { container } = render(<WorkflowVisualizer mode="governance" currentStep={0} />);
            const activeCircles = container.querySelectorAll('.bg-amber-500');
            expect(activeCircles.length).toBeGreaterThanOrEqual(1);
        });

        it('uses purple color for full mode', () => {
            const { container } = render(<WorkflowVisualizer mode="full" currentStep={0} />);
            const activeCircles = container.querySelectorAll('.bg-purple-500');
            expect(activeCircles.length).toBeGreaterThanOrEqual(1);
        });
    });

    // ── Compact mode ──
    describe('compact', () => {
        it('renders compact layout with smaller elements', () => {
            const { container } = render(<WorkflowVisualizer mode="simple" compact />);
            // Compact uses w-6 h-6 circles instead of w-12 h-12
            const smallCircles = container.querySelectorAll('.w-6.h-6');
            expect(smallCircles.length).toBe(3); // 3 steps for simple
        });

        it('shows mode name in compact mode', () => {
            render(<WorkflowVisualizer mode="simple" compact />);
            expect(screen.getByText('Simple Mode')).toBeTruthy();
        });

        it('shows badge in compact mode', () => {
            render(<WorkflowVisualizer mode="governance" compact />);
            expect(screen.getByText('🛡️')).toBeTruthy();
        });

        it('highlights steps in compact mode', () => {
            const { container } = render(<WorkflowVisualizer mode="simple" currentStep={0} compact />);
            const activeCircles = container.querySelectorAll('.bg-blue-500');
            expect(activeCircles.length).toBeGreaterThanOrEqual(1);
        });

        it('renders compact connectors', () => {
            const { container } = render(<WorkflowVisualizer mode="simple" compact />);
            // 2 connectors between 3 steps (w-4 h-0.5)
            const connectors = container.querySelectorAll('.w-4');
            expect(connectors.length).toBe(2);
        });
    });

    // ── Vietnamese language ──
    describe('Vietnamese language', () => {
        beforeEach(() => {
            mockLanguage = 'vi';
        });

        it('renders Vietnamese step labels', () => {
            render(<WorkflowVisualizer mode="simple" />);
            expect(screen.getByText('Điền Form')).toBeTruthy();
            expect(screen.getByText('Xuất Spec')).toBeTruthy();
            expect(screen.getByText('Paste vào AI')).toBeTruthy();
        });

        it('renders Vietnamese mode name', () => {
            render(<WorkflowVisualizer mode="simple" />);
            expect(screen.getByText('Chế độ Đơn giản')).toBeTruthy();
        });

        it('renders Vietnamese descriptions', () => {
            render(<WorkflowVisualizer mode="simple" />);
            expect(screen.getByText('Nhập yêu cầu của bạn')).toBeTruthy();
        });

        it('renders Vietnamese in compact mode', () => {
            render(<WorkflowVisualizer mode="governance" compact />);
            expect(screen.getByText('Chế độ Có Quy tắc')).toBeTruthy();
        });
    });
});

describe('WorkflowModeSelector', () => {
    beforeEach(() => {
        mockLanguage = 'en';
    });

    it('renders all 3 mode buttons', () => {
        const onChange = vi.fn();
        render(<WorkflowModeSelector selectedMode="simple" onModeChange={onChange} />);
        // Mode name appears in both button and preview, so use getAllByText
        expect(screen.getAllByText('Simple Mode').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Governance Mode').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('CVF Full Mode').length).toBeGreaterThanOrEqual(1);
    });

    it('renders mode descriptions', () => {
        const onChange = vi.fn();
        render(<WorkflowModeSelector selectedMode="simple" onModeChange={onChange} />);
        expect(screen.getAllByText('Quick prompts, no rules. Best for simple tasks.').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Adds stop conditions & guardrails for safer AI execution.').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('4-Phase protocol: Discovery → Design → Build → Review').length).toBeGreaterThanOrEqual(1);
    });

    it('renders mode badges', () => {
        const onChange = vi.fn();
        render(<WorkflowModeSelector selectedMode="simple" onModeChange={onChange} />);
        expect(screen.getAllByText('⚡').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('🛡️').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('🚀').length).toBeGreaterThanOrEqual(1);
    });

    it('calls onModeChange when a mode is clicked', () => {
        const onChange = vi.fn();
        render(<WorkflowModeSelector selectedMode="simple" onModeChange={onChange} />);
        fireEvent.click(screen.getAllByText('Governance Mode')[0]);
        expect(onChange).toHaveBeenCalledWith('governance');
    });

    it('calls onModeChange with full when CVF Full Mode is clicked', () => {
        const onChange = vi.fn();
        render(<WorkflowModeSelector selectedMode="simple" onModeChange={onChange} />);
        fireEvent.click(screen.getAllByText('CVF Full Mode')[0]);
        expect(onChange).toHaveBeenCalledWith('full');
    });

    it('renders workflow preview for selected mode', () => {
        const onChange = vi.fn();
        render(<WorkflowModeSelector selectedMode="full" onModeChange={onChange} />);
        // The WorkflowVisualizer preview should show full mode steps
        expect(screen.getAllByText('Discovery').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Design').length).toBeGreaterThanOrEqual(1);
    });

    it('renders Vietnamese labels when language is vi', () => {
        mockLanguage = 'vi';
        const onChange = vi.fn();
        render(<WorkflowModeSelector selectedMode="simple" onModeChange={onChange} />);
        expect(screen.getAllByText('Chế độ Đơn giản').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Chế độ Có Quy tắc')).toBeTruthy();
    });

    it('handles hover state for mode preview', () => {
        const onChange = vi.fn();
        render(<WorkflowModeSelector selectedMode="simple" onModeChange={onChange} />);
        // Hover over governance mode button - find the button containing that text
        const govButtons = screen.getAllByText('Governance Mode');
        fireEvent.mouseEnter(govButtons[0]);
        // Should show governance step labels in the preview
        expect(screen.getAllByText('Add Rules').length).toBeGreaterThanOrEqual(1);
        // Mouse leave should revert to selected mode
        fireEvent.mouseLeave(govButtons[0]);
    });
});
